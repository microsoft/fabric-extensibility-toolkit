import React from "react";
import { Button, Tooltip, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components';
import { ChevronDown24Regular } from '@fluentui/react-icons';
import { FluentIconComponent } from './RibbonToolbarAction';

/**
 * Configuration for a dropdown menu item
 */
export interface DropdownMenuItem {
  /**
   * Unique identifier for the menu item
   */
  key: string;
  
  /**
   * The label text for the menu item
   */
  label: string;
  
  /**
   * Optional icon for the menu item
   */
  icon?: FluentIconComponent;
  
  /**
   * Click handler for the menu item
   */
  onClick: () => void | Promise<void>;
  
  /**
   * Whether the menu item is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether this menu item should be hidden
   */
  hidden?: boolean;
}

/**
 * Configuration for a ribbon action button (enhanced for real button appearance)
 */
export interface RibbonActionButton {
  /**
   * Unique identifier for the action
   */
  key: string;
  
  /**
   * The icon to display in the button (optional for dropdowns)
   */
  icon?: FluentIconComponent;
  
  /**
   * The label/text to display in the button
   */
  label: string;
  
  /**
   * Click handler for the action (only for regular buttons)
   */
  onClick?: () => void | Promise<void>;
  
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
  appearance?: 'primary' | 'secondary' | 'subtle' | 'transparent';
  
  /**
   * Optional custom aria-label (defaults to label)
   */
  ariaLabel?: string;
  
  /**
   * Whether this action should be hidden
   */
  hidden?: boolean;
  
  /**
   * Dropdown menu items (if this is a dropdown button)
   */
  dropdownItems?: DropdownMenuItem[];
}

/**
 * Props for the RibbonActionButtonImpl component
 */
export interface RibbonActionButtonImplProps {
  /**
   * Action configuration
   */
  action: RibbonActionButton;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * RibbonActionButtonImpl - Real button component for ribbon action buttons
 * 
 * This component provides:
 * - Real button appearance with icon and text
 * - Support for dropdown menus
 * - Proper tooltips and accessibility
 * - Primary/secondary styling variants
 * 
 * ## Features
 * 
 * - **Regular Button**: Shows icon + text, handles onClick
 * - **Dropdown Button**: Shows icon + text + chevron, opens menu
 * - **Tooltip Support**: Hover tooltips for additional context
 * - **Accessibility**: Proper ARIA labels and keyboard support
 * 
 * @example
 * ```tsx
 * // Regular button
 * const action: RibbonActionButton = {
 *   key: 'share',
 *   icon: Share24Regular,
 *   label: 'Share',
 *   onClick: handleShare,
 *   tooltip: 'Share this item'
 * };
 * 
 * // Dropdown button
 * const dropdownAction: RibbonActionButton = {
 *   key: 'trial',
 *   icon: Info24Regular,
 *   label: 'Trial',
 *   dropdownItems: [
 *     { key: 'start', label: 'Start Trial', onClick: startTrial },
 *     { key: 'upgrade', label: 'Upgrade', onClick: upgrade }
 *   ]
 * };
 * 
 * <RibbonActionButtonImpl action={action} />
 * <RibbonActionButtonImpl action={dropdownAction} />
 * ```
 * 
 * @see {@link ../../../docs/components/ItemEditor/RibbonToolbar.md} - RibbonToolbar integration documentation
 * @see {@link ../../../docs/components/ItemEditor.md} - ItemEditor overview and patterns
 * @see {@link https://react.fluentui.dev/} - Fluent UI v9 Documentation
 */
export const RibbonActionButtonImpl: React.FC<RibbonActionButtonImplProps> = ({
  action,
  className = ''
}) => {
  const {
    icon: Icon,
    label,
    onClick,
    disabled = false,
    testId,
    tooltip,
    appearance = 'secondary',
    ariaLabel,
    dropdownItems = []
  } = action;
  
  // Filter visible dropdown items
  const visibleDropdownItems = dropdownItems.filter((item: DropdownMenuItem) => !item.hidden);
  const isDropdown = visibleDropdownItems.length > 0;
  
  // Determine tooltip text
  const tooltipText = tooltip || label;
  
  // Determine aria-label
  const buttonAriaLabel = ariaLabel || label;
  
  // Handle regular button click
  const handleClick = React.useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);
  
  // Handle menu item click
  const handleMenuItemClick = React.useCallback((itemOnClick: () => void | Promise<void>) => {
    return () => {
      if (!disabled) {
        itemOnClick();
      }
    };
  }, [disabled]);
  
  // Render regular button
  if (!isDropdown) {
    return (
      <Tooltip content={tooltipText} relationship="label">
        <Button
          className={`ribbon-action-button ${className}`.trim()}
          appearance={appearance}
          disabled={disabled}
          onClick={handleClick}
          data-testid={testId}
          data-appearance={appearance}
          aria-label={buttonAriaLabel}
          icon={Icon ? <Icon /> : undefined}
        >
          {label}
        </Button>
      </Tooltip>
    );
  }
  
  // Render dropdown button
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content={tooltipText} relationship="label">
          <Button
            className={`ribbon-action-button ribbon-action-button--dropdown ${className}`.trim()}
            appearance={appearance}
            disabled={disabled}
            data-testid={testId}
            data-appearance={appearance}
            aria-label={buttonAriaLabel}
            icon={Icon ? <Icon /> : undefined}
            iconPosition="before"
          >
            {label}
            <ChevronDown24Regular className="ribbon-action-button__dropdown-icon" />
          </Button>
        </Tooltip>
      </MenuTrigger>
      
      <MenuPopover>
        <MenuList>
          {visibleDropdownItems.map((item: DropdownMenuItem) => (
            <MenuItem
              key={item.key}
              disabled={item.disabled}
              onClick={handleMenuItemClick(item.onClick)}
              icon={item.icon ? <item.icon /> : undefined}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};