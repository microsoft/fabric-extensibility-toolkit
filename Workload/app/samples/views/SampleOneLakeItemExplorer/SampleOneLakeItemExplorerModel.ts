export interface ItemMetadata {
    workspaceObjectId: string;
    objectId: string;
    displayName: string;
}

export interface OneLakeObjectMetadata{
    prefix: string;
    name: string;
    path: string;
    isShortcut?: boolean;
}

export interface TableMetadata extends OneLakeObjectMetadata {
    prefix: "Tables";
    schema?: string;
}

export interface FileMetadata extends OneLakeObjectMetadata {
    prefix: "Files";
    isDirectory: boolean;
}

export interface OneLakeItemExplorerTablesTreeProps {
    allTablesInItem: TableMetadata[];
    selectedTablePath?: string;
    onSelectTableCallback: (selectedTable: TableMetadata) => void;
}

export interface OneLakeItemExplorerFilesTreeProps {
    allFilesInItem: FileMetadata[];
    selectedFilePath?: string;
    onSelectFileCallback: (selectedFile: FileMetadata) => void;
    onDeleteFileCallback?: (filePath: string) => Promise<void>;
    onDeleteFolderCallback?: (folderPath: string) => Promise<void>;
    onCreateFolderCallback?: (parentPath: string) => Promise<void>;
    onCreateShortcutCallback?: (parentPath: string) => Promise<void>;
    // Required for dynamic shortcut content loading
    workloadClient?: any; // WorkloadClientAPI
    workspaceId?: string;
    itemId?: string;
}