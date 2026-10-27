/**
 * Types for the `eventstream.json` definition part of a Fabric Eventstream item.
 *
 * The topology is a graph of four node collections joined by `inputNodes`
 * references, which point at other nodes by name.
 *
 * Reference:
 * https://learn.microsoft.com/en-us/rest/api/fabric/articles/item-management/definitions/eventstream-definition
 */

/** A reference to another node in the topology, by name. */
export interface EventstreamNodeReference {
  name: string;
}

export interface EventstreamSerialization {
  type: "Json" | "Avro" | "Csv" | string;
  properties?: Record<string, any>;
}

export interface EventstreamSource {
  name: string;
  /** e.g. AzureEventHub, AzureIoTHub, ApacheKafka, CustomEndpoint */
  type: string;
  properties?: Record<string, any>;
}

export interface EventstreamStream {
  name: string;
  type: "DefaultStream" | "DerivedStream";
  properties?: Record<string, any>;
  inputNodes?: EventstreamNodeReference[];
}

export interface EventstreamOperator {
  name: string;
  /** e.g. SQL, Filter, GroupBy, ManageFields, Join, Union, Aggregate, Expand */
  type: string;
  properties?: Record<string, any>;
  inputNodes?: EventstreamNodeReference[];
}

export interface EventstreamDestination {
  name: string;
  /** Eventhouse, Lakehouse, Activator or CustomEndpoint - the only supported destinations. */
  type: string;
  properties?: Record<string, any>;
  inputNodes?: EventstreamNodeReference[];
}

/** The contents of `eventstream.json`. */
export interface EventstreamDefinition {
  sources: EventstreamSource[];
  destinations: EventstreamDestination[];
  streams: EventstreamStream[];
  operators: EventstreamOperator[];
  compatibilityLevel: string;
}

/** The contents of the optional `eventstreamProperties.json` part. */
export interface EventstreamProperties {
  retentionTimeInDays?: number;
  eventThroughputLevel?: "Low" | "Medium" | "High";
}

/**
 * advancedSettings on the SQL operator. These correspond directly to the
 * job-level late/out-of-order policies on a Stream Analytics job.
 */
export interface EventstreamSqlAdvancedSettings {
  eventsOutOfOrderPolicy?: string;
  eventsOutOfOrderMaxDelayInSeconds?: number;
  eventsLateArrivalMaxDelayInSeconds?: number;
}

export const EVENTSTREAM_COMPATIBILITY_LEVEL = "1.0";

/** Default serialization applied when an ASA endpoint does not declare one. */
export const DEFAULT_JSON_SERIALIZATION: EventstreamSerialization = {
  type: "Json",
  properties: { encoding: "UTF8" }
};
