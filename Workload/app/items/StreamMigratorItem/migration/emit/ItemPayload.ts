/**
 * Turns a generated Eventstream topology into the payload accepted by
 * POST /v1/workspaces/{workspaceId}/items.
 *
 * Every definition part is base64-encoded with payloadType InlineBase64.
 */

import { CreateItemRequest, ItemDefinitionPart } from "../../../../clients/FabricPlatformTypes";
import { EventstreamDefinition, EventstreamProperties } from "./EventstreamDefinition";

/** The Fabric item type for an Eventstream. */
export const EVENTSTREAM_ITEM_TYPE = "Eventstream";

/**
 * UTF-8 safe base64. btoa alone mishandles multi-byte characters, which appear
 * routinely in ASA queries via non-ASCII string literals and column names.
 */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function buildDefinitionParts(
  definition: EventstreamDefinition,
  properties?: EventstreamProperties
): ItemDefinitionPart[] {
  const parts: ItemDefinitionPart[] = [
    {
      path: "eventstream.json",
      payload: toBase64(JSON.stringify(definition, null, 2)),
      payloadType: "InlineBase64"
    }
  ];

  if (properties) {
    parts.push({
      path: "eventstreamProperties.json",
      payload: toBase64(JSON.stringify(properties, null, 2)),
      payloadType: "InlineBase64"
    });
  }

  return parts;
}

/**
 * Builds the create-item request for a migrated Eventstream.
 *
 * Pair this with ItemClient.createItem and poll the result through
 * LongRunningOperationsClient: creating an item with a definition is async.
 */
export function buildCreateEventstreamRequest(
  displayName: string,
  definition: EventstreamDefinition,
  options: { description?: string; properties?: EventstreamProperties; folderId?: string } = {}
): CreateItemRequest {
  return {
    displayName,
    description: options.description,
    type: EVENTSTREAM_ITEM_TYPE,
    folderId: options.folderId,
    definition: {
      parts: buildDefinitionParts(definition, options.properties)
    }
  };
}
