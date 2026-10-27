/**
 * Evaluates a Stream Analytics query against the Eventstream SQL operator's
 * support matrix (see queryRules.ts).
 *
 * The output is an inventory, not just a list of problems: every recognized
 * construct is reported with where it occurs and whether it carries over, so
 * the user can see what was checked as well as what needs attention.
 *
 * This is a scanner, not a parser. Comments and string literals are blanked
 * out first (keeping offsets), so matches inside them never count and every
 * hit maps back to an exact line of the original query.
 */

import { AsaStreamingJob } from "../../../../clients/AzureResourceManagerTypes";
import { QueryRule, QuerySupport, QUERY_RULES, ruleById } from "./queryRules";
import { parseQueryStructure, resolveReads, siteAt } from "./queryStructure";
import { maskQuery } from "./queryMask";

export interface QueryOccurrence {
  /** 1-based line in the original query. */
  line: number;
  /** The matched text, as written. */
  text: string;
}

export interface QueryConstruct {
  rule: QueryRule;
  /** Empty for job-level constructs that do not live in the query text. */
  occurrences: QueryOccurrence[];
}

export interface QueryAnalysis {
  query: string;
  constructs: QueryConstruct[];
  counts: Record<QuerySupport, number>;
  /** Worst support status of any construct on each line, for highlighting. */
  lineSupport: Record<number, QuerySupport>;
}

const SEVERITY: Record<QuerySupport, number> = { Supported: 0, NeedsReview: 1, Unsupported: 2 };

export { maskQuery };

function lineAt(query: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (query.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
}

/** True when `offset` sits inside an OVER( ... ) clause, e.g. analytic-function partitioning. */
function insideOverClause(masked: string, offset: number): boolean {
  let depth = 0;
  for (let i = offset - 1; i >= 0; i--) {
    const ch = masked[i];
    if (ch === ")") {
      depth++;
    } else if (ch === "(") {
      if (depth === 0) {
        return /\bOVER\s*$/i.test(masked.slice(Math.max(0, i - 12), i));
      }
      depth--;
    }
  }
  return false;
}

function identifierName(raw: string): string {
  return raw.replace(/^\[|\]$/g, "").toLowerCase();
}

export function analyzeQuery(job: AsaStreamingJob): QueryAnalysis {
  const properties = job.properties || {};
  const query = properties.transformation?.properties?.query || "";
  const masked = maskQuery(query);
  const found = new Map<string, QueryOccurrence[]>();

  const add = (id: string, offset: number, text: string) => {
    const list = found.get(id) || [];
    list.push({ line: lineAt(query, offset), text: query.substr(offset, text.length).trim() });
    found.set(id, list);
  };

  // ---- pattern rules ------------------------------------------------------
  for (const rule of QUERY_RULES) {
    if (!rule.pattern) {
      continue;
    }
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    let match = pattern.exec(masked);
    while (match) {
      const skip = rule.id === "partition-by" && insideOverClause(masked, match.index);
      if (!skip) {
        add(rule.id, match.index, match[0]);
      }
      match = pattern.exec(masked);
    }
  }

  // ---- JOIN: against reference data, within one input, or across inputs ---
  const isReference = (input: { properties?: { type?: string } }) =>
    (input.properties?.type || "").toLowerCase() === "reference";
  const referenceInputs = new Set(
    (properties.inputs || []).filter(isReference).map(input => input.name.toLowerCase())
  );
  const streamInputs = new Set(
    (properties.inputs || []).filter(input => !isReference(input)).map(input => input.name.toLowerCase())
  );
  const structure = streamInputs.size > 1 ? parseQueryStructure(query) : undefined;
  /** True when the step or statement around `offset` reads two or more stream inputs. */
  const readsSeveralInputs = (offset: number) => {
    const site = structure && siteAt(structure, offset);
    return Boolean(
      site && resolveReads(structure, site).names.filter(name => streamInputs.has(name)).length > 1
    );
  };
  const joinPattern = /\bJOIN\s+(\[[^\]]+\]|[A-Za-z_][\w-]*)/gi;
  let join = joinPattern.exec(masked);
  while (join) {
    const id = referenceInputs.has(identifierName(join[1]))
      ? "join-reference"
      : readsSeveralInputs(join.index)
        ? "join-inputs"
        : "join-stream";
    add(id, join.index, join[0]);
    join = joinPattern.exec(masked);
  }

  // ---- multiple outputs ---------------------------------------------------
  const intoPattern = /\bINTO\s+(\[[^\]]+\]|[A-Za-z_][\w-]*)/gi;
  const intoHits: { offset: number; text: string; target: string }[] = [];
  let into = intoPattern.exec(masked);
  while (into) {
    intoHits.push({ offset: into.index, text: into[0], target: identifierName(into[1]) });
    into = intoPattern.exec(masked);
  }
  if (new Set(intoHits.map(hit => hit.target)).size > 1) {
    for (const hit of intoHits) {
      add("multiple-outputs", hit.offset, hit.text);
    }
  }

  // ---- job-level settings -------------------------------------------------
  const constructs: QueryConstruct[] = [];
  if ((properties.compatibilityLevel || "").trim() === "1.0") {
    constructs.push({ rule: ruleById("compat-level"), occurrences: [] });
  }
  const nonJson = (properties.inputs || []).filter(input => {
    const format = (input.properties?.serialization?.type || "Json").toLowerCase();
    return format !== "json";
  });
  if (nonJson.length > 0) {
    constructs.push({ rule: ruleById("non-json-input"), occurrences: [] });
  }

  // ---- assemble, worst first ------------------------------------------------
  for (const rule of QUERY_RULES) {
    const occurrences = found.get(rule.id);
    if (occurrences && occurrences.length > 0) {
      constructs.push({ rule, occurrences });
    }
  }
  constructs.sort((a, b) => SEVERITY[b.rule.support] - SEVERITY[a.rule.support]);

  const counts: Record<QuerySupport, number> = { Supported: 0, NeedsReview: 0, Unsupported: 0 };
  const lineSupport: Record<number, QuerySupport> = {};
  for (const construct of constructs) {
    counts[construct.rule.support]++;
    for (const occurrence of construct.occurrences) {
      const current = lineSupport[occurrence.line];
      if (!current || SEVERITY[construct.rule.support] > SEVERITY[current]) {
        lineSupport[occurrence.line] = construct.rule.support;
      }
    }
  }

  return { query, constructs, counts, lineSupport };
}
