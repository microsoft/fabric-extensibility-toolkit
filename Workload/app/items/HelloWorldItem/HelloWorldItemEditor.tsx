import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Stack } from "@fluentui/react";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem } from "../../controller/ItemCRUDController";
import { ItemEditorLoadingProgressBar } from "../../controls/ItemEditorLoadingProgressBar";
import { HelloWorldItemDefinition } from "./HelloWorldItemModel";
import { HelloWorldItemEditorEmpty } from "./HelloWorldItemEditorEmpty";
import { HelloWorldItemEditorGettingStarted } from "./HelloWorldItemEditorGettingStarted";
import "../../styles.scss";
import { HelloWorldRibbon } from "./HelloWorldRibbon";

/**
 * Main editor component for HelloWorld item.
 *
 * Note: To remove the empty state, simply set defaultView to 'getting-started'
 */
export function HelloWorldItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<HelloWorldItemDefinition>>();
  const [currentView, setCurrentView] = useState<'empty' | 'getting-started'>('empty');

  /**
   * Loads item data from URL parameters and determines the appropriate view
   * @param pageContext - Context containing item object ID
   * @param pathname - Current URL pathname for non-editor contexts
   */
  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<HelloWorldItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      try {
        LoadedItem = await getWorkloadItem<HelloWorldItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        if (!LoadedItem?.definition) {
          LoadedItem = {
            ...LoadedItem,
            definition: {
              state: undefined,
            }
          };
        }
        else {
          console.log('LoadedItem definition: ', LoadedItem.definition);
        }
        setItem(LoadedItem);
        setCurrentView(!LoadedItem?.definition?.state ? 'empty' : 'getting-started');

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

  /**
   * Navigates from empty state to getting started view
   */
  const navigateToGettingStarted = () => {
    setCurrentView('getting-started');
    console.log('Navigating to Getting Started view');
  };

  if (isLoading) {
    return (
      <ItemEditorLoadingProgressBar
        message={t("HelloWorldItemEditor_Loading", "Loading item...")}
      />
    );
  }

  return (
    <Stack className="editor" data-testid="item-editor-inner">
      <HelloWorldRibbon
        currentView={currentView}
        workloadClient={workloadClient}
        item={item}
        navigateToGettingStartedCallback={navigateToGettingStarted}
      />
      {currentView === 'empty' ? (
        <HelloWorldItemEditorEmpty
          onNavigateToGettingStarted={navigateToGettingStarted}
        />
      ) : (
        <HelloWorldItemEditorGettingStarted
          workloadClient={workloadClient}
          item={item}
        />
      )}
    </Stack>
  );
}