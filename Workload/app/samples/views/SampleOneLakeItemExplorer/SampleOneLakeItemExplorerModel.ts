export interface ItemMetadata {
    workspaceObjectId: string;
    objectId: string;
    displayName: string;
}

export interface TableMetadata {
    name: string;
    path: string;
    schema?: string;
}

export interface FileMetadata {
    name: string;
    path: string;
    isDirectory: boolean;
    isShortcut?: boolean;
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
}

export interface OneLakePath {
    name: string;
    isShortcut?: boolean;
    accountType?: string;
    isDirectory?: boolean;
}

export interface OneLakePathContainer {
    paths: OneLakePath[];
}