import React, { useEffect, useState } from "react";
import { Stack } from "@fluentui/react";
import {
  Button,
  Image,
  Tree,
  TreeItem,
  TreeItemLayout,
  Spinner,
  Subtitle2,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import { ChevronDoubleLeft20Regular, ChevronDoubleRight20Regular, FolderAdd20Regular, Link20Regular } from "@fluentui/react-icons";
import { TableMetadata, FileMetadata } from "./SampleOneLakeItemExplorerModel";
import "../../../styles.scss";
import { getTables, getFiles } from "./SampleOneLakeItemExplorerController";
import { PageProps } from "../../../App";
import { Item } from "../../../clients/FabricPlatformTypes";
import { TableTreeWithSchema } from "./TableTreeWithSchema";
import { TableTreeWithoutSchema } from "./TableTreeWithoutSchema";
import { FileTree } from "./FileTree";
import { callDatahubOpen, callDatahubWizardOpen } from "../../../controller/DataHubController";
import { ItemReference } from "../../../controller/ItemCRUDController";
import { OneLakeShortcutClient } from "../../../clients/OneLakeShortcutClient";
import { NotificationType } from "@ms-fabric/workload-client";
import { OneLakeStorageClient } from "../../../clients/OneLakeStorageClient";
import { callNotificationOpen } from "../../../controller/NotificationController";
import { callDialogOpenMsgBox } from "../../../controller/DialogController";

export interface OneLakeItemExplorerItem extends ItemReference {
  displayName: string;
}

export interface OneLakeItemExplorerComponentProps extends PageProps {
  onFileSelected(fileName: string, oneLakeLink: string): Promise<void>;
  onTableSelected(tableName: string, oneLakeLink: string): Promise<void>;
  onItemChanged(item: Item): Promise<void>,
  config: {
    // Configuration options for the component
    initialItem?: OneLakeItemExplorerItem;
    allowedItemTypes?: string[];
    allowItemSelection: boolean;
    refreshTrigger?: number; // Timestamp to trigger refresh
  };
}

export function OneLakeItemExplorerComponent(props: OneLakeItemExplorerComponentProps) {
  const [selectedItem, setSelectedItem] = useState<OneLakeItemExplorerItem>(null);

  const [tablesInItem, setTablesInItem] = useState<TableMetadata[]>(null);
  const [filesInItem, setFilesInItem] = useState<FileMetadata[]>(null);
  const [selectedTablePath, setSelectedTablePath] = useState<string>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("idle");
  const [isExplorerVisible, setIsExplorerVisible] = useState<boolean>(true);
  const [hasSchema, setHasSchema] = useState<boolean>(false);
  const [openFilesMenu, setOpenFilesMenu] = useState<boolean>(false);
  const [openTablesMenu, setOpenTablesMenu] = useState<boolean>(false);

  // Initialize selectedItem from props.initialItem
  useEffect(() => {
    if (props.config.initialItem && 
        props.config.initialItem.id && 
        props.config.initialItem.workspaceId) {
        setSelectedItem(props.config.initialItem);
    } else {
      // No initial item provided, show empty state
      setLoadingStatus("idle");
    }
  }, [props.config.initialItem]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedItem && selectedItem.id && selectedItem.workspaceId) {
        setLoadingStatus("loading");
        let success = false;
        try {
          success = await setTablesAndFiles(null);
        } catch (exception) {
          try {
            success = await setTablesAndFiles(".default");
          } catch (secondException) {
            console.error("SampleOneLakeItemExplorer: Failed to load data for item:", selectedItem, secondException);
            success = false;
          }
        }
        setLoadingStatus(success ? "idle" : "error");
      } else if (selectedItem) {
        // selectedItem exists but is missing required properties
        console.error("SampleOneLakeItemExplorer: selectedItem is missing required properties:", selectedItem);
        setLoadingStatus("error");
      }
    };
    fetchData();
  }, [selectedItem]);

  // Watch for refresh trigger changes to re-fetch data
  useEffect(() => {
    if (props.config.refreshTrigger && selectedItem && selectedItem.id && selectedItem.workspaceId) {
      const fetchData = async () => {
        setLoadingStatus("loading");
        let success = false;
        try {
          success = await setTablesAndFiles(null);
        } catch (exception) {
          try {
            success = await setTablesAndFiles(".default");
          } catch (secondException) {
            console.error("SampleOneLakeItemExplorer: Failed to refresh data for item:", selectedItem, secondException);
            success = false;
          }
        }
        setLoadingStatus(success ? "idle" : "error");
      };
      fetchData();
    }
  }, [props.config.refreshTrigger, selectedItem]);


  async function setTablesAndFiles(additionalScopesToConsent: string): Promise<boolean> {
    try {
      if (!selectedItem || !selectedItem.workspaceId || !selectedItem.id) {
        console.error("SampleOneLakeItemExplorer: Cannot fetch data - selectedItem is invalid:", selectedItem);
        return false;
      }

      console.log(`Fetching tables and files for item: ${selectedItem.id} in workspace: ${selectedItem.workspaceId}`);
      let tables = await getTables(props.workloadClient, selectedItem.workspaceId, selectedItem.id);
      let files = await getFiles(props.workloadClient, selectedItem.workspaceId, selectedItem.id);

      if (tables && files) {
        console.log(`Loaded ${tables.length} tables and ${files.length} files`);
        setTablesInItem(tables);
        setFilesInItem(files);
        setHasSchema(tables[0]?.schema != null);
        // Clear selections when new data is loaded
        setSelectedTablePath(null);
        setSelectedFilePath(null);
        return true;
      }
    } catch (error) {
      console.error("SampleOneLakeItemExplorer: Error fetching tables and files:", error);
    }
    return false;
  }

  function getDefaultItemTypes() {
    const workloadName = process.env.WORKLOAD_NAME;
    const itemTypes = process.env.ITEM_NAMES
      .split(",")
      .map(item => `${workloadName}.${item.trim()}`);
    return ["Lakehouse", ...itemTypes];
  }

  async function onDatahubClicked() {
    const result = await callDatahubOpen(
      props.workloadClient,
      [ ...props.config.allowedItemTypes || getDefaultItemTypes() ],
      "Select an item to use for Frontend Sample Workload",
      false
    );

    if (!result) {
      return;
    }
    updateExplorerItem(result);
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
      setLoadingStatus("error");
    }
  }

  function toggleExplorer() {
    setIsExplorerVisible(!isExplorerVisible);
  }

  function tableSelectedCallback(tableSelected: TableMetadata) {
    // Add Tables prefix to match the directory structure, similar to how FileTree handles Files
    const tablePathWithPrefix = `Tables/${tableSelected.path}`;
    const tableFilePath = OneLakeStorageClient.getPath(selectedItem.workspaceId, selectedItem.id, tablePathWithPrefix);
    // Update selection state without modifying the tables array
    setSelectedTablePath(tableSelected.path); // Keep original path for selection comparison
    setSelectedFilePath(null); // Clear file selection when table is selected
    if (props.onTableSelected && tableSelected.name) {
      props.onTableSelected(tableSelected.name, tableFilePath);
    }
  }

  async function fileSelectedCallback(fileSelected: FileMetadata) {
    const fullFilePath = OneLakeStorageClient.getPath(selectedItem.workspaceId, selectedItem.id, fileSelected.path);
    // Update selection state without modifying the files array
    setSelectedFilePath(fileSelected.path);
    setSelectedTablePath(null); // Clear table selection when file is selected
    if (props.onFileSelected && fileSelected.name) {
      await props.onFileSelected(fileSelected.name, fullFilePath);
    }
  }

  async function deleteFileCallback(filePath: string) {
    // Show confirmation dialog
    const fileName = filePath.split('/').pop() || filePath; // Get just the filename
    const clickedButton = await callDialogOpenMsgBox(
      props.workloadClient,
      "Delete File",
      `Are you sure you want to delete the file "${fileName}"?\n\nThis action cannot be undone.`,
      ["Yes", "No"]
    );
    
    if (clickedButton !== "Yes") {
      return; // User cancelled, don't delete
    }

    try {
      const fullFilePath = OneLakeStorageClient.getPath(selectedItem.workspaceId, selectedItem.id, filePath);
      const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
      await oneLakeClient.deleteFile(fullFilePath);

      // Refresh the file list after deletion
      await setTablesAndFiles(null);
    } catch (error) {
      console.error("Failed to delete file:", error);
      await callNotificationOpen(
        props.workloadClient,
        "Delete Failed",
        "Failed to delete file. Please try again.",
        NotificationType.Error
      );
    }
  }

  async function deleteFolderCallback(folderPath: string) {
    // Show confirmation dialog for folder deletion
    const folderName = folderPath.split('/').pop() || folderPath; // Get just the folder name
    const clickedButton = await callDialogOpenMsgBox(
      props.workloadClient,
      "Delete Shortcut Folder",
      `Are you sure you want to delete the shortcut folder "${folderName}"?\n\nThis will remove the shortcut but not the original data.\nThis action cannot be undone.`,
      ["Yes", "No"]
    );
    
    if (clickedButton !== "Yes") {
      return; // User cancelled, don't delete
    }

    try {
      const fullFolderPath = OneLakeStorageClient.getPath(selectedItem.workspaceId, selectedItem.id, folderPath);
      const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
      await oneLakeClient.deleteFile(fullFolderPath);
      
      // Refresh the file list after deletion
      await setTablesAndFiles(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      await callNotificationOpen(
        props.workloadClient,
        "Delete Failed",
        "Failed to delete folder. Please try again.",
        NotificationType.Error
      );
    }
  }

  async function createFolderCallback(parentPath: string) {
    // Get folder name from user - using prompt as placeholder until custom dialog is implemented
    const folderName = "New Folder"
    
    if (!folderName || !folderName.trim()) {
      return; // User cancelled or entered empty name
    }

    try {
      const folderPath = parentPath ? `${parentPath}/${folderName.trim()}` : folderName.trim();
      const fullFolderPath = OneLakeStorageClient.getPath(selectedItem.workspaceId, selectedItem.id, folderPath);
      console.log(`Creating folder at path: ${fullFolderPath}`);
      
      const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
      await oneLakeClient.createFolder(fullFolderPath);
      console.log(`Folder created successfully, refreshing tree...`);
      
      // Show success notification
      await callNotificationOpen(
        props.workloadClient,
        "Folder Created",
        `Folder "${folderName.trim()}" created successfully.`,
        NotificationType.Success
      );
      
      // Refresh the file list after folder creation
      await setTablesAndFiles(null);
      console.log(`Tree refresh completed`);
    } catch (error) {
      console.error("Failed to create folder:", error);
      await callNotificationOpen(
        props.workloadClient,
        "Create Folder Failed",
        "Failed to create folder. Please try again.",
        NotificationType.Error
      );
    }
  }

  async function createShortcutCallback(parentPath: string) {
    try {
      // Open data hub wizard to select target item and path for the shortcut
      const targetItemAndPath = await callDatahubWizardOpen(
        props.workloadClient,
        props.config.allowedItemTypes || ["Lakehouse"],
        "Create Shortcut",
        "Select a target location to create a shortcut to",
        false, // Single selection
        true,  // Show files folder
        true   // Workspace navigation enabled
      );

      if (!targetItemAndPath) {
        return; // User cancelled
      }

      // Create shortcut name based on the last element of the selected path
      const shortcutName = targetItemAndPath.selectedPath 
        ? targetItemAndPath.selectedPath.split('/').pop() || targetItemAndPath.displayName
        : targetItemAndPath.displayName;

      // Create the OneLake shortcut using the client
      const shortcutClient = new OneLakeShortcutClient(props.workloadClient);
      await shortcutClient.createOneLakeShortcut(
        selectedItem.workspaceId,
        selectedItem.id,
        shortcutName,
        parentPath,
        targetItemAndPath.workspaceId,
        targetItemAndPath.id,
        targetItemAndPath.selectedPath
      );

      console.log(`Created shortcut "${shortcutName}" to item: ${targetItemAndPath.displayName}, path: ${targetItemAndPath.selectedPath}`);
      
      // Show success notification
      await callNotificationOpen(
        props.workloadClient,
        "Shortcut Created",
        `Shortcut "${shortcutName}" created successfully.`,
        NotificationType.Success
      );
      
      // Refresh the file list after shortcut creation
      await setTablesAndFiles(null);
    } catch (error) {
      console.error("Failed to create shortcut:", error);
      await callNotificationOpen(
        props.workloadClient,
        "Create Shortcut Failed",
        "Failed to create shortcut. Please try again.",
        NotificationType.Error
      );
    }
  }

  // Handler for creating folder from Files node
  const handleCreateFolderFromFilesNode = async () => {
    await createFolderCallback("Files");
    setOpenFilesMenu(false);
  };

  // Handler for creating shortcut from Files node
  const handleCreateShortcutFromFilesNode = async () => {
    await createShortcutCallback("Files");
    setOpenFilesMenu(false);
  };

  // Handler for creating shortcut from Tables node
  const handleCreateShortcutFromTablesNode = async () => {
    await createShortcutCallback("Tables");
    setOpenTablesMenu(false);
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
        {selectedItem == null && isExplorerVisible && (
          <Stack className="main-body" verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: 5 }} style={{ flex: 1 }}>
            <Image src="/assets/samples/views/SampleOneLakeItemExplorer/EmptyIcon.svg" />
            <span className="add">Add an item</span>
            {props.config?.allowItemSelection && (
            <Tooltip content={"Open Datahub Explorer"} relationship="label">
              <Button className="add-button" size="small" onClick={() => onDatahubClicked()} appearance="primary">
                Add
              </Button>
            </Tooltip>
            )}
          </Stack>
        )}
        {loadingStatus === "loading" && <Spinner className="main-body" label="Loading Data" style={{ flex: 1 }} />}
        {selectedItem && loadingStatus == "idle" && isExplorerVisible && (
          <Tree
            aria-label="Tables in Item"
            className="selector-body"
            size="medium"
            defaultOpenItems={["Tables", "Files"]}
            style={{ flex: 1, overflow: "auto" }}
          >
            <div className="tree-container">
              <TreeItem itemType="branch" value="Tables">
                <Menu
                  open={openTablesMenu}
                  onOpenChange={(e, data) => {
                    // Only allow opening on right-click context menu
                    if (data.open && e.type !== 'contextmenu') {
                      return;
                    }
                    setOpenTablesMenu(data.open);
                  }}
                >
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      onClick={() => {
                        // When Tables folder is clicked, select the first table if available
                        if (tablesInItem && tablesInItem.length > 0) {
                          tableSelectedCallback(tablesInItem[0]);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTablesMenu(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <TreeItemLayout>
                        Tables
                      </TreeItemLayout>
                    </div>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem 
                        icon={<Link20Regular />}
                        onClick={handleCreateShortcutFromTablesNode}
                      >
                        Create Shortcut
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
                <Tree className="tree" selectionMode="single">
                  {hasSchema &&
                    <TableTreeWithSchema
                      allTablesInItem={tablesInItem}
                      selectedTablePath={selectedTablePath}
                      onSelectTableCallback={tableSelectedCallback} />
                  }
                  {!hasSchema &&
                    <TableTreeWithoutSchema
                      allTablesInItem={tablesInItem}
                      selectedTablePath={selectedTablePath}
                      onSelectTableCallback={tableSelectedCallback} />
                  }
                </Tree>
              </TreeItem>
              <TreeItem itemType="branch" value="Files">
                <Menu
                  open={openFilesMenu}
                  onOpenChange={(e, data) => {
                    // Only allow opening on right-click context menu
                    if (data.open && e.type !== 'contextmenu') {
                      return;
                    }
                    setOpenFilesMenu(data.open);
                  }}
                >
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      onClick={() => {
                        // When Files folder is clicked, select the first file if available
                        if (filesInItem && filesInItem.length > 0) {
                          fileSelectedCallback(filesInItem[0]);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenFilesMenu(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <TreeItemLayout>
                        Files
                      </TreeItemLayout>
                    </div>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem 
                        icon={<FolderAdd20Regular />}
                        onClick={handleCreateFolderFromFilesNode}
                      >
                        Create Folder
                      </MenuItem>
                      <MenuItem 
                        icon={<Link20Regular />}
                        onClick={handleCreateShortcutFromFilesNode}
                      >
                        Create Shortcut
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
                <Tree className="tree" selectionMode="single">
                  <FileTree
                    allFilesInItem={filesInItem}
                    selectedFilePath={selectedFilePath}
                    onSelectFileCallback={fileSelectedCallback}
                    onDeleteFileCallback={deleteFileCallback}
                    onDeleteFolderCallback={deleteFolderCallback}
                    onCreateFolderCallback={createFolderCallback}
                    onCreateShortcutCallback={createShortcutCallback} />
                </Tree>
              </TreeItem>
            </div>
          </Tree>
        )}
        {loadingStatus === "error" && isExplorerVisible && <div className="main-body" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <Subtitle2>Error loading data</Subtitle2>
          <p>Do you have permission to view this Item?</p>
        </div>}
      </Stack>
    </>
  );
}
