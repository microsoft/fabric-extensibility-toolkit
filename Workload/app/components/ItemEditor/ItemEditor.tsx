import React, { ReactNode } from "react";
import { ItemEditorLoadingView } from "./ItemEditorLoadingView";
import { RibbonAction } from './RibbonToolbar';
import "./ItemEditor.scss";

/**
 * Context for views to access navigation functions
 */
export const ViewNavigationContext = React.createContext<{
  setCurrentView: (view: string) => void;
  goBack: () => void;
  viewHistory: string[];
} | null>(null);

/**
 * Context for detail views to register their actions
 */
export const DetailViewActionsContext = React.createContext<{
  setDetailViewActions: (actions: RibbonAction[]) => void;
} | null>(null);

/**
 * Registered view definition
 */
export interface RegisteredView {
  /** Unique name/key for the view */
  name: string;
  /** The view component to render */
  component: ReactNode;
  /** Whether this is a detail view (L2 page) - affects ribbon behavior */
  isDetailView?: boolean;
}

/**
 * Registered notification definition
 */
export interface RegisteredNotification {
  /** Unique name/key for the notification */
  name: string;
  /** The notification component to render */
  component: ReactNode;
  /** Views where this notification should be shown (empty array = all views) */
  showInViews?: string[];
}

/**
 * View context information passed to ribbon
 */
export interface ViewContext {
  /** Current active view name (null when no view is set yet) */
  currentView: string | null;
  /** Function to navigate to a different view */
  setCurrentView: (view: string) => void;
  /** Whether the current view is a detail view */
  isDetailView: boolean;
  /** Function to navigate back to previous view (only available in detail views) */
  goBack: () => void;
  /** History of visited views */
  viewHistory: string[];
  /** Actions from current detail view (empty array if not detail view) */
  detailViewActions: RibbonAction[];
  /** Function to set detail view actions (called by ItemEditorDetailView) */
  setDetailViewActions: (actions: RibbonAction[]) => void;
}

/**
 * ItemEditor Props Interface
 * 
 * ItemEditor manages view state internally using static view registration.
 * Views are defined as a simple array and can navigate using the useViewNavigation() hook.
 * 
 * ## Detail View Support (Automatic Back Navigation)
 * When a view is marked as `isDetailView: true`, ItemEditor AUTOMATICALLY:
 * - Tracks view history for back navigation (no manual implementation needed)
 * - Provides `context.goBack()` function to ribbon (navigates to previous view)
 * - Signals ribbon with `context.isDetailView` flag (show back button instead of tabs)
 * - Maintains complete navigation history in `context.viewHistory`
 * 
 * **NO MANUAL IMPLEMENTATION REQUIRED** - Just mark views as detail views and use `context.goBack()`
 * 
 * ## Initial View Determination
 * Two patterns for setting the initial view:
 * 1. **Static**: Use `initialView` prop with predetermined view name
 * 2. **Dynamic**: Use `getInitialView` function called when loading completes
 * 
 * ## Scrolling Responsibility (IMPORTANT)
 * **ItemEditor center panel handles ALL scrolling behavior**
 * - Individual item views should NOT implement their own scrolling
 * - Content should grow naturally with `height: auto`
 * - ItemEditor automatically adds vertical scrolling when content exceeds available space
 * - This ensures consistent scrolling behavior across all items
 * 
 * ```tsx
 * // Pattern 1: Static initial view
 * <ItemEditor initialView="dashboard" views={views} />
 * 
 * // Pattern 2: Dynamic initial view (recommended for data-dependent logic)
 * <ItemEditor 
 *   getInitialView={() => item?.hasData ? 'dashboard' : 'onboarding'}
 *   views={views}
 * />
 * ```
 * 
 * @property {ReactNode | Function} ribbon - The ribbon component (receives ViewContext)
 * @property {RegisteredNotification[] | Function} messageBar - Static messageBar registration or function (DEPRECATED: prefer array)
 * @property {RegisteredView[]} views - Array of registered views with static definitions
 * @property {string | null | undefined} initialView - Name of the initial view to show (null/undefined = no view rendered until set)
 * @property {() => string | null | undefined} getInitialView - Function to determine initial view when loading completes (alternative to initialView)
 * @property {(view: string) => void} onViewChange - Optional callback when view changes
 * @property {string} className - Optional additional CSS class for the editor container
 * @property {string} contentClassName - Optional additional CSS class for the scrollable content area
 */
