/**
 * Decides how a job's stream inputs share Eventstreams.
 *
 * An Eventstream has exactly one default stream, and every source added to it
 * feeds that stream, so a query in that Eventstream sees the events of all its
 * sources mixed together. Rewriting `FROM [a]` and `FROM [b]` to the default
 * stream is therefore only faithful when the query already mixes a and b in
 * exactly that way. The rules:
 *
 * - Statements that read disjoint sets of inputs are independent pipelines.
 *   Each group becomes its own Eventstream, so every input keeps a default
 *   stream to itself and no statement sees another input's events.
 * - Inputs read together by one statement are merged into one default stream.
 *   That is allowed only when every read of them is a branch of a UNION whose
 *   branches differ in nothing but the input they read. The merged stream
 *   already holds that union (ASA's UNION keeps duplicates), so the UNION is
 *   collapsed to its first branch; keeping every branch would read the merged
 *   stream once per branch and duplicate each event.
 * - Anything else that reads several inputs together (a JOIN across inputs,
 *   UNION branches that differ, a statement reading only some of the merged
 *   inputs) cannot run on one merged stream, and is blocked.
 *
 * https://learn.microsoft.com/en-us/stream-analytics-query/union-azure-stream-analytics
 * https://learn.microsoft.com/en-us/rest/api/fabric/articles/item-management/definitions/eventstream-definition
 */

import { AsaInput, AsaStreamingJob } from "../../../../clients/AzureResourceManagerTypes";
import { MappingFinding, approximated, blocked, mapped } from "../assess/Assessment";
import {
  QuerySite,
  QuerySpan,
  QueryStructure,
  parseQueryStructure,
  resolveReads
} from "../assess/queryStructure";

export interface InputGroup {
  /** ASA stream input names, in job order. */
  inputs: string[];
  /** Top-level statements this group's Eventstream runs, in query order. */
  statements: QuerySite[];
  /** WITH steps those statements use, in query order. */
  steps: QuerySite[];
  /** UNION sites cut down to their first branch, because the merge already unions the inputs. */
  collapsed: QuerySite[];
  /** INTO targets of the statements, as written. */
  outputs: string[];
}

export interface InputGrouping {
  structure: QueryStructure;
  groups: InputGroup[];
  findings: MappingFinding[];
}

const MULTIPLE_INPUTS = "multiple inputs";

export function isStreamInput(input: AsaInput): boolean {
  return (input.properties?.type || "").toLowerCase() !== "reference";
}

