import React from "react";
import { Toolbar, ToolbarDivider } from '@fluentui/react-toolbar';
import { RibbonToolbarAction, FluentIconComponent } from './RibbonToolbarAction';
import { DropdownMenuItem, RibbonActionButtonImpl } from './RibbonActionButton';

/**
 * Configuration for a dropdown menu item (re-exported for convenience)
 */
export type { DropdownMenuItem } from './RibbonActionButton';

/**
 * Configuration for a ribbon action button
 * 
 * @see {@link ../../../docs/components/ItemEditor/RibbonToolbar.md} - Complete RibbonToolbar documentation
 * @see {@link ../../../docs/components/ItemEditor/Ribbon.md} - Ribbon integration patterns
 * @see {@link ./RibbonActionButton.tsx} - Individual action button component
 */
export interface RibbonAction {
  /**
   * Unique identifier for the action
   */
  key: string;
  
  /**
   * The icon to display in the button (optional for dropdowns)
   */
  icon?: FluentIconComponent;
  
  /**
   * The label/tooltip text for the button (optional - can be handled at display level)
   */
  label?: string;
  
  /**
   * Click handler for the action
   */
  onClick: () => void | Promise<void>;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Optional test ID for the button
   */
  testId?: string;
  
  /**
   * Optional tooltip text for the button (defaults to label)
   */
  tooltip?: string;
  
  /**
   * Optional appearance variant
   */
  appearance?: 'primary' | 'subtle' | 'transparent';
  
  /**
   * Optional custom aria-label (defaults to label)
   */
  ariaLabel?: string;
  
  /**
   * Whether to show a divider after this action
   */
  showDividerAfter?: boolean;
  
  /**
   * Whether this action should be hidden
   */
  hidden?: boolean;
}

/**
 * Configuration for a ribbon dropdown action button
 * Extends RibbonAction with dropdown-specific properties
 */
export interface RibbonDropdownAction extends RibbonAction {
  /**
   * Dropdown menu items to display
   */
  dropdownItems: DropdownMenuItem[];
}

/**
 * Union type for all possible ribbon actions
 */
export type RibbonActionType = RibbonAction | RibbonDropdownAction;

/**
 * Type guard to check if an action is a dropdown action
 */
export const isDropdownAction = (action: RibbonActionType): action is RibbonDropdownAction => {
  return 'dropdownItems' in action;
};

/**
 * Props for the RibbonToolbar component
 */
export interface RibbonToolbarProps {
  /**
   * Array of actions to display in the toolbar
   * Can include both regular actions and dropdown actions
   */
  actions: RibbonActionType[];
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * RibbonToolbar - Reusable toolbar component for ribbons
 * 
 * This component provides:
 * - Consistent action rendering with full tooltip support
 * - Support for dividers between action groups
 * - Conditional action visibility
 * - Proper spacing and alignment
 * - Integration with RibbonAction and RibbonDropdownAction interfaces
 * - Automatic dropdown detection and rendering
 * 
 * ## Action Configuration
 * 
 * Actions support comprehensive configuration:
 * - **Regular Actions**: Standard button actions with icon, label, and click handler
 * - **Dropdown Actions**: Buttons with dropdown menus using RibbonDropdownAction interface
 * - **Tooltip Support**: Both `tooltip` and `label` properties
 * - **Appearance**: 'primary', 'subtle', 'transparent'
 * - **Accessibility**: Automatic aria-label and tooltip mapping
 * - **Dividers**: Optional separators between action groups
 * - **Visibility**: Hide/show actions conditionally
 * 
 * @example
 * ```tsx
 * const actions: RibbonActionType[] = [
 *   // Regular action
 *   {
 *     key: 'save',
 *     label: 'Save',
 *     icon: Save24Regular,
 *     tooltip: 'Save your current changes',
 *     onClick: handleSave,
 *     disabled: !hasChanges,
 *     appearance: 'primary'
 *   },
 *   // Dropdown action
 *   {
 *     key: 'export',
 *     label: 'Export',
 *     icon: Share24Regular,
 *     tooltip: 'Export your data',
 *     onClick: () => {}, // Not used for dropdown
 *     dropdownItems: [
 *       { key: 'pdf', label: 'Export as PDF', onClick: handleExportPdf },
 *       { key: 'excel', label: 'Export as Excel', onClick: handleExportExcel }
 *     ],
 *     showDividerAfter: true
 *   }
 * ];
 * 
 * <RibbonToolbar actions={actions} />
 * ```
 */
export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  actions,
  className = ''
}) => {
  // Filter out hidden actions
  const visibleActions = actions.filter(action => !action.hidden);
  
  return (
    <Toolbar className={className}>
      {visibleActions.map((action, index) => (
        <React.Fragment key={action.key}>
          {isDropdownAction(action) ? (
            // Render dropdown action using RibbonActionButton
            <RibbonActionButtonImpl
              action={{
                key: action.key,
                icon: action.icon,
                label: action.label || '',
                onClick: action.onClick,
                disabled: action.disabled,
                testId: action.testId,
                tooltip: action.tooltip,
                appearance: action.appearance,
                ariaLabel: action.ariaLabel,
                dropdownItems: action.dropdownItems
              }}
            />
          ) : (
            // Render regular action using RibbonToolbarAction
            <RibbonToolbarAction
              icon={action.icon}
              label={action.label}
              tooltip={action.tooltip}
              onClick={action.onClick}
              disabled={action.disabled}
              testId={action.testId}
              appearance={action.appearance}
              ariaLabel={action.ariaLabel}
            />
          )}
          
          {/* Show divider if specified and not the last item */}
          {action.showDividerAfter && index < visibleActions.length - 1 && (
            <ToolbarDivider />
          )}
        </React.Fragment>
      ))}
    </Toolbar>
  );
};