export interface ItemEditorPropsWithViews {
  /** The ribbon component - can be ReactNode or function receiving (ViewContext) */
  ribbon: ReactNode | ((context: ViewContext) => ReactNode);
  /** Static messageBar registration or function (DEPRECATED: prefer array) */
  messageBar?: RegisteredNotification[] | ((currentView: string) => ReactNode);
  /** Array of registered views with static definitions */
  views: RegisteredView[];
  /** Name of the initial view to show (null/undefined = don't render content until set) */
  initialView?: string | null | undefined;
  /** Function to determine initial view when loading completes (alternative to initialView) */
  getInitialView?: () => string | null | undefined;
  /** Callback to receive the view setter function for programmatic view changes */
  viewSetter?: (setCurrentView: (view: string) => void) => void;
  /** Optional callback when view changes */
  onViewChange?: (view: string) => void;
  /** Optional CSS class for the editor container */
  className?: string;
  /** Optional CSS class for the scrollable content area */
  contentClassName?: string;
  /** Whether to show loading indicator instead of content */
  isLoading?: boolean;
  /** Loading message to display */
  loadingMessage?: string;
}

/**
 * ItemEditor Props Interface
 */
export type ItemEditorProps = ItemEditorPropsWithViews;

/**
 * ItemEditor Component
 * 
 * A foundational editor control that provides a consistent layout for item editors:
 * - Fixed ribbon at the top (always visible)
 * - Scrollable content area that fills the remaining space
 * - Proper height management to fill the iframe
 * - Support for different view types (empty, default, detail pages)
 * 
 * ## View Registration
 * 
 * ItemEditor uses static view registration. Views are defined as a simple array and 
 * can navigate using the useViewNavigation() hook from within view components.
 * 
 * @see {@link ../../../docs/components/ItemEditor.md} - Complete documentation with examples and architecture
 * @see {@link ../../../docs/components/ItemEditor/README.md} - Main ItemEditor documentation
 * @see {@link ../../../docs/components/ItemEditor/Architecture.md} - System design and patterns
 * @see {@link ../../../docs/components/ItemEditor/QuickReference.md} - Quick reference guide
 * @see {@link ../../../docs/components/ItemEditor/ViewNavigationPatterns.md} - View navigation patterns
 * 
 * ## Architecture
 * 
 * ```
 * ┌─────────────────────────────────────┐
 * │  Ribbon (Fixed at top)              │
 * ├─────────────────────────────────────┤
 * │  MessageBar (Optional, Fixed)       │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │  Scrollable Content Area            │
 * │  - Empty View                       │
 * │  - Default View                     │
 * │  - Detail Pages                     │
 * │  - Custom Views                     │
 * │                                     │
 * │  (scrolls independently)            │
 * │                                     │
 * └─────────────────────────────────────┘
 * ```
 * 
 * ## Usage Example
 * 
 * ```tsx
 * import { ItemEditor, RegisteredView, useViewNavigation } from "../../components/ItemEditor";
 *
 * // View wrapper that uses navigation hook
 * const EmptyViewWrapper = () => {
 *   const { setCurrentView } = useViewNavigation();
 *   
 *   return (
 *     <EmptyView onStart={() => setCurrentView('main')} />
 *   );
 * };
 * 
 * const MainViewWrapper = () => {
 *   const { setCurrentView } = useViewNavigation();
 *   
 *   return (
 *     <MainView onShowDetail={(id) => setCurrentView(`detail-${id}`)} />
 *   );
 * };
 * 
 * const DetailViewWrapper = () => {
 *   const { goBack } = useViewNavigation();
 *   
 *   return (
 *     <DetailView recordId="123" onBack={goBack} />
 *   );
 * };
 * 
 * // Static view definitions
 * const views: RegisteredView[] = [
 *   { 
 *     name: 'empty', 
 *     component: <EmptyViewWrapper />
 *   },
 *   { 
 *     name: 'main', 
 *     component: <MainViewWrapper />
 *   },
 *   { 
 *     name: 'detail-123', 
 *     component: <DetailViewWrapper />,
 *     isDetailView: true  // ⭐ Enables automatic back navigation
 *   }
 * ];
 * 
 * <ItemEditor 
 *   // Ribbon receives ViewContext with AUTOMATIC back navigation support
 *   ribbon={(context: ViewContext) => (
 *     <MyRibbon 
 *       currentView={context.currentView}
 *       isDetailView={context.isDetailView}  // True when on detail view
 *       onViewChange={context.setCurrentView}
 *       onBack={context.goBack}  // ⭐ Automatically navigates to previous view
 *     />
 *   )}
 *   messageBar={[
 *     {
 *       name: 'info-message',
 *       showInViews: ['main'],
 *       component: <MessageBar intent="info">Info</MessageBar>
 *     }
 *   ]}
 *   views={views}
 *   initialView="empty"
 * />
 * ```
 * 
 * ### Detail Views (L2 Pages) - Automatic Back Navigation
 * Detail views are special drill-down pages with AUTOMATIC back navigation:
 * 
 * **What You Do:**
 * 1. Set `isDetailView: true` in RegisteredView
 * 2. Use `const { goBack } = useViewNavigation()` in view component
 * 3. Pass `context.goBack` to ribbon back button
 * 4. Ribbon shows back button when `context.isDetailView === true`
 * 
 * **What ItemEditor Does AUTOMATICALLY:**
 * - ✅ Tracks complete view history
 * - ✅ Provides `context.goBack()` function (no manual implementation)
 * - ✅ Navigates to previous view when goBack() is called
 * - ✅ Maintains navigation stack across multiple detail levels
 * 
 * ```tsx
 * {
 *   name: 'detail-record-123',
 *   component: <DetailViewWrapper />,
 *   isDetailView: true  // ⭐ This enables automatic back navigation!
 * }
 * 
 * // In your view component:
 * const DetailViewWrapper = () => {
 *   const { goBack } = useViewNavigation();
 *   
 *   return (
 *     <ItemEditorDetailView
 *       center={<RecordDetails recordId="123" />}
 *       onBack={goBack}  // ⭐ No manual logic - ItemEditor handles everything
 *       actions={[
 *         { id: 'save', label: 'Save', icon: <Save24Regular />, onClick: handleSave }
 *       ]}
 *     />
 *   );
 * };
 * 
 * // In your ribbon - just wire up the back button:
 * ribbon={(context) => (
 *   <Ribbon
 *     showBackButton={context.isDetailView}
 *     onBack={context.goBack}  // ⭐ Automatic back navigation
 *   />
 * )}
 * ```
 * 
 * ## Features
 * 
 * - **Fixed Ribbon**: Ribbon stays at the top during scrolling
 * - **Full Height**: Editor fills 100% of the iframe
 * - **Independent Scrolling**: Content scrolls while ribbon remains visible
 * - **Static View Registration**: Views defined as simple array like ribbon actions
 * - **Navigation Hook**: Easy view navigation with useViewNavigation() hook
 * - **Detail View Support**: Automatic history tracking and back navigation
 * - **View Context**: Ribbon receives full context including isDetailView flag
 * - **Consistent Layout**: Enforces Fabric design guidelines
 * 
 * @component
 */
