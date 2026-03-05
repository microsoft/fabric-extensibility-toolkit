import React, { ReactNode, useState, useCallback } from "react";
import { Button, Text } from "@fluentui/react-components";
import { ChevronDoubleLeft20Regular, ChevronDoubleRight20Regular } from "@fluentui/react-icons";
import { ViewNavigationContext } from './ItemEditor';
import "./ItemEditor.scss"

/**
 * Left Panel Configuration Interface
 * 
 * Defines the configuration for the optional left panel in ItemEditorDefaultView.
 * The left panel provides a consistent layout for navigation, properties, file explorers,
 * and other secondary content areas.
 * 
 * ## Collapse Behavior
 * - **State Management**: Toggle state is always managed internally by ItemEditorDefaultView
 * - **Initial State**: Use `collapsed` to set the initial collapsed state (default: false)
 * - **Notification**: Use `onCollapseChange` to receive notifications when state changes
 * - **No External Control**: External components cannot control the collapse state after initialization
 * 
 * ## Header Behavior
 * - **Expanded**: Shows title on left, collapse button (⏷) on right
 * - **Collapsed**: Shows only expand button (⏵) in vertical strip
 * - **Pattern**: Follows SampleOneLakeView design for consistency
 * 
 * @example
 * ```tsx
 * // Basic collapsible panel
 * const leftConfig: LeftPanelConfig = {
 *   content: <MyNavigationTree />,
 *   title: "Navigation",
 *   collapsible: true
 * };
 * 
 * // Panel with custom width and notification
 * const leftConfig: LeftPanelConfig = {
 *   content: <FileExplorer />,
 *   title: "Files",
 *   width: 320,
 *   minWidth: 240,
 *   collapsible: true,
 *   collapsed: false, // Start expanded
 *   enableUserResize: true, // Allow user to resize (default)
 *   onCollapseChange: (collapsed) => {
 *     console.log(`Panel ${collapsed ? 'collapsed' : 'expanded'}`);
 *   }
 * };
 * ```
 */
export interface LeftPanelConfig {
  /** Left panel content (e.g., navigation, tree view, file explorer) */
  content: ReactNode;
  /** Optional title for the left panel header (default: "Panel") */
  title?: string;
  /** Width of the left panel in pixels (default: 280px) */
  width?: number;
  /** Minimum width of the left panel for resizing (default: 200px) */
  minWidth?: number;
  /** Maximum width of the left panel for resizing (default: 600px) */
  maxWidth?: number;
  /** Whether the left panel is collapsible (default: false) */
  collapsible?: boolean;
  /** Initial collapsed state of left panel (default: false) - state is managed internally after initialization */
  collapsed?: boolean;
  /** Whether to enable user resizing of the left panel via drag handle (default: true) */
  enableUserResize?: boolean;
  /** Callback when left panel collapse state changes (notification only) - does not control state */
  onCollapseChange?: (isCollapsed: boolean) => void;
  /** Callback when left panel width changes (only called when enableUserResize is enabled) */
  onWidthChange?: (newWidth: number) => void;
}

/**
 * Central Panel Configuration Interface
 * 
 * Defines the configuration for the required center content area in ItemEditorDefaultView.
 * The center panel is the main workspace area for content editing, forms, canvases, and primary user interactions.
 * 
 * ## Design Principles
 * - **Main Content**: Always visible and takes remaining space after left panel
 * - **Flexible**: Adapts to various content types (editors, forms, canvases, etc.)
 * - **Scrollable**: Handles overflow with proper scroll behavior
 * - **Accessible**: Uses proper ARIA roles and semantic HTML
 * 
 * @example
 * ```tsx
 * // Basic center content
 * const centerConfig: CentralPanelConfig = {
 *   content: <MyMainEditor />
 * };
 * 
 * // Center content with custom styling and accessibility
 * const centerConfig: CentralPanelConfig = {
 *   content: <DesignCanvas />,
 *   className: "custom-canvas-area",
 *   ariaLabel: "Design canvas workspace"
 * };
 * ```
 */
