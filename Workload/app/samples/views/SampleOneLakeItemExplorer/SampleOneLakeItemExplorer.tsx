import React, { useEffect, useState } from "react";
import { Stack } from "@fluentui/react";
import {
  Button,
} from "@fluentui/react-components";
import { ChevronDoubleLeft20Regular, ChevronDoubleRight20Regular } from "@fluentui/react-icons";
import "./SampleOneLakeItemExplorer.scss";
import { PageProps } from "../../../App";
import { Item } from "../../../clients/FabricPlatformTypes";
import { ItemReference } from "../../../controller/ItemCRUDController";
import { 
  OneLakeView
} from "../../../components/OneLakeView";

// Re-export the types from the control for backwards compatibility  
export interface OneLakeItemExplorerItem extends ItemReference {
  displayName: string;
}

export interface OneLakeItemExplorerComponentProps extends PageProps {
  onFileSelected(fileName: string, oneLakeLink: string): Promise<void>;
  onTableSelected(tableName: string, oneLakeLink: string): Promise<void>;
  onItemChanged(item: Item): Promise<void>,
  config: {
    mode?: "view" | "edit";
    // Configuration options for the component
    initialItem?: OneLakeItemExplorerItem;
    allowedItemTypes?: string[];
    allowItemSelection: boolean;
    refreshTrigger?: number; // Timestamp to trigger refresh
  };
}

/**
 * OneLakeItemExplorerComponent - Sample implementation with header and collapse functionality
 * 
 * This component demonstrates how to use the OneLakeItemExplorer control with additional UI features:
 * - Collapsible header with title and toggle button
 * - Empty state with item selection
 * - Wrapper styling and layout
 * 
 * The core tree functionality is provided by the OneLakeItemExplorer control.
 */
export function OneLakeItemExplorerComponent(props: OneLakeItemExplorerComponentProps) {
  const [selectedItem, setSelectedItem] = useState<OneLakeItemExplorerItem>(null);
  const [isExplorerVisible, setIsExplorerVisible] = useState<boolean>(true);

  // Initialize selectedItem from props.config.initialItem
  useEffect(() => {
    if (props.config.initialItem && 
        props.config.initialItem.id && 
        props.config.initialItem.workspaceId) {
        setSelectedItem(props.config.initialItem);
    }
  }, [props.config.initialItem]);

  function toggleExplorer() {
    setIsExplorerVisible(!isExplorerVisible);
  }

  function updateExplorerItem(item: Item){
    // Validate the item has required properties
    if (item && item.id && item.workspaceId) {
      setSelectedItem(item);
      // Call the callback to notify parent of item change
      if (props.onItemChanged) {
        props.onItemChanged(item);
      }
    } else {
      console.error("SampleOneLakeItemExplorer: Cannot update explorer with invalid item:", item);
    }
  }

  // Handle callbacks from the OneLakeItemExplorer control
  const handleFileSelected = async (fileName: string, oneLakeLink: string) => {
    if (props.onFileSelected) {
      await props.onFileSelected(fileName, oneLakeLink);
    }
  };

  const handleTableSelected = async (tableName: string, oneLakeLink: string) => {
    if (props.onTableSelected) {
      await props.onTableSelected(tableName, oneLakeLink);
    }
  };

  const handleItemChanged = async (item: Item) => {
    updateExplorerItem(item);
  };

  return (
    <>
      <Stack className={`explorer ${isExplorerVisible ? "" : "hidden-explorer"}`} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className={`top ${isExplorerVisible ? "" : "vertical-text"}`}>
          {!isExplorerVisible && (
            <Button onClick={toggleExplorer} appearance="subtle" icon={<ChevronDoubleRight20Regular />}></Button>
          )}
          <h1>OneLake Item Explorer</h1>
          {isExplorerVisible && (
            <Button onClick={toggleExplorer} appearance="subtle" icon={<ChevronDoubleLeft20Regular />}></Button>
          )}
        </div>
        
        {isExplorerVisible && (
          <div className="selector-body" style={{ flex: 1, overflow: "hidden" }}>
            <OneLakeView
              workloadClient={props.workloadClient}
              config={{
                mode: props.config.mode,
                initialItem: selectedItem,
                allowedItemTypes: props.config.allowedItemTypes,
                allowItemSelection: props.config.allowItemSelection,
                refreshTrigger: props.config.refreshTrigger
              }}
              callbacks={{
                onFileSelected: handleFileSelected,
                onTableSelected: handleTableSelected,
                onItemChanged: handleItemChanged
              }}
            />
          </div>
        )}
      </Stack>
    </>
  );
}
