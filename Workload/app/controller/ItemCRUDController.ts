import { GetItemDefinitionResult, GetItemResult, ItemDefinitionPart, PayloadType, UpdateItemDefinitionPayload, UpdateItemDefinitionResult, WorkloadClientAPI } from "@ms-fabric/workload-client";
import { Item } from "../clients/FabricPlatformTypes";

/*
* Represents a reference to a fabric item.
* This interface extends ItemLikeV2 to include additional metadata.
*/
export interface ItemReference {
    workspaceId: string;
    id: string;
}

/*
* Represents a fabric item with additional metadata and a payload.  
* This interface extends GenericItem and includes a payload property.
*/
export interface ItemWithDefinition<T> extends ItemReference {
    type: string;
    displayName: string;
    description?: string;
    definition?: T;
    additionalDefinitionParts?: ItemDefinitionPart[];
}

/**
* Enum representing the paths for item payloads.
* This enum is used to define the paths for item metadata and platform files.
* If you have more files that need to be stored in the item payload, you can add them here.
* The paths are relative to the item payload root. 
* The platform file is used to store platform-specific information about the item and needs to be present in the item payload.
* The item metadata file is used to store metadata about the item and needs to be present in the item payload.
* The paths are used to read and write files in the item payload.
*/
export enum ItemDefinitionPath {
    Default = "payload.json",
    Platform = ".platform",
}

/**
 * This function is used to fetch an item by its ObjectId.
 * It calls the 'itemCrud.getItem' function from the WorkloadClientAPI.
 * 
 * Stored item definition is not fetched by this function, only the item metadata.
 * to retrieve the item definition, use callGetItemDefinition.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.
 * @param {string} itemId - The ItemId of the item to fetch.
 * @returns {Promise<GetItemResult>} - A promise that resolves to a wrapper for the item's data.
 */
export async function callGetItem(
    workloadClient: WorkloadClientAPI, 
    itemId: string): Promise<GetItemResult> {
    try {
        const item: GetItemResult = await workloadClient.itemCrud.getItem({ itemId });
        console.log(`Successfully fetched item ${itemId}: ${item}`)

        return item;
    } catch (exception) {
        console.error("Failed locating item with ObjectID %s", itemId, exception);
        return undefined;
    }
}


/** 
 * This method is used to save an item definition for a given item.
 * This method can be used for simplification if the Itemn only has a single Part that needs to be stored as part of the item definition
 * If the item definition has multiple parts, use the callUpdateItemDefinition function instead and parse the parts individually.
 * 
 * It calls the 'itemCrudPublic.updateItemDefinition' function from the WorkloadClientAPI.
 * 
 * It updates the item definition for a given item with the provided definition.
 * 
 * This function is a wrapper around the callUpdateItemDefinition function and returns the result of the update.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.        
 * @param {string} itemId - The ID of the item to update.
 * @param {T} definition - The data to save as the item definition.
 * @returns {Promise<UpdateItemDefinitionResult>} - The result of the item definition update.
 */
export async function saveItemDefinition<T>(
    workloadClient: WorkloadClientAPI, 
    itemId: string, 
    definition: T): Promise<UpdateItemDefinitionResult> {

        // Convert the definition to a definition part using the helper method
        const definitionPart = createDefaultDefinitionPart(definition);        
        return callUpdateItemDefinition(workloadClient, itemId, [definitionPart], false);
}

/** 
 * This function retrieves the item definition for a given item by its ObjectId.
 * This method can be used for simplification if the Item only has a single Part that needs to be retrieved as part of the item definition.
 * If your item contains multiple parts, use the callGetItemDefinition function instead and parse the parts individually.
 * 
 * It calls the 'itemCrudPublic.getItemDefinition' function from the WorkloadClientAPI.
 * 
 * It returns the item definition if available, otherwise undefined.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.    
 * @param {string} itemId - The ObjectId of the item to retrieve.
 * @returns {Promise<T>} - The item definition if available, otherwise undefined.
 */ 
export async function getItemDefinition<T>(
    workloadClient: WorkloadClientAPI,
    itemId: string): Promise<T> {
        const workloadITem = await getWorkloadItem<T>(workloadClient, itemId);
        if (workloadITem && workloadITem.definition) {
            return workloadITem.definition;
        }
        return undefined  
}

/** 
 * This function retrieves a WorkloadItem by its ObjectId.
 * It calls the 'itemCrudPublic.getItem' and 'itemCrudPublic.getItemDefinition' functions from the WorkloadClientAPI.
 * It returns a WorkloadItem containing the item metadata and definition.
 * 
 * If the item definition is not available, it will return a WorkloadItem with the default definition provided.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.    
 * @param {string} itemObjectId - The ObjectId of the item to retrieve.
 * @param {T} [defaultDefinition] - Optional. The default definition to use if the item definition is not available.
 * @returns {Promise<ItemWithDefinition<T>>} - A promise that resolves to the WorkloadItem.
 */
export async function getWorkloadItem<T>(
    workloadClient: WorkloadClientAPI,
    itemObjectId: string,
    defaultDefinition?: T): Promise<ItemWithDefinition<T>> {
        const getItemResult = await callGetItem(workloadClient, itemObjectId);
        const getItemDefinitionResult = await callGetItemDefinition(workloadClient, itemObjectId);
        const item = convertGetItemResultToWorkloadItem<T>(getItemResult, getItemDefinitionResult, defaultDefinition);
        return item;
    }


/** 
 * This function saves a WorkloadItem by updating its definition.
 * It extracts the definition from the ItemWithDefinition and calls saveItemDefinition.
 * It also saves any additional definition parts that are included in the ItemWithDefinition.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.
 * @param {ItemWithDefinition<T>} itemWithDefinition - The workload item to save.
 * @returns {Promise<UpdateItemDefinitionResult>} - The result of the item definition update.
 */
export async function saveWorkloadItem<T>(
    workloadClient: WorkloadClientAPI,
    itemWithDefinition: ItemWithDefinition<T>): Promise<UpdateItemDefinitionResult> {
    if (!itemWithDefinition.id) {
        throw new Error("No item ID provided");
    }
    
    if (!itemWithDefinition.definition) {
        throw new Error("No definition provided");
    }
    
    // Start with the main definition as the default part
    const defaultDefinitionPart = createDefaultDefinitionPart(itemWithDefinition.definition)
    const definitionParts: ItemDefinitionPart[] = [defaultDefinitionPart];
    
    // Copy all additional definition parts by decoding and adding them
    if (itemWithDefinition.additionalDefinitionParts?.length > 0) {
        for (const additionalPart of itemWithDefinition.additionalDefinitionParts) {
            definitionParts.push(additionalPart)
        }
    }
    
    // Save all parts together using callUpdateItemDefinition
    return callUpdateItemDefinition(
        workloadClient, 
        itemWithDefinition.id, 
        definitionParts,
        false
    );
}

/** 
 * This function is used to update an item definition for a given item. 
 * It calls the 'itemCrudPublic.updateItemDefinition' function from the WorkloadClientAPI.
 * It updates the item definition for a given item with the provided definition parts.
 * 
 * It constructs the payload using the provided definition parts and calls the updateItemDefinition method.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.
 * @param {string} itemId - The ObjectId of the item to update.
 * @param {ItemDefinitionPart[]} definitionParts - An array of definition parts to update in the item definition.        
 * @param {boolean} [updateMetadata=false] - Optional. Indicates whether to update metadata. Defaults to false.
 * @returns {Promise<UpdateItemDefinitionResult>} - The result of the item definition update.
 */
export async function callUpdateItemDefinition(
    workloadClient: WorkloadClientAPI,
    itemId: string,
    definitionParts: ItemDefinitionPart[],
    updateMetadata: boolean = false): Promise<UpdateItemDefinitionResult> {

    const itemDefinitions: UpdateItemDefinitionPayload =  {
        definition: {
            format: undefined,
            parts: definitionParts
        }
    }  
    
    try {
        return await workloadClient.itemCrud.updateItemDefinition({
            itemId: itemId,
            payload: itemDefinitions,
            updateMetadata: updateMetadata
        });
    } catch (exception) {
        console.error("Failed updating Item definition %s", itemId, exception);
        return undefined
    }
}

/**
 * This function retrieves the item definition for a given item by its ObjectId.
 * It calls the 'itemCrudPublic.getItemDefinition' function from the WorkloadClientAPI.
 * 
 * It returns the item definition if available, otherwise undefined.
 * 
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.
 * @param {string} itemId - The ObjectId of the item to retrieve the definition for.
 * @returns {Promise<GetItemDefinitionResult>} - The item definition result if successful, otherwise undefined.
 */ 
export async function callGetItemDefinition(
    workloadClient: WorkloadClientAPI,
    itemId: string): Promise<GetItemDefinitionResult> {
    try {
        const itemDefinition: GetItemDefinitionResult = await workloadClient.itemCrud.getItemDefinition({
            itemId: itemId,
        });
        console.log("Successfully fetched item definition for item %s: %o", itemId, itemDefinition);
        return itemDefinition;
    } catch (exception) {
        console.error("Failed getting Item definition %s", itemId, exception);
        return undefined;
    }
}

/** 
 * This function converts a GetItemResult and GetItemDefinitionResult into a WorkloadItem.  
 * It extracts the necessary metadata and payload from the item definition parts.
 * It handles the parsing of the payload and platform metadata, and returns a WorkloadItem.
 * 
 * If the item definition parts are not available or parsing fails, it will log an error and return a WorkloadItem with undefined payload.
 * 
 * @param {GetItemResult} itemResult - The item result to convert.
 * @param {GetItemDefinitionResult} itemDefinitionResult - The item definition result to convert.
 * @param {T} [defaultDefinition] - Optional. The default definition to use if the item definition is not available.
 * @returns {ItemWithDefinition<T>} - The converted WorkloadItem.
 */
