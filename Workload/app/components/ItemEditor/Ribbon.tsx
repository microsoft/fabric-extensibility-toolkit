import React from "react";
import { Tab, TabList } from '@fluentui/react-tabs';
import { Button, Tooltip } from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { useTranslation } from "react-i18next";
import { ViewContext } from './ItemEditor';
import { RibbonToolbar, RibbonAction } from './RibbonToolbar';
import { RibbonActionButtonImpl, RibbonActionButton } from './RibbonActionButton';
import "./ItemEditor.scss"

/**
 * Definition for additional ribbon tabs beyond Home
 */
export interface RibbonTab {
  /**
   * Unique key for the tab
   */
  key: string;
  
  /**
   * Display label for the tab
   */
  label: string;
  
  /**
   * Actions for this tab
   */
  actions: RibbonAction[];
  
  /**
   * Optional test ID
   */
  testId?: string;
  
  /**
   * Optional disabled state
   */
  disabled?: boolean;
}

/**
 * Props for the Ribbon component
 * 
 * @see {@link ../../../docs/components/ItemEditor/Ribbon.md} - Complete Ribbon documentation
 * @see {@link ../../../docs/components/ItemEditor.md} - ItemEditor overview and integration patterns
 * @see {@link ./RibbonToolbar.tsx} - RibbonToolbar component for action groups
 */
export interface RibbonProps {

  /**
   * Home tab label
   * @default "Home"
   */
  homeToolbarLabel?: string;

  /**
   * Actions for the Home tab (always present)
   */
  homeToolbarActions: RibbonAction[];
  
  /**
   * Optional additional tabs with their actions
   */
  additionalToolbars?: RibbonTab[];
  
  /**
   * The default selected tab key
   * @default "home"
   */
  defaultSelectedTab?: string;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Optional view context for automatic back button handling
   * When provided and isDetailView is true, shows back button instead of tabs
   */
  viewContext?: ViewContext;

  /**
   * Optional action buttons to display on the right side of the ribbon
   * These buttons are always visible at the same height as the tabs
   */
  rightActionButtons?: RibbonActionButton[];

}

/**
 * Ribbon - Clean ribbon with mandatory Home tab and optional additional tabs
 * 
 * This component provides:
 * - Mandatory Home tab with actions
 * - Optional additional tabs with their own actions
 * - Automatic tab switching and action display
 * - Back button support for detail views
 * - Clean API without complex configuration
 * 
 * ## Simple Architecture
 * 
 * ```
 * Ribbon
 * ├── Home Tab (always present) → homeToolbarActions
 * ├── Data Tab (optional) → additionalToolbars[0].actions  
 * ├── Format Tab (optional) → additionalToolbars[1].actions
 * └── Back Button (detail view only)
 * ```
 * 
 * @example
 * ```tsx
 * // Simple: Just Home tab
 * <Ribbon 
 *   homeToolbarActions={[saveAction, settingsAction]}
 * />
 * 
 * // With additional tabs
 * <Ribbon 
 *   homeToolbarActions={[saveAction, settingsAction]}
 *   additionalToolbars={[
 *     {
 *       key: 'data',
 *       label: 'Data', 
 *       actions: [refreshAction, exportAction]
 *     },
 *     {
 *       key: 'format',
 *       label: 'Format',
 *       actions: [fontAction, colorAction]
 *     }
 *   ]}
 * />
 * ```
 */
export const Ribbon: React.FC<RibbonProps> = ({
  homeToolbarActions,
  additionalToolbars = [],
  defaultSelectedTab = 'home',
  className = '',
  viewContext,
  homeToolbarLabel,
  rightActionButtons = []
}) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = React.useState<string>(defaultSelectedTab);
  
  // Use translation for Home label if no custom label provided
  const resolvedHomeLabel = homeToolbarLabel || t("ItemEditor_Ribbon_Home_Label", "Home");
  
  // Build all available tabs
  const allTabs = React.useMemo(() => {
    const tabs = [
      {
        key: 'home',
        label: resolvedHomeLabel,
        actions: homeToolbarActions
      },
      ...additionalToolbars
    ];
    return tabs;
  }, [resolvedHomeLabel, homeToolbarActions, additionalToolbars]);
  
  // Get actions for currently selected tab (or detail view actions if in detail view)
  const currentActions = React.useMemo(() => {
    const isDetailView = viewContext?.isDetailView || false;
    const detailViewActions = viewContext?.detailViewActions || [];
    
    if (isDetailView && detailViewActions.length > 0) {
      return detailViewActions;
    }
    
    const activeTab = allTabs.find(tab => tab.key === selectedTab);
    return activeTab?.actions || homeToolbarActions;
  }, [selectedTab, allTabs, homeToolbarActions, viewContext?.isDetailView, viewContext?.detailViewActions]);
  
  // Determine if we should show back button
  const isDetailView = viewContext?.isDetailView || false;
  const showTabs = !isDetailView; // Always show tabs unless in detail view
  
  return (
    <div className={`ribbon-container ${className}`.trim()}>
      {/* Header section with tabs/back button and right action buttons */}
      <div className="ribbon-header">
        {/* Left side - Back Button for Detail Views or Tab Navigation */}
        <div className="ribbon-header__left">
          {isDetailView ? (
            <div className="ribbon-back-button-container">
              <Tooltip content="Back" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<ArrowLeft24Regular />}
                  onClick={viewContext?.goBack}
                  data-testid="ribbon-back-btn"
                  aria-label="Back"
                >
                  Back
                </Button>
              </Tooltip>
            </div>
          ) : (
            /* Tab Navigation */
            showTabs && (
              <div className="ribbon-tablist-container" role="none">
                <TabList 
                  selectedValue={selectedTab}
                  onTabSelect={(_, data) => setSelectedTab(data.value as string)}
                  className="ribbon-tablist"
                >
                  {allTabs.map((tab) => (
                    <div key={tab.key} className="ribbon-tab-item" role="none">
                      <div className="ribbon-tab-wrapper" role="none">
                        <Tab
                          value={tab.key}
                          data-testid={tab.testId || `ribbon-${tab.key}-tab-btn`}
                          disabled={tab.disabled}
                          className="ribbon-tab-button"
                        >
                          <span className="ribbon-tab-content">
                            <span className="ribbon-tab-label">
                              {tab.label}
                            </span>
                          </span>
                        </Tab>
                      </div>
                    </div>
                  ))}
                </TabList>
              </div>
            )
          )}
        </div>

        {/* Right side - Action Buttons */}
        {rightActionButtons.length > 0 && (
          <div className="ribbon-header__right ribbon-header__right-actions">
            {rightActionButtons.map((action) => (
              <RibbonActionButtonImpl
                key={action.key}
                action={action}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Tab Toolbar */}
      <div className="toolbarContainer">
        <RibbonToolbar actions={currentActions} />
      </div>
    </div>
  );
};