import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { FabricPlatformClient } from "./FabricPlatformClient";
import { FABRIC_BASE_SCOPES } from "./FabricPlatformScopes";
import { EnvironmentConstants } from "../constants";
import { OneLakeStorageClientItemWrapper } from "./OneLakeStorageClientItemWrapper";
import { ItemReference } from "../controller/ItemCRUDController";
import { OneLakeStorageContainerMetadata } from "./FabricPlatformTypes";

export const FILE_FOLDER_NAME = "Files"
export const TABLE_FOLDER_NAME = "Tables"

/**
 * API wrapper for OneLake operations
 * Provides methods for reading and writing files to OneLake storage
 * 
 */
export class OneLakeStorageClient extends FabricPlatformClient {

  constructor(workloadClient: WorkloadClientAPI) {
    super(workloadClient, FABRIC_BASE_SCOPES.ONELAKE_STORAGE);
  }

  /**
   * Create a wrapper for a OneLake item that correctly prefexis all calls to the onelake client with the item workspace and item id
   * @param item The OneLake item to use to access OneLake
   * @returns A OneLakeItemClient instance that is corectly configure to always use conent in the item directories in OneLake
   */
  createItemWrapper(item: ItemReference){
    return new OneLakeStorageClientItemWrapper(this, item);
  }

  /**
   * Check if a file exists in OneLake
   * @param filePath The OneLake file path
   * @returns Promise<boolean>
   */
  async checkIfFileExists(filePath: string): Promise<boolean> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(url, {
        method: "HEAD",
        headers: { Authorization: `Bearer ${accessToken.token}` }
      });
      if (response.status === 200) {
        return true;
      } else if (response.status === 404) {
        return false;
      } else {
        console.warn(`checkIfFileExists received unexpected status code: ${response.status}`);
        return false;
      }
    } catch (ex: any) {
      console.error(`checkIfFileExists failed for filePath: ${filePath}. Error: ${ex.message}`);
      return false;
    }
  }

  /**
   * Write content to a OneLake file as base64
   * @param filePath The OneLake file path
   * @param content The content to write as base64 encoded string
   */
  async writeFileAsBase64(filePath: string, content: string): Promise<void> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
    const accessToken = await this.getAccessToken();
    
    try {
      // First, create an empty file
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken.token}` },
        body: "" // Create empty file
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(`writeFileAsBase64: Creating a new file succeeded for filePath: ${filePath}`);
    } catch (ex: any) {
      console.error(`writeFileAsBase64: Creating a new file failed for filePath: ${filePath}. Error: ${ex.message}`);
      throw ex;
    }
    if(content && content.length > 0) {
      // Then append the base64 content as binary data
      await this.appendBinaryToFile(accessToken.token, filePath, content);
    }
  }

  /**
   * Read a file from OneLake as base64
   * @param filePath The OneLake file path
   * @returns Promise<string> The file content as base64 string
   */
  async readFileAsBase64(filePath: string): Promise<string> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken.token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert binary data to base64
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64Content = btoa(binaryString);
      
      console.log(`readFileAsBase64 succeeded for filePath: ${filePath}`);
      return base64Content;
    } catch (ex: any) {
      console.error(`readFileAsBase64 failed for filePath: ${filePath}. Error: ${ex.message}`);
      return "";
    }
  }

  /**
   * Write content to a OneLake file as text
   * @param filePath The OneLake file path
   * @param content The text content to write
   */
  async writeFileAsText(filePath: string, content: string): Promise<void> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken.token}` },
        body: "" // Create empty file
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(`writeFileAsText: Creating a new file succeeded for filePath: ${filePath}`);
    } catch (ex: any) {
      console.error(`writeFileAsText: Creating a new file failed for filePath: ${filePath}. Error: ${ex.message}`);
      return;
    }
    if(content && content.length > 0) {
      await this.appendToFile(accessToken.token, filePath, content);
    }
  }

  /**
   * Read a file from OneLake as text
   * @param filePath The OneLake file path
   * @returns Promise<string> The file content as text
   */
  async readFileAsText(filePath: string): Promise<string> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken.token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      console.log(`readFileAsText succeeded for filePath: ${filePath}`);
      return content;
    } catch (ex: any) {
      console.error(`readFileAsText failed for filePath: ${filePath}. Error: ${ex.message}`);
      return "";
    }
  }

  /**
   * Delete a file from OneLake
   * @param filePath The OneLake file path
   */
  async deleteFile(filePath: string): Promise<void> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?recursive=true`;
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken.token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(`deleteFile succeeded for filePath: ${filePath}`);
    } catch (ex: any) {
      console.error(`deleteFile failed for filePath: ${filePath}. Error: ${ex.message}`);
    }
  }

/**
   * Retrieves metadata for paths and files in a OneLake directory using the OneLake DFS API.
   * This method supports listing files, directories, and shortcuts with detailed metadata information.
   * 
   * @param workspaceId The Fabric workspace ID containing the OneLake item
   * @param path The directory path within the OneLake item to query (e.g., "itemId/Files/" or "itemId/Tables/")
   * @param recursive Whether to recursively list all subdirectories and files (default: false)
   * @param shortcutMetadata Whether to include shortcut metadata information in the response (default: true)
   * @returns Promise<OneLakeStorageContainerMetadata> Container object with paths array containing file/directory metadata
   * 
   * @remarks
   * - The path parameter should include the item ID prefix (e.g., "myItemId/Files/subfolder")
   * - When shortcutMetadata is true, shortcuts will include additional properties like accountType and target information but you need to call the method again with the shortcut path to get the content
   * - Recursive mode can significantly increase response size for large directory structures
   * - Uses the OneLake DFS API endpoint which follows ADLS Gen2 REST API conventions
   * 
   */
  async getPathMetadata(
    workspaceId: string,
    path: string,
    recursive = false,
    shortcutMetadata = true,
  ): Promise<OneLakeStorageContainerMetadata> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${workspaceId}/?recursive=${recursive}&resource=filesystem&directory=${encodeURIComponent(path)}&getShortcutMetadata=${shortcutMetadata}`;
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken.token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const paths: OneLakeStorageContainerMetadata = await response.json();
      return paths;
    } catch (ex: any) {
      console.error(`getPathList failed: ${ex.message}`);
      throw ex;
    }
  }

  /**
   * Create a folder in OneLake by creating a placeholder file
   * @param folderPath The path to the folder
   */
  async createFolder(folderPath: string): Promise<void> {
    // OneLake doesn't have explicit folder creation, so we create a placeholder file
    const placeholderPath = `${folderPath}/.folder_placeholder`;
    await this.writeFileAsText(placeholderPath, "");
  }

  /**
   * Get the OneLake file path for a specific file in the Files folder
   * @param workspaceId The ID of the workspace
   * @param itemId The ID of the item
   * @param fileName The name of the file
   * @returns The OneLake file path
   */
  static getFilePath(workspaceId: string, itemId: string, fileName: string): string {
    return OneLakeStorageClient.getPath(workspaceId, itemId, `${FILE_FOLDER_NAME}/${fileName}`);
  }

  /**
   * Get the path for a table
   * @param workspaceId 
   * @param itemId 
   * @param tableName 
   * @returns 
   */
  static getTablePath(workspaceId: string, itemId: string, tableName: string): string {
    return OneLakeStorageClient.getPath(workspaceId, itemId, `${TABLE_FOLDER_NAME}/${tableName}`);
  }


  /**
   * Get the OneLake path for a specific file (generic version)
   * @param workspaceId The workspace ID
   * @param itemId The item ID
   * @param fileName The file name/path
   * @returns The OneLake path
   */
  static getPath(workspaceId: string, itemId: string, fileName: string): string {
    return `${workspaceId}/${itemId}/${fileName}`;
  }

  // Private helper methods
  
  private async appendToFile(token: string, filePath: string, content: string): Promise<void> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
    const appendQuery = this.buildAppendQueryParameters();
    const appendUrl = `${url}?${appendQuery}`;
    
    try {
      const appendResponse = await fetch(appendUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: content
      });
      if (!appendResponse.ok) throw new Error(`HTTP ${appendResponse.status}`);

      // For Node.js: Buffer.byteLength, for browser: new TextEncoder().encode(content).length
      const contentLength = typeof Buffer !== "undefined"
        ? Buffer.byteLength(content, "utf8")
        : new TextEncoder().encode(content).length;

      const flushQuery = this.buildFlushQueryParameters(contentLength);
      const flushUrl = `${url}?${flushQuery}`;

      const flushResponse = await fetch(flushUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!flushResponse.ok) throw new Error(`HTTP ${flushResponse.status}`);

      console.log(`appendToFile succeeded for filePath: ${filePath}`);
    } catch (ex: any) {
      console.error(`appendToFile failed for filePath: ${filePath}. Error: ${ex.message}`);
      throw ex;
    }
  }

  private async appendBinaryToFile(token: string, filePath: string, base64Content: string): Promise<void> {
    const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
    const appendQuery = this.buildAppendQueryParameters();
    const appendUrl = `${url}?${appendQuery}`;
    
    try {
      // Decode base64 string to binary data
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const appendResponse = await fetch(appendUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: bytes
      });
      if (!appendResponse.ok) throw new Error(`HTTP ${appendResponse.status}`);

      // Flush with content length (bytes length, not string length)
      const contentLength = bytes.length;
      const flushQuery = this.buildFlushQueryParameters(contentLength);
      const flushUrl = `${url}?${flushQuery}`;

      const flushResponse = await fetch(flushUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!flushResponse.ok) throw new Error(`HTTP ${flushResponse.status}`);

      console.log(`appendBinaryToFile succeeded for filePath: ${filePath}`);
    } catch (ex: any) {
      console.error(`appendBinaryToFile failed for filePath: ${filePath}. Error: ${ex.message}`);
      throw ex;
    }
  }

  private buildAppendQueryParameters(): string {
    return "position=0&action=append";
  }

  private buildFlushQueryParameters(contentLength: number): string {
    return `position=${contentLength}&action=flush`;
  }
}
