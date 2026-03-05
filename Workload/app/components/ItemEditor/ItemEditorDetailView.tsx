import React from "react";
import { ArrowLeft20Regular } from "@fluentui/react-icons";
import { ItemEditorDefaultView, ItemEditorDefaultViewProps } from "./ItemEditorDefaultView";
import { RibbonAction } from "./RibbonToolbar";
import { DetailViewActionsContext } from "./ItemEditor";
import "./ItemEditor.scss"

/**
 * Action item for the detail view ribbon
 * 
 * Direct alias to RibbonAction for semantic clarity in detail view context.
 * Since RibbonAction now has full tooltip support, no additional properties are needed.
 */
export interface DetailViewAction extends RibbonAction {
}

/**
 * ItemEditorDetailView Props Interface
 */
export interface ItemEditorDetailViewProps extends ItemEditorDefaultViewProps {
  /** Optional additional actions to display in the ribbon */
  toolbarActions?: DetailViewAction[];
  /** Callback for the back action (if not provided, uses automatic ViewContext.goBack) */
  onBack?: () => void;
  /** Custom label for the back button (if not provided, will be handled at display level) */
  backLabel?: string;
  /** Custom tooltip for the back button (if not provided, will be handled at display level) */
  backTooltip?: string;
}

/**
 * ItemEditorDetailView Component
 * 
 * A specialized view component for displaying detail pages within item editors.
 * Built on ItemEditorDefaultView with added support for context-specific ribbon actions.
 * 
 * ## Architecture
 * 
 * ```
 * ┌────────────────────────────────────────────────────┐
 * │  ItemEditor (Ribbon with dynamic actions)          │
 * │  ┌──────────────────────────────────────────────┐  │
 * │  │  ItemEditorDetailView                        │  │
 * │  │  ┌────────────┬───────────────────────────┐ │  │
 * │  │  │            │                           │ │  │
 * │  │  │   Left     │      Center Content       │ │  │
 * │  │  │ (Optional) │      (Required)           │ │  │
 * │  │  │            │                           │ │  │
 * │  │  │ Properties │   Detail form/content     │ │  │
 * │  │  │ Navigation │   Data visualization      │ │  │
 * │  │  │ Metadata   │   Editor workspace        │ │  │
 * │  │  │            │                           │ │  │
 * │  │  └────────────┴───────────────────────────┘ │  │
 * │  └──────────────────────────────────────────────┘  │
 * └────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Key Features
 * - **Context-Specific Actions**: Define actions that appear in the ribbon for this view
 * - **Flexible Layout**: Optional left panel + required center content using panel config objects
 * - **Automatic Back Navigation**: Back button handled automatically when view is marked as `isDetailView: true`
 * - **Action Management**: Automatically registers actions with parent through context
 * - **Consistent Styling**: Uses ItemEditorDefaultView for layout consistency
 * - **Standardized Actions**: Uses RibbonAction interface with full tooltip support
 * 
 * ## Design Principles
 * - **Action-Driven**: Surface relevant actions in the ribbon based on view context
 * - **Composable**: Built on ItemEditorDefaultView for consistency
 * - **Flexible**: Left panel optional for simple or complex layouts
 * - **Accessible**: Inherits ARIA support from ItemEditorDefaultView
 * - **Fabric Compliant**: Uses design tokens and standard patterns
 * - **Type Safe**: Strong TypeScript interfaces throughout
 * 
 * ## Action System
 * 
 * DetailViewAction is a direct alias to RibbonAction, providing:
 * - **Unified Interface**: Same properties as RibbonAction
 * - **Tooltip Support**: Built-in tooltip with fallback to label
 * - **No Conversion**: Direct usage without transformation
 * - **Consistency**: Same API across all ribbon contexts
 * 
 * ## Usage Examples
 * 
 * ### Example 1: Simple Detail View with Actions
 * ```tsx
 * import { ItemEditorDetailView } from "../../components/ItemEditor";
 * import { Save24Regular, Delete24Regular } from "@fluentui/react-icons";
 * 
 * const toolbarActions = [
 *   {
 *     key: 'save',
 *     label: 'Save Changes', // Can be omitted for translation at display level
 *     icon: Save24Regular,
 *     onClick: () => handleSave(),
 *     appearance: 'primary',
 *     tooltip: 'Save your current changes'
 *   },
 *   {
 *     key: 'delete',
 *     // label omitted - will be handled at display level for translation
 *     icon: Delete24Regular,
 *     onClick: () => handleDelete(),
 *     appearance: 'subtle',
 *     disabled: !canDelete,
 *     tooltip: 'Delete this item permanently'
 *   }
 * ];
 * 
 * <ItemEditorDetailView
 *   center={{
 *     content: <MyDetailContent />
 *   }}
 *   toolbarActions={toolbarActions}
 * />
 * ```
 * 
 * ### Example 2: With Left Properties Panel
 * ```tsx
 * <ItemEditorDetailView
 *   left={{
 *     content: <PropertiesPanel item={selectedItem} />,
 *     title: "Properties",
 *     width: 300,
 *     collapsible: true
 *   }}
 *   center={{
 *     content: <DetailEditor item={selectedItem} />
 *   }}
 *   toolbarActions={[
 *     {
 *       key: 'apply',
 *       label: 'Apply',
 *       icon: Save24Regular, // Requires an icon
 *       onClick: () => applyChanges(),
 *       appearance: 'primary'
 *     }
 *   ]}
 * />
 * ```
 * 
 * ### Example 3: With Navigation Panel
 * ```tsx
 * const [selectedPage, setSelectedPage] = useState('overview');
 * 
 * import { ArrowDownload24Regular, Share24Regular } from "@fluentui/react-icons";
 * 
 * const toolbarActions = [
 *   {
 *     key: 'export',
 *     label: 'Export',
 *     icon: ArrowDownload24Regular,
 *     onClick: () => handleExport(),
 *     tooltip: 'Export current page'
 *   },
 *   {
 *     key: 'share',
 *     label: 'Share',
 *     icon: Share24Regular,
 *     onClick: () => handleShare(),
 *     tooltip: 'Share with others'
 *   }
 * ];
 * 
 * <ItemEditorDetailView
 *   left={{
 *     content: (
 *       <NavigationMenu
 *         items={pages}
 *         selected={selectedPage}
 *         onSelect={setSelectedPage}
 *       />
 *     ),
 *     title: "Navigation",
 *     width: 240
 *   }}
 *   center={{
 *     content: <PageContent page={selectedPage} />
 *   }}
 *   toolbarActions={toolbarActions}
 * />
 * ```
 * 
 * ## Action Management
 * 
 * Actions are automatically registered with the parent ItemEditor through the DetailViewActionsContext.
 * When a detail view is active, its actions appear in the ribbon toolbar automatically.
 * 
 * ```tsx
 * // Just define your actions - registration is automatic
 * const detailActions: DetailViewAction[] = [
 *   {
 *     key: 'save',
 *     label: 'Save',
 *     icon: Save24Regular,
 *     tooltip: 'Save your changes',
 *     onClick: handleSave,
 *     appearance: 'primary'
 *   }
 * ];
 * 
 * // Actions automatically appear in ribbon when this view is active
 * <ItemEditorDetailView
 *   center={{ content: <MyContent /> }}
 *   toolbarActions={detailActions}
 * />
 * ```
 * 
 * ## Integration with Ribbon System
 * 
 * DetailViewActions are automatically compatible with the ribbon system:
 * 
 * ```tsx
 * // Define actions with full RibbonAction properties
 * const detailActions: DetailViewAction[] = [
 *   {
 *     key: 'save',
 *     label: 'Save',
 *     icon: Save24Regular,
 *     tooltip: 'Save your changes',
 *     onClick: handleSave,
 *     appearance: 'primary'
 *   }
 * ];
 * 
 * // Use directly in ribbon toolbar - no conversion needed
 * <RibbonToolbar actions={detailActions} />
 * ```
 * 
 * ## Fabric UX Compliance
 * - Uses Fabric design tokens for consistent spacing
 * - Inherits responsive behavior from ItemEditorDefaultView
 * - Proper action button styling and states
 * - Semantic HTML structure with ARIA landmarks
 * - High contrast mode support
 * 
 * @component
 * @see {@link https://react.fluentui.dev/} Fluent UI v9 Documentation
 * @see {@link ../../../docs/components/ItemEditor/ItemEditorDetailView.md} - Complete ItemEditorDetailView documentation
 * @see {@link ./ItemEditorDefaultView.tsx} - Base layout component
 * @see {@link ../../../docs/components/ItemEditor.md} - ItemEditor integration patterns
 */
export function ItemEditorDetailView({
  left,
  center,
  className,
  toolbarActions = [],
  onBack,
  backLabel,
  backTooltip
}: ItemEditorDetailViewProps) {

  // Get the context to register actions with ItemEditor
  const detailViewActionsContext = React.useContext(DetailViewActionsContext);

  // Create the back action for the detail view actions (separate from Ribbon's back button)
  const backAction: DetailViewAction = {
    key: 'back',
    label: backLabel, // Allow undefined - will be handled at display level
    icon: ArrowLeft20Regular,
    onClick: onBack || (() => {}),
    appearance: 'subtle',
    disabled: !onBack,
    tooltip: backTooltip // Allow undefined - will be handled at display level
  };

  // Combine back action with additional actions (only if onBack is provided)
  const allActions = onBack ? [backAction, ...toolbarActions] : toolbarActions;

  // Register actions with ItemEditor through context
  React.useEffect(() => {
    if (detailViewActionsContext) {
      // Register all actions including back action if provided
      // Ribbon will handle the automatic back button, but this allows for custom back actions too
      detailViewActionsContext.setDetailViewActions(allActions);
    }
    
    // Cleanup: clear actions when component unmounts
    return () => {
      if (detailViewActionsContext) {
        detailViewActionsContext.setDetailViewActions([]);
      }
    };
  }, [detailViewActionsContext, allActions]);

  // Use ItemEditorDefaultView for consistent layout
  return (
    <ItemEditorDefaultView
      left={left}
      center={center}
      className={className}
    />
  );
}

export default ItemEditorDetailView;