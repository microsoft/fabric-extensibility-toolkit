/**
 * Creates the migrated Eventstream in a Fabric workspace.
 *
 * Creating an item *with a definition* is asynchronous: Fabric answers 202 with an
 * operation id rather than the created item. FabricPlatformClient.makeRequest
 * surfaces that as an AsyncOperationIndicator even though ItemClient.createItem is
 * declared to return an Item, so both shapes have to be handled here.
 */

import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemClient } from "../../../../clients/ItemClient";
import { LongRunningOperationsClient } from "../../../../clients/LongRunningOperationsClient";
import { AsyncOperationIndicator, Item } from "../../../../clients/FabricPlatformTypes";
import { isAsyncOperation } from "./asyncOperation";
import { EventstreamDefinition, EventstreamProperties } from "../emit/EventstreamDefinition";
import { buildCreateEventstreamRequest } from "../emit/ItemPayload";

export interface CreateEventstreamOptions {
  displayName: string;
  description?: string;
  properties?: EventstreamProperties;
  folderId?: string;
  /** Poll interval and ceiling for the long-running create operation. */
  pollingIntervalMs?: number;
  timeoutMs?: number;
}

export interface CreateEventstreamResult {
  item: Item;
  /** True when Fabric processed the create asynchronously and we polled for it. */
  wasAsynchronous: boolean;
}

/**
 * Creates an Eventstream item from a generated definition, waiting for the
 * long-running operation to finish when Fabric returns one.
 *
 * Throws if the operation fails or times out; the caller is expected to surface
 * the message, which carries Fabric's own validation text for a rejected topology.
 */
export async function createEventstream(
  workloadClient: WorkloadClientAPI,
  workspaceId: string,
  definition: EventstreamDefinition,
  options: CreateEventstreamOptions
): Promise<CreateEventstreamResult> {
  const itemClient = new ItemClient(workloadClient);
  const request = buildCreateEventstreamRequest(options.displayName, definition, {
    description: options.description,
    properties: options.properties,
    folderId: options.folderId
  });

  const result: Item | AsyncOperationIndicator = await itemClient.createItem(
    workspaceId,
    request
  );

  if (!isAsyncOperation(result)) {
    return { item: result as Item, wasAsynchronous: false };
  }

  const operationsClient = new LongRunningOperationsClient(workloadClient);
  const item = await operationsClient.waitForSuccessAndGetResult<Item>(
    result,
    options.pollingIntervalMs ?? 2000,
    options.timeoutMs ?? 300000
  );

  return { item, wasAsynchronous: true };
}
