/**
 * Maps Stream Analytics inputs onto Eventstream source nodes.
 *
 * ASA datasource discriminators come from the 2020-03-01 management API.
 * Eventstream source types come from the official definition template at
 * https://github.com/microsoft/fabric-event-streams (API Templates).
 */

import { AsaInput } from "../../../../clients/AzureResourceManagerTypes";
import { EventstreamSource, DEFAULT_JSON_SERIALIZATION } from "../emit/EventstreamDefinition";
import { MappingFinding, blocked, mapped } from "../assess/Assessment";

/** ASA input datasource discriminators. */
export const ASA_INPUT_TYPES = {
  SERVICE_BUS_EVENT_HUB: "Microsoft.ServiceBus/EventHub",
  EVENT_HUB: "Microsoft.EventHub/EventHub",
  IOT_HUB: "Microsoft.Devices/IotHubs",
  BLOB: "Microsoft.Storage/Blob",
  ADLS_GEN2: "Microsoft.Storage/storageAccounts",
  SQL_DATABASE: "Microsoft.Sql/Server/Database",
  GATEWAY_MESSAGE_BUS: "GatewayMessageBus"
};

export interface SourceMappingResult {
  /**
   * The Eventstream source node, when one could be produced. The
   * `dataConnectionId` is left blank: ARM never returns ASA secrets, so the
   * connection has to be chosen or created by the user in a later step.
   */
  node?: EventstreamSource;
  finding: MappingFinding;
}

/** Eventstream node names must be unique and free of separator characters. */
export function sanitizeNodeName(name: string): string {
  return (name || "unnamed").replace(/[^A-Za-z0-9_-]/g, "-");
}

function serializationOf(input: AsaInput) {
  const serialization = input.properties?.serialization;
  if (!serialization) {
    return DEFAULT_JSON_SERIALIZATION;
  }
  return {
    type: serialization.type,
    properties: serialization.properties || {}
  };
}

/**
 * Maps one ASA input.
 *
 * Reference inputs are rejected regardless of their datasource: Eventstream reads
 * reference data only from Lakehouse Delta tables, which the migrator cannot
 * create, so a query joining against one cannot run as generated.
 */
export function mapInput(input: AsaInput): SourceMappingResult {
  const name = sanitizeNodeName(input.name);
  const inputKind = input.properties?.type;
  const datasourceType = input.properties?.datasource?.type || "unknown";
  const datasourceProps = input.properties?.datasource?.properties || {};

  if (inputKind && inputKind.toLowerCase() === "reference") {
    return {
      finding: blocked(
        "Input",
        input.name,
        datasourceType,
        "Eventstream joins reference data only from Lakehouse Delta tables. Load this data " +
          "into a Lakehouse table, then connect it to the SQL operator after migrating the " +
          "rest of the job."
      )
    };
  }

  switch (datasourceType) {
    case ASA_INPUT_TYPES.SERVICE_BUS_EVENT_HUB:
    case ASA_INPUT_TYPES.EVENT_HUB:
      return {
        node: {
          name,
          type: "AzureEventHub",
          properties: {
            dataConnectionId: "",
            consumerGroupName: datasourceProps.consumerGroupName || "$Default",
            inputSerialization: serializationOf(input)
          }
        },
        finding: mapped(
          "Input",
          input.name,
          datasourceType,
          "AzureEventHub",
          `Event Hub '${datasourceProps.eventHubName || "unknown"}' maps directly. ` +
            "You will need to select or create a Fabric connection for it."
        )
      };

    case ASA_INPUT_TYPES.IOT_HUB:
      return {
        node: {
          name,
          type: "AzureIoTHub",
          properties: {
            dataConnectionId: "",
            consumerGroupName: datasourceProps.consumerGroupName || "$Default",
            inputSerialization: serializationOf(input)
          }
        },
        finding: mapped(
          "Input",
          input.name,
          datasourceType,
          "AzureIoTHub",
          "IoT Hub maps directly. You will need to select or create a Fabric connection for it."
        )
      };

    case ASA_INPUT_TYPES.BLOB:
    case ASA_INPUT_TYPES.ADLS_GEN2:
      return {
        finding: blocked(
          "Input",
          input.name,
          datasourceType,
          "Eventstream cannot read file content from blob or ADLS storage as a stream. " +
            "Its AzureBlobStorageEvents source carries change notifications, not the files " +
            "themselves, so it is not a substitute."
        )
      };

    case ASA_INPUT_TYPES.GATEWAY_MESSAGE_BUS:
      return {
        finding: blocked(
          "Input",
          input.name,
          datasourceType,
          "Edge gateway inputs are specific to Stream Analytics on IoT Edge and have no " +
            "Eventstream equivalent."
        )
      };

    default:
      return {
        finding: blocked(
          "Input",
          input.name,
          datasourceType,
          `Unrecognized input datasource type '${datasourceType}'. No Eventstream source ` +
            "was generated for it."
        )
      };
  }
}
