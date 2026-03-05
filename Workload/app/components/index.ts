/**
 * Reusable Components for Microsoft Fabric Workload Items
 * 
 * This module exports commonly used UI components that maintain consistency
 * across all item editors in the workload.
 * 
 * @see {@link ../../docs/components/README.md} - Complete components documentation overview
 * @see {@link ../../docs/components/ItemEditor.md} - ItemEditor component and architecture
 * @see {@link ../../docs/components/Wizard.md} - Wizard component for step-by-step workflows
 * @see {@link ../../docs/components/OneLakeView.md} - OneLakeView component for data browsing
 */

// Base Item Editor - Foundation for all item editors
export { 
  ItemEditor,
  ItemEditorDefaultView,
  ItemEditorEmptyView,
  ItemEditorDetailView,
  Ribbon,
  RibbonToolbar,
  RibbonToolbarAction,
  createSaveAction,
  createSettingsAction,
  createAboutAction
} from './ItemEditor/';

export type { 
  ItemEditorProps, 
  RegisteredView,
  ViewContext,
  LeftPanelConfig,
  CentralPanelConfig,
  EmptyStateTask,
  DetailViewAction,
  RibbonProps,
  RibbonAction,
  RibbonActionButton,
  FluentIconComponent
} from './ItemEditor/';

// Wizard Component - Step-by-step guided workflows
export { 
  WizardControl
} from './Wizard/';

export type { 
  WizardStep, 
  WizardControlProps,
  WizardStepProps,
  WizardNavigationProps
} from './Wizard/';

// OneLakeView Component - OneLake item browsing and selection
export { 
  OneLakeView
} from './OneLakeView/';

export type { 
  OneLakeViewProps,
  OneLakeViewItem,
  TableMetadata,
  FileMetadata,
  LoadingStatus
} from './OneLakeView/';

// Dialog Component - Simple dialog with wizard-like styling
export {
  DialogControl
} from './Dialog/';

export type {
  DialogControlProps
} from './Dialog/';
