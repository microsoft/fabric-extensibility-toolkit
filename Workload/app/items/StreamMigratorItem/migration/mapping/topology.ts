/**
 * Assembles complete Eventstream topologies from a Stream Analytics job.
 *
 * Each Eventstream has the shape:
 *
 *   source(s) --> DefaultStream --> SQL operator --> destination(s)
 *
 * Each destination takes the name of an ASA output, so `INTO [output]` resolves
 * as the SQL operator's output alias. The DefaultStream takes the first ASA
 * input's name until bindToEventstream renames it to the Eventstream's default
 * stream and rewrites `FROM [input]` to match, for every input it carries.
 * Source nodes are suffixed to keep names unique, since the query never
 * references them.
 *
 * Most jobs become one Eventstream. A job whose query runs independent
 * pipelines over different inputs becomes one Eventstream per pipeline, because
 * an Eventstream merges all of its sources into its one default stream (see
 * inputGroups.ts).
 */

import { AsaStreamingJob } from "../../../../clients/AzureResourceManagerTypes";
import {
  EventstreamDefinition,
  EventstreamDestination,
  EventstreamSource,
  EventstreamStream,
  EVENTSTREAM_COMPATIBILITY_LEVEL
} from "../emit/EventstreamDefinition";
import {
  MappingFinding,
  MigrationAssessment,
  approximated,
  blocked,
  buildAssessment
} from "../assess/Assessment";
import { mapInput, sanitizeNodeName } from "./sourceMap";
import { FabricTargetSelection, mapOutput } from "./destinationMap";
import { mapQuery, renameQuerySource } from "./queryMap";
import { QueryAnalysis } from "../assess/queryAnalysis";
import { InputGroup, groupInputs, sliceQuery } from "./inputGroups";

export interface TopologyBuildOptions {
  /** Fabric targets per ASA output name, chosen by the user in the wizard. */
  targets?: Record<string, FabricTargetSelection>;
  /**
   * Fabric connection ids per ASA input name. ARM never returns ASA secrets, so
   * the connection backing each source is always chosen by the user.
   */
  connections?: Record<string, string>;
}

/** One Eventstream the migration will create. */
export interface PlannedEventstream {
  /** ASA stream inputs it ingests, in job order. */
  inputs: string[];
  /** ASA outputs it writes to. */
  outputs: string[];
  /** The generated eventstream.json contents. */
  definition: EventstreamDefinition;
}

export interface MigrationPlan {
  /**
   * The Eventstreams to create; exactly one unless the job splits into
   * independent pipelines. Emitted even when blocked, for review.
   */
  eventstreams: PlannedEventstream[];
  assessment: MigrationAssessment;
  /** Construct-by-construct evaluation of the query against Eventstream SQL support. */
  queryAnalysis: QueryAnalysis;
}

/** An Eventstream bound to its final display name, ready to create. */
export interface BoundEventstream extends PlannedEventstream {
  displayName: string;
}

/**
 * ASA identifiers are case-insensitive, so `INTO dest` writes to an output named
 * `Dest`. Eventstream resolves node names exactly, so a node referenced by the
 * query takes the query's spelling, which keeps the query verbatim.
 */
function matchQuerySpelling(nodeName: string, identifiers: string[]): string {
  const lowered = nodeName.toLowerCase();
  const match = identifiers.find(
    id => id.toLowerCase() === lowered && sanitizeNodeName(id) === id
  );
  return match || nodeName;
}

/**
 * `base`, or `base-2`, `base-3`... when taken. Records the result as taken.
 * Fabric rejects a topology with duplicated node names, and an input and an
 * output may well share one (e.g. both called `events`).
 */
function uniqueName(base: string, taken: Set<string>): string {
  let name = base;
  for (let n = 2; taken.has(name.toLowerCase()); n++) {
    name = `${base}-${n}`;
  }
  taken.add(name.toLowerCase());
  return name;
}

/** Source nodes are named `<input>-source`, plus `-N` when that collided. */
const SOURCE_SUFFIX = /-source(?:-\d+)?$/;

/**
 * Recovers the ASA input a source node was generated from. Source names are
 * sanitized and suffixed, so match on the sanitized input name.
 */