export function ItemEditor(props: ItemEditorProps) {
  const { className = "", contentClassName = "", isLoading = false, loadingMessage } = props;

  // Internal state for view management - Initialize with the initial view directly
  const [currentView, setCurrentViewInternal] = React.useState<string | null>(props.initialView || null);
  // View history for back navigation in detail views - Initialize with initial view
  const [viewHistory, setViewHistory] = React.useState<string[]>(() => 
    props.initialView ? [props.initialView] : []
  );
  // Detail view actions from current view
  const [detailViewActions, setDetailViewActions] = React.useState<RibbonAction[]>([]);

  // Update view when initialView prop changes (but avoid setState during render)
  React.useEffect(() => {
    if (props.initialView && props.initialView !== currentView) {
      setCurrentViewInternal(props.initialView);
      setViewHistory([props.initialView]);
    }
  }, [props.initialView]); // Only depend on initialView, not currentView to avoid loops

  // Call getInitialView when loading completes (alternative to static initialView)
  React.useEffect(() => {
    if (!isLoading && props.getInitialView && !currentView) {
      const determinedView = props.getInitialView();
      if (determinedView) {
        setCurrentViewInternal(determinedView);
        setViewHistory([determinedView]);
      }
    }
  }, [isLoading, props.getInitialView, currentView]);

  // Wrapped setCurrentView that manages history and calls the optional callback
  const setCurrentView = React.useCallback((view: string) => {
    setViewHistory(prev => [...prev, view]);
    setCurrentViewInternal(view);
    // Clear detail view actions when changing views
    setDetailViewActions([]);
    props.onViewChange?.(view);
  }, [props]);

  // Go back to previous view (for detail views)
  const goBack = React.useCallback(() => {
    if (viewHistory.length > 1) {
      // Remove current view from history
      const newHistory = [...viewHistory];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      
      setViewHistory(newHistory);
      setCurrentViewInternal(previousView);
      // Clear detail view actions when going back
      setDetailViewActions([]);
      
      props.onViewChange?.(previousView);
    }
  }, [viewHistory, props]);

  // Callback for detail views to set their actions
  const handleSetDetailViewActions = React.useCallback((actions: RibbonAction[]) => {
    setDetailViewActions(actions);
  }, []);

  // Views are now always an array - no function pattern support
  const resolvedViews = React.useMemo((): RegisteredView[] => {
    return props.views;
  }, [props.views]);

  // Check if current view is a detail view
  const isDetailView = React.useMemo(() => {
    const view = resolvedViews.find((v: RegisteredView) => v.name === currentView);
    return view?.isDetailView === true;
  }, [resolvedViews, currentView]);

  // Build view context for ribbon
  const viewContext: ViewContext = React.useMemo(() => ({
    currentView,
    setCurrentView,
    isDetailView,
    goBack,
    viewHistory,
    detailViewActions,
    setDetailViewActions: handleSetDetailViewActions
  }), [currentView, setCurrentView, isDetailView, goBack, viewHistory, detailViewActions, handleSetDetailViewActions]);

  // Build navigation context for views
  const navigationContext = React.useMemo(() => ({
    setCurrentView,
    goBack,
    viewHistory
  }), [setCurrentView, goBack, viewHistory]);

  // Call viewSetter prop to provide the setCurrentView function to the parent
  React.useEffect(() => {
    if (props.viewSetter) {
      props.viewSetter(setCurrentView);
    }
  }, [props.viewSetter, setCurrentView]);

  // Resolve ribbon (either ReactNode or render function with ViewContext)
  const ribbonContent = React.useMemo(() => {
    const ribbon = props.ribbon;
    if (typeof ribbon === 'function') {
      return ribbon(viewContext);
    }
    return ribbon;
  }, [props, viewContext]);

  // Resolve notification (static registration or legacy function)
  const notificationContent = React.useMemo(() => {
    const notifications = props.messageBar;
    
    if (!notifications) {
      return null;
    }
    
    // Legacy function pattern support
    if (typeof notifications === 'function') {
      return notifications(currentView);
    }
    
    // Static notification registration (preferred)
    if (Array.isArray(notifications)) {
      // Find notifications that should show in current view
      const activeNotifications = notifications.filter(notification => {
        // If showInViews is not specified, show in all views
        if (!notification.showInViews || notification.showInViews.length === 0) {
          return true;
        }
        // Check if current view is in the showInViews array
        return notification.showInViews.includes(currentView);
      });
      
      // Return the first active notification (can be enhanced to support multiple)
      return activeNotifications.length > 0 ? activeNotifications[0].component : null;
    }
    
    return null;
  }, [props.messageBar, currentView]);

  // Determine content from view registration
  const content = React.useMemo(() => {
    // Show loading indicator if isLoading is true
    if (isLoading) {
      return <ItemEditorLoadingView message={loadingMessage || "Loading..."} />;
    }
    
    // Don't render any view if currentView is null/undefined (prevents flash of wrong view)
    if (!currentView) {
      return null;
    }
    
    // View Registration Mode
    const activeView = resolvedViews.find((v: RegisteredView) => v.name === currentView);
    return activeView?.component || null;
  }, [resolvedViews, currentView, isLoading, loadingMessage]);

  return (
    <div className={`item-editor-container ${className}`.trim()} data-testid="item-editor">
      {/* Fixed ribbon at the top */}
      <div className="item-editor-container__ribbon" data-testid="item-editor-ribbon">
        {ribbonContent}
      </div>
      
      {/* Optional notification area (fixed, not scrolled) */}
      {notificationContent && (
        <div className="item-editor-container__notification" data-testid="item-editor-notification">
          {notificationContent}
        </div>
      )}
      
      {/* Scrollable content area */}
      <div className={`item-editor-container__content ${contentClassName}`.trim()} data-testid="item-editor-content">
        <ViewNavigationContext.Provider value={navigationContext}>
          <DetailViewActionsContext.Provider value={{ setDetailViewActions: handleSetDetailViewActions }}>
            {content}
          </DetailViewActionsContext.Provider>
        </ViewNavigationContext.Provider>
      </div>
    </div>
  );
}