export function convertGetItemResultToWorkloadItem<T>(
        itemResult: GetItemResult,
        itemDefinitionResult: GetItemDefinitionResult, 
        defaultDefinition?: T): ItemWithDefinition<T> {            
    let payload: T;
    let itemPlatformMetadata: Item | undefined;
    let additionalParts: ItemDefinitionPart[] = [];
    
    if (itemDefinitionResult?.definition?.parts) {
        try {
            // Iterate through all parts once and categorize them
            for (const part of itemDefinitionResult.definition.parts) {
                if (part.path === ItemDefinitionPath.Default) {
                    payload = JSON.parse(atob(part.payload));
                } else if (part.path === ItemDefinitionPath.Platform) {
                    const itemPlatformPayload = JSON.parse(atob(part.payload));
                    itemPlatformMetadata = itemPlatformPayload ? itemPlatformPayload.metadata : undefined;
                } else {
                    // Add any other parts to additionalParts
                    additionalParts.push(part);
                }
            }
        } catch (payloadParseError) {
            console.error(`Failed parsing payload for item ${itemResult?.item.id}, itemDefinitionResult: ${itemDefinitionResult}`, payloadParseError);
        }
    }

    return {
        id: itemResult?.item.id,
        workspaceId: itemResult?.item.workspaceId,
        type: itemPlatformMetadata?.type ?? itemResult?.item.type,
        displayName: itemPlatformMetadata?.displayName ?? itemResult?.item.displayName,
        description: itemPlatformMetadata?.description ?? itemResult?.item.description,
        definition: payload ?? defaultDefinition,
        additionalDefinitionParts: additionalParts,
    };
}


/**
 * Private helper function to create a serialized ItemDefinitionPart for the default definition.
 * This method handles the proper base64 encoding and payload type assignment.
 * 
 * @param {T} definition - The definition data to serialize.
 * @returns {ItemDefinitionPart} - The serialized item definition part.
 */
function createDefaultDefinitionPart<T>(definition: T): ItemDefinitionPart {
    return {
        path: ItemDefinitionPath.Default,
        payload: btoa(JSON.stringify(definition, null, 2)),
        payloadType: PayloadType.InlineBase64
    };
}


/**
 * This function constructs a payload for the public API to update an item definition.
 * It allows for multiple parts to be included in the payload, each represented by a path and its corresponding payload data.
 * Each part is encoded in Base64 format and marked with the PayloadType of InlineBase64.
 *
 * @param {Array<{ payloadPath: string, payloadData: any }>} parts - An array of parts to include in the payload.
 * Each part should have a payloadPath (string) and payloadData (any) property.
 * @returns {UpdateItemDefinitionPayload} - The constructed payload for the item definition update.
 */
export function buildPublicAPIPayloadWithParts(
    parts: { payloadPath: string, payloadData: any }[]
): UpdateItemDefinitionPayload {
    const itemDefinitionParts: ItemDefinitionPart[] = parts.map(({ payloadPath, payloadData }) => ({
        path: payloadPath,
        payload: btoa(JSON.stringify(payloadData, null, 2)),
        payloadType: PayloadType.InlineBase64
    }));
    return {
        definition: {
            format: undefined,
            parts: itemDefinitionParts
        }
    };
}

/**
 * This function converts a JSON response from the getItemDefinition API call
 * into a structured GetItemDefinitionResult object.
 *
 * @param {string} responseBody - The response body from the getItemDefinition API call as a JSON string.
 * @returns {GetItemDefinitionResult} - The structured item definition result.
 * @throws {Error} - If the response format is invalid or if parsing fails.
 */
export function convertGetDefinitionResponseToItemDefinition(responseBody: string): GetItemDefinitionResult {
    let itemDefinition: GetItemDefinitionResult;
    try {
        const responseItemDefinition = JSON.parse((responseBody));
        if (!responseItemDefinition?.definition?.parts || !Array.isArray(responseItemDefinition.definition.parts)) {
            throw new Error("Invalid response format: missing definition.parts array");
        }
        itemDefinition = {
            definition: {
                format: undefined,
                parts: responseItemDefinition.definition.parts.map((part: ItemDefinitionPart) => ({
                    path: part.path,
                    payload: part.payload,
                    payloadType: part.payloadType ?? "InlineBase64"
                }))
            }
        };
        console.log(`Parsed item definition is ${itemDefinition}`);
    } catch (itemDefParseError) {
        console.error(`Failed parsing item definition, responseBody: ${responseBody}`, itemDefParseError);
    }
    return itemDefinition;
}