export function asaInputNameOf(job: AsaStreamingJob | undefined, sourceName: string): string {
  const stripped = sourceName.replace(SOURCE_SUFFIX, "");
  const lowered = stripped.toLowerCase();
  const input = (job?.properties?.inputs || []).find(
    candidate => sanitizeNodeName(candidate.name).toLowerCase() === lowered
  );
  return input?.name || stripped;
}

/**
 * Recovers the ASA output a destination node was generated from. Destination
 * names are sanitized and may take the query's casing, so match loosely.
 */
export function asaOutputNameOf(job: AsaStreamingJob | undefined, destinationName: string): string {
  const lowered = destinationName.toLowerCase();
  const output = (job?.properties?.outputs || []).find(
    candidate => sanitizeNodeName(candidate.name).toLowerCase() === lowered
  );
  return output?.name || destinationName;
}

/** Every source node across the plan's Eventstreams. Each ASA input appears in exactly one. */
export function planSources(plan: MigrationPlan | undefined): EventstreamSource[] {
  return ([] as EventstreamSource[]).concat(...(plan?.eventstreams || []).map(es => es.definition.sources));
}

/**
 * Every destination node across the plan's Eventstreams. An output written by
 * several independent pipelines appears once per Eventstream that writes it.
 */
export function planDestinations(plan: MigrationPlan | undefined): EventstreamDestination[] {
  return ([] as EventstreamDestination[]).concat(
    ...(plan?.eventstreams || []).map(es => es.definition.destinations)
  );
}

/** True when the query's INTO targets include this output, in any case or sanitized spelling. */
function isWritten(outputName: string, intoTargets: string[]): boolean {
  const names = [outputName.toLowerCase(), sanitizeNodeName(outputName).toLowerCase()];
  return intoTargets.some(target => names.indexOf(target.toLowerCase()) !== -1);
}

/**
 * Builds the Eventstream definitions and the fidelity assessment for one job.
 *
 * Definitions are always produced, even when the assessment reports blockers, so
 * the user can inspect what would have been created and understand the gap.
 */
export function buildMigrationPlan(
  job: AsaStreamingJob,
  options: TopologyBuildOptions = {}
): MigrationPlan {
  const findings: MappingFinding[] = [];
  const jobProperties = job.properties || {};

  // ---- inputs -------------------------------------------------------------
  const inputs = jobProperties.inputs || [];
  const sourceNodes = new Map<string, EventstreamSource>();

  if (inputs.length === 0) {
    findings.push(
      blocked("Job", job.name, "inputs", "The job has no inputs, so there is nothing to ingest.")
    );
  }

  for (const input of inputs) {
    const result = mapInput(input);
    findings.push(result.finding);

    if (!result.node) {
      continue;
    }

    if (result.node.name !== input.name) {
      findings.push(
        approximated(
          "Input",
          input.name,
          result.finding.asaType,
          result.node.type,
          `Input name was normalized to '${result.node.name}' for Eventstream. Update any ` +
            "FROM clause that referenced the original name."
        )
      );
    }

    sourceNodes.set(input.name, {
      ...result.node,
      properties: {
        ...result.node.properties,
        dataConnectionId: options.connections?.[input.name] || ""
      }
    });
  }

  // ---- query --------------------------------------------------------------
  const queryResult = mapQuery(job);
  findings.push(...queryResult.findings);

  const grouping = groupInputs(job);
  findings.push(...grouping.findings);

  // ---- outputs ------------------------------------------------------------
  const outputs = jobProperties.outputs || [];
  const destinationNodes = new Map<string, EventstreamDestination>();
  // With no statements to go on (an empty query is blocked anyway), keep every output.
  const hasStatements = grouping.structure.statements.length > 0;

  if (outputs.length === 0) {
    findings.push(
      blocked("Job", job.name, "outputs", "The job has no outputs, so there is nowhere to write.")
    );
  }

  for (const output of outputs) {
    const result = mapOutput(output, options.targets?.[output.name]);

    if (hasStatements && !isWritten(output.name, queryResult.intoTargets)) {
      // An unused output does not need an Eventstream equivalent, even an unsupported one.
      findings.push(
        approximated(
          "Output",
          output.name,
          result.finding.asaType,
          "",
          "No INTO clause in the query writes to this output, so no destination is generated for it." +
            (result.node ? "" : ` It would not have migrated anyway: ${result.finding.reason}`)
        )
      );
      continue;
    }

    findings.push(result.finding);
    if (result.node) {
      destinationNodes.set(output.name, result.node);
    }
  }

  // ---- one definition per input group --------------------------------------
  const operatorBase = `${sanitizeNodeName(job.name)}-query`;
  const query = jobProperties.transformation?.properties?.query || "";

  const eventstreams = grouping.groups.map(group => {
    const groupOutputs = outputs
      .map(output => output.name)
      .filter(name => destinationNodes.has(name))
      .filter(name => !hasStatements || isWritten(name, group.outputs));

    return {
      inputs: group.inputs,
      outputs: groupOutputs,
      definition: buildDefinition(group, {
        query: sliceQuery(query, grouping.structure, group),
        advancedSettings: queryResult.advancedSettings,
        operatorBase,
        sources: group.inputs.filter(name => sourceNodes.has(name)).map(name => sourceNodes.get(name)),
        destinations: groupOutputs.map(name => {
          const node = destinationNodes.get(name);
          return { ...node, name: matchQuerySpelling(node.name, queryResult.intoTargets) };
        }),
        onDuplicate: (name, asaOutputs) =>
          findings.push(
            blocked(
              "Output",
              asaOutputs.join(", "),
              "node name",
              `Outputs ${asaOutputs.map(o => `'${o}'`).join(" and ")} both become a destination ` +
                `named '${name}' once normalized for Eventstream, and node names must be unique. ` +
                "Rename one of them in the job and its INTO clause."
            )
          )
      })
    };
  });

  // ---- cross-checks -------------------------------------------------------
  // The query's identifiers must line up with the nodes we generated. A mismatch
  // means the created Eventstream would fail validation server-side, which is
  // exactly what we want to catch here.
  const destinationNames = ([] as string[]).concat(
    ...eventstreams.map(es => es.definition.destinations.map(destination => destination.name))
  );

  for (const target of queryResult.intoTargets) {
    if (destinationNames.indexOf(target) === -1) {
      findings.push(
        blocked(
          "Query",
          job.name,
          "INTO target",
          `The query writes INTO '${target}', but no destination was generated for it. ` +
            "That output is either unsupported or missing, and the Eventstream would fail validation."
        )
      );
    }
  }

  const single = eventstreams.length === 1 && eventstreams[0].inputs.length === 1 ? eventstreams[0] : undefined;
  const defaultStreamName = single?.definition.streams[0]?.name;
  if (defaultStreamName && queryResult.fromSources.length > 0) {
    const accepted = [defaultStreamName.toLowerCase(), single.inputs[0].toLowerCase()];
    const readsDefaultStream = queryResult.fromSources.some(s => accepted.indexOf(s.toLowerCase()) !== -1);
    if (!readsDefaultStream) {
      findings.push(
        approximated(
          "Query",
          job.name,
          "FROM source",
          "SQL",
          `The query reads from ${queryResult.fromSources.map(s => `'${s}'`).join(", ")} ` +
            `rather than '${defaultStreamName}'. This is expected when the query uses common ` +
            "table expressions or step names, but verify the first step reads the input stream."
        )
      );
    }
  }

  return {
    eventstreams,
    assessment: buildAssessment(job.name, findings),
    queryAnalysis: queryResult.analysis
  };
}

interface DefinitionParts {
  query: string;
  advancedSettings: Record<string, any>;
  operatorBase: string;
  sources: EventstreamSource[];
  destinations: EventstreamDestination[];
  /** Called for destination names that two outputs normalize to. */
  onDuplicate: (name: string, asaOutputs: string[]) => void;
}

/**
 * One Eventstream's topology. Destination names are fixed (the query writes to
 * them by name), so they are reserved first and every other node yields.
 */
function buildDefinition(group: InputGroup, parts: DefinitionParts): EventstreamDefinition {
  const taken = new Set<string>();
  const seen = new Map<string, string>();
  for (const destination of parts.destinations) {
    const key = destination.name.toLowerCase();
    if (seen.has(key)) {
      parts.onDuplicate(destination.name, [seen.get(key), destination.name]);
    }
    seen.set(key, destination.name);
    taken.add(key);
  }

  const operatorName = uniqueName(parts.operatorBase, taken);
  const streams: EventstreamStream[] = [];
  const sources = parts.sources.map(source => ({
    ...source,
    name: uniqueName(`${source.name}-source`, taken)
  }));

  if (sources.length > 0) {
    // Every source feeds the one default stream: Eventstream has no other way
    // to bring several sources into a SQL operator.
    streams.push({
      name: uniqueName(parts.sources[0].name, taken),
      type: "DefaultStream",
      properties: {},
      inputNodes: sources.map(source => ({ name: source.name }))
    });
  }

  return {
    sources,
    // Fabric rejects a destination behind "SQL operator -> derived stream", so the
    // operator feeds each destination directly and the destination is the INTO alias.
    destinations: parts.destinations.map(destination => ({
      ...destination,
      inputNodes: [{ name: operatorName }]
    })),
    streams,
    operators: [
      {
        name: operatorName,
        type: "SQL",
        inputNodes: streams.length > 0 ? [{ name: streams[0].name }] : [],
        properties: {
          query: parts.query,
          advancedSettings: parts.advancedSettings
        }
      }
    ],
    compatibilityLevel: EVENTSTREAM_COMPATIBILITY_LEVEL
  };
}

/**
 * Display names for the plan's Eventstreams: the chosen name when there is one
 * Eventstream, otherwise the chosen name suffixed with each one's first input.
 * Underscores and dots become hyphens, since Fabric rejects them here.
 */
export function eventstreamNamesFor(plan: MigrationPlan, baseName: string): string[] {
  if (plan.eventstreams.length <= 1) {
    return [baseName];
  }
  const taken = new Set<string>();
  return plan.eventstreams.map(es =>
    uniqueName(`${baseName}-${(es.inputs[0] || "part").replace(/[^A-Za-z0-9-]/g, "-")}`, taken)
  );
}

/** Binds every planned Eventstream to its display name; see bindToEventstream. */
export function bindPlan(plan: MigrationPlan, baseName: string): BoundEventstream[] {
  const names = eventstreamNamesFor(plan, baseName);
  return plan.eventstreams.map((es, index) => ({
    ...es,
    displayName: names[index],
    definition: bindToEventstream(es.definition, names[index])
  }));
}

/**
 * Renames the default stream to `<eventstreamName>-stream`, the name Fabric
 * gives an Eventstream's default stream, and repoints everything that read it,
 * including FROM/JOIN clauses in the SQL query. Every ASA input feeding the
 * default stream is rewritten, not only the one it was named after, so a query
 * reading several merged inputs reads the default stream throughout.
 *
 * Applied once the Eventstream name is final, so the plan can be built before
 * the user has chosen one.
 */
export function bindToEventstream(
  definition: EventstreamDefinition,
  eventstreamName: string
): EventstreamDefinition {
  const defaultStream = definition.streams.find(stream => stream.type === "DefaultStream");
  if (!defaultStream || !eventstreamName) {
    return definition;
  }

  const oldName = defaultStream.name;
  const newName = `${eventstreamName}-stream`;
  const queryNames = [
    oldName,
    ...(defaultStream.inputNodes || []).map(source => source.name.replace(SOURCE_SUFFIX, ""))
  ];
  const rewrite = (query: string) =>
    queryNames.reduce((text, name) => renameQuerySource(text, name, newName), query);
  const repoint = <T extends { name: string }>(nodes?: T[]): T[] | undefined =>
    nodes?.map(node => (node.name === oldName ? { ...node, name: newName } : node));

  return {
    ...definition,
    streams: definition.streams.map(stream => ({
      ...stream,
      name: stream === defaultStream ? newName : stream.name,
      inputNodes: repoint(stream.inputNodes)
    })),
    operators: definition.operators.map(operator => ({
      ...operator,
      inputNodes: repoint(operator.inputNodes),
      properties:
        operator.type === "SQL" && operator.properties
          ? { ...operator.properties, query: rewrite(operator.properties.query || "") }
          : operator.properties
    })),
    destinations: definition.destinations.map(destination => ({
      ...destination,
      inputNodes: repoint(destination.inputNodes)
    }))
  };
}

/** Node names that occur more than once in a definition, which Fabric rejects. */
export function duplicateNodeNames(definition: EventstreamDefinition): string[] {
  const names = [
    ...definition.sources,
    ...definition.streams,
    ...definition.operators,
    ...definition.destinations
  ].map(node => node.name);
  return names.filter((name, index) => names.indexOf(name) !== index);
}
