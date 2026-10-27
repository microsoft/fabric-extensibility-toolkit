/**
 * Prefills Fabric connection parameters from a Stream Analytics input.
 *
 * ARM never returns ASA secrets, but it does return the whole non-secret half of
 * an endpoint: namespace, hub name, consumer group, policy name. Carrying those
 * across means the user only has to paste a key rather than look everything up.
 *
 * Fabric declares each connector's parameter names at runtime via
 * /connections/supportedConnectionTypes, and those names are not stable across
 * connectors, so matching is done on a normalized alias list rather than on
 * exact strings.
 */

import { AsaInput } from "../../../../clients/AzureResourceManagerTypes";

/** Lowercases and strips separators so `entityPath` and `entity_path` both match. */
export function normalizeParameterName(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Aliases Fabric uses for the concepts ASA gives us. */
const ENDPOINT_ALIASES = [
  "endpoint",
  "server",
  "namespace",
  "servicebusnamespace",
  "fullyqualifiednamespace",
  "host",
  "hostname",
  "iothubnamespace"
];

const ENTITY_ALIASES = ["entitypath", "eventhubname", "entity", "hub", "eventhub", "topic", "path"];

const CONSUMER_GROUP_ALIASES = ["consumergroup", "consumergroupname", "group"];

const POLICY_ALIASES = ["sharedaccesspolicyname", "policyname", "keyname", "username", "policy"];

/**
 * The fully qualified Service Bus / Event Hub host for a namespace.
 * ASA stores the bare namespace; Fabric connectors generally want the FQDN.
 */
function toNamespaceHost(namespace: string): string {
  if (!namespace) {
    return "";
  }
  return namespace.indexOf(".") === -1 ? `${namespace}.servicebus.windows.net` : namespace;
}

/**
 * Suggests a value for one connection parameter, or "" when nothing in the ASA
 * input corresponds to it. An empty result means the user must supply it.
 */
export function prefillConnectionParameter(parameterName: string, input?: AsaInput): string {
  const props = input?.properties?.datasource?.properties;
  if (!props) {
    return "";
  }

  const normalized = normalizeParameterName(parameterName);

  if (ENDPOINT_ALIASES.indexOf(normalized) !== -1) {
    // IoT Hub inputs carry iotHubNamespace instead of serviceBusNamespace.
    const namespace = props.serviceBusNamespace || props.iotHubNamespace || "";
    return toNamespaceHost(namespace);
  }

  if (ENTITY_ALIASES.indexOf(normalized) !== -1) {
    return props.eventHubName || props.topic || "";
  }

  if (CONSUMER_GROUP_ALIASES.indexOf(normalized) !== -1) {
    return props.consumerGroupName || "";
  }

  if (POLICY_ALIASES.indexOf(normalized) !== -1) {
    return props.sharedAccessPolicyName || "";
  }

  return "";
}

/**
 * Fabric connection type names that plausibly match an Eventstream source type.
 *
 * Used only to preselect a sensible default in the dropdown; the authoritative
 * list always comes from the service, and the user can override.
 */
export function candidateConnectionTypes(eventstreamSourceType: string): string[] {
  switch (eventstreamSourceType) {
    case "AzureEventHub":
      return ["EventHub", "AzureEventHub", "EventHubs"];
    case "AzureIoTHub":
      return ["IotHub", "IoTHub", "AzureIoTHub"];
    case "ApacheKafka":
      return ["Kafka", "ApacheKafka"];
    case "ConfluentCloud":
      return ["Confluent", "ConfluentCloud"];
    default:
      return [];
  }
}

/**
 * Picks the best default connection type from what the service reported.
 * Returns "" when nothing matches, which is the signal to make the user choose.
 */
export function pickDefaultConnectionType(
  eventstreamSourceType: string,
  availableTypes: string[]
): string {
  const candidates = candidateConnectionTypes(eventstreamSourceType).map(normalizeParameterName);

  for (const candidate of candidates) {
    const match = availableTypes.find(type => normalizeParameterName(type) === candidate);
    if (match) {
      return match;
    }
  }

  return "";
}
