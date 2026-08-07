# Fabric Items: Code Examples

Code templates for creating new workload items. All templates follow the HelloWorld pattern and use the mandatory architecture components.

## Item Definition Template

```typescript
// [ItemName]ItemDefinition.ts
export interface [ItemName]ItemDefinition {
  // Add your item-specific properties here
  message?: string;
  // title?: string;
  // description?: string;
  // configuration?: any;
}
```

Key points:

- Define the interface representing your item's persisted state
- Keep it serializable (JSON-compatible types only)
- Follow the HelloWorld pattern for consistency

## Editor Template

```typescript
// [ItemName]ItemEditor.tsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem, callGetItem, saveItemDefinition } from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, ItemEditorEmptyView } from "../../components/ItemEditor";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";
import { [ItemName]ItemDefaultView } from "./[ItemName]ItemDefaultView";
import { [ItemName]ItemRibbon } from "./[ItemName]ItemRibbon";
import "./[ItemName]Item.scss";

export function [ItemName]ItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();

  const EDITOR_VIEW_TYPES = {
    EMPTY: 'empty',
    DEFAULT: 'default',
  } as const;

  type CurrentView = keyof typeof EDITOR_VIEW_TYPES;

  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<[ItemName]ItemDefinition>>();
  const [currentView, setCurrentView] = useState<CurrentView>(EDITOR_VIEW_TYPES.EMPTY);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);

  const { pathname } = useLocation();

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<[ItemName]ItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      try {
        LoadedItem = await getWorkloadItem<[ItemName]ItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        if (!LoadedItem.definition) {
          LoadedItem = {
            ...LoadedItem,
            definition: { state: undefined }
          };
        }

        setItem(LoadedItem);
        setCurrentView(!LoadedItem?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT);
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

  const navigateToDefaultView = () => {
    setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
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

  async function SaveItem() {
    var successResult = await saveItemDefinition<[ItemName]ItemDefinition>(
      workloadClient,
      item.id,
      { state: EDITOR_VIEW_TYPES.DEFAULT }
    );
    const wasSaved = Boolean(successResult);
    setHasBeenSaved(wasSaved);
    callNotificationOpen(
      props.workloadClient,
      t("ItemEditor_Saved_Notification_Title"),
      t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
      undefined,
      undefined
    );
  }

  const isSaveEnabled = () => {
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) return false;
    if (currentView === EDITOR_VIEW_TYPES.DEFAULT) {
      if (hasBeenSaved) return false;
      if (!item?.definition?.state) return true;
      return false;
    }
    return false;
  };

  return (
    <ItemEditor
      ribbon={
        <[ItemName]ItemRibbon
          {...props}
          isSaveButtonEnabled={isSaveEnabled()}
          currentView={currentView}
          saveItemCallback={SaveItem}
          openSettingsCallback={handleOpenSettings}
          navigateToDefaultViewCallback={navigateToDefaultView}
        />
      }
      views={(setCurrentView) => [
        {
          name: EDITOR_VIEW_TYPES.EMPTY,
          component: (
            <ItemEditorEmptyView
              title={t('[ItemName]ItemEmptyView_Title', 'Welcome to [ItemName]!')}
              description={t('[ItemName]ItemEmptyView_Description', 'Get started with your new item')}
              imageSrc="/assets/items/[ItemName]Item/EditorEmpty.svg"
              imageAlt="Empty state illustration"
              tasks={[{
                id: 'getting-started',
                label: t('[ItemName]ItemEmptyView_StartButton', 'Getting Started'),
                onClick: () => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT),
                appearance: 'primary'
              }]}
            />
          )
        },
        {
          name: EDITOR_VIEW_TYPES.DEFAULT,
          component: (
            <[ItemName]ItemDefaultView
              workloadClient={workloadClient}
              item={item}
            />
          )
        }
      ]}
      initialView={!item?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT}
    />
  );
}
```

Architecture requirements:

- Use `<ItemEditor>` as the root container (mandatory)
- Register views with the `views` prop, set starting view with `initialView`
- Pass ribbon component via `ribbon` prop
- ItemEditor handles loading states internally -- do not manually check `isLoading`

## Empty View Template

