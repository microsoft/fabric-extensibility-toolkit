/**
 * OneLakeView Component - Main Export Module
 * 
 * This module provides a reusable OneLake Item Explorer component that can be
 * integrated into any component that needs tree-based OneLake browsing functionality.
 * 
 * Core Components:
 * - OneLakeView: Main component with tree functionality
 * - FileTree: File system tree component
 * - TableTreeWithSchema: Table tree with schema grouping
 * - TableTreeWithoutSchema: Flat table tree
 * 
 * Data Models:
 * - OneLakeViewProps: Main component props interface
 * - OneLakeViewConfig: Configuration options
 * - OneLakeViewCallbacks: Event callback functions
 * - TableMetadata, FileMetadata: Data structures
 * 
 * @see {@link ../../../docs/components/OneLakeView.md} - Complete OneLakeView documentation
 * @see {@link ./OneLakeView.tsx} - Main component implementation
 * @see {@link ./OneLakeViewController.ts} - Data operations controller
 * 
 * Usage:
 * ```tsx
 * import { OneLakeView } from '../components/OneLakeView';
 * 
 * const config = {
 *   mode: "edit",
 *   initialItem: { id: "item-id", workspaceId: "workspace-id", displayName: "My Item" },
 *   allowItemSelection: true
 * };
 * 
 * const callbacks = {
 *   onFileSelected: async (fileName, oneLakeLink) => { ... },
 *   onTableSelected: async (tableName, oneLakeLink) => { ... },
 *   onItemChanged: async (item) => { ... }
 * };
 * 
 * <OneLakeView 
 *   workloadClient={workloadClient}
 *   config={config}
 *   callbacks={callbacks}
 * />
 * ```
 */

// Main control
export { OneLakeView } from './OneLakeView';

// Sub-components
export { FileTree } from './FileTree';
export { TableTreeWithSchema } from './TableTreeWithSchema';
export { TableTreeWithoutSchema } from './TableTreeWithoutSchema';

// Controller functions
export {
  getTables,
  getFiles,
  getShortcutContents,
  getFilesInPath,
  getItem
} from './OneLakeViewController';

// Types and interfaces
export type {
  OneLakeViewProps,
  OneLakeViewConfig,
  OneLakeViewCallbacks,
  OneLakeViewItem,
  TableMetadata,
  FileMetadata,
  OneLakeObjectMetadata,
  OneLakeViewTablesTreeProps,
  OneLakeViewFilesTreeProps,
  LoadingStatus,
  ContextMenuState
} from './OneLakeViewModel';