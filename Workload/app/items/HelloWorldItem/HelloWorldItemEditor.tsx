import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody
} from "@fluentui/react-components";
import { NotificationType } from "@ms-fabric/workload-client";
import {
  Dismiss20Regular,
  Warning20Filled
} from "@fluentui/react-icons";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem, callGetItem, saveWorkloadItem } from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, useViewNavigation, RegisteredNotification } from "../../components/ItemEditor";
import { HelloWorldItemDefinition } from "./HelloWorldItemDefinition";
import { HelloWorldItemEmptyView } from "./HelloWorldItemEmptyView";
import { HelloWorldItemDefaultView } from "./HelloWorldItemDefaultView";
import { HelloWorldItemRibbon } from "./HelloWorldItemRibbon";
import "./HelloWorldItem.scss";

/**
 * Different views that are available for the HelloWorld item
 */
export const EDITOR_VIEW_TYPES = {
  EMPTY: 'empty',
  DEFAULT: 'default',
} as const;

const enum SaveStatus {
  NotSaved = 'NotSaved',
  Saving = 'Saving',
  Saved = 'Saved'
}


export function HelloWorldItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<HelloWorldItemDefinition>>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NotSaved);
  const [currentDefinition, setCurrentDefinition] = useState<HelloWorldItemDefinition>({});
  // Set to true if you want to see the messageBar content in the editor
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);

  const { pathname } = useLocation();

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    // Prevent unnecessary reload if the same item is already loaded
    if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
      console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
      return;
    }

    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<HelloWorldItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      // for Edit scenario we get the itemObjectId and then load the item via the workloadClient SDK
      try {
        LoadedItem = await getWorkloadItem<HelloWorldItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        // Ensure item definition is properly initialized without mutation
        if (!LoadedItem.definition) {
          setSaveStatus(SaveStatus.NotSaved);
          LoadedItem = {
            ...LoadedItem,
            definition: {
              message: undefined,
            }
          };
        }
        else {
          setSaveStatus(SaveStatus.Saved);
          console.log('LoadedItem definition: ', LoadedItem.definition);
        }

        // Initialize the item
        setItem(LoadedItem);
        
        // Initialize current definition
        setCurrentDefinition(LoadedItem.definition || {});

      } catch (error) {
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
    }
    setIsLoading(false);
  }


  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  const handleOpenSettings = async () => {
    if (item) {
      try {
        const item_res = await callGetItem(workloadClient, item.id);
        await callOpenSettings(workloadClient, item_res.item, 'About');
      } catch (error) {
        console.error('Failed to open settings:', error);
      }
    }
  };

  async function saveItem() {
    setSaveStatus(SaveStatus.Saving);
    item.definition = {
      ...currentDefinition,
      message: currentDefinition.message || "Hello, Fabric!"
    }
    setCurrentDefinition(item.definition)

    let successResult;
    let errorMessage = "";

    try {
      successResult = await saveWorkloadItem<HelloWorldItemDefinition>(
        workloadClient,
        item,
      );
    } catch (error) {
      errorMessage = error?.message;
    }

    const wasSaved = Boolean(successResult);

    if (wasSaved) {
      setSaveStatus(SaveStatus.Saved);
      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_Saved_Notification_Title"),
        t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
        undefined,
        undefined
      );
    } else {
      setSaveStatus(SaveStatus.NotSaved);
      const failureMessage = errorMessage
        ? `${t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName })} ${errorMessage}.`
        : t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName });
        
      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_SaveFailed_Notification_Title"),
        failureMessage,
        NotificationType.Error,
        undefined
      );
    }
  }

  // Check if Save should be enabled
  const isSaveEnabled = (currentView: string) => {
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) {
      return false;
    } else {
      if (saveStatus === SaveStatus.Saved) {
        return false;
      }
      // Enable save if message has changed or if no message exists yet
      const originalMessage = item?.definition?.message || "";
      const currentMessage = currentDefinition.message || "";
      return originalMessage !== currentMessage || !item?.definition?.message;
    }
  };

  // Wrapper component for empty view that uses navigation hook
  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    
    return (
      <HelloWorldItemEmptyView
        workloadClient={workloadClient}
        item={item}
        onNavigateToGettingStarted={() => {
          setCurrentDefinition(prev => ({ ...prev, message: "Hello Fabric Item!" }));
          setSaveStatus(SaveStatus.NotSaved);
          setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
        }}
      />
    );
  };

  // Static view definitions - no function wrapper needed!
  const views = [
    {
      name: EDITOR_VIEW_TYPES.EMPTY,
      component: <EmptyViewWrapper />
    },
    {
      name: EDITOR_VIEW_TYPES.DEFAULT,
      component: (
      <HelloWorldItemDefaultView
        workloadClient={workloadClient}
        item={item}
        messageValue={currentDefinition.message}
        onMessageChange={(newValue) => {
          setCurrentDefinition(prev => ({ ...prev, message: newValue }));
          setSaveStatus(SaveStatus.NotSaved);
        }}
      />
    )
    }
  ];

  // Effect to set the correct view after loading completes
  useEffect(() => {
    if (!isLoading && item && viewSetter) {
      // Determine the correct view based on item state
      const correctView = !item?.definition?.message ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT;   
      viewSetter(correctView);
    }
  }, [isLoading, item, viewSetter]);


  // Static notification definitions - like views!
  const notifications: RegisteredNotification[] = [
    {
      name: 'default-warning',
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT], // Only show in DEFAULT view
      component: showWarning ? (
        <MessageBar intent="warning" icon={<Warning20Filled />}>
          <MessageBarBody>
            {t('GettingStarted_Warning', 'You can delete or modify the content on this page at any time.')}
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                icon={<Dismiss20Regular />}
                aria-label={t('MessageBar_Dismiss', 'Dismiss')}
                onClick={() => setShowWarning(false)}
              />
            }
          />
        </MessageBar>
      ) : null
    }
  ];

  return (
    <ItemEditor
      isLoading={isLoading}
      loadingMessage={t("HelloWorldItemEditor_Loading", "Loading item...")}
      ribbon={(context) => (
        <HelloWorldItemRibbon
          {...props}
          viewContext={context}
          isSaveButtonEnabled={isSaveEnabled(context.currentView)}
          saveItemCallback={saveItem}
          openSettingsCallback={handleOpenSettings}
        />
      )}
      messageBar={notifications}
      views={views}
      viewSetter={(setCurrentView) => {
        // Store the setCurrentView function so we can use it after loading
        if (!viewSetter) {
          setViewSetter(() => setCurrentView);
        }
      }}
    />
  );
}