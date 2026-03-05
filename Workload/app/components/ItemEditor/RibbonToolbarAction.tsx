import React from "react";
import { ToolbarButton, Tooltip } from '@fluentui/react-components';

/**
 * Type for Fluent UI icon components
 */
export type FluentIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * Props for the RibbonToolbarAction component
 */
export interface RibbonToolbarActionProps {
  /**
   * The icon to display in the button
   */
  icon: FluentIconComponent;
  
  /**
   * The label/tooltip text for the button (optional - can be handled at display level)
   */
  label?: string;
  
  /**
   * Optional tooltip text (defaults to label)
   */
  tooltip?: string;
  
  /**
   * Click handler for the button
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
   * Optional appearance variant
   */
  appearance?: 'primary' | 'subtle' | 'transparent';
  
  /**
   * Optional custom aria-label (defaults to label)
   */
  ariaLabel?: string;
}

/**
 * RibbonToolbarAction - Standardized ribbon toolbar action component following Fabric guidelines
 * 
 * This component provides:
 * - Consistent Tooltip + ToolbarButton pattern (mandatory for accessibility)
 * - Comprehensive tooltip support with fallback to label
 * - Proper icon sizing (24px Regular icons)
 * - Accessibility attributes
 * - Standardized styling with 'subtle' appearance (neutral colors, not brand colors)
 * - Error handling for async operations
 * 
 * ## Tooltip Behavior
 * - **Primary**: Uses `tooltip` prop if provided
 * - **Fallback**: Falls back to `label` if no tooltip specified
 * - **Accessibility**: Proper relationship between tooltip and button
 * 
 * Fabric UX Guideline: Toolbar buttons should use 'subtle' appearance for neutral styling.
 * Never use 'primary' appearance in toolbars - that's reserved for dialog CTAs.
 * 
 * @example
 * ```tsx
 * // With explicit tooltip
 * <RibbonToolbarAction
 *   icon={Save24Regular}
 *   label="Save"
 *   tooltip="Save your current changes"
 *   onClick={handleSave}
 *   disabled={!hasChanges}
 *   testId="save-btn"
 * />
 * 
 * // Tooltip defaults to label
 * <RibbonToolbarAction
 *   icon={Settings24Regular}
 *   label="Settings"
 *   onClick={handleSettings}
 * />
 * ```
 */
export const RibbonToolbarAction: React.FC<RibbonToolbarActionProps> = ({
  icon,
  label,
  tooltip,
  onClick,
  disabled = false,
  testId,
  appearance = 'subtle',
  ariaLabel
}) => {
  const IconComponent = icon;
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await onClick();
    } catch (error) {
      console.error(`Error in RibbonToolbarAction onClick handler for ${label || 'unlabeled action'}:`, error);
    }
  };

  // Use tooltip, then label, then fallback for display
  const displayTooltip = tooltip || label || 'Action';
  const displayAriaLabel = ariaLabel || label || 'Action';
  
  return (
    <Tooltip
      content={displayTooltip}
      relationship="label"
    >
      <ToolbarButton
        aria-label={displayAriaLabel}
        appearance={appearance}
        disabled={disabled}
        data-testid={testId}
        icon={<IconComponent />}
        onClick={handleClick}
      />
    </Tooltip>
  );
};