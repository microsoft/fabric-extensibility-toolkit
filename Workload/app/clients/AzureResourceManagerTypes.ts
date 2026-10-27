/**
 * Types for the Azure Resource Manager (ARM) control plane.
 *
 * These describe the subset of ARM used by the Stream Analytics migrator:
 * subscription/resource group discovery, and reading Stream Analytics job
 * definitions.
 *
 * Reference:
 * https://learn.microsoft.com/en-us/rest/api/streamanalytics/streaming-jobs/get
 */

// ============================
// ARM envelope
// ============================

/** Standard ARM list response. Pagination uses an absolute `nextLink` URL. */
export interface ArmListResponse<T> {
  value: T[];
  nextLink?: string;
}

/** Standard ARM error body. */
export interface ArmErrorResponse {
  error?: {
    code?: string;
    message?: string;
    target?: string;
    details?: any[];
  };
}

export interface AzureSubscription {
  id: string;
  subscriptionId: string;
  tenantId?: string;
  displayName: string;
  state: string;
}

export interface AzureResourceGroup {
  id: string;
  name: string;
  location: string;
}

// ============================
// Stream Analytics
// ============================

/**
 * The datasource block of an ASA input or output.
 *
 * `type` is a resource provider moniker such as `Microsoft.ServiceBus/EventHub`,
 * `Microsoft.Devices/IotHubs`, `Microsoft.Storage/Blob`, `Microsoft.Sql/Server/Database`
 * or `Microsoft.Kusto/clusters/databases`. `properties` is deliberately left open
 * here: the per-type shapes are modelled by the mapping layer, not by the client.
 */
export interface AsaDataSource {
  type: string;
  properties?: Record<string, any>;
}

/** How an input or output is serialized (Json, Csv, Avro, Parquet). */
export interface AsaSerialization {
  type: string;
  properties?: Record<string, any>;
}

export interface AsaInput {
  id?: string;
  name: string;
  properties?: {
    /** `Stream` or `Reference`. Reference inputs have no Eventstream equivalent. */
    type?: string;
    datasource?: AsaDataSource;
    serialization?: AsaSerialization;
    compression?: { type?: string };
    partitionKey?: string;
    etag?: string;
  };
}

export interface AsaOutput {
  id?: string;
  name: string;
  properties?: {
    datasource?: AsaDataSource;
    serialization?: AsaSerialization;
    sizeWindow?: number;
    timeWindow?: string;
    etag?: string;
  };
}

export interface AsaTransformation {
  id?: string;
  name: string;
  properties?: {
    streamingUnits?: number;
    validStreamingUnits?: number[];
    /** The ASA SQL query. This is what phase 1 carries into the Eventstream SQL operator. */
    query?: string;
    etag?: string;
  };
}

/**
 * A user-defined function. These have no Eventstream counterpart; their presence
 * makes a job unmigratable and must be surfaced by the assessment step.
 */
export interface AsaFunction {
  id?: string;
  name: string;
  properties?: {
    type?: string;
    properties?: Record<string, any>;
    etag?: string;
  };
}

export interface AsaStreamingJob {
  id: string;
  name: string;
  type: string;
  location?: string;
  tags?: Record<string, string>;
  properties?: {
    sku?: { name?: string };
    jobId?: string;
    provisioningState?: string;
    jobState?: string;
    /** `Drop` or `Adjust`. Maps to the Eventstream SQL operator's advancedSettings. */
    eventsOutOfOrderPolicy?: string;
    outputErrorPolicy?: string;
    eventsOutOfOrderMaxDelayInSeconds?: number;
    eventsLateArrivalMaxDelayInSeconds?: number;
    dataLocale?: string;
    compatibilityLevel?: string;
    createdDate?: string;
    /** Only present when requested via $expand. */
    inputs?: AsaInput[];
    outputs?: AsaOutput[];
    transformation?: AsaTransformation;
    functions?: AsaFunction[];
  };
}

/** Parsed components of an ARM resource id. */
export interface ArmResourceIdParts {
  subscriptionId: string;
  resourceGroupName: string;
  name: string;
}
