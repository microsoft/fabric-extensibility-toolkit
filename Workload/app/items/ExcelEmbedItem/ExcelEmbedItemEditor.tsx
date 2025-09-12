import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Stack } from "@fluentui/react";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem, callGetItem, saveItemDefinition } from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditorLoadingProgressBar } from "../../controls/ItemEditorLoadingProgressBar";
import { ExcelEmbedItemDefinition, VIEW_TYPES, CurrentView } from "./ExcelEmbedItemModel";
import { ExcelEmbedItemEditorEmpty } from "./ExcelEmbedItemEditorEmpty";
import { ExcelEmbedItemEditorDefaultWithConsent } from "./ExcelEmbedItemEditorDefault";
import "../../styles.scss";
import { ExcelEmbedItemRibbon } from "./ExcelEmbedItemRibbon";
import { NotificationType } from "@ms-fabric/workload-client";

export function ExcelEmbedItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<ExcelEmbedItemDefinition>>();
  const [currentView, setCurrentView] = useState<CurrentView>(VIEW_TYPES.EMPTY);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);

  const { pathname } = useLocation();

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<ExcelEmbedItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      // for Edit scenario we get the itemObjectId and then load the item via the workloadClient SDK
      try {
        LoadedItem = await getWorkloadItem<ExcelEmbedItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        // Ensure item definition is properly initialized without mutation
        if (!LoadedItem.definition) {
          LoadedItem = {
            ...LoadedItem,
            definition: {
              embedCode: undefined,
              title: undefined,
            }
          };
        }
        else {
          console.log('LoadedItem definition: ', LoadedItem.definition);
        }

        setItem(LoadedItem);
        setCurrentView(!LoadedItem?.definition?.embedCode ? VIEW_TYPES.EMPTY : VIEW_TYPES.CONFIGURED);

      } catch (error) {
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    setHasBeenSaved(false);
  }, [currentView, item?.id]);

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  const navigateToConfigured = () => {
    setCurrentView(VIEW_TYPES.CONFIGURED);
  };

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

  const handleSave = async (updatedDefinition: ExcelEmbedItemDefinition) => {
    if (!item) return;

    try {
      setIsLoading(true);
      const successResult = await saveItemDefinition<ExcelEmbedItemDefinition>(
        workloadClient,
        item.id,
        updatedDefinition
      );
      
      const wasSaved = Boolean(successResult);
      setHasBeenSaved(wasSaved);
      setCurrentView(VIEW_TYPES.CONFIGURED);
      
      if (wasSaved) {
        await callNotificationOpen(
          workloadClient,
          "Saved",
          "Excel embed has been saved successfully",
          NotificationType.Success
        );
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      await callNotificationOpen(
        workloadClient,
        "Error",
        "Failed to save Excel embed",
        NotificationType.Error
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ItemEditorLoadingProgressBar message="Loading Excel embed item..." />;
  }

  if (!item) {
    return (
      <Stack>
        <div>Error loading item</div>
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <ExcelEmbedItemRibbon 
        item={item}
        currentView={currentView}
        hasBeenSaved={hasBeenSaved}
        onSave={handleSave}
        onOpenSettings={handleOpenSettings}
      />
      
      {currentView === VIEW_TYPES.EMPTY && (
        <ExcelEmbedItemEditorEmpty 
          item={item}
          onSave={handleSave}
          onNavigateToConfigured={navigateToConfigured}
        />
      )}
      
      {currentView === VIEW_TYPES.CONFIGURED && (
        <ExcelEmbedItemEditorDefaultWithConsent 
          item={item}
          onSave={handleSave}
        />
      )}
    </Stack>
  );
}