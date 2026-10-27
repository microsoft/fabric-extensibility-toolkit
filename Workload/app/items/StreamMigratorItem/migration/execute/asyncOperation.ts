/**
 * Narrowing for the two shapes a Fabric create-item call can return.
 *
 * ItemClient.createItem is declared to return an Item, but FabricPlatformClient
 * turns a 202 response into an AsyncOperationIndicator instead. Creating an item
 * *with a definition* is asynchronous, so both shapes occur in practice.
 *
 * Kept free of client imports so it stays covered by the offline self-test.
 */

import { AsyncOperationIndicator } from "../../../../clients/FabricPlatformTypes";

/**
 * True when the value is a long-running operation handle rather than a created item.
 *
 * An operation indicator carries an operationId and no id; a created item carries an
 * id. Both are checked so a future response containing both is treated as the item.
 */
export function isAsyncOperation(result: any): result is AsyncOperationIndicator {
  return Boolean(result) && typeof result.operationId === "string" && !result.id;
}
