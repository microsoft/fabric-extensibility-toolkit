import React, { useState, useEffect } from "react";
import { Document20Regular, FolderRegular, Delete20Regular, FolderAdd20Regular, Link20Regular, FolderLink20Regular } from "@fluentui/react-icons";
import { Tree, TreeItem, TreeItemLayout, Tooltip, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { FileMetadata, OneLakeItemExplorerFilesTreeProps } from "./SampleOneLakeItemExplorerModel";
import { getShortcutContents } from "./SampleOneLakeItemExplorerController";

interface TreeNode {
    metadata: FileMetadata;
    children: TreeNode[];
    isLoading?: boolean;
    isExpanded?: boolean;
}

type FolderMap = Map<string, TreeNode>;

export function FileTree(props: OneLakeItemExplorerFilesTreeProps) {
    const {allFilesInItem: allFilesInOneLake, selectedFilePath, onSelectFileCallback, onDeleteFileCallback, onDeleteFolderCallback, onCreateFolderCallback, onCreateShortcutCallback, workloadClient, workspaceId, itemId} = props;
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [expandedShortcuts, setExpandedShortcuts] = useState<Set<string>>(new Set());
    const [shortcutContents, setShortcutContents] = useState<Map<string, FileMetadata[]>>(new Map());
    const [loadingShortcuts, setLoadingShortcuts] = useState<Set<string>>(new Set());

    const loadShortcutContents = async (shortcutPath: string) => {
        if (!workloadClient || !workspaceId || !itemId) {
            console.warn('Missing required props for loading shortcut contents');
            return;
        }

        setLoadingShortcuts(prev => new Set(prev).add(shortcutPath));
        
        try {
            console.log(`Loading contents for shortcut: ${shortcutPath}`);
            const contents = await getShortcutContents(
                workloadClient,
                workspaceId,
                itemId,
                shortcutPath,
                true // assuming Files folder for now
            );
            
            setShortcutContents(prev => {
                const newMap = new Map(prev);
                newMap.set(shortcutPath, contents);
                return newMap;
            });
            
            setExpandedShortcuts(prev => new Set(prev).add(shortcutPath));
        } catch (error) {
            console.error(`Failed to load shortcut contents for ${shortcutPath}:`, error);
        } finally {
            setLoadingShortcuts(prev => {
                const newSet = new Set(prev);
                newSet.delete(shortcutPath);
                return newSet;
            });
        }
    };

    const buildFileTree = (files: FileMetadata[]) => {
        const root: TreeNode[] = [];
        const folders: FolderMap = new Map();

        // Helper function to add a node (file or folder) to the tree
        const addNode = (metadata: FileMetadata): TreeNode => {
            const node: TreeNode = {
                metadata: metadata,
                children: []
            };
            
            // If it's a directory, store it in our folders map for later reference
            if (metadata.isDirectory) {
                folders.set(metadata.path, node);
            }

            // Add to parent folder or root
            const segments = metadata.path.split('/').filter(s => s);
            if (segments.length > 1) {
                const parentPath = segments.slice(0, -1).join('/');
                const parent = folders.get(parentPath);
                if (parent) {
                    parent.children.push(node);
                } else {
                    root.push(node);
                }
            } else {
                root.push(node);
            }

            return node;
        };

        // First pass: create folder nodes
        files.filter(f => f.isDirectory).forEach(folder => {
            addNode(folder);
        });

        // Second pass: add files to their folders
        files.filter(f => !f.isDirectory).forEach(file => {
            addNode(file);
        });

        // Third pass: add shortcut contents if loaded
        shortcutContents.forEach((contents, shortcutPath) => {
            const shortcutNode = folders.get(shortcutPath);
            if (shortcutNode && expandedShortcuts.has(shortcutPath)) {
                // Clear existing children and add shortcut contents
                shortcutNode.children = [];
                contents.forEach(contentItem => {
                    // Adjust the path to be relative to the shortcut
                    const adjustedItem: FileMetadata = {
                        ...contentItem,
                        path: shortcutPath + '/' + contentItem.path
                    };
                    const childNode: TreeNode = {
                        metadata: adjustedItem,
                        children: []
                    };
                    shortcutNode.children.push(childNode);
                });
            }
        });

        // Sort tree alphabetically and by type (folders first)
        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.metadata.isDirectory !== b.metadata.isDirectory) {
                    return a.metadata.isDirectory ? -1 : 1;
                }
                return a.metadata.name.localeCompare(b.metadata.name);
            });
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    sortNodes(node.children);
                }
            });
        };

        sortNodes(root);
        return root;
    };

    const handleCreateFolder = async (metadata: FileMetadata) => {
        if (onCreateFolderCallback) {
            // Ensure the path includes the Files prefix since FileTree is within the Files directory
            const fullPath = metadata ? `${metadata.prefix}/${metadata.path}` : "Files";
            await onCreateFolderCallback(fullPath);
        }
    };

    const handleCreateShortcut = async (metadata: FileMetadata) => {
        if (onCreateShortcutCallback) {
            // Ensure the path includes the Files prefix since FileTree is within the Files directory
            const fullPath = metadata ? `${metadata.prefix}/${metadata.path}` : "Files";
            await onCreateShortcutCallback(fullPath);
        }
    };

    const handleDeleteFile = async (metadata: FileMetadata) => {
        if (onDeleteFileCallback) {
            const fullPath = metadata ? `${metadata.prefix}/${metadata.path}` : "Files";
            await onDeleteFileCallback(fullPath);
        }
    };

    const handleDeleteFolder = async (metadata: FileMetadata) => {
        if (onDeleteFolderCallback) {
            // Ensure the path includes the Files prefix since FileTree is within the Files directory
            const fullPath = metadata ? `${metadata.prefix}/${metadata.path}` : "Files";
            await onDeleteFolderCallback(fullPath);
        }
    };

    const renderTreeNode = (node: TreeNode): JSX.Element => {
        const { metadata, children } = node;

        if (metadata.isDirectory) {
            // Use different icon for shortcut folders vs regular folders
            const folderIcon = metadata.isShortcut ? <FolderLink20Regular /> : <FolderRegular />;
            
            return (
                <TreeItem key={metadata.path} itemType="branch">
                    <Menu 
                        open={openMenu === metadata.path}
                        onOpenChange={(e, data) => setOpenMenu(data.open ? metadata.path : null)}
                    >
                        <MenuTrigger disableButtonEnhancement>
                            <Tooltip relationship="label" content={metadata.name}>
                                <TreeItemLayout 
                                    iconBefore={folderIcon}
                                    onClick={async (e) => {
                                        // Handle shortcut expansion on click
                                        if (metadata.isShortcut && !expandedShortcuts.has(metadata.path)) {
                                            e.stopPropagation();
                                            await loadShortcutContents(metadata.path);
                                        }
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setOpenMenu(metadata.path);
                                    }}
                                >
                                    {metadata.name}
                                    {loadingShortcuts.has(metadata.path) && (
                                        <span style={{ marginLeft: '8px', fontSize: '12px' }}>Loading...</span>
                                    )}
                                </TreeItemLayout>
                            </Tooltip>
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                {/* Only show create options for regular folders (not shortcuts) */}
                                {onCreateFolderCallback && !metadata.isShortcut && (
                                    <MenuItem 
                                        icon={<FolderAdd20Regular />}
                                        onClick={() => {
                                            handleCreateFolder(metadata);
                                            setOpenMenu(null);
                                        }}
                                    >
                                        Create Folder
                                    </MenuItem>
                                )}
                                {onCreateShortcutCallback && !metadata.isShortcut && (
                                    <MenuItem 
                                        icon={<Link20Regular />}
                                        onClick={() => {
                                            handleCreateShortcut(metadata);
                                            setOpenMenu(null);
                                        }}
                                    >
                                        Create Shortcut
                                    </MenuItem>
                                )}
                                {/* Only show delete option for shortcut folders */}
                                {onDeleteFolderCallback && metadata.isShortcut && (
                                    <MenuItem 
                                        icon={<Delete20Regular />}
                                        onClick={() => {
                                            handleDeleteFolder(metadata);
                                            setOpenMenu(null);
                                        }}
                                    >
                                        Delete Shortcut
                                    </MenuItem>
                                )}
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                    <Tree>
                        {children.map(child => renderTreeNode(child))}
                    </Tree>
                </TreeItem>
            );
        } else {
            return (
                <TreeItem
                    key={metadata.path}
                    itemType="leaf"
                >
                    <Menu 
                        open={openMenu === metadata.path}
                        onOpenChange={(e, data) => {
                            // Only allow opening on right-click context menu
                            if (data.open && e.type !== 'contextmenu') {
                                return;
                            }
                            setOpenMenu(data.open ? metadata.path : null);
                        }}
                    >
                        <MenuTrigger disableButtonEnhancement>
                            <Tooltip relationship="label" content={metadata.name}>
                                <TreeItemLayout
                                    className={selectedFilePath === metadata.path ? "selected" : ""}
                                    iconBefore={<Document20Regular />}
                                    onClick={(e) => {
                                        // Left click - select file
                                        e.stopPropagation();
                                        onSelectFileCallback(metadata);
                                    }}
                                    onContextMenu={(e) => {
                                        // Right click - show context menu
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenMenu(metadata.path);
                                    }}
                                >
                                    {metadata.name}
                                </TreeItemLayout>
                            </Tooltip>
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                {onDeleteFileCallback && (
                                    <MenuItem 
                                        icon={<Delete20Regular />}
                                        onClick={() => {
                                            handleDeleteFile(metadata);
                                            setOpenMenu(null);
                                        }}
                                    >
                                        Delete File
                                    </MenuItem>
                                )}
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </TreeItem>
            );
        }
    };

    const fileTree = buildFileTree(allFilesInOneLake || []);

    // Rebuild tree when shortcut contents change
    useEffect(() => {
        // This will trigger a re-render when shortcut contents are loaded
    }, [shortcutContents, expandedShortcuts]);

    // Close menu when clicking outside
    const handleGlobalClick = () => {
        setOpenMenu(null);
    };

    React.useEffect(() => {
        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    return (
        <>
            {fileTree.length > 0 ? (
                fileTree.map(node => renderTreeNode(node))
            ) : (
                // Show context menu option when Files folder is empty
                (onCreateFolderCallback || onCreateShortcutCallback) && (
                    <div 
                        style={{ padding: "8px", color: "#666", fontStyle: "italic" }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (onCreateFolderCallback) {
                                handleCreateFolder(undefined);
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCreateFolderCallback) {
                                handleCreateFolder(undefined);
                            }
                        }}
                    >
                        Right-click or click here to create a folder or shortcut
                    </div>
                )
            )}
        </>
    );
}