```typescript
// [ItemName]ItemEmptyView.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";
import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";

interface [ItemName]ItemEmptyViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<[ItemName]ItemDefinition>;
  onNavigateToDefaultView: () => void;
}

export function [ItemName]ItemEmptyView({
  workloadClient, item, onNavigateToDefaultView
}: [ItemName]ItemEmptyViewProps) {
  const { t } = useTranslation();

  const tasks: EmptyStateTask[] = [
    {
      id: 'getting-started',
      label: t('[ItemName]ItemEmptyView_StartButton', 'Getting Started'),
      description: t('[ItemName]ItemEmptyView_StartDescription', 'Learn how to use this item'),
      onClick: onNavigateToDefaultView,
      appearance: 'primary'
    }
  ];

  return (
    <ItemEditorEmptyView
      title={t('[ItemName]ItemEmptyView_Title', 'Welcome to [ItemName]!')}
      description={t('[ItemName]ItemEmptyView_Description', 'Get started by configuring your item')}
      imageSrc="/assets/items/[ItemName]Item/EditorEmpty.svg"
      imageAlt="Empty state illustration"
      tasks={tasks}
    />
  );
}
```

## Default View Template

```typescript
// [ItemName]ItemDefaultView.tsx
import React, { useState, useEffect } from "react";
import { Stack } from "@fluentui/react";
import { Text, Input, Button, Card, CardHeader } from "@fluentui/react-components";
import "./[ItemName]Item.scss";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition, saveItemDefinition } from "../../controller/ItemCRUDController";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";

interface [ItemName]ItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  item: ItemWithDefinition<[ItemName]ItemDefinition>;
}

export const [ItemName]ItemDefaultView: React.FC<[ItemName]ItemDefaultViewProps> = ({
  workloadClient, item
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>(item?.definition?.message || "");
  const [isEdited, setIsEdited] = useState<boolean>(false);

  useEffect(() => {
    setIsEdited(message !== (item?.definition?.message || ""));
  }, [message, item?.definition?.message]);

  const handleSaveChanges = async () => {
    if (item && isEdited) {
      try {
        await saveItemDefinition<[ItemName]ItemDefinition>(
          workloadClient, item.id,
          { ...item.definition, message: message }
        );
        setIsEdited(false);
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
    }
  };

  return (
    <div className="[item-name]-view">
      <Stack tokens={{ childrenGap: 24 }} style={{ padding: '24px' }}>
        <Stack.Item>
          <Text as="h1" size={900} weight="semibold">
            {t('[ItemName]ItemDefaultView_Title', `${item?.displayName} Editor`)}
          </Text>
        </Stack.Item>
        <Stack.Item>
          <Card>
            <CardHeader header={
              <Text weight="semibold">
                {t('[ItemName]ItemDefaultView_Content_Header', 'Content')}
              </Text>
            } />
            <Stack tokens={{ childrenGap: 16 }} style={{ padding: '16px' }}>
              <Stack.Item>
                <Input
                  value={message}
                  onChange={(e, data) => setMessage(data.value)}
                  placeholder={t('[ItemName]ItemDefaultView_Message_Placeholder', 'Enter your message...')}
                  style={{ width: '100%' }}
                />
              </Stack.Item>
              {isEdited && (
                <Stack.Item>
                  <Button appearance="primary" onClick={handleSaveChanges}>
                    {t('[ItemName]ItemDefaultView_Save_Button', 'Save Changes')}
                  </Button>
                </Stack.Item>
              )}
            </Stack>
          </Card>
        </Stack.Item>
      </Stack>
    </div>
  );
};
```

## Ribbon Template

```typescript
// [ItemName]ItemRibbon.tsx
import React from "react";
import { PageProps } from '../../App';
import { useTranslation } from "react-i18next";
import {
  Ribbon,
  RibbonToolbar,
  RibbonAction,
  createSaveAction,
  createSettingsAction,
  createRibbonTabs
} from '../../components/ItemEditor';
import { Rocket24Regular } from '@fluentui/react-icons';

export interface [ItemName]ItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  currentView: string;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  navigateToDefaultViewCallback: () => void;
}

export function [ItemName]ItemRibbon(props: [ItemName]ItemRibbonProps) {
  const { t } = useTranslation();
  const translate = (key: string, fallback?: string) => t(key, fallback);

  const tabs = createRibbonTabs(t("ItemEditor_Ribbon_Home_Label"));

  const actions: RibbonAction[] = [
    createSaveAction(props.saveItemCallback, !props.isSaveButtonEnabled, translate),
    createSettingsAction(props.openSettingsCallback, translate),
    {
      key: 'navigate-default',
      icon: Rocket24Regular,
      label: t("ItemEditor_Ribbon_Navigate_Label", "Navigate to Default"),
      onClick: props.navigateToDefaultViewCallback,
      testId: 'ribbon-navigate-default-btn',
      hidden: props.currentView !== 'empty'
    }
  ];

  return (
    <Ribbon tabs={tabs}>
      <RibbonToolbar actions={actions} />
    </Ribbon>
  );
}
```

## SCSS Template

```scss
// [ItemName]Item.scss
// Contains ONLY item-specific styles. Never modify component files.

.[item-name]-view {
  background-color: var(--colorNeutralBackground1);
  padding: var(--spacingVerticalL);
  border-radius: var(--borderRadiusMedium);
}

.[item-name]-section-title {
  color: var(--colorBrandForeground1);
  font-size: var(--fontSizeBase500);
  font-weight: var(--fontWeightSemibold);
  margin-bottom: var(--spacingVerticalM);
}
```

## Detail View Example

For drill-down pages (L2), register an `ItemEditorDetailView` with `isDetailView: true`:

```typescript
// Add to views array in [ItemName]ItemEditor.tsx
{
  name: 'record-detail',
  component: (
    <ItemEditorDetailView
      left={{
        content: <PropertiesPanel record={record} />,
        title: "Properties",
        width: 280,
        collapsible: true
      }}
      center={{
        content: <RecordEditor record={record} />
      }}
      actions={[
        { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
      ]}
    />
  ),
  isDetailView: true  // Enables automatic back navigation
}
```

## Manifest XML Template

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

## Manifest JSON Template

```json
{
  "name": "[ItemName]",
  "version": "1.100",
  "displayName": "[ItemName]Item_DisplayName",
  "displayNamePlural": "[ItemName]Item_DisplayName_Plural",
  "editor": {
    "path": "/[ItemName]Item-editor"
  },
  "icon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "activeIcon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "contextMenuItems": [],
  "quickActionItems": [],
  "supportedInMonitoringHub": true,
  "supportedInDatahubL1": true,
  "itemJobActionConfig": {},
  "itemSettings": {
    "getItemSettings": {
      "action": "getItemSettings"
    }
  },
  "editorTab": {
    "onDeactivate": "item.tab.onDeactivate",
    "canDeactivate": "item.tab.canDeactivate",
    "canDestroy": "item.tab.canDestroy",
    "onDestroy": "item.tab.onDestroy",
    "onDelete": "item.tab.onDelete"
  },
  "createItemDialogConfig": {
    "onCreationFailure": { "action": "item.onCreationFailure" },
    "onCreationSuccess": { "action": "item.onCreationSuccess" }
  }
}
```

## Product.json Entry Template

Add to `createExperience.cards` array:

```json
{
  "title": "[ItemName]Item_DisplayName",
  "description": "[ItemName]Item_Description",
  "icon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "icon_small": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "availableIn": [
    "home",
    "create-hub",
    "workspace-plus-new",
    "workspace-plus-new-teams"
  ],
  "itemType": "[ItemName]",
  "createItemDialogConfig": {
    "onCreationFailure": { "action": "item.onCreationFailure" },
    "onCreationSuccess": { "action": "item.onCreationSuccess" }
  }
}
```

Add to `homePage.recommendedItemTypes` array:

```json
{
  "homePage": {
    "recommendedItemTypes": [
      "HelloWorld",
      "[ItemName]"
    ]
  }
}
```

## Routing Template

Add to `Workload/app/App.tsx`:

```typescript
import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

// In the Switch statement:
<Route path="/[ItemName]Item-editor/:itemObjectId">
  <[ItemName]ItemEditor {...pageProps} />
</Route>
```

## Translation Templates

Manifest translations (`Workload/Manifest/assets/locales/en-US/translations.json`):

```json
{
  "[ItemName]Item_DisplayName": "Your Item Display Name",
  "[ItemName]Item_DisplayName_Plural": "Your Item Display Names",
  "[ItemName]Item_Description": "Description of what this item does"
}
```

App translations (`Workload/app/assets/locales/en-US/translation.json`):

```json
{
  "[ItemName]ItemEditor_Loading": "Loading [Item Name]...",
  "[ItemName]ItemEditor_LoadError": "Failed to load the [item name] item.",
  "[ItemName]ItemEmptyView_Title": "Get started with [Item Name]",
  "[ItemName]ItemEmptyView_Description": "Description for empty state",
  "[ItemName]ItemRibbon_Save_Label": "Save",
  "[ItemName]ItemRibbon_Settings_Label": "Settings"
}
```
