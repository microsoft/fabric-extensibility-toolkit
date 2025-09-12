import React from "react";
import { Tab, TabList } from '@fluentui/react-tabs';
import { Toolbar } from '@fluentui/react-toolbar';
import {
  ToolbarButton, Tooltip
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Edit24Regular
} from "@fluentui/react-icons";
import { CurrentView, VIEW_TYPES } from "./ExcelEmbedItemModel";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { ExcelEmbedItemDefinition } from "./ExcelEmbedItemModel";
import '../../styles.scss';

/**
 * Props interface for the Excel Embed Item Ribbon component
 */
export interface ExcelEmbedItemRibbonProps {
  item: ItemWithDefinition<ExcelEmbedItemDefinition>;
  currentView: CurrentView;
  hasBeenSaved: boolean;
  onSave: (definition: ExcelEmbedItemDefinition) => Promise<void>;
  onOpenSettings: () => Promise<void>;
}

const ExcelEmbedItemTabToolbar: React.FC<ExcelEmbedItemRibbonProps> = (props) => {
  const handleSettingsClick = async () => {
    await props.onOpenSettings();
  };

  return (
    <Toolbar>
      {/* Settings Button */}
      <Tooltip
        content="Settings"
        relationship="label">
        <ToolbarButton
          aria-label="Settings"
          data-testid="item-editor-settings-btn"
          icon={<Settings24Regular />}
          onClick={handleSettingsClick} 
        />
      </Tooltip>

      {/* Edit Button - Show when configured */}
      {props.currentView === VIEW_TYPES.CONFIGURED && (
        <Tooltip
          content="Edit Excel Embed"
          relationship="label">
          <ToolbarButton
            aria-label="Edit Excel Embed"
            data-testid="excel-embed-edit-btn"
            icon={<Edit24Regular />}
            onClick={() => {/* Edit is handled in the component itself */}}
          />
        </Tooltip>
      )}
    </Toolbar>
  );
};

/**
 * Main Ribbon component for Excel Embed Item
 */
export function ExcelEmbedItemRibbon(props: ExcelEmbedItemRibbonProps) {
  return (
    <div className="ribbon">
      <TabList defaultSelectedValue="home">
        <Tab value="home" data-testid="home-tab-btn">
          Home
        </Tab>
      </TabList>

      {/* Toolbar Container */}
      <div className="toolbarContainer">
        <ExcelEmbedItemTabToolbar {...props} />
      </div>
    </div>
  );
}