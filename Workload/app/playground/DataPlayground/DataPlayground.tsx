import React, { useState } from 'react';
import {
  TabList,
  Tab,
  SelectTabData,
  TabValue,
} from '@fluentui/react-components';
import { Stack } from '@fluentui/react';
import { OneLakeItemExplorerComponent } from '../../samples/views/SampleOneLakeItemExplorer/SampleOneLakeItemExplorer';
import { OneLakeShortcutCreator } from '../../samples/views/SampleOneLakeShortcutCreator/SampleOneLakeShortcutCreator';
import "../Playground.scss";
import { EventhouseExplorerComponent } from '../../samples/views/SampleEventhouseExplorer/SampleEventhouseExplorer';
import { TabContentProps } from '../ClientSDKPlayground/ClientSDKPlaygroundModel';
import { getConfiguredWorkloadItemTypes } from './../../controller/ConfigurationController';

export function DataPlayground(props: TabContentProps) {
  const { workloadClient } = props;
  const [selectedTab, setSelectedTab] = useState<TabValue>("OneLakeView");

  return (
    <Stack className="playground-container" >
      <TabList
        className="tabListContainer"
        defaultSelectedValue={selectedTab}
        data-testid="item-editor-selected-tab-btn"
        onTabSelect={(_, data: SelectTabData) => setSelectedTab(data.value)}
      >
        <Tab value="OneLakeView">OneLake Item Explorer</Tab>
        <Tab value="onelakeShortcutCreator">OneLake Shortcut Creator</Tab>
        <Tab value="eventhouseExplorer">Eventhouse Explorer</Tab>
      </TabList>

      <Stack className="main">
        {selectedTab === 'OneLakeView' && (
          <OneLakeItemExplorerComponent 
            workloadClient={workloadClient}
            onFileSelected={async (fileName: string, oneLakeLink: string) => {
              // Handle file selection in playground
              console.log('File selected:', fileName, oneLakeLink);
            }}
            onTableSelected={async (tableName: string, oneLakeLink: string) => {
              // Handle table selection in playground
              console.log('Table selected:', tableName, oneLakeLink);
            }}
            onItemChanged={async (item) => {
              // Handle item change in playground
              console.log('Item changed:', item);
            }}
            config={{
              initialItem: undefined,
              allowedItemTypes: ["Lakehouse", ...getConfiguredWorkloadItemTypes()], // Allow all item types
              allowItemSelection: true,
              refreshTrigger: Date.now()
            }}
          />
        )}
        {selectedTab === 'onelakeShortcutCreator' && (
          <OneLakeShortcutCreator workloadClient={workloadClient}
            allowedSourceItemTypes={["Lakehouse", ...getConfiguredWorkloadItemTypes()]}
            allowedTargetItemTypes={["Lakehouse", ...getConfiguredWorkloadItemTypes()]}
          />
        )}
        {selectedTab === 'eventhouseExplorer' && (
          <EventhouseExplorerComponent workloadClient={workloadClient} />
        )}
      </Stack>
    </Stack>

  );
};
