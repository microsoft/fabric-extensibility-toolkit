import React from "react";
import { OneLakeViewTablesTreeProps } from "./OneLakeViewModel";
import { Table20Regular } from "@fluentui/react-icons";
import { TreeItem, TreeItemLayout, Tooltip } from "@fluentui/react-components";

export function TableTreeWithoutSchema(props: OneLakeViewTablesTreeProps) {
    const {allTablesInItem: allTablesInOneLake, selectedTablePath, onSelectTableCallback} = props;
    return (
        <>
            {allTablesInOneLake &&
                allTablesInOneLake.map((table) => (
                    <TreeItem 
                    key={table.name} 
                    accessKey={table.relativePath} 
                    itemType="leaf" 
                    onClick={() => onSelectTableCallback(table)}
                    >
                        <Tooltip
                            relationship="label"
                            content={table.name}>
                            <TreeItemLayout
                                className={(selectedTablePath === table.relativePath ? "selected" : "")}
                                iconBefore={<Table20Regular />}>
                                {table.name}
                            </TreeItemLayout>
                        </Tooltip>
                    </TreeItem>
                ))}
        </>
    );
}