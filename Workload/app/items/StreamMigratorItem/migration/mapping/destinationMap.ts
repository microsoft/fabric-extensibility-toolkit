/**
 * Maps Stream Analytics outputs onto Eventstream destination nodes.
 *
 * This is the narrowest part of the migration. Eventstream supports exactly four
 * destination types - Eventhouse, Lakehouse, Activator and CustomEndpoint - while
 * ASA writes to well over a dozen sinks. Notably there is no Event Hub, SQL,
 * Cosmos DB, Power BI or Service Bus destination, so those jobs are blocked.
 */

import { AsaOutput } from "../../../../clients/AzureResourceManagerTypes";
import { EventstreamDestination, DEFAULT_JSON_SERIALIZATION } from "../emit/EventstreamDefinition";
import { MappingFinding, approximated, blocked, mapped } from "../assess/Assessment";
import { sanitizeNodeName } from "./sourceMap";

/** ASA output datasource discriminators. */
export const ASA_OUTPUT_TYPES = {
  BLOB: "Microsoft.Storage/Blob",
  TABLE: "Microsoft.Storage/Table",
  DATA_LAKE: "Microsoft.DataLake/Accounts",
  SERVICE_BUS_EVENT_HUB: "Microsoft.ServiceBus/EventHub",
  EVENT_HUB: "Microsoft.EventHub/EventHub",
  SERVICE_BUS_QUEUE: "Microsoft.ServiceBus/Queue",
  SERVICE_BUS_TOPIC: "Microsoft.ServiceBus/Topic",
  SQL_DATABASE: "Microsoft.Sql/Server/Database",
  SQL_DATA_WAREHOUSE: "Microsoft.Sql/Server/DataWarehouse",
  DOCUMENT_DB: "Microsoft.Storage/DocumentDB",
  AZURE_FUNCTION: "Microsoft.AzureFunction",
  POSTGRES: "Microsoft.DBForPostgreSQL/servers/databases",
  KUSTO: "Microsoft.Kusto/clusters/databases",
  POWER_BI: "PowerBI",
  GATEWAY_MESSAGE_BUS: "GatewayMessageBus",
  RAW: "Raw"
};

/**
 * Where a mapped destination should write. The user picks these in the wizard;
 * ASA cannot tell us, since the Fabric items do not exist in Azure.
 */
export interface FabricTargetSelection {
  workspaceId?: string;
  itemId?: string;
  databaseName?: string;
  tableName?: string;
  deltaTable?: string;
  schema?: string;
}

export interface DestinationMappingResult {
  /**
   * The Eventstream destination node, when one could be produced. Workspace and
   * item ids are left blank unless the caller supplied a target: the Fabric
   * items are chosen by the user, not derivable from the ASA job.
   */
  node?: EventstreamDestination;
  finding: MappingFinding;
}

function serializationOf(output: AsaOutput) {
  const serialization = output.properties?.serialization;
  if (!serialization) {
    return DEFAULT_JSON_SERIALIZATION;
  }
  return {
    type: serialization.type,
    properties: serialization.properties || {}
  };
}

/** Blocked sinks, each with the reason a user would need to hear. */
const BLOCKED_OUTPUTS: Record<string, string> = {
  [ASA_OUTPUT_TYPES.SERVICE_BUS_EVENT_HUB]:
    "Eventstream has no Event Hub destination - Event Hub is supported only as a source. " +
    "Route to an Eventhouse or a custom endpoint instead.",
  [ASA_OUTPUT_TYPES.EVENT_HUB]:
    "Eventstream has no Event Hub destination - Event Hub is supported only as a source. " +
    "Route to an Eventhouse or a custom endpoint instead.",
  [ASA_OUTPUT_TYPES.SQL_DATABASE]:
    "Eventstream cannot write to Azure SQL Database. Land the data in an Eventhouse or " +
    "Lakehouse and copy it onward with a pipeline.",
  [ASA_OUTPUT_TYPES.DOCUMENT_DB]:
    "Eventstream cannot write to Cosmos DB.",
  [ASA_OUTPUT_TYPES.TABLE]:
    "Eventstream cannot write to Azure Table storage.",
  [ASA_OUTPUT_TYPES.SERVICE_BUS_QUEUE]:
    "Eventstream cannot write to a Service Bus queue.",
  [ASA_OUTPUT_TYPES.SERVICE_BUS_TOPIC]:
    "Eventstream cannot write to a Service Bus topic.",
  [ASA_OUTPUT_TYPES.AZURE_FUNCTION]:
    "Eventstream cannot invoke an Azure Function. An Activator destination may cover " +
    "alerting use cases, but it is not a general-purpose function trigger.",
  [ASA_OUTPUT_TYPES.POWER_BI]:
    "Eventstream has no direct Power BI streaming dataset destination. Land the data in " +
    "an Eventhouse and build a report over it.",
  [ASA_OUTPUT_TYPES.POSTGRES]:
    "Eventstream cannot write to PostgreSQL.",
  [ASA_OUTPUT_TYPES.GATEWAY_MESSAGE_BUS]:
    "Edge gateway outputs are specific to Stream Analytics on IoT Edge.",
  [ASA_OUTPUT_TYPES.RAW]:
    "Raw outputs are a Stream Analytics testing construct with no Eventstream equivalent."
};