function unique<T>(items: T[]): T[] {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function quoted(names: string[]): string {
  return names.map(name => `'${name}'`).join(", ");
}

function byQueryOrder(sites: QuerySite[]): QuerySite[] {
  return [...sites].sort((a, b) => a.span.start - b.span.start);
}

/**
 * The inputs a collapsible UNION site unions, or undefined when the site is not
 * one: every branch reads exactly one stream input and nothing else, no two
 * branches read the same input, and the branches are otherwise identical.
 */
function collapsibleInputs(site: QuerySite, inputOf: (name: string) => string | undefined): string[] | undefined {
  if (site.branches.length < 2 || site.hasJoin) {
    return undefined;
  }
  const inputs: string[] = [];
  for (const branch of site.branches) {
    const input = branch.reads.length === 1 ? inputOf(branch.reads[0].name) : undefined;
    if (!input || inputs.indexOf(input) !== -1 || branch.signature !== site.branches[0].signature) {
      return undefined;
    }
    inputs.push(input);
  }
  return inputs;
}

/**
 * Why a merged group cannot run on one default stream, one reason per
 * offending site; empty when it can. JOINs across inputs are left to the query
 * analyzer's "join-inputs" rule, which already blocks them with line numbers.
 */
function mergeProblems(
  group: InputGroup,
  siteInputs: (site: QuerySite) => string[],
  inputOf: (name: string) => string | undefined
): string[] {
  const problems: string[] = [];
  const all = group.inputs;

  for (const statement of group.statements) {
    const reads = siteInputs(statement);
    const missing = all.filter(input => reads.indexOf(input) === -1);
    if (missing.length > 0) {
      problems.push(
        `The statement at line ${statement.line} reads ${reads.length ? quoted(reads) : "no stream input"} ` +
          `but not ${quoted(missing)}. Those inputs share one default stream in this Eventstream, so ` +
          "it would also receive their events. Give it a filter on a field that tells the inputs " +
          "apart, or move it to a separate job, then re-assess."
      );
    }
  }

  for (const site of byQueryOrder([...group.steps, ...group.statements])) {
    const direct = unique(site.reads.map(read => inputOf(read.name)).filter(Boolean) as string[]);
    if (direct.length === 0 || joinsInputs(site, siteInputs)) {
      continue;
    }
    const unioned = collapsibleInputs(site, inputOf);
    const where = site.kind === "step" ? `Step '${site.name}' (line ${site.line})` : `The statement at line ${site.line}`;
    if (unioned && unioned.length === all.length) {
      continue;
    }
    if (site.branches.length > 1) {
      problems.push(
        `${where} is a UNION whose branches do more than read different inputs (different ` +
          "columns, filters, timestamps or constants per input). Every branch would read the " +
          "same merged default stream, so each would also see the other inputs' events. Make the " +
          "branches identical apart from the input name, or add a field that identifies the " +
          "input and filter on it, then re-assess."
      );
    } else {
      problems.push(
        `${where} reads ${quoted(direct)} on its own, but ${quoted(all)} are merged into one ` +
          "default stream in this Eventstream, so it would also see the other inputs' events."
      );
    }
  }

  return problems;
}

/** Matches the analyzer's "join-inputs" rule: a JOIN in a site that reads several inputs. */
function joinsInputs(site: QuerySite, siteInputs: (site: QuerySite) => string[]): boolean {
  return site.hasJoin && siteInputs(site).length > 1;
}

/** Union-find over input names. */
function connect(inputs: string[], links: string[][]): Map<string, string> {
  const parent = new Map(inputs.map(input => [input, input]));
  const root = (name: string): string => {
    const up = parent.get(name) as string;
    return up === name ? name : root(up);
  };
  for (const link of links) {
    for (const other of link.slice(1)) {
      parent.set(root(other), root(link[0]));
    }
  }
  return new Map(inputs.map(input => [input, root(input)]));
}

export function groupInputs(job: AsaStreamingJob): InputGrouping {
  const properties = job.properties || {};
  const query = properties.transformation?.properties?.query || "";
  const structure = parseQueryStructure(query);
  const streamInputs = (properties.inputs || []).filter(isStreamInput).map(input => input.name);
  const byLowerName = new Map(streamInputs.map(name => [name.toLowerCase(), name]));
  const inputOf = (name: string) => byLowerName.get(name.toLowerCase());
  const inJobOrder = (names: string[]) => streamInputs.filter(input => names.indexOf(input) !== -1);
  const findings: MappingFinding[] = [];

  const siteInputs = (site: QuerySite) =>
    inJobOrder(resolveReads(structure, site).names.map(inputOf).filter(Boolean) as string[]);
  const statementInputs = new Map<QuerySite, string[]>();
  const statementSteps = new Map<QuerySite, QuerySite[]>();
  for (const statement of structure.statements) {
    statementInputs.set(statement, siteInputs(statement));
    statementSteps.set(statement, resolveReads(structure, statement).steps);
  }

  const groupOf = (inputs: string[], statements: QuerySite[]): InputGroup => ({
    inputs,
    statements,
    steps: byQueryOrder(unique(([] as QuerySite[]).concat(...statements.map(s => statementSteps.get(s) || [])))),
    collapsed: [],
    outputs: unique(([] as string[]).concat(...statements.map(s => s.into)))
  });

  // One stream input: the whole query runs against it, exactly as before.
  if (streamInputs.length <= 1) {
    return { structure, groups: [groupOf(streamInputs, structure.statements)], findings };
  }

  // ---- partition inputs by the statements that read them together ---------
  const roots = connect(streamInputs, structure.statements.map(s => statementInputs.get(s) || []));
  const read = new Set(([] as string[]).concat(...Array.from(statementInputs.values())));
  const groups: InputGroup[] = [];
  const groupByRoot = new Map<string, InputGroup>();

  for (const input of streamInputs) {
    if (!read.has(input)) {
      continue;
    }
    const root = roots.get(input) as string;
    let group = groupByRoot.get(root);
    if (!group) {
      group = groupOf([], []);
      groupByRoot.set(root, group);
      groups.push(group);
    }
    group.inputs.push(input);
  }

  for (const input of streamInputs.filter(name => !read.has(name))) {
    findings.push(
      approximated(
        "Input",
        input,
        "stream input",
        "",
        "No statement in the query reads this input, so no Eventstream source is generated for it."
      )
    );
  }

  if (groups.length === 0) {
    // Nothing recognizably reads any input; merge them all and let the checks below explain.
    groups.push(groupOf([...streamInputs], []));
  }

  const unattributed: QuerySite[] = [];
  for (const statement of structure.statements) {
    const inputs = statementInputs.get(statement) || [];
    const group = inputs.length > 0 ? groupByRoot.get(roots.get(inputs[0]) as string) : undefined;
    (group ? group.statements : unattributed).push(statement);
  }
  for (const statement of unattributed) {
    groups[0].statements.push(statement);
    findings.push(
      approximated(
        "Query",
        job.name,
        MULTIPLE_INPUTS,
        "SQL",
        `The statement at line ${statement.line} reads none of the job's stream inputs, so it was ` +
          `placed with ${quoted(groups[0].inputs)}. Check which input it should read.`
      )
    );
  }

  const finalGroups = groups.map(group => groupOf(group.inputs, byQueryOrder(group.statements)));

  // ---- merged groups: allowed only when the merge is what the query asked for
  for (const group of finalGroups.filter(candidate => candidate.inputs.length > 1)) {
    const problems = mergeProblems(group, siteInputs, inputOf);
    for (const problem of problems) {
      findings.push(blocked("Query", job.name, MULTIPLE_INPUTS, problem));
    }
    if (problems.length > 0 || [...group.steps, ...group.statements].some(site => joinsInputs(site, siteInputs))) {
      continue;
    }

    group.collapsed = [...group.steps, ...group.statements].filter(site =>
      Boolean(collapsibleInputs(site, inputOf))
    );
    const lines = group.collapsed.map(site => site.line).join(", ");
    findings.push(
      approximated(
        "Query",
        job.name,
        MULTIPLE_INPUTS,
        "DefaultStream",
        `Inputs ${quoted(group.inputs)} feed one Eventstream, whose single default stream carries ` +
          `the events of all of them. The UNION at line ${lines}, whose branches differ only in the ` +
          "input they read, is collapsed to one branch reading that stream; this yields the same " +
          "rows, since UNION keeps duplicates. Out-of-order and late-arrival policies now apply " +
          "to the merged stream rather than to each input, and the inputs must share a schema."
      )
    );
  }

  // ---- independent pipelines: one Eventstream each -------------------------
  if (finalGroups.length > 1) {
    const sharedOutputs = unique(
      ([] as string[]).concat(...finalGroups.map(group => group.outputs.map(o => o.toLowerCase())))
    ).filter(output => finalGroups.filter(g => g.outputs.some(o => o.toLowerCase() === output)).length > 1);
    findings.push(
      mapped(
        "Job",
        job.name,
        MULTIPLE_INPUTS,
        "Eventstream",
        `The query runs ${finalGroups.length} independent pipelines over different inputs (` +
          finalGroups.map(group => `${quoted(group.inputs)} -> ${quoted(group.outputs)}`).join("; ") +
          "). An Eventstream merges all of its sources into one default stream, so each pipeline " +
          "becomes its own Eventstream and no statement sees another input's events." +
          (sharedOutputs.length > 0
            ? ` ${quoted(sharedOutputs)} ${sharedOutputs.length > 1 ? "are" : "is"} written by ` +
              "more than one pipeline, so each of those Eventstreams gets a destination for it, " +
              "writing to the same target."
            : "")
      )
    );
  }

  return { structure, groups: finalGroups, findings };
}

/**
 * The query text one group's Eventstream runs: the original query with the
 * other groups' statements, the steps this group does not use, and the
 * collapsed UNION branches cut out. Everything kept, comments included, stays
 * byte-for-byte as written; a group that keeps everything gets the query back
 * verbatim.
 */
export function sliceQuery(query: string, structure: QueryStructure, group: InputGroup): string {
  const removals: QuerySpan[] = [];

  for (const statement of structure.statements) {
    if (group.statements.indexOf(statement) === -1) {
      removals.push(statement.span);
    }
  }

  const steps = structure.steps;
  const firstKept = steps.findIndex(step => group.steps.indexOf(step) !== -1);
  if (structure.withSpan && firstKept === -1) {
    removals.push(structure.withSpan);
  } else {
    steps.forEach((step, index) => {
      if (group.steps.indexOf(step) !== -1) {
        return;
      }
      // Take the separating comma with the step: the one after it for steps
      // before the first kept one, the one before it otherwise.
      removals.push(
        index < firstKept
          ? { start: step.span.start, end: steps[index + 1].span.start }
          : { start: steps[index - 1].span.end, end: step.span.end }
      );
    });
  }

  for (const site of group.collapsed) {
    removals.push({ start: site.branches[0].span.end, end: site.body.end });
  }

  if (removals.length === 0) {
    return query;
  }

  removals.sort((a, b) => a.start - b.start);
  let result = "";
  let cursor = 0;
  for (const removal of removals) {
    if (removal.start >= cursor) {
      result += query.slice(cursor, removal.start);
      cursor = removal.end;
    }
  }
  return result + query.slice(cursor);
}
