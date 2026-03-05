import {
  Save24Regular,
  Settings24Regular,
  Info24Regular,
  Share24Regular
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { RibbonAction, RibbonDropdownAction, DropdownMenuItem } from './RibbonToolbar';

// Re-export types for convenience
export type { RibbonAction, RibbonDropdownAction, DropdownMenuItem, RibbonActionType } from './RibbonToolbar';

/**
 * Standard ribbon action configurations following Fabric guidelines
 * 
 * These factory functions provide consistent action configurations that can be
 * reused across different item editors while maintaining the same look and feel.
 * 
 * Core Standard Actions:
 * - Save: Universal save action for persisting changes
 * - Settings: Common configuration/settings panel access
 * - About: Information and help action
 * - Export (Dropdown): Common export options with dropdown menu
 * 
 * Note: Other actions (Undo, Redo, Delete, Share, Print, Download, Upload, Add, Edit, Close)
 * should be implemented as custom actions specific to each item editor's needs.
 * See HelloWorldItemRibbon.tsx for examples of creating custom actions.
 * 
 * Translation: All actions use default translation keys with fallbacks for internationalization.
 * 
 * @example Basic Usage with Dropdown
 * ```tsx
 * import { createSaveAction, createExportDropdownAction, RibbonActionType } from './RibbonStandardActions';
 * 
 * const homeToolbarActions: RibbonActionType[] = [
 *   createSaveAction(handleSave, !hasChanges),
 *   createExportDropdownAction([
 *     { key: 'pdf', label: 'Export as PDF', onClick: () => exportToPdf() },
 *     { key: 'excel', label: 'Export to Excel', onClick: () => exportToExcel() },
 *     { key: 'csv', label: 'Export as CSV', onClick: () => exportToCsv() }
 *   ])
 * ];
 * ```
 */

/**
 * Creates a standard Save action with automatic translation
 * @param onClick - Save handler
 * @param disabled - Whether the save button should be disabled
 * @param label - Custom label (if not provided, will use translation key "ItemEditor_Ribbon_Save_Label")
 */
export const createSaveAction = (
  onClick: () => void | Promise<void>,
  disabled: boolean = false,
  label?: string
): RibbonAction => {
  const { t } = useTranslation();
  
  return {
    key: 'save',
    icon: Save24Regular,
    label: label || t("ItemEditor_Ribbon_Save_Label", "Save"),
    onClick,
    disabled,
    testId: 'ribbon-save-btn',
  };
};

/**
 * Creates a standard Settings action with automatic translation
 * @param onClick - Settings handler
 * @param label - Custom label (if not provided, will use translation key "ItemEditor_Ribbon_Settings_Label")
 * @param disabled - Whether the settings button should be disabled
 * @param showDividerAfter - Whether to show a divider after this action (defaults to true)
 */
export const createSettingsAction = (
  onClick: () => void | Promise<void>,
  label?: string,
  disabled: boolean = false,
  showDividerAfter: boolean = true
): RibbonAction => {
  const { t } = useTranslation();
  
  return {
    key: 'settings',
    icon: Settings24Regular,
    label: label || t("ItemEditor_Ribbon_Settings_Label", "Settings"),
    onClick,
    disabled,
    testId: 'ribbon-settings-btn',
    showDividerAfter
  };
};

/**
 * Creates a standard About/Info action with automatic translation
 * @param onClick - About handler
 * @param label - Custom label (if not provided, will use translation key "ItemEditor_Ribbon_About_Label")
 * @param disabled - Whether the about button should be disabled
 */
export const createAboutAction = (
  onClick: () => void | Promise<void>,
  label?: string,
  disabled: boolean = false
): RibbonAction => {
  const { t } = useTranslation();
  
  return {
    key: 'about',
    icon: Info24Regular,
    label: label || t("ItemEditor_Ribbon_About_Label", "About"),
    onClick,
    disabled,
    testId: 'ribbon-about-btn'
  };
};

/**
 * Creates a standard Export dropdown action with automatic translation
 * @param exportItems - Array of export options for the dropdown menu
 * @param label - Custom label (if not provided, will use translation key "ItemEditor_Ribbon_Export_Label")
 * @param disabled - Whether the export button should be disabled
 * @param showDividerAfter - Whether to show a divider after this action
 */
export const createExportDropdownAction = (
  exportItems: DropdownMenuItem[],
  label?: string,
  disabled: boolean = false,
  showDividerAfter: boolean = false
): RibbonDropdownAction => {
  const { t } = useTranslation();
  
  return {
    key: 'export',
    icon: Share24Regular,
    label: label || t("ItemEditor_Ribbon_Export_Label", "Export"),
    onClick: () => {}, // Not used for dropdown actions
    disabled,
    testId: 'ribbon-export-btn',
    showDividerAfter,
    dropdownItems: exportItems
  };
};