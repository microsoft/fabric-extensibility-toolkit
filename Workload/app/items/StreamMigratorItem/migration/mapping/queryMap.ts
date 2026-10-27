/**
 * Carries the Stream Analytics transformation query into an Eventstream SQL
 * operator.
 *
 * Phase 1 is deliberately a pass-through rather than a compiler: the Eventstream
 * SQL operator accepts a raw query, so most jobs move without decomposing the
 * query into Filter/GroupBy/ManageFields nodes.
 *
 * The SQL operator runs the Stream Analytics query language, but not all of it:
 * an unsupported construct fails server-side at create time rather than here.
 * So the query is evaluated against a documented support matrix (see
 * assess/queryAnalysis.ts) and every construct is reported up front, where the
 * user can still do something about it.
 */

import { AsaStreamingJob } from "../../../../clients/AzureResourceManagerTypes";
import { EventstreamSqlAdvancedSettings } from "../emit/EventstreamDefinition";
import { MappingFinding, approximated, blocked, mapped } from "../assess/Assessment";
import { QueryAnalysis, QueryConstruct, analyzeQuery } from "../assess/queryAnalysis";

export interface QueryMappingResult {
  query: string;
  advancedSettings: EventstreamSqlAdvancedSettings;
  findings: MappingFinding[];
  /** Every recognized construct and its support status, for the assessment view. */
  analysis: QueryAnalysis;
  /** Identifiers the query writes to, i.e. the targets of INTO clauses. */
  intoTargets: string[];
  /** Identifiers the query reads from, i.e. the sources of FROM clauses. */
  fromSources: string[];
}

function constructReason(construct: QueryConstruct): string {
  const lines = Array.from(new Set(construct.occurrences.map(o => o.line)));
  const where = lines.length > 0 ? ` (line${lines.length > 1 ? "s" : ""} ${lines.join(", ")})` : "";
  const caveat = construct.rule.unverified ? " Not confirmed by Microsoft documentation." : "";
  return `${construct.rule.detail}${caveat}${where}`;
}

/** Removes line and block comments so scanning does not match commented-out code. */
export function stripSqlComments(query: string): string {
  return (query || "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n\r]*/g, " ");
}

/**
 * Points every FROM/JOIN of `fromName` at `toName`, leaving the rest of the
 * query (comments included) untouched. ASA identifiers are case-insensitive.
 */
export function renameQuerySource(query: string, fromName: string, toName: string): string {
  // Blank out comments without shifting offsets, so matches map back onto the original.
  const masked = (query || "")
    .replace(/\/\*[\s\S]*?\*\//g, comment => " ".repeat(comment.length))
    .replace(/--[^\n\r]*/g, comment => " ".repeat(comment.length));
  const pattern = /\b(FROM|JOIN)(\s+)(\[[^\]]+\]|[A-Za-z0-9_]+)/gi;
  const wanted = fromName.toLowerCase();

  let result = "";
  let cursor = 0;
  let match = pattern.exec(masked);
  while (match) {
    const identifier = match[3].replace(/^\[|\]$/g, "");
    if (identifier.toLowerCase() === wanted) {
      const start = match.index + match[1].length + match[2].length;
      result += query.slice(cursor, start) + `[${toName}]`;
      cursor = start + match[3].length;
    }
    match = pattern.exec(masked);
  }

  return result + query.slice(cursor);
}

function extractIdentifiers(query: string, keyword: "INTO" | "FROM"): string[] {
  const pattern = new RegExp(`\\b${keyword}\\s+(?:\\[([^\\]]+)\\]|([A-Za-z0-9_]+))`, "gi");
  const found: string[] = [];
  let match = pattern.exec(query);

  while (match) {
    const identifier = match[1] || match[2];
    if (identifier && found.indexOf(identifier) === -1) {
      found.push(identifier);
    }
    match = pattern.exec(query);
  }

  return found;
}

/**
 * Builds the SQL operator payload from the job's transformation.
 *
 * The out-of-order and late-arrival policies are job-level in ASA but
 * operator-level in Eventstream, so they move onto advancedSettings here.
 */
export function mapQuery(job: AsaStreamingJob): QueryMappingResult {
  const jobProperties = job.properties || {};
  const query = jobProperties.transformation?.properties?.query || "";
  const findings: MappingFinding[] = [];
  const analysis = analyzeQuery(job);

  const advancedSettings: EventstreamSqlAdvancedSettings = {
    eventsOutOfOrderPolicy: jobProperties.eventsOutOfOrderPolicy,
    eventsOutOfOrderMaxDelayInSeconds: jobProperties.eventsOutOfOrderMaxDelayInSeconds,
    eventsLateArrivalMaxDelayInSeconds: jobProperties.eventsLateArrivalMaxDelayInSeconds
  };

  if (!query.trim()) {
    findings.push(
      blocked(
        "Query",
        job.name,
        "transformation",
        "The job has no transformation query. There is nothing for the Eventstream SQL " +
          "operator to run."
      )
    );
    return { query, advancedSettings, findings, analysis, intoTargets: [], fromSources: [] };
  }

  const scannable = stripSqlComments(query);

  for (const construct of analysis.constructs) {
    if (construct.rule.support === "Unsupported") {
      findings.push(blocked("Query", job.name, construct.rule.label, constructReason(construct)));
    } else if (construct.rule.support === "NeedsReview") {
      findings.push(
        approximated("Query", job.name, construct.rule.label, "SQL", constructReason(construct))
      );
    }
  }

  // A job carrying UDF definitions is unmigratable even if the query text does
  // not obviously reference them.
  const functions = jobProperties.functions || [];
  if (functions.length > 0) {
    findings.push(
      blocked(
        "Query",
        job.name,
        "functions",
        `The job defines ${functions.length} user-defined function(s) ` +
          `(${functions.map(f => f.name).join(", ")}). Eventstream cannot host them.`
      )
    );
  }

  if (!findings.some(finding => finding.status === "Blocked")) {
    const checked = analysis.constructs.length;
    findings.push(
      mapped(
        "Query",
        job.name,
        "transformation",
        "SQL",
        "The transformation query is carried into an Eventstream SQL operator, along with the " +
          "job's out-of-order and late-arrival policies. " +
          (checked > 0
            ? `${analysis.counts.Supported} of ${checked} recognized constructs run unchanged.`
            : "It uses no constructs that need special handling.")
      )
    );
  }

  return {
    query,
    advancedSettings,
    findings,
    analysis,
    intoTargets: extractIdentifiers(scannable, "INTO"),
    fromSources: extractIdentifiers(scannable, "FROM")
  };
}