export function mapOutput(
  output: AsaOutput,
  target?: FabricTargetSelection
): DestinationMappingResult {
  const name = sanitizeNodeName(output.name);
  const datasourceType = output.properties?.datasource?.type || "unknown";
  const datasourceProps = output.properties?.datasource?.properties || {};

  const blockedReason = BLOCKED_OUTPUTS[datasourceType];
  if (blockedReason) {
    return { finding: blocked("Output", output.name, datasourceType, blockedReason) };
  }

  switch (datasourceType) {
    case ASA_OUTPUT_TYPES.KUSTO:
      return {
        node: {
          name,
          type: "Eventhouse",
          properties: {
            dataIngestionMode: "ProcessedIngestion",
            workspaceId: target?.workspaceId || "",
            itemId: target?.itemId || "",
            databaseName: target?.databaseName || datasourceProps.database || "",
            tableName: target?.tableName || datasourceProps.table || "",
            inputSerialization: serializationOf(output)
          },
          inputNodes: []
        },
        finding: mapped(
          "Output",
          output.name,
          datasourceType,
          "Eventhouse",
          `Azure Data Explorer table '${datasourceProps.table || "unknown"}' maps to an ` +
            "Eventhouse destination. Select the target Eventhouse item in the next step."
        )
      };

    case ASA_OUTPUT_TYPES.BLOB:
    case ASA_OUTPUT_TYPES.DATA_LAKE:
      return {
        node: {
          name,
          type: "Lakehouse",
          properties: {
            workspaceId: target?.workspaceId || "",
            itemId: target?.itemId || "",
            schema: target?.schema || "",
            deltaTable: target?.deltaTable || name,
            minimumRows: 100000,
            maximumDurationInSeconds: 120,
            inputSerialization: serializationOf(output)
          },
          inputNodes: []
        },
        finding: approximated(
          "Output",
          output.name,
          datasourceType,
          "Lakehouse",
          "File output becomes a Lakehouse delta table. This changes the storage shape: " +
            "the ASA path pattern, file format and partitioning are not carried over, and " +
            "rows are batched by row count and time window instead."
        )
      };

    case ASA_OUTPUT_TYPES.SQL_DATA_WAREHOUSE:
      return {
        node: {
          name,
          type: "Lakehouse",
          properties: {
            workspaceId: target?.workspaceId || "",
            itemId: target?.itemId || "",
            schema: target?.schema || "",
            deltaTable: target?.deltaTable || datasourceProps.table || name,
            minimumRows: 100000,
            maximumDurationInSeconds: 120,
            inputSerialization: serializationOf(output)
          },
          inputNodes: []
        },
        finding: approximated(
          "Output",
          output.name,
          datasourceType,
          "Lakehouse",
          "Synapse dedicated SQL pool output becomes a Lakehouse delta table. Verify that " +
            "downstream consumers can read the Lakehouse rather than the warehouse table."
        )
      };

    default:
      return {
        finding: blocked(
          "Output",
          output.name,
          datasourceType,
          `Unrecognized output datasource type '${datasourceType}'. No Eventstream ` +
            "destination was generated for it."
        )
      };
  }
}
