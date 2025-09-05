import { Item, OneLakeStoragePathMetadata } from "../../../clients/FabricPlatformTypes";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FileMetadata, TableMetadata } from "./SampleOneLakeItemExplorerModel";
import { FabricPlatformAPIClient } from "../../../clients";
import { OneLakeStorageClient } from "../../../clients/OneLakeStorageClient";


/**
 * Retrieves a list of tables from the specified Fabric Item.
 */
export async function getTables(
    workloadClient: WorkloadClientAPI,
    workspaceId: string,
    itemId: string
): Promise<TableMetadata[]> {
    const directory = `${itemId}/Tables/`;
    const oneLakeStorageClient = new OneLakeStorageClient(workloadClient);
    const oneLakeContainer = await oneLakeStorageClient.getPathMetadata(workspaceId, directory, true);
    const deltaLogDirectory = "/_delta_log";
    const tables = (oneLakeContainer.paths || [])
        .filter(path =>
            path.name.endsWith(deltaLogDirectory) ||
            (path.isShortcut && 
                (path.accountType === "ADLS" || path.accountType === "ExternalADLS"))
        )
        .map(path => {

            return convertToTableMetadata(path, deltaLogDirectory);
        });

    return tables;
}


function convertToTableMetadata(path: OneLakeStoragePathMetadata, deltaLogDirectory: string): TableMetadata {
    let pathName = path.name;
    let parts = pathName.split('/');
    let tableName: string;
    let schemaName: string | null = null;

    // Remove '_delta_log' if present
    if (pathName.endsWith(deltaLogDirectory)) {
        pathName = parts.slice(0, -1).join('/');
        parts = pathName.split('/');
    }

    tableName = parts[parts.length - 1];
    if (parts.length === 4) {
        schemaName = parts[2];
    }

    return {
        prefix: "Tables",
        name: tableName,
        path: pathName + '/',
        schema: schemaName,
    } as TableMetadata;
}

/**
 * Retrieves a Fabric item.
 */
export async function getItem(
    workloadClient: WorkloadClientAPI,
    token: string,
    workspaceId: string,
    itemId: string
): Promise<Item | null> {
    const client = FabricPlatformAPIClient.create(workloadClient);
    return client.items.getItem(workspaceId, itemId)
}

export async function getFiles(
    workloadClient: WorkloadClientAPI,
    workspaceId: string,
    itemId: string
): Promise<FileMetadata[]> {
    const directory = `${itemId}/Files/`;
    const oneLakeStorageClient = new OneLakeStorageClient(workloadClient);
    const oneLakeContainer = await oneLakeStorageClient.getPathMetadata(workspaceId, directory, true);
    const files = (oneLakeContainer.paths || []).map(path => {
        return convertToFileMetadata(path, directory);
    });

    return files;
}

function convertToFileMetadata(path: OneLakeStoragePathMetadata, directory: string) {
    const pathName = path.name;
    const parts = pathName.split('/');

    // Path structure: <itemId>/Files/...<Subdirectories>.../<fileName>
    const fileName = parts[parts.length - 1];

    // Remove the prefix (itemId/Files/) from the path
    const relativePath = pathName.length > directory.length ? pathName.substring(directory.length) : "";

    return {
        prefix: "Files",
        name: fileName,
        path: relativePath,
        isDirectory: path.isDirectory,
        isShortcut: path.isShortcut
    } as FileMetadata;
}

/**
 * Get files and directories inside a shortcut by treating it as a regular directory
 * @param workloadClient The workload client
 * @param workspaceId The workspace ID
 * @param itemId The item ID (Lakehouse)
 * @param shortcutPath The path to the shortcut (e.g., "MyShortcut" if in root, "folder/MyShortcut" if nested)
 * @param isInFilesFolder Whether the shortcut is in the Files folder (true) or Tables folder (false)
 * @returns FileMetadata array of contents inside the shortcut
 */
export async function getShortcutContents(
    workloadClient: WorkloadClientAPI,
    workspaceId: string,
    itemId: string,
    shortcutPath: string,
    isInFilesFolder: boolean = true
): Promise<FileMetadata[]> {
    // Construct the directory path to look inside the shortcut
    const folderPrefix = isInFilesFolder ? "Files" : "Tables";
    const directory = `${itemId}/${folderPrefix}/${shortcutPath}`;
    
    console.log(`Getting contents of shortcut at path: ${directory}`);
    
    const oneLakeStorageClient = new OneLakeStorageClient(workloadClient);
    const oneLakeContainer = await oneLakeStorageClient.getPathMetadata(workspaceId, directory, true);
    const files = (oneLakeContainer.paths || []).map(path => {
        const pathName = path.name;
        const parts = pathName.split('/');
        const fileName = parts[parts.length - 1];
        
        // Remove the prefix from the path to get relative path within the shortcut
        const relativePath = pathName.length > directory.length 
            ? pathName.substring(directory.length + 1) // +1 to remove leading slash
            : "";

        return {
            prefix: folderPrefix,
            name: fileName,
            path: relativePath,
            isDirectory: path.isDirectory,
            isShortcut: path.isShortcut
        } as FileMetadata;
    });

    return files;
}

/**
 * Get files in any directory path (including shortcuts)
 * This is a more flexible version that can navigate into shortcuts or regular directories
 * @param workloadClient The workload client
 * @param workspaceId The workspace ID  
 * @param itemId The item ID (Lakehouse)
 * @param directoryPath The full path within the item (e.g., "Files/MyShortcut/subfolder")
 * @returns FileMetadata array of contents in the directory
 */
export async function getFilesInPath(
    workloadClient: WorkloadClientAPI,
    workspaceId: string,
    itemId: string,
    directoryPath: string
): Promise<FileMetadata[]> {
    const directory = `${itemId}/${directoryPath}`;
    
    console.log(`Getting files in path: ${directory}`);
    
    const oneLakeStorageClient = new OneLakeStorageClient(workloadClient);
    const oneLakeContainer = await oneLakeStorageClient.getPathMetadata(workspaceId, directory, false);
    const files = (oneLakeContainer.paths || []).map(path => {
        const pathName = path.name;
        const parts = pathName.split('/');
        const fileName = parts[parts.length - 1];
        
        // Remove the prefix from the path
        const relativePath = pathName.length > directory.length 
            ? pathName.substring(directory.length + 1)
            : "";

        // Determine the prefix (Files or Tables)
        const prefix = directoryPath.startsWith('Files/') ? 'Files' : 
                     directoryPath.startsWith('Tables/') ? 'Tables' : 
                     directoryPath.split('/')[0];

        return {
            prefix,
            name: fileName,
            path: relativePath,
            isDirectory: path.isDirectory,
            isShortcut: path.isShortcut
        } as FileMetadata;
    });

    return files;
}