/**
 * OneLakeView Component - Core Data Models and Interfaces
 * 
 * This module defines the core data structures and interfaces for the OneLake View
 * component. These types are shared between the component and its consumer components.
 */

import { PageProps } from "../../App";
import { Item } from "../../clients/FabricPlatformTypes";
import { ItemReference } from "../../controller/ItemCRUDController";

// ============================================================================
// Core Data Structures
// ============================================================================

export interface OneLakeObjectMetadata {
    rootFolder: string;
    name: string;
    relativePath: string;
    isShortcut?: boolean;
}

export interface TableMetadata extends OneLakeObjectMetadata {
    rootFolder: "Tables";
    schema?: string;
}

export interface FileMetadata extends OneLakeObjectMetadata {
    rootFolder: "Files";
    isDirectory: boolean;
}

export interface OneLakeViewItem extends ItemReference {
    displayName: string;
}

// ============================================================================
// Control Configuration
// ============================================================================

export interface OneLakeViewConfig {
    /**
     * Control mode - view for read-only, edit for full functionality
     */
    mode?: "view" | "edit";
    
    /**
     * Initial item to display in the explorer
     */
    initialItem?: OneLakeViewItem;
    
    /**
     * Allowed item types for item selection
     */
    allowedItemTypes?: string[];
    
    /**
     * Whether to allow item selection via DataHub
     */
    allowItemSelection?: boolean;
    
    /**
     * Timestamp to trigger refresh
     */
    refreshTrigger?: number;
}

// ============================================================================
// Callback Interfaces
// ============================================================================

export interface OneLakeViewCallbacks {
    /**
     * Called when a file is selected
     */
    onFileSelected?: (fileName: string, oneLakeLink: string) => Promise<void>;
    
    /**
     * Called when a table is selected
     */
    onTableSelected?: (tableName: string, oneLakeLink: string) => Promise<void>;
    
    /**
     * Called when the selected item changes
     */
    onItemChanged?: (item: Item) => Promise<void>;
}

// ============================================================================
// Control Props
// ============================================================================

export interface OneLakeViewProps extends PageProps {
    /**
     * Configuration options for the explorer
     */
    config: OneLakeViewConfig;
    
    /**
     * Callback functions for explorer events
     */
    callbacks: OneLakeViewCallbacks;
}

// ============================================================================
// Tree Component Props
// ============================================================================

export interface OneLakeViewTablesTreeProps {
    allTablesInItem: TableMetadata[];
    selectedTablePath?: string;
    onSelectTableCallback: (selectedTable: TableMetadata) => void;
}

export interface OneLakeViewFilesTreeProps {
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
    mode?: "view" | "edit";
}

// ============================================================================
// Loading States
// ============================================================================

export type LoadingStatus = "idle" | "loading" | "error";

// ============================================================================
// Context Menu States
// ============================================================================

export interface ContextMenuState {
    openFilesMenu: boolean;
    openTablesMenu: boolean;
    setOpenFilesMenu: (open: boolean) => void;
    setOpenTablesMenu: (open: boolean) => void;
}