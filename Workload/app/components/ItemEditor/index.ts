/**
 * ItemEditor Components
 * 
 * This module exports all ItemEditor-related components and types
 * for building consistent item editors in Microsoft Fabric workloads.
 * 
 * @see {@link ../../../docs/components/ItemEditor.md} - Complete ItemEditor documentation
 * @see {@link ../../../docs/components/ItemEditor/README.md} - Detailed ItemEditor guide
 * @see {@link ../../../docs/components/ItemEditor/Architecture.md} - System architecture overview
 * @see {@link ../../../docs/components/ItemEditor/QuickReference.md} - Quick reference guide
 */

// Core ItemEditor component
export { ItemEditor } from './ItemEditor';
export type { 
  ItemEditorProps, 
  RegisteredView,
  RegisteredNotification,
  ViewContext
} from './ItemEditor';

// ItemEditor View components
export { ItemEditorDefaultView, useViewNavigation } from './ItemEditorDefaultView';
export type { ItemEditorDefaultViewProps, LeftPanelConfig, CentralPanelConfig } from './ItemEditorDefaultView';

// ItemEditor Empty View component
export { ItemEditorEmptyView } from './ItemEditorEmptyView';
export type { ItemEditorEmptyViewProps, EmptyStateTask } from './ItemEditorEmptyView';

// ItemEditor Detail View component  
export { ItemEditorDetailView } from './ItemEditorDetailView';
export type { ItemEditorDetailViewProps, DetailViewAction } from './ItemEditorDetailView';

// Ribbon Components - Standardized ribbon components
export { Ribbon } from './Ribbon';
export type { RibbonProps, RibbonTab } from './Ribbon';

export { RibbonToolbar } from './RibbonToolbar';
export type { RibbonToolbarProps, RibbonAction, RibbonDropdownAction } from './RibbonToolbar';

export { RibbonToolbarAction } from './RibbonToolbarAction';
export type { RibbonToolbarActionProps, FluentIconComponent } from './RibbonToolbarAction';

export { RibbonActionButtonImpl } from './RibbonActionButton';
export type { RibbonActionButtonImplProps, RibbonActionButton, DropdownMenuItem } from './RibbonActionButton';

export { 
  createSaveAction,
  createSettingsAction,
  createAboutAction
} from './RibbonStandardActions';

// Re-export contexts for consumers who need them
export { DetailViewActionsContext, ViewNavigationContext } from './ItemEditor';

// Hook for view navigation is exported from ItemEditorDefaultView