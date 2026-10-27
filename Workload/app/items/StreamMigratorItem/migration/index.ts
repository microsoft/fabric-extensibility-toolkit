/**
 * Stream Analytics to Eventstream migration engine.
 *
 * The mapping, assessment and emit modules are pure functions with no React or
 * Fabric client dependencies, so they can be exercised against captured ASA job
 * JSON without a tenant - see selftest.ts.
 *
 * The execute module is the exception: it talks to the Fabric item APIs, so it
 * is the one part that cannot be covered by the offline self-test.
 */

export * from "./assess/Assessment";
export * from "./assess/queryAnalysis";
export * from "./assess/queryRules";
export * from "./assess/queryStructure";
export * from "./emit/EventstreamDefinition";
export * from "./emit/ItemPayload";
export * from "./execute/asyncOperation";
export * from "./execute/createEventstream";
export * from "./mapping/sourceMap";
export * from "./mapping/connectionPrefill";
export * from "./mapping/destinationMap";
export * from "./mapping/inputGroups";
export * from "./mapping/queryMap";
export * from "./mapping/topology";
