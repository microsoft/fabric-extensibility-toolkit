import React from "react";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { callNavigationOpenInNewBrowserTab } from "../../controller/NavigationController";
import { HelloWorldItemDefinition } from "./HelloWorldItemDefinition";
import { ItemEditorDefaultView } from "../../components/ItemEditor";
import { GettingStartedSection } from "./GettingStartedSection";
import { ItemDetailsSection } from "./ItemDetailsSection";
import "./HelloWorldItem.scss";

interface HelloWorldItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<HelloWorldItemDefinition>;
  messageValue?: string;
  onMessageChange?: (newValue: string) => void;
}

export function HelloWorldItemDefaultView({
  workloadClient,
  item,
  messageValue,
  onMessageChange,
}: HelloWorldItemDefaultViewProps) {
  const { t } = useTranslation();

  const handleOpenResource = async (url: string) => {
    try {
      // Demonstrate external navigation API
      await callNavigationOpenInNewBrowserTab(workloadClient, url);
    } catch (error) {
      // Log the error
      console.error('Failed to open resource via Fabric navigation API:', error);
    }
  };

  return (
    <ItemEditorDefaultView
      //Add left control if you want to split the center content in the editor
      left={{
        content: <GettingStartedSection onOpenResource={handleOpenResource} />,
        width: 400,
        minWidth: 350,
        title: t('Item_GettingStarted_Label', 'Next Steps'),
        enableUserResize: true,
        collapsible: true
      }}
      center={{
         content: (
          <ItemDetailsSection
            item={item}
            messageValue={messageValue}
            onMessageChange={onMessageChange}
            onOpenResource={handleOpenResource}
          />
        )
      }}
    />
  );
}