export interface CentralPanelConfig {
  /** Main content area (e.g., editor, form, canvas, workspace) */
  content: ReactNode;
  /** Optional className for custom styling */
  className?: string;
  /** Optional ARIA label for accessibility (default: "Main content") */
  ariaLabel?: string;
}

/**
 * ItemEditorDefaultView Props Interface
 */
export interface ItemEditorDefaultViewProps {
  /** Optional left panel configuration */
  left?: LeftPanelConfig;
  /** Required center content area configuration */
  center: CentralPanelConfig;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * ItemEditorDefaultView Component
 * 
 * A flexible layout component for item editor content areas with optional left panel and required center content.
 * This component is designed to be used WITHIN ItemEditor's children area.
 * 
 * ## Architecture
 * 
 * ```
 * ┌────────────────────────────────────────────────────┐
 * │  ItemEditor (Ribbon at top)                        │
 * │  ┌──────────────────────────────────────────────┐  │
 * │  │  ItemEditorDefaultView                       │  │
 * │  │  ┌────────────┬───────────────────────────┐ │  │
 * │  │  │ ┌──────────┐│                           │ │  │
 * │  │  │ │Title  [⏷]││      Center Content       │ │  │
 * │  │  │ └──────────┘│      (Required)           │ │  │
 * │  │  │            │                           │ │  │
 * │  │  │   Left     │   Main workspace/canvas   │ │  │
 * │  │  │ (Optional) │   Editor area             │ │  │
 * │  │  │  Content   │   Form/Details            │ │  │
 * │  │  │            │                           │ │  │
 * │  │  └────────────┴───────────────────────────┘ │  │
 * │  │                                              │  │
 * │  │  Collapsed: [⏵] (vertical strip only)       │  │
 * │  └──────────────────────────────────────────────┘  │
 * └────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Design Principles
 * - **Left Panel (Optional)**: 280px default width for navigation/explorer with unified configuration
 * - **Center Area (Required)**: Flexible width, takes remaining space
 * - **Responsive**: Proper spacing and overflow handling
 * - **Accessible**: Semantic HTML with ARIA regions
 * - **Fabric Compliant**: Uses design tokens for spacing and colors
 * - **Header-Based Toggle**: Follows SampleOneLakeView pattern with title and toggle button
 * 
 * ## Usage Examples
 * 
 * ### Example 1: Center Content Only (No Left Panel)
 * ```tsx
 * import { ItemEditor, ItemEditorDefaultView } from "../../components/ItemEditor";
 *
 * <ItemEditor ribbon={<MyRibbon />}>
 *   <ItemEditorDefaultView
 *     center={{
 *       content: <MyMainContent />
 *     }}
 *   />
 * </ItemEditor>
 * ```
 * 
 * ### Example 2: With Left Navigation Panel
 * ```tsx
 * <ItemEditor ribbon={<MyRibbon />}>
 *   <ItemEditorDefaultView
 *     left={{
 *       content: <NavigationTree items={navItems} />,
 *       title: "Navigation"
 *     }}
 *     center={{
 *       content: <DetailView selectedItem={selectedItem} />
 *     }}
 *   />
 * </ItemEditor>
 * ```
 * 
 * ### Example 3: With Custom Left Panel Width
 * ```tsx
 * <ItemEditor ribbon={<MyRibbon />}>
 *   <ItemEditorDefaultView
 *     left={{
 *       content: <FileExplorer files={files} />,
 *       title: "Files",
 *       width: 320,
 *       minWidth: 240
 *     }}
 *     center={{
 *       content: <CodeEditor file={currentFile} />
 *     }}
 *   />
 * </ItemEditor>
 * ```
 * 
 * ### Example 4: With Collapsible Left Panel
 * ```tsx
 * <ItemEditor ribbon={<MyRibbon />}>
 *   <ItemEditorDefaultView
 *     left={{
 *       content: <PropertiesPanel properties={props} />,
 *       title: "Properties",
 *       collapsible: true,
 *       collapsed: false, // Initial state
 *       enableUserResize: false, // Disable user resizing
 *       onCollapseChange: (collapsed) => console.log('Panel collapsed:', collapsed)
 *     }}
 *     center={{
 *       content: <DesignCanvas elements={elements} />
 *     }}
 *   />
 * </ItemEditor>
 * ```
 * 
 * ### Example 5: With Collapsible Left Panel (Default Resize Enabled)
 * ```tsx
 * <ItemEditor ribbon={<MyRibbon />}>
 *   <ItemEditorDefaultView
 *     left={{
 *       content: <PropertiesPanel properties={props} />,
 *       title: "Properties",
 *       collapsible: true
 *       // enableUserResize defaults to true
 *       // collapsed defaults to false, state managed internally
 *     }}
 *     center={{
 *       content: <DesignCanvas elements={elements} />
 *     }}
 *   />
 * </ItemEditor>
 * ```
 * 
 * ## Fabric UX Compliance
 * - Uses Fabric design tokens for consistent spacing
 * - Proper overflow handling for scrollable areas
 * - Semantic HTML structure with ARIA landmarks
 * - Responsive layout patterns
 * - High contrast mode support
 * 
 * @component
 * @see {@link https://react.fluentui.dev/} Fluent UI v9 Documentation
 * @see {@link ../../../docs/components/ItemEditor/ItemEditorDefaultView.md} - Complete ItemEditorDefaultView documentation
 * @see {@link ../../../docs/components/ItemEditor.md} - ItemEditor integration patterns
 * @see {@link ./ItemEditor.tsx} - Main ItemEditor component
 */
export function ItemEditorDefaultView(props: ItemEditorDefaultViewProps) {
  const { left, center, className = "" } = props;

  // State for left panel collapse
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(left?.collapsed ?? false);
  
  // State for left panel width (for resizing)
  const [leftPanelWidth, setLeftPanelWidth] = useState(left?.width ?? 280);
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Constants for panel sizing
  const leftPanelMinWidth = left?.minWidth ?? 200;
  const leftPanelMaxWidth = left?.maxWidth ?? 600;
  const leftPanelTitle = left?.title ?? "Panel";
  const isLeftPanelCollapsible = left?.collapsible ?? false;
  const enableUserResize = left?.enableUserResize ?? true;

  // Extract center panel configuration with defaults
  const centerClassName = center.className ?? "";
  const centerAriaLabel = center.ariaLabel ?? "Main content";

  // Handle left panel collapse toggle
  const handleToggleCollapse = () => {
    if (isLeftPanelCollapsible) {
      const newCollapsedState = !isLeftPanelCollapsed;
      setIsLeftPanelCollapsed(newCollapsedState);
      left?.onCollapseChange?.(newCollapsedState);
    }
  };

  // Handle resize move
  const handleResizeMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - resizeStartX;
    const newWidth = Math.min(leftPanelMaxWidth, Math.max(leftPanelMinWidth, resizeStartWidth + deltaX));
    
    setLeftPanelWidth(newWidth);
    left?.onWidthChange?.(newWidth);
  }, [resizeStartX, resizeStartWidth, leftPanelMinWidth, leftPanelMaxWidth, left]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Effect to manage event listeners
  React.useEffect(() => {
    if (isResizing) {
      const moveHandler = (e: MouseEvent) => handleResizeMove(e);
      const endHandler = () => {
        handleResizeEnd();
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', endHandler);

      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
      };
    }
    
    return () => {}; // Return empty cleanup function when not resizing
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!enableUserResize) return;
    
    e.preventDefault();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(leftPanelWidth);
  };

  return (
    <div 
      className={`item-editor-view ${className}`.trim()}
      data-testid="item-editor-view"
    >
      {/* Top Section: Left Panel and Center Content */}
      <div className="item-editor-view__top-section">
        {/* Left Panel (Optional) */}
        {left && (
          <>
            <aside 
              className={`item-editor-view__left ${isLeftPanelCollapsed ? "collapsed" : ""}`}
              style={{ 
                width: isLeftPanelCollapsed ? "auto" : `${leftPanelWidth}px`,
                minWidth: isLeftPanelCollapsed ? "auto" : `${leftPanelMinWidth}px`
              }}
              role="complementary"
              aria-label="Navigation panel"
              data-testid="item-editor-view-left"
            >
              {/* Header with title and toggle button - only show if has title or is collapsible */}
              {(left.title || isLeftPanelCollapsible) && (
                <div className={`item-editor-view__left-header ${isLeftPanelCollapsed ? "collapsed" : ""}`}>
                  {isLeftPanelCollapsed && (
                    <>
                      {isLeftPanelCollapsible && (
                        <Button 
                          appearance="subtle" 
                          icon={<ChevronDoubleRight20Regular />}
                          onClick={handleToggleCollapse}
                          aria-label="Expand panel"
                          title="Expand panel"
                          className="item-editor-view__left-expand-button"
                        />
                      )}
                      {left.title && (
                        <Text weight="semibold" size={500} className="item-editor-view__left-title-vertical">{leftPanelTitle}</Text>
                      )}
                    </>
                  )}
                  {!isLeftPanelCollapsed && (
                    <>
                      {left.title && (
                        <Text weight="semibold" size={400} className="item-editor-view__left-title-horizontal">{leftPanelTitle}</Text>
                      )}
                      {isLeftPanelCollapsible && (
                        <Button 
                          appearance="subtle" 
                          icon={<ChevronDoubleLeft20Regular />}
                          onClick={handleToggleCollapse}
                          aria-label="Collapse panel"
                          title="Collapse panel"
                          className="item-editor-view__left-collapse-button"
                        />
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Content area - only show when not collapsed */}
              {!isLeftPanelCollapsed && (
                <div className="item-editor-view__left-content">
                  {left.content}
                </div>
              )}
            </aside>

            {/* Resize Handle (Only show when enableUserResize and not collapsed) */}
            {enableUserResize && !isLeftPanelCollapsed && (
              <div 
                className={`item-editor-view__resize-handle ${isResizing ? 'resizing' : ''}`}
                onMouseDown={handleResizeStart}
                data-testid="item-editor-view-resize-handle"
                title="Drag to resize panel"
              />
            )}
          </>
        )}

        {/* Center Content Area (Required) */}
        <main 
          className={`item-editor-view__center ${centerClassName}`.trim()}
          role="main"
          aria-label={centerAriaLabel}
          data-testid={left  ? "item-editor-view-center--with-left-panel" : "item-editor-view-center"}
        >
          {center.content}
        </main>
      </div>
    </div>
  );
}

/**
 * Hook to access view navigation functions from within ItemEditor view components
 * 
 * This hook is part of the ItemEditorDefaultView module as it's an integral part 
 * of the ItemEditor view system. It provides access to:
 * - setCurrentView: Function to navigate to a different view
 * - goBack: Function to navigate back to previous view (for detail views)
 * - viewHistory: Array of visited view names
 * 
 * @example
 * ```tsx
 * import { useViewNavigation } from '../../components/ItemEditor';
 * 
 * function MyViewWrapper() {
 *   const { setCurrentView, goBack } = useViewNavigation();
 * 
 *   return (
 *     <div>
 *       <button onClick={() => setCurrentView('detail')}>Show Detail</button>
 *       <button onClick={goBack}>Go Back</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns Navigation context with setCurrentView, goBack, and viewHistory
 * @throws Error if used outside of ItemEditor component
 */
export function useViewNavigation() {
  const context = React.useContext(ViewNavigationContext);
  
  if (!context) {
    throw new Error('useViewNavigation must be used within an ItemEditor component');
  }
  
  return context;
}

export default ItemEditorDefaultView;