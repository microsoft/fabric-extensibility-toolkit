import React, { useEffect, useState } from "react";
import { Tab, TabList } from '@fluentui/react-tabs';
import { Toolbar } from '@fluentui/react-toolbar';
import {
  ToolbarButton, Tooltip
} from '@fluentui/react-components';
import {
  Save24Regular,
  Settings24Regular,
  Rocket24Regular
} from "@fluentui/react-icons";
import { PageProps } from '../../App';
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemWithDefinition, callGetItem, saveItemDefinition } from "../../controller/ItemCRUDController";

import { useTranslation } from "react-i18next";
import '../../styles.scss';
import { HelloWorldItemDefinition } from "./HelloWorldItemModel";

/**
 * View types enumeration for the HelloWorld item editor
 */
export const VIEW_TYPES = {
  EMPTY: 'empty',
  GETTING_STARTED: 'getting-started'
} as const;

export type CurrentView = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];

/**
 * Props interface for the HelloWorld Ribbon component
 */
export interface HelloWorldRibbonProps extends PageProps {
  /** The workload client API for Fabric platform interactions */
  workloadClient: WorkloadClientAPI;
  /** The current HelloWorld item being edited */
  item?: ItemWithDefinition<HelloWorldItemDefinition>;
  /** Current view state of the editor */
  currentView: CurrentView;
  /** Callback to navigate to getting started view */
  navigateToGettingStartedCallback: () => void;
}

/**
 * Toolbar component for the HelloWorld ribbon's home tab.
 * 
 * Provides the main actions available to users:
 * - Save: Persists the current item state to the Fabric platform
 * - Settings: Opens the item settings dialog
 * - Get Started: Navigates from empty to getting started view
 * 
 * Save button behavior:
 * - Disabled in empty view
 * - Enabled in getting started view when item needs saving
 * - Disabled after successful save until next change
 * 
 * @param props - HelloWorldRibbonProps containing item data and callbacks
 * @returns JSX.Element - The toolbar component
 */
const HelloWorldHomeTabToolbar: React.FC<HelloWorldRibbonProps> = (props) => {
  const { t } = useTranslation();
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);

  /**
   * Handles navigation from empty to getting started view
   */
  const handleGettingStartedClick = () => {
    props.navigateToGettingStartedCallback();
  };

  /**
   * Reset save state when view changes or item changes
   */
  useEffect(() => {
    setHasBeenSaved(false);
  }, [props.currentView, props.item?.id]);

  /**
   * Opens the Fabric platform settings dialog for the current item
   */
  const handleSettingsClick = async () => {
    try {
      const item_res = await callGetItem(props.workloadClient, props.item.id);
      const result = await callOpenSettings(props.workloadClient, item_res.item, 'About');
      console.log("Settings opened result:", result.value);
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  };

  /**
   * Saves the current item definition to the Fabric platform.
   * Sets the item state to 'getting-started' and shows a success notification
   */
  async function SaveItem() {
    var successResult = await saveItemDefinition<HelloWorldItemDefinition>(
      props.workloadClient,
      props.item.id,
      {
        state: VIEW_TYPES.GETTING_STARTED
      });
    const wasSaved = Boolean(successResult);
    setHasBeenSaved(wasSaved);
    callNotificationOpen(
      props.workloadClient,
      t("ItemEditor_Saved_Notification_Title"),
      t("ItemEditor_Saved_Notification_Text", { itemName: props.item.displayName }),
      undefined,
      undefined
    );
  }

  /**
   * Determines whether the save button should be enabled based on current state.
   * 
   * @returns {boolean} - True if save button should be enabled
   */
  const isSaveEnabled = () => {
    if (props.currentView === VIEW_TYPES.EMPTY) {
      return false;
    }

    if (props.currentView === VIEW_TYPES.GETTING_STARTED) {
      if (hasBeenSaved) {
        return false;
      }

      if (!props.item?.definition?.state) {
        return true;
      }

      return false;
    }

    return false;
  };

  return (
    <Toolbar>
      <Tooltip
        content={t("ItemEditor_Ribbon_Save_Label")}
        relationship="label">
        <ToolbarButton
          disabled={!isSaveEnabled()}
          aria-label={t("ItemEditor_Ribbon_Save_Label")}
          data-testid="item-editor-save-btn"
          icon={<Save24Regular />}
          onClick={SaveItem}
        />
      </Tooltip>

      <Tooltip
        content={t("ItemEditor_Ribbon_Settings_Label")}
        relationship="label">
        <ToolbarButton
          aria-label={t("ItemEditor_Ribbon_Settings_Label")}
          data-testid="item-editor-settings-btn"
          icon={<Settings24Regular />}
          onClick={handleSettingsClick}
        />
      </Tooltip>

      {props.currentView === 'empty' && (
        <Tooltip
          content={t("ItemEditor_Ribbon_GettingStarted_Label", "Getting Started")}
          relationship="label">
          <ToolbarButton
            aria-label={t("ItemEditor_Ribbon_GettingStarted_Label", "Getting Started")}
            data-testid="item-editor-getting-started-btn"
            icon={<Rocket24Regular />}
            onClick={handleGettingStartedClick}
          />
        </Tooltip>
      )}
    </Toolbar>
  );
};

/**
 * Main HelloWorld Ribbon component for Microsoft Fabric.
 * 
 * Provides the ribbon interface for HelloWorld items, including:
 * - Tab navigation (Home tab)
 * - Toolbar with context-appropriate actions
 * - Conditional rendering based on current editor view
 * 
 * The ribbon adapts its appearance and available actions based on the current
 * view state, providing users with relevant options for their current context.
 * 
 * @param props - HelloWorldRibbonProps containing item data and callbacks
 * @returns JSX.Element - The complete ribbon interface
 */
export function HelloWorldRibbon(props: HelloWorldRibbonProps) {
  const { t } = useTranslation();

  return (
    <div className="ribbon">
      {props.currentView === 'empty' && (
        <TabList defaultSelectedValue="home">
          <Tab value="home" data-testid="home-tab-btn">
            {t("ItemEditor_Ribbon_Home_Label")}
          </Tab>
        </TabList>
      )}

      <div className="toolbarContainer">
        <HelloWorldHomeTabToolbar {...props} />
      </div>
    </div>
  );
}