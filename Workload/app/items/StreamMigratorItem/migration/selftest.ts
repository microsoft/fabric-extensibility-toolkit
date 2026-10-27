/**
 * Self-test for the migration engine.
 *
 * The repo has no test runner, so this is a plain script: compile it to
 * CommonJS and run it with node. From the Workload directory:
 *
 *   node_modules/.bin/tsc app/items/StreamMigratorItem/migration/selftest.ts \
 *     --outDir <tmp> --module commonjs --target ES2017 --esModuleInterop \
 *     --skipLibCheck --moduleResolution node
 *   node <tmp>/items/StreamMigratorItem/migration/selftest.js
 *
 * Exits non-zero on the first failed assertion.
 */

import {
  asaInputNameOf,
  asaOutputNameOf,
  bindPlan,
  bindToEventstream,
  buildMigrationPlan,
  duplicateNodeNames,
  eventstreamNamesFor
} from "./mapping/topology";
import { EventstreamDefinition } from "./emit/EventstreamDefinition";
import { stripSqlComments } from "./mapping/queryMap";
import { QueryAnalysis, analyzeQuery } from "./assess/queryAnalysis";
import { QUERY_RULES } from "./assess/queryRules";
import { buildCreateEventstreamRequest, toBase64 } from "./emit/ItemPayload";
import { isAsyncOperation } from "./execute/asyncOperation";
import {
  normalizeParameterName,
  pickDefaultConnectionType,
  prefillConnectionParameter
} from "./mapping/connectionPrefill";
import { MigrationAssessment } from "./assess/Assessment";
import {
  blobToSqlJob,
  commentedUdfJob,
  eventHubToKustoJob,
  fanOutJob,
  referenceAndUdfJob,
  sameNameJob,
  separatePipelinesJob,
  streamJoinJob,
  unionTwoHubsJob
} from "./__fixtures__/asaJobs";

/** A copy of a job's first output, renamed. */
function kustoOutputFor(job: typeof sameNameJob, name: string) {
  return { ...job.properties!.outputs![0], name };
}

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string): void {
  checks++;
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` -- ${detail}` : ""}`);
  }
}

function blockedReasons(assessment: MigrationAssessment): string {
  return assessment.findings
    .filter(f => f.status === "Blocked")
    .map(f => `${f.scope}/${f.asaName}`)
    .join(", ");
}

console.log("\n== eventHubToKustoJob: should migrate cleanly ==");
{
  const { eventstreams: [{ definition }], assessment } = buildMigrationPlan(eventHubToKustoJob);

  check("assessment reports migratable", assessment.canMigrate, blockedReasons(assessment));
  check("no blocked findings", assessment.counts.Blocked === 0);
  check("one source generated", definition.sources.length === 1);
  check("source is AzureEventHub", definition.sources[0]?.type === "AzureEventHub");
  check("source name is suffixed", definition.sources[0]?.name === "deviceInput-source");

  const defaultStream = definition.streams.find(s => s.type === "DefaultStream");
  check("default stream named after ASA input", defaultStream?.name === "deviceInput");
  check(
    "default stream reads the source",
    defaultStream?.inputNodes?.[0]?.name === "deviceInput-source"
  );

  // Fabric rejects a destination behind "SQL operator -> derived stream".
  check(
    "no derived stream",
    !definition.streams.some(s => s.type === "DerivedStream")
  );

  check("one SQL operator", definition.operators.length === 1);
  check("operator type is SQL", definition.operators[0]?.type === "SQL");
  check(
    "operator reads the default stream",
    definition.operators[0]?.inputNodes?.[0]?.name === "deviceInput"
  );

  // The whole point of the naming scheme: the query moves across untouched.
  check(
    "query passed through verbatim",
    definition.operators[0]?.properties?.query ===
      eventHubToKustoJob.properties.transformation.properties.query
  );

  const advanced = definition.operators[0]?.properties?.advancedSettings;
  check("out-of-order policy carried", advanced?.eventsOutOfOrderPolicy === "Adjust");
  check("out-of-order delay carried", advanced?.eventsOutOfOrderMaxDelayInSeconds === 5);
  check("late arrival delay carried", advanced?.eventsLateArrivalMaxDelayInSeconds === 300);

  check("one destination", definition.destinations.length === 1);
  check("destination is Eventhouse", definition.destinations[0]?.type === "Eventhouse");
  check("destination named after ASA output", definition.destinations[0]?.name === "kustoOutput");
  const nodeNames = [
    ...definition.sources,
    ...definition.destinations,
    ...definition.streams,
    ...definition.operators
  ].map(node => node.name);
  check("node names are unique", new Set(nodeNames).size === nodeNames.length, nodeNames.join(", "));
  check(
    "destination reads the SQL operator",
    definition.destinations[0]?.inputNodes?.[0]?.name === "telemetry-job-query"
  );
  check("ADX table name carried", definition.destinations[0]?.properties?.tableName === "Readings");
  check("compatibility level set", definition.compatibilityLevel === "1.0");
}

console.log("\n== blobToSqlJob: both ends unsupported ==");
{
  const { eventstreams: [{ definition }], assessment } = buildMigrationPlan(blobToSqlJob);

  check("assessment reports NOT migratable", !assessment.canMigrate);
  check("no sources generated", definition.sources.length === 0);
  check("no destinations generated", definition.destinations.length === 0);

  const blobFinding = assessment.findings.find(f => f.scope === "Input" && f.asaName === "blobInput");
  check("blob input blocked", blobFinding?.status === "Blocked");
  check(
    "blob reason mentions notifications, not files",
    /notifications, not the files/i.test(blobFinding?.reason || "")
  );

  const sqlFinding = assessment.findings.find(f => f.scope === "Output" && f.asaName === "sqlOutput");
  check("sql output blocked", sqlFinding?.status === "Blocked");

  // The INTO target has no destination, so the cross-check must catch it.
  const intoFinding = assessment.findings.find(f => f.asaType === "INTO target");
  check("dangling INTO target flagged", intoFinding?.status === "Blocked", "cross-check missed it");
}

console.log("\n== referenceAndUdfJob: reference data and a UDF ==");
{
  const { assessment } = buildMigrationPlan(referenceAndUdfJob);

  check("assessment reports NOT migratable", !assessment.canMigrate);

  const refFinding = assessment.findings.find(f => f.asaName === "lookupInput");
  check("reference input blocked", refFinding?.status === "Blocked");

  const udfFindings = assessment.findings.filter(
    f => f.scope === "Query" && f.status === "Blocked"
  );
  check("udf call detected in query", udfFindings.some(f => f.asaType === "user-defined function"));
  check("declared functions detected", udfFindings.some(f => f.asaType === "functions"));

  // The event hub input itself is still fine, and should be reported as such.
  const ehFinding = assessment.findings.find(f => f.asaName === "eventInput");
  check("event hub input still mapped", ehFinding?.status === "Mapped");

  // The data lake output is supported, but only approximately.
  const lakeFinding = assessment.findings.find(f => f.asaName === "lakeOutput");
  check("data lake output approximated", lakeFinding?.status === "Approximated");
  check("data lake targets Lakehouse", lakeFinding?.targetType === "Lakehouse");
}

console.log("\n== commentedUdfJob: comments must not trip the scanner ==");
{
  const { assessment } = buildMigrationPlan(commentedUdfJob);

  const udfFinding = assessment.findings.find(f => f.asaType === "user-defined function");
  check("commented-out udf NOT flagged", !udfFinding, "false positive from a SQL comment");

  const iotFinding = assessment.findings.find(f => f.asaName === "input1");
  check("iot hub input mapped", iotFinding?.status === "Mapped");
  check("iot hub targets AzureIoTHub", iotFinding?.targetType === "AzureIoTHub");

  check("job is migratable", assessment.canMigrate, blockedReasons(assessment));
}

console.log("\n== INTO target differs from output name only by case ==");
{
  // ASA treats `INTO dest` and an output named `Dest` as the same identifier.
  const job = {
    ...eventHubToKustoJob,
    properties: {
      ...eventHubToKustoJob.properties,
      transformation: {
        name: "Transformation",
        properties: { query: "SELECT * INTO dest FROM deviceInput" }
      },
      outputs: [{ ...eventHubToKustoJob.properties!.outputs![0], name: "Dest" }]
    }
  };
  const { eventstreams: [{ definition }], assessment } = buildMigrationPlan(job);
  const destinationName = definition.destinations[0]?.name;

  check("case-only mismatch is not blocked", assessment.canMigrate, blockedReasons(assessment));
  check("destination takes the query's spelling", destinationName === "dest", destinationName);
  check("destination maps back to the ASA output", asaOutputNameOf(job, destinationName) === "Dest");
}

console.log("\n== query analysis: Eventstream SQL support matrix ==");
{
  const withQuery = (query: string, extra: Record<string, any> = {}) => ({
    ...eventHubToKustoJob,
    properties: {
      ...eventHubToKustoJob.properties,
      ...extra,
      transformation: { name: "Transformation", properties: { query } }
    }
  });
  const ids = (analysis: QueryAnalysis) => analysis.constructs.map(c => c.rule.id);

  // Geospatial and anomaly detection carry Microsoft's "Fabric Eventstream" badge.
  const geo = buildMigrationPlan(withQuery(
    "SELECT ST_WITHIN(CreatePoint(lat, lon), zone) AS inside,\n" +
    "  AnomalyDetection_SpikeAndDip(CAST(t AS FLOAT), 95, 120, 'spikesanddips') OVER (LIMIT DURATION(second, 120)) AS s\n" +
    "INTO [kustoOutput] FROM [deviceInput]"
  ));
  check("geospatial is not blocked", geo.assessment.canMigrate, blockedReasons(geo.assessment));
  check("geospatial reported supported", geo.queryAnalysis.constructs.some(c => c.rule.id === "geospatial" && c.rule.support === "Supported"));
  check("anomaly detection reported supported", ids(geo.queryAnalysis).indexOf("anomaly-detection") !== -1);
  check("line numbers point at the construct", geo.queryAnalysis.constructs.find(c => c.rule.id === "anomaly-detection")?.occurrences[0]?.line === 2);

  // Comments and string literals must never count.
  const masked = analyzeQuery(withQuery(
    "/* udf.old(x) */ SELECT 'udf.notreal' AS note -- TumblingWindow(second, 5)\nINTO [kustoOutput] FROM [deviceInput]"
  ));
  check("udf inside a string literal ignored", ids(masked).indexOf("udf-call") === -1);
  check("window inside a comment ignored", ids(masked).indexOf("window-tumbling") === -1);

  // PARTITION BY inside OVER(...) is analytic partitioning, not input partitioning.
  const over = analyzeQuery(withQuery(
    "SELECT LAG(v) OVER (PARTITION BY id LIMIT DURATION(minute, 1)) AS prev INTO [kustoOutput] FROM [deviceInput]"
  ));
  check("PARTITION BY inside OVER not flagged", ids(over).indexOf("partition-by") === -1);
  check("LAG recognized", ids(over).indexOf("lag") !== -1);
  const input = analyzeQuery(withQuery(
    "SELECT * INTO [kustoOutput] FROM [deviceInput] PARTITION BY PartitionId"
  ));
  check("input PARTITION BY needs review", input.constructs.some(c => c.rule.id === "partition-by" && c.rule.support === "NeedsReview"));

  // JOIN is classified by what it joins against.
  const joins = analyzeQuery(withQuery(
    "SELECT * INTO [kustoOutput] FROM [deviceInput] d\n" +
    "JOIN [lookup] r ON d.id = r.id\n" +
    "JOIN [other] o ON DATEDIFF(second, d, o) BETWEEN 0 AND 5 AND d.id = o.id",
    { inputs: [...eventHubToKustoJob.properties!.inputs!, { name: "lookup", properties: { type: "Reference" } }] }
  ));
  check("reference JOIN needs review", joins.constructs.find(c => c.rule.id === "join-reference")?.occurrences[0]?.line === 2);
  check("stream JOIN supported", joins.constructs.find(c => c.rule.id === "join-stream")?.occurrences[0]?.line === 3);

  // UDF calls block; metadata needs review; several outputs are supported.
  const mixed = buildMigrationPlan(withQuery(
    "SELECT udf.clean(payload) AS p, GetMetadataPropertyValue(e, 'EventId') AS id INTO [a] FROM [deviceInput] e\n" +
    "SELECT * INTO [b] FROM [deviceInput]"
  ));
  check("udf call blocks", mixed.queryAnalysis.constructs.some(c => c.rule.id === "udf-call" && c.rule.support === "Unsupported"));
  check("metadata function needs review", ids(mixed.queryAnalysis).indexOf("metadata-function") !== -1);
  check("multiple outputs recognized", ids(mixed.queryAnalysis).indexOf("multiple-outputs") !== -1);
  check("unsupported sorted first", mixed.queryAnalysis.constructs[0]?.rule.support === "Unsupported");
  check("line 1 highlighted as unsupported", mixed.queryAnalysis.lineSupport[1] === "Unsupported");

  // Job-level settings surface without a line.
  const legacy = analyzeQuery(withQuery("SELECT * INTO [kustoOutput] FROM [deviceInput]", { compatibilityLevel: "1.0" }));
  check("compatibility level 1.0 flagged", legacy.constructs.some(c => c.rule.id === "compat-level" && c.occurrences.length === 0));

  // Every rule cites a Microsoft Learn page.
  check("every rule links Microsoft Learn", QUERY_RULES.every(r => r.docUrl.indexOf("https://learn.microsoft.com/") === 0));
}

console.log("\n== binding to the Eventstream's default stream ==");
{
  const query =
    "/* reads FROM Source in a comment */\nSELECT\n    *\nINTO\n    Dest\nFROM\n    Source\n" +
    "-- JOIN Source\n";
  const job = {
    ...eventHubToKustoJob,
    properties: {
      ...eventHubToKustoJob.properties,
      inputs: [{ ...eventHubToKustoJob.properties!.inputs![0], name: "Source" }],
      transformation: { name: "Transformation", properties: { query } },
      outputs: [{ ...eventHubToKustoJob.properties!.outputs![0], name: "Dest" }]
    }
  };
  const bound = bindToEventstream(buildMigrationPlan(job).eventstreams[0].definition, "DemoStreamAnalytics");
  const defaultStream = bound.streams.find(s => s.type === "DefaultStream");
  const boundQuery = bound.operators[0]?.properties?.query;

  check("default stream renamed", defaultStream?.name === "DemoStreamAnalytics-stream", defaultStream?.name);
  check("default stream still reads the source", defaultStream?.inputNodes?.[0]?.name === "Source-source");
  check(
    "operator reads the renamed stream",
    bound.operators[0]?.inputNodes?.[0]?.name === "DemoStreamAnalytics-stream"
  );
  check("FROM rewritten", /FROM\s+\[DemoStreamAnalytics-stream\]/.test(boundQuery), boundQuery);
  check("comments left alone", boundQuery.indexOf("reads FROM Source in a comment") !== -1);
  check("line comment left alone", boundQuery.indexOf("-- JOIN Source") !== -1);
  check("INTO untouched", /INTO\s+Dest/.test(boundQuery));
  const nodeNames = [...bound.sources, ...bound.destinations, ...bound.streams, ...bound.operators]
    .map(node => node.name);
  check("bound node names are unique", new Set(nodeNames).size === nodeNames.length);
}

/** Every node name in a definition, for uniqueness checks. */
function nodeNamesOf(definition: EventstreamDefinition): string[] {
  return [...definition.sources, ...definition.destinations, ...definition.streams, ...definition.operators]
    .map(node => node.name);
}

function findingsOf(assessment: MigrationAssessment, asaType: string, status?: string) {
  return assessment.findings.filter(f => f.asaType === asaType && (!status || f.status === status));
}

console.log("\n== unionTwoHubsJob: identical UNION branches merge into one default stream ==");
{
  const plan = buildMigrationPlan(unionTwoHubsJob);
  const { assessment } = plan;

  check("migratable", assessment.canMigrate, blockedReasons(assessment));
  check("one Eventstream", plan.eventstreams.length === 1);
  const definition = plan.eventstreams[0].definition;
  check("both inputs ingested", plan.eventstreams[0].inputs.join(",") === "eastHub,westHub");
  check("two sources", definition.sources.map(s => s.name).join(",") === "eastHub-source,westHub-source");
  check(
    "both sources feed the default stream",
    definition.streams[0]?.inputNodes?.map(n => n.name).join(",") === "eastHub-source,westHub-source"
  );
  check("one default stream, no derived stream", definition.streams.length === 1);

  const merge = findingsOf(assessment, "multiple inputs", "Approximated")[0];
  check("merge raised as approximated", Boolean(merge));
  check("merge reason explains the collapse", /collapsed to one branch/.test(merge?.reason || ""), merge?.reason);

  // Both branches would read the merged stream, so keeping both would duplicate every event.
  const query = definition.operators[0]?.properties?.query || "";
  check("UNION collapsed to its first branch", !/\bUNION\b/.test(stripSqlComments(query)), query);
  check("second branch removed", query.indexOf("westHub") === -1, query);
  check("first branch kept verbatim", query.indexOf("INTO [allReadings]\nFROM [eastHub] TIMESTAMP BY eventTime") !== -1);

  const bound = bindToEventstream(definition, "regions");
  const boundQuery = bound.operators[0]?.properties?.query || "";
  check("bound default stream named after the Eventstream", bound.streams[0]?.name === "regions-stream");
  check(
    "bound default stream keeps every source",
    bound.streams[0]?.inputNodes?.map(n => n.name).join(",") === "eastHub-source,westHub-source"
  );
  check("FROM rewritten to the default stream", /FROM \[regions-stream\] TIMESTAMP BY/.test(boundQuery), boundQuery);
  check("comment left alone", boundQuery.indexOf("FROM [eastHub] in a comment stays put") !== -1);
  check("bound node names unique", new Set(nodeNamesOf(bound)).size === nodeNamesOf(bound).length);
}

console.log("\n== UNION in a WITH step, aggregated downstream ==");
{
  const job = {
    ...unionTwoHubsJob,
    properties: {
      ...unionTwoHubsJob.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            "WITH merged AS (\n  SELECT * FROM eastHub\n  UNION ALL\n  SELECT * FROM westHub\n)\n" +
            "SELECT COUNT(*) AS n INTO [allReadings] FROM merged GROUP BY TumblingWindow(minute, 1)"
        }
      }
    }
  };
  const plan = buildMigrationPlan(job);
  const query = plan.eventstreams[0].definition.operators[0]?.properties?.query || "";
  check("step UNION migrates", plan.assessment.canMigrate, blockedReasons(plan.assessment));
  check("step UNION collapsed", query.indexOf("westHub") === -1 && /FROM eastHub\s*\)/.test(query), query);
  check("aggregation kept", query.indexOf("FROM merged GROUP BY TumblingWindow(minute, 1)") !== -1);

  // Reading one merged input on its own would now see the other's events too.
  const leaky = {
    ...job,
    properties: {
      ...job.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            job.properties.transformation.properties.query +
            "\nSELECT * INTO [allReadings] FROM eastHub WHERE temperature > 50"
        }
      }
    }
  };
  const leakyPlan = buildMigrationPlan(leaky);
  check("partial read of merged inputs blocked", !leakyPlan.assessment.canMigrate);
  check(
    "reason names the missing input",
    findingsOf(leakyPlan.assessment, "multiple inputs", "Blocked").some(f => /not 'westHub'/.test(f.reason))
  );
}

console.log("\n== UNION branches that differ per input ==");
{
  // Microsoft's own UNION example: each branch timestamps by a different field.
  const job = {
    ...unionTwoHubsJob,
    properties: {
      ...unionTwoHubsJob.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            "SELECT TollId, EntryTime AS Time INTO [allReadings] FROM eastHub TIMESTAMP BY EntryTime\n" +
            "UNION\nSELECT TollId, ExitTime AS Time FROM westHub TIMESTAMP BY ExitTime"
        }
      }
    }
  };
  const plan = buildMigrationPlan(job);
  check("differing branches blocked", !plan.assessment.canMigrate);
  check(
    "reason says the branches differ",
    findingsOf(plan.assessment, "multiple inputs", "Blocked").some(f => /branches do more than read different inputs/.test(f.reason))
  );
  check("not collapsed when blocked", /\bUNION\b/.test(plan.eventstreams[0].definition.operators[0]?.properties?.query));

  // A literal that differs per branch is a real difference, even though masking blanks it.
  const labelled = {
    ...job,
    properties: {
      ...job.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            "SELECT 'east' AS region, * INTO [allReadings] FROM eastHub\n" +
            "UNION\nSELECT 'west' AS region, * FROM westHub"
        }
      }
    }
  };
  check("branches differing only in a string literal blocked", !buildMigrationPlan(labelled).assessment.canMigrate);

  // Aliases differ in name only.
  const aliased = {
    ...job,
    properties: {
      ...job.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            "SELECT e.deviceId INTO [allReadings] FROM eastHub e\nUNION\nSELECT w.deviceId FROM westHub AS w"
        }
      }
    }
  };
  const aliasedPlan = buildMigrationPlan(aliased);
  check("branches differing only in alias merge", aliasedPlan.assessment.canMigrate, blockedReasons(aliasedPlan.assessment));
}

console.log("\n== separatePipelinesJob: independent inputs become separate Eventstreams ==");
{
  const plan = buildMigrationPlan(separatePipelinesJob);
  const { assessment } = plan;

  check("migratable", assessment.canMigrate, blockedReasons(assessment));
  check("two Eventstreams", plan.eventstreams.length === 2, String(plan.eventstreams.length));
  const [orders, clicks] = plan.eventstreams;
  check("first ingests orders only", orders?.inputs.join(",") === "orders");
  check("second ingests clicks only", clicks?.inputs.join(",") === "clicks");
  check("orders writes its outputs", orders?.outputs.join(",") === "ordersOut,auditOut", orders?.outputs.join(","));
  check("clicks writes its outputs", clicks?.outputs.join(",") === "clicksOut,auditOut", clicks?.outputs.join(","));
  check("one source each", orders?.definition.sources.length === 1 && clicks?.definition.sources.length === 1);

  const ordersQuery = orders?.definition.operators[0]?.properties?.query || "";
  const clicksQuery = clicks?.definition.operators[0]?.properties?.query || "";
  check("orders query keeps its step", /WITH cleanOrders AS \(SELECT \* FROM \[orders\] WHERE amount > 0\)/.test(ordersQuery), ordersQuery);
  check("orders query drops the clicks step", ordersQuery.indexOf("recentClicks") === -1, ordersQuery);
  check("orders query keeps its literal", ordersQuery.indexOf("SELECT 'order' AS kind") !== -1);
  check("orders query drops click statements", ordersQuery.indexOf("'click'") === -1 && ordersQuery.indexOf("clicksOut") === -1);
  check("clicks query keeps its step as the WITH clause", /^WITH recentClicks AS \(/.test(clicksQuery), clicksQuery);
  check("clicks query drops orders", clicksQuery.indexOf("orders") === -1 && clicksQuery.indexOf("cleanOrders") === -1, clicksQuery);
  check("comment kept", clicksQuery.indexOf("-- click stream") !== -1);

  const split = findingsOf(assessment, "multiple inputs").find(f => f.scope === "Job");
  check("split explained", /2 independent pipelines/.test(split?.reason || ""), split?.reason);
  check("shared output explained", /'auditout' is written by more than one pipeline/i.test(split?.reason || ""), split?.reason);

  const names = eventstreamNamesFor(plan, "shop");
  check("Eventstreams named after their input", names.join(",") === "shop-orders,shop-clicks", names.join(","));
  const bound = bindPlan(plan, "shop");
  check("each bound to its own default stream", bound[1]?.definition.streams[0]?.name === "shop-clicks-stream");
  check(
    "each reads its own default stream",
    /FROM \[shop-clicks-stream\] WHERE page/.test(bound[1]?.definition.operators[0]?.properties?.query || "")
  );
  check("bound node names unique", bound.every(es => duplicateNodeNames(es.definition).length === 0));
}

console.log("\n== streamJoinJob: JOIN across two stream inputs ==");
{
  const plan = buildMigrationPlan(streamJoinJob);
  check("blocked", !plan.assessment.canMigrate);
  const join = plan.queryAnalysis.constructs.find(c => c.rule.id === "join-inputs");
  check("analyzer flags JOIN across inputs", join?.rule.support === "Unsupported");
  check("JOIN pinpointed to its line", join?.occurrences[0]?.line === 4);
  check("not reported as a supported stream JOIN", !plan.queryAnalysis.constructs.some(c => c.rule.id === "join-stream"));
  const finding = plan.assessment.findings.find(f => f.status === "Blocked" && f.asaType === "JOIN across stream inputs");
  check("blocked finding raised once", Boolean(finding) && findingsOf(plan.assessment, "multiple inputs", "Blocked").length === 0);
  check("reason says it is unconfirmed, not faked", /not confirmed by Microsoft documentation/.test(finding?.reason || ""));
  check("merged for review in one Eventstream", plan.eventstreams.length === 1 && plan.eventstreams[0].definition.sources.length === 2);

  // A self-join within one input is still an ordinary, supported stream JOIN.
  const self = analyzeQuery({
    ...streamJoinJob,
    properties: {
      ...streamJoinJob.properties,
      transformation: {
        name: "Transformation",
        properties: {
          query:
            "SELECT * INTO [tripTimes] FROM entries a JOIN entries b ON DATEDIFF(second, a, b) BETWEEN 0 AND 5\n" +
            "SELECT * INTO [tripTimes] FROM exits"
        }
      }
    }
  });
  check("self-join within one input stays supported", self.constructs.some(c => c.rule.id === "join-stream"));
}

console.log("\n== fanOutJob: one input, several outputs, one unsupported ==");
{
  const plan = buildMigrationPlan(fanOutJob);
  const definition = plan.eventstreams[0].definition;
  const { assessment } = plan;

  check("one Eventstream", plan.eventstreams.length === 1);
  check(
    "supported outputs still become destinations",
    definition.destinations.map(d => `${d.name}:${d.type}`).join(",") === "hot:Eventhouse,archive:Lakehouse",
    definition.destinations.map(d => d.name).join(",")
  );
  check("all destinations read the one SQL operator", definition.destinations.every(d => d.inputNodes?.[0]?.name === "fanout-job-query"));
  check("function output blocked", assessment.findings.some(f => f.asaName === "alerts" && f.status === "Blocked" && f.scope === "Output"));
  check("its INTO flagged as dangling", assessment.findings.some(f => f.asaType === "INTO target" && /'alerts'/.test(f.reason)));

  const unused = assessment.findings.find(f => f.asaName === "debugOut");
  check("unused output flagged", unused?.status === "Approximated" && /No INTO clause/.test(unused.reason), unused?.reason);
  check("unused unsupported output does not block", !assessment.findings.some(f => f.asaName === "debugOut" && f.status === "Blocked"));
  check("unused output gets no destination", !definition.destinations.some(d => d.name === "debugOut"));
  check("only the unsupported output blocks", assessment.counts.Blocked === 2, blockedReasons(assessment));
}

console.log("\n== sameNameJob: an input and an output share a name ==");
{
  const plan = buildMigrationPlan(sameNameJob);
  const definition = plan.eventstreams[0].definition;

  check("migratable", plan.assessment.canMigrate, blockedReasons(plan.assessment));
  check("destination keeps the INTO alias", definition.destinations[0]?.name === "events");
  check("default stream yields with a suffix", definition.streams[0]?.name === "events-2", definition.streams[0]?.name);
  check("unbound node names unique", duplicateNodeNames(definition).length === 0, nodeNamesOf(definition).join(","));
  check("source maps back to the ASA input", asaInputNameOf(sameNameJob, definition.sources[0]?.name) === "events");
  check("destination maps back to the ASA output", asaOutputNameOf(sameNameJob, definition.destinations[0]?.name) === "events");

  const bound = bindToEventstream(definition, "evts");
  const boundQuery = bound.operators[0]?.properties?.query;
  check("FROM rewritten through the suffixed stream", boundQuery === "SELECT * INTO events FROM [evts-stream]", boundQuery);
  check("operator reads the bound stream", bound.operators[0]?.inputNodes?.[0]?.name === "evts-stream");
  check("bound node names unique", duplicateNodeNames(bound).length === 0);

  // An Eventstream name that makes "<name>-stream" equal an output is caught.
  const clash = {
    ...sameNameJob,
    properties: {
      ...sameNameJob.properties,
      transformation: { name: "Transformation", properties: { query: "SELECT * INTO [evts-stream] FROM events" } },
      outputs: [kustoOutputFor(sameNameJob, "evts-stream")]
    }
  };
  const clashed = bindToEventstream(buildMigrationPlan(clash).eventstreams[0].definition, "evts");
  check("default stream / output clash detected", duplicateNodeNames(clashed).indexOf("evts-stream") !== -1);

  // A source suffixed for uniqueness still maps back to its input.
  check("suffixed source maps back", asaInputNameOf(sameNameJob, "events-source-2") === "events");
}

console.log("\n== helpers ==");
{
  check(
    "stripSqlComments removes line comments",
    stripSqlComments("SELECT 1 -- udf.x\nFROM t").indexOf("udf.") === -1
  );
  check(
    "stripSqlComments removes block comments",
    stripSqlComments("SELECT /* udf.x */ 1").indexOf("udf.") === -1
  );

  // Multi-byte input is the reason we do not call btoa directly.
  const encoded = toBase64('{"q":"温度"}');
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  check("base64 round-trips multi-byte text", decoded === '{"q":"温度"}', decoded);

  const { eventstreams: [{ definition }] } = buildMigrationPlan(eventHubToKustoJob);
  const request = buildCreateEventstreamRequest("telemetry-job", definition, {
    properties: { retentionTimeInDays: 1, eventThroughputLevel: "Low" }
  });
  check("item type is Eventstream", request.type === "Eventstream");
  check("two definition parts", request.definition?.parts.length === 2);
  check("first part is eventstream.json", request.definition?.parts[0].path === "eventstream.json");
  check("payload type is InlineBase64", request.definition?.parts[0].payloadType === "InlineBase64");

  const roundTripped = JSON.parse(
    Buffer.from(request.definition.parts[0].payload, "base64").toString("utf8")
  );
  check("payload decodes to the definition", roundTripped.sources.length === 1);
  check("decoded operator keeps the query", roundTripped.operators[0].properties.query.length > 0);
}

console.log("\n== create-item response narrowing ==");
{
  // A 202 from Fabric yields an operation handle, which must be polled.
  check("operation indicator detected", isAsyncOperation({ operationId: "op-123" }));
  check(
    "operation indicator with retryAfter detected",
    isAsyncOperation({ operationId: "op-123", retryAfter: 5 })
  );

  // A 201 yields the created item, which must be used directly.
  check(
    "created item not treated as an operation",
    !isAsyncOperation({ id: "i1", type: "Eventstream", displayName: "es", workspaceId: "ws" })
  );
  check(
    "value carrying both fields is treated as an item",
    !isAsyncOperation({ id: "i1", operationId: "op-123" })
  );

  check("null is not an operation", !isAsyncOperation(null));
  check("undefined is not an operation", !isAsyncOperation(undefined));
  check("empty object is not an operation", !isAsyncOperation({}));
}

console.log("\n== connection prefill ==");
{
  const ehInput = eventHubToKustoJob.properties.inputs[0];
  const iotInput = commentedUdfJob.properties.inputs[0];

  // Fabric parameter names vary per connector, so matching is alias-based.
  check(
    "endpoint gets the namespace FQDN",
    prefillConnectionParameter("endpoint", ehInput) === "contoso-ns.servicebus.windows.net",
    prefillConnectionParameter("endpoint", ehInput)
  );
  check(
    "entityPath gets the event hub name",
    prefillConnectionParameter("entityPath", ehInput) === "telemetry"
  );
  check(
    "alias spelling still matches",
    prefillConnectionParameter("Entity_Path", ehInput) === "telemetry"
  );
  check(
    "consumer group carried over",
    prefillConnectionParameter("consumerGroupName", ehInput) === "$Default"
  );
  check(
    "iot hub namespace resolves too",
    prefillConnectionParameter("endpoint", iotInput) === "hub.servicebus.windows.net",
    prefillConnectionParameter("endpoint", iotInput)
  );
  check(
    "unknown parameter yields empty, not a guess",
    prefillConnectionParameter("somethingElse", ehInput) === ""
  );
  check("missing input yields empty", prefillConnectionParameter("endpoint", undefined) === "");
  check("normalization strips separators", normalizeParameterName("Entity_Path") === "entitypath");

  // The service is authoritative; we only preselect when it offers a match.
  check(
    "event hub type preselected from service list",
    pickDefaultConnectionType("AzureEventHub", ["SQL", "EventHub"]) === "EventHub"
  );
  check(
    "no preselection when nothing matches",
    pickDefaultConnectionType("AzureEventHub", ["SQL", "Snowflake"]) === ""
  );
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
console.log("selftest OK");
