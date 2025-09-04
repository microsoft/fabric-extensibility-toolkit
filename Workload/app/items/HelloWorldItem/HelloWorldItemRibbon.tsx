import React from "react";
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
import { CurrentView, VIEW_TYPES } from "./HelloWorldItemModel";
import { useTranslation } from "react-i18next";
import '../../styles.scss';

/**
 * Props interface for the Empty State Ribbon component
 */
export interface HelloWorldItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  currentView: CurrentView;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  navigateToGettingStartedCallback: () => void;
}


const HelloWorldItemTabToolbar: React.FC<HelloWorldItemRibbonProps> = (props) => {
  const { t } = useTranslation();


  const handleSettingsClick = async () => {
    await props.openSettingsCallback();
  };

  const handleGettingStartedClick = () => {
    props.navigateToGettingStartedCallback();
  };

  async function onSaveAsClicked() {
    await props.saveItemCallback();
    return;
  }

  return (
    <Toolbar>
      {/* Save Button - Disabled */}
      <Tooltip
        content={t("ItemEditor_Ribbon_Save_Label")}
        relationship="label">
        <ToolbarButton
          disabled={!props.isSaveButtonEnabled}
          aria-label={t("ItemEditor_Ribbon_Save_Label")}
          data-testid="item-editor-save-btn"
          icon={<Save24Regular />}
          onClick={onSaveAsClicked}
        />
      </Tooltip>

      {/* Settings Button */}
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

      {/* Getting Started Button */}
      {props.currentView === VIEW_TYPES.EMPTY && (
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
 * Main Ribbon component
 */
export function HelloWorldItemRibbon(props: HelloWorldItemRibbonProps) {
  const { t } = useTranslation();

  return (
    <div className="ribbon">
      {props.currentView === VIEW_TYPES.EMPTY && (
      <TabList defaultSelectedValue="home">
        <Tab value="home" data-testid="home-tab-btn">
          {t("ItemEditor_Ribbon_Home_Label")}
        </Tab>
      </TabList>
      )}

      {/* Toolbar Container */}
      <div className="toolbarContainer">
        <HelloWorldItemTabToolbar {...props} />
      </div>
    </div>
  );
}