/**
 * The catalog of Stream Analytics query constructs the analyzer recognizes,
 * each with its support status in the Fabric Eventstream SQL operator.
 *
 * Status comes from Microsoft's own documentation: every page of the query
 * language reference is badged either "Azure Stream Analytics" only or
 * "Azure Stream Analytics + Fabric Eventstream", and the Eventstream migration
 * guide lists what does not carry over. Each rule links the page it rests on,
 * so a verdict shown to the user can always be traced back to its source.
 *
 * Rules marked `unverified` are not contradicted by the docs but not confirmed
 * either; they surface as "needs review" rather than guessing either way.
 */

export type QuerySupport = "Supported" | "NeedsReview" | "Unsupported";

export type QueryConstructCategory =
  | "Window"
  | "Join"
  | "Clause"
  | "Analytic"
  | "Function"
  | "Metadata"
  | "Extensibility"
  | "Job";

export interface QueryRule {
  id: string;
  label: string;
  category: QueryConstructCategory;
  support: QuerySupport;
  /** Matched against the query with comments and string literals blanked out. */
  pattern?: RegExp;
  /** What this means for the migration, in terms the user can act on. */
  detail: string;
  docUrl: string;
  /** Not contradicted by the docs, but not confirmed by them either. */
  unverified?: boolean;
}

const REF = "https://learn.microsoft.com/en-us/stream-analytics-query";
const ES_SQL =
  "https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/process-events-using-sql-code-editor";
const ES_MIGRATE =
  "https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/migrate-from-azure-event-hubs-stream-analytics";
const ES_METADATA =
  "https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/extract-event-metadata-with-eventstream";
const ES_REFERENCE =
  "https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/enrich-events-with-reference-data";

/** A function call: the name followed by an opening parenthesis. */
function call(...names: string[]): RegExp {
  return new RegExp(`\\b(?:${names.join("|")})\\s*\\(`, "gi");
}

export const QUERY_RULES: QueryRule[] = [
  // ---- windows ------------------------------------------------------------
  {
    id: "window-tumbling", label: "Tumbling window", category: "Window", support: "Supported",
    pattern: call("TumblingWindow", "Tumbling"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/tumbling-window-azure-stream-analytics`
  },
  {
    id: "window-hopping", label: "Hopping window", category: "Window", support: "Supported",
    pattern: call("HoppingWindow", "Hopping"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/hopping-window-azure-stream-analytics`
  },
  {
    id: "window-sliding", label: "Sliding window", category: "Window", support: "Supported",
    pattern: call("SlidingWindow", "Sliding"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/sliding-window-azure-stream-analytics`
  },
  {
    id: "window-session", label: "Session window", category: "Window", support: "Supported",
    pattern: call("SessionWindow", "Session"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/session-window-azure-stream-analytics`
  },
  {
    id: "window-snapshot", label: "Snapshot window", category: "Window", support: "Supported",
    pattern: call("SnapshotWindow", "Snapshot"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/snapshot-window-azure-stream-analytics`
  },
  {
    id: "window-multiple", label: "Multiple windows (WINDOWS)", category: "Window", support: "Supported",
    pattern: call("WINDOWS"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/windows-azure-stream-analytics`
  },

  // ---- joins and composition ---------------------------------------------
  // JOIN is classified structurally (stream vs reference data) by the analyzer.
  {
    id: "join-stream", label: "Stream-to-stream JOIN", category: "Join", support: "Supported",
    detail: "Supported. Joins two streams within a DATEDIFF time bound, as in Stream Analytics.",
    docUrl: `${REF}/join-azure-stream-analytics`
  },
  {
    // The JOIN itself is supported; what cannot carry over is the two inputs.
    id: "join-inputs", label: "JOIN across stream inputs", category: "Join", support: "Unsupported",
    detail:
      "Joins events from two different stream inputs. An Eventstream feeds every source into its one " +
      "default stream, so both sides of the JOIN would read the same mixed events and match events " +
      "from the wrong input. Reading two separate streams in one SQL operator is not confirmed by " +
      "Microsoft documentation, so the migrator does not attempt it. Keep this job in Stream " +
      "Analytics, or build the Eventstream by hand and test it.",
    docUrl: ES_SQL
  },
  {
    id: "join-reference", label: "Reference data JOIN", category: "Join", support: "NeedsReview",
    detail:
      "Eventstream joins reference data only from Lakehouse Delta tables. Load this data into a " +
      "Lakehouse table and connect it to the SQL operator after migrating.",
    docUrl: ES_REFERENCE
  },
  {
    id: "union", label: "UNION", category: "Join", support: "Supported",
    pattern: /\bUNION\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/union-azure-stream-analytics`
  },
  {
    id: "with-steps", label: "WITH query steps", category: "Clause", support: "Supported",
    pattern: /\bWITH\s+(?:\[[^\]]+\]|[A-Za-z_][\w-]*)\s+AS\s*\(/gi,
    detail: "Supported. Microsoft recommends WITH to read the input once and fan out to several outputs.",
    docUrl: `${REF}/with-azure-stream-analytics`
  },
  {
    id: "apply", label: "CROSS / OUTER APPLY", category: "Clause", support: "Supported",
    pattern: /\b(?:CROSS|OUTER)\s+APPLY\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/apply-azure-stream-analytics`
  },

  // ---- clauses ------------------------------------------------------------
  {
    id: "timestamp-by", label: "TIMESTAMP BY", category: "Clause", support: "Supported",
    pattern: /\bTIMESTAMP\s+BY\b/gi,
    detail:
      "Supported. Without it Eventstream uses arrival time. The job's late-arrival and " +
      "out-of-order thresholds move to the SQL operator's advanced settings.",
    docUrl: `${REF}/timestamp-by-azure-stream-analytics`
  },
  {
    id: "group-by", label: "GROUP BY", category: "Clause", support: "Supported",
    pattern: /\bGROUP\s+BY\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/group-by-azure-stream-analytics`
  },
  {
    id: "having", label: "HAVING", category: "Clause", support: "Supported",
    pattern: /\bHAVING\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/having-azure-stream-analytics`
  },
  {
    id: "case", label: "CASE expression", category: "Clause", support: "Supported",
    pattern: /\bCASE\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/case-azure-stream-analytics`
  },
  {
    id: "match-recognize", label: "MATCH_RECOGNIZE", category: "Clause", support: "Supported",
    pattern: /\bMATCH_RECOGNIZE\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/match-recognize-stream-analytics`
  },
  // Input-level PARTITION BY only; PARTITION BY inside OVER(...) is filtered out by the analyzer.
  {
    id: "partition-by", label: "Input PARTITION BY", category: "Clause", support: "NeedsReview", unverified: true,
    pattern: /\bPARTITION\s+BY\b/gi,
    detail:
      "Valid syntax in Eventstream, but whether explicit partitioning is honoured is not documented. " +
      "Verify throughput and ordering after migrating.",
    docUrl: `${REF}/from-azure-stream-analytics`
  },

  // ---- analytic functions ------------------------------------------------
  {
    id: "lag", label: "LAG", category: "Analytic", support: "Supported", pattern: call("LAG"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/lag-azure-stream-analytics`
  },
  {
    id: "last", label: "LAST", category: "Analytic", support: "Supported", pattern: call("LAST"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/last-azure-stream-analytics`
  },
  {
    id: "isfirst", label: "ISFIRST", category: "Analytic", support: "Supported", pattern: call("ISFIRST"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/isfirst-azure-stream-analytics`
  },
  {
    id: "collect", label: "COLLECT / COLLECTTOP", category: "Analytic", support: "Supported",
    pattern: call("COLLECT", "COLLECTTOP"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/collect-azure-stream-analytics`
  },
  {
    id: "topone", label: "TopOne", category: "Analytic", support: "Supported", pattern: call("TopOne"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/topone-azure-stream-analytics`
  },
  {
    id: "percentile", label: "PERCENTILE_CONT / PERCENTILE_DISC", category: "Analytic", support: "Supported",
    pattern: call("PERCENTILE_CONT", "PERCENTILE_DISC"),
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/percentile-cont-azure-stream-analytics`
  },
  {
    id: "count-distinct", label: "COUNT(DISTINCT)", category: "Analytic", support: "Supported",
    pattern: /\bCOUNT\s*\(\s*DISTINCT\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.", docUrl: `${REF}/count-azure-stream-analytics`
  },
  {
    id: "anomaly-detection", label: "Anomaly detection", category: "Analytic", support: "Supported",
    pattern: call("AnomalyDetection_SpikeAndDip", "AnomalyDetection_ChangePoint"),
    detail: "Supported. The built-in ML anomaly detection functions run in the Eventstream SQL operator.",
    docUrl: `${REF}/anomalydetection-spikeanddip-azure-stream-analytics`
  },

  // ---- scalar functions --------------------------------------------------
  {
    id: "geospatial", label: "Geospatial functions", category: "Function", support: "Supported",
    pattern: call("CreatePoint", "CreatePolygon", "CreateLineString", "ST_DISTANCE", "ST_WITHIN",
      "ST_OVERLAPS", "ST_INTERSECTS"),
    detail: "Supported. Geospatial functions run in the Eventstream SQL operator.",
    docUrl: `${REF}/st-within`
  },
  {
    id: "record-array", label: "Record and array functions", category: "Function", support: "Supported",
    pattern: call("GetRecordPropertyValue", "GetRecordProperties", "GetArrayElement", "GetArrayElements",
      "GetArrayLength"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/getrecordpropertyvalue-azure-stream-analytics`
  },
  {
    id: "system-timestamp", label: "System.Timestamp()", category: "Function", support: "Supported",
    pattern: /\bSystem\.Timestamp\b/gi,
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/system-timestamp-stream-analytics`
  },
  {
    id: "cast", label: "CAST / TRY_CAST", category: "Function", support: "Supported",
    pattern: call("CAST", "TRY_CAST"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/cast-azure-stream-analytics`
  },
  {
    id: "regexmatch", label: "REGEXMATCH", category: "Function", support: "Supported",
    pattern: call("REGEXMATCH"),
    detail: "Runs unchanged in the Eventstream SQL operator.",
    docUrl: `${REF}/regexmatch-azure-stream-analytics`
  },

  // ---- metadata ------------------------------------------------------------
  {
    id: "metadata-function", label: "GetMetadataPropertyValue", category: "Metadata", support: "NeedsReview",
    pattern: call("GetMetadataPropertyValue"),
    detail:
      "Supported, but enable Extended features on the Eventstream source and update the property " +
      "paths. Test runs in the editor return no metadata values.",
    docUrl: ES_METADATA
  },
  {
    id: "metadata-columns", label: "Event Hub / IoT Hub system columns", category: "Metadata",
    support: "NeedsReview", unverified: true,
    pattern: /\b(?:EventEnqueuedUtcTime|EventProcessedUtcTime|PartitionId|IoTHub\.\w+)\b/gi,
    detail:
      "Not documented for Eventstream. Prefer GetMetadataPropertyValue, and confirm these columns " +
      "resolve after migrating.",
    docUrl: ES_METADATA
  },

  // ---- extensibility -------------------------------------------------------
  {
    id: "udf-call", label: "user-defined function", category: "Extensibility", support: "Unsupported",
    pattern: /\b(?:udf|uda)\s*\./gi,
    detail:
      "Eventstream doesn't support custom UDFs in its SQL processing. Rewrite the logic in SQL, " +
      "or keep this job in Stream Analytics.",
    docUrl: ES_MIGRATE
  },

  // ---- job-level settings (raised structurally, not by pattern) -----------
  {
    id: "compat-level", label: "Compatibility level 1.0", category: "Job", support: "NeedsReview", unverified: true,
    detail:
      "Under level 1.0, Stream Analytics lower-cases field names. Eventstream's behaviour is not " +
      "documented, so check field references for case after migrating.",
    docUrl: `${REF}/stream-analytics-query-language-reference`
  },
  {
    id: "non-json-input", label: "Non-JSON input format", category: "Job", support: "NeedsReview", unverified: true,
    detail:
      "The input format is set on the Eventstream source connector. CSV, Avro and Parquet with the " +
      "SQL operator are not documented, so check the parsed fields after migrating.",
    docUrl: ES_SQL
  },
  {
    id: "multiple-outputs", label: "Multiple outputs", category: "Clause", support: "Supported",
    detail: "Supported. Each INTO target becomes its own destination fed by the SQL operator.",
    docUrl: ES_SQL
  }
];

export function ruleById(id: string): QueryRule {
  const rule = QUERY_RULES.find(candidate => candidate.id === id);
  if (!rule) {
    throw new Error(`Unknown query rule '${id}'`);
  }
  return rule;
}
