---
applyTo: "/Workload/app/items/[ItemName]Item/"
---

# Create New Workload Item

## 🚨 MANDATORY PROCESS - FOLLOW EXACTLY

**CRITICAL**: This process has multiple steps that are easy to miss. Use disciplined execution:

### 📋 Step 0: Create Complete TODO List (MANDATORY)

Before writing ANY code, create a comprehensive todo list with `manage_todo_list`:

**REQUIRED TODO ITEMS - ALL MUST BE COMPLETED:**
1. Read both instruction files completely
2. 🔍 **DISCOVER EXISTING COMPONENTS** - Search for Base* components before coding
3. Create [ItemName]ItemDefinition.ts with proper interface for storing the state of the item
4. Create [ItemName]ItemEditor.tsx using ItemEditor
5. Create [ItemName]ItemEmptyView.tsx with proper patterns
6. Create [ItemName]ItemDefaultView.tsx using **EXISTING BASE COMPONENTS**
7. Create [ItemName]ItemRibbon.tsx using RibbonToolbar
8. Create [ItemName]Item.scss with ONLY overrides
9. Add route to App.tsx
10. Create manifest JSON and XML files
11. Copy icon file from HelloWorld pattern
12. Add translations to Manifest/assets/locales/en-US/translations.json
13. Add translations to app/assets/locales/en-US/translation.json
14. 🚨 **UPDATE PRODUCT.JSON - CRITICAL FOR ITEM VISIBILITY**
15. Verify all files created and syntax correct

### 🔍 Component Discovery Phase (Step 2)

**MANDATORY**: Before coding any views, search for existing components:

```bash
# Use semantic_search to find existing patterns:
- "ItemEditorView left right split layout"
- "ItemEditorDetailView left center" 
- "Base* components [your use case]"
```

**Available Components (USE THESE - DON'T REINVENT):**
- **ItemEditorView**: Left/center layouts (explorer + content)
- **ItemEditorDetailView**: Detail views with actions
- **ItemEditorEmptyView**: Empty states with tasks

### 🎯 **CRITICAL: When to Use ItemEditorDetailView**

**ALWAYS use ItemEditorDetailView for these scenarios:**

1. **Detail/Drill-down Pages (L2 Pages)**: 
   - Record details, configuration pages, property panels
   - Any page you navigate TO from a main view
   - Pages that need a "back" button

2. **Settings and Configuration**:
   - Item settings, preferences, advanced options
   - Multi-step wizards or forms
   - Property editing interfaces

3. **Edit/View Individual Items**:
   - File viewers, table schemas, record editors
   - Any focused view of a single entity
   - Content that requires dedicated actions

**⚠️ DON'T create custom detail layouts** - ItemEditorDetailView provides:
- ✅ Automatic back navigation (mark view as `isDetailView: true`)
- ✅ Context-specific actions in ribbon
- ✅ Optional left panel for properties/navigation
- ✅ Consistent layout with other detail views
- ✅ Built-in accessibility and responsive behavior

**Example Usage Pattern:**
```tsx
// In your views registration
{
  name: 'record-detail-123',
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
  isDetailView: true  // ⭐ This enables automatic back navigation
}
```

### 🔄 Execution Rules (MANDATORY)

1. **Mark ONE todo in-progress** before starting work
2. **Complete that todo FULLY** - no partial work
3. **Mark completed IMMEDIATELY** after finishing
4. **NEVER skip Product.json** - it's required for Fabric integration
5. **Follow HelloWorld patterns EXACTLY** - including version numbers

---

## 🏗️ Architecture Overview

**CRITICAL**: All item editors MUST use the standardized architecture patterns:

### Required Base Components

1. **ItemEditor** (`Workload/app/components/ItemEditor/ItemEditor.tsx`)
   - 🚨 **MANDATORY**: ALL item editors must use ItemEditor as the container
   - Provides consistent layout: Fixed ribbon + scrollable content
   - Handles full-height iframe rendering
   - Ensures proper scroll behavior (ribbon stays fixed, content scrolls)
   - **DO NOT create custom layout patterns** - use ItemEditor

2. **Ribbon Components** (`Workload/app/components/ItemEditor/`)
   - 🚨 **MANDATORY**: Use the standardized Ribbon pattern
   - **Ribbon**: Standard ribbon structure with tabs
   - **RibbonToolbar**: Renders action buttons with proper spacing
   - **Standard Action Factories**: `createSaveAction`, `createSettingsAction`
   - **Tooltip + ToolbarButton**: ALWAYS wrap ToolbarButton in Tooltip for accessibility

### Standard Architecture Pattern

```typescript
// CORRECT Pattern - Use ItemEditor + Standard Ribbon
export function [ItemName]ItemEditor(props: PageProps) {
  // ... state and logic ...
  
  return (
    <ItemEditor
      ribbon={
        <[ItemName]ItemRibbon
          saveItemCallback={handleSave}
          openSettingsCallback={handleSettings}
          isSaveButtonEnabled={hasChanges}
        />
      }
    >
      {currentView === EDITOR_VIEW_TYPES.EMPTY ? (
        <[ItemName]ItemEmptyView {...emptyProps} />
      ) : (
        <[ItemName]ItemDefaultView {...defaultProps} />
      )}
    </ItemEditor>
  );
}
```

### ❌ INCORRECT Patterns - DO NOT USE

```typescript
// ❌ WRONG: Custom Stack layout without ItemEditor
<Stack className="editor">
  <MyCustomRibbon />
  <Stack className="main">
    {content}
  </Stack>
</Stack>

// ❌ WRONG: Not using standard ribbon components
<div className="custom-toolbar">
  <button onClick={save}>Save</button>  // No Tooltip wrapper
</div>

// ❌ WRONG: Custom scroll handling
<div style={{height: '100vh', overflow: 'scroll'}}>
  {/* ItemEditor handles this */}
</div>
```

### Key Benefits of Standard Architecture

✅ **Consistent UX**: All items look and behave the same way  
✅ **Accessibility**: Built-in ARIA labels, keyboard navigation, screen reader support  
✅ **Maintenance**: Centralized updates benefit all items  
✅ **Scroll Behavior**: Proper fixed ribbon + scrollable content  
✅ **Responsive**: Mobile-friendly layouts and touch targets  
✅ **Testing**: Standard patterns = standard test coverage  

### 🚨 CRITICAL: Styling Requirements

**MANDATORY**: All styling MUST follow the standardized patterns and will be verified by the verification team:

1. **Component Styles** (🚫 STRICTLY FORBIDDEN TO MODIFY):
   - **DO NOT EDIT**: Any files in `Workload/app/components/` directory
   - **DO NOT MODIFY**: `ItemEditor.scss`, `Ribbon.scss`, `OneLakeView.scss`, `Wizard.scss`, etc.
   - **REASON**: Components provide standardized layouts and functionality for all items
   - **CONSEQUENCE**: Modifications to control files will fail verification and break other items

2. **Item-Specific Styles** (✅ REQUIRED):
   - Create `[ItemName]Item.scss` in your item folder (`Workload/app/items/[ItemName]/`)
   - Import item styles: `import "./[ItemName]Item.scss";`
   - Define ONLY item-specific branding, colors, and custom content styling
   - Use prefixed class names: `.hello-world-*`, `.data-analyzer-*` for clear item identification

3. **Styling Pattern** (HelloWorld Example):
   ```scss
   // [ItemName]Item.scss - All item-specific styles
   .hello-world-view {
     /* Typical views need padding to prevent content from touching edges */
     padding: var(--spacingVerticalL, 12px);
     /* Add other item-specific styles like colors, layout, or branding */
   }
   
   .hello-world-section-title {
     color: var(--colorBrandForeground1);
     font-weight: var(--fontWeightSemibold);
   }
   ```

4. **Component Usage**:
   ```tsx
   // Use item-specific classes for your content
   <div className="hello-world-view">
     <div className="hello-world-section-title">
       {/* Content with item-specific styling */}
     </div>
   </div>
   ```

4. **Verification Checklist** (Will be checked):
   - ✅ ItemEditor used (no custom editor layout)
   - ✅ Ribbon + RibbonToolbar used (no custom ribbon layout)  
   - ✅ Styles in separate `[ItemName]Item.scss` file in item directory
   - ✅ **NO MODIFICATIONS** to any files in `components/` directory
   - ✅ Item-specific class naming pattern used (`.item-name-*`)
   - ✅ Only item content and branding styled, not control structure
   - ✅ Import pattern: `import "./[ItemName]Item.scss";` (no global imports)

**❌ STYLE VIOLATIONS** (Will fail verification):
```scss
// ❌ WRONG: Modifying control files
// components/ItemEditor/ItemEditor.scss
.item-editor-container {
  background: blue;  // FORBIDDEN: Don't modify control styles
}

// ❌ WRONG: Modifying any control files
// components/Ribbon/Ribbon.scss, components/OneLakeView/OneLakeView.scss, etc.
}

// ❌ WRONG: Not using separate SCSS file
// Inline styles in JSX
<div style={{background: 'blue'}}>  // Use SCSS file instead

// ❌ WRONG: Duplicating control structural styles
// [ItemName]Item.scss
.my-item-view {
  display: flex;           // ❌ Don't duplicate layout from components
  flex-direction: column;  // ❌ components handle their own structure
  background: blue;        // ✅ Only item-specific styles like this
}
```

---

## Process

This guide provides step-by-step instructions for AI tools to create a new item in the Microsoft Fabric Extensibility Toolkit. Creating a new item requires implementation files, manifest configuration, routing setup, and environment variable updates.

**🚨 REMEMBER**: 
- Always use ItemEditor and standard Ribbon components!
- **CRITICAL**: Must update Product.json to register item in create dialogs
- **OneLakeStorageClient**: Always use `createItemWrapper()` for item-scoped OneLake operations
- **OneLakeView**: Use the control from `components/OneLakeView`, NOT the sample code

### Step 1: Create Item Implementation Structure

1. **Create item directory**:
   ```
   Workload/app/items/[ItemName]Item/
   ```

2. **Create the required implementation files**:
   - `[ItemName]ItemDefinition.ts` - Data model and interface definitions
   - `[ItemName]ItemEditor.tsx` - Main editor component
   - `[ItemName]ItemEmptyView.tsx` - Empty state component (shown when item is first created)
   - `[ItemName]ItemDefaultView.tsx` - Default/main content view (shown when item has data)
   - `[ItemName]ItemRibbon.tsx` - Ribbon/toolbar component

### Step 2: Implement the Model (`[ItemName]ItemDefinition.ts`)

The model defines the data structure that will be stored in Fabric. **Use the HelloWorld pattern**:

```typescript
// Based on HelloWorldItemDefinition.ts
export interface [ItemName]ItemDefinition {
  // Add your item-specific properties here
  // Example: Follow HelloWorld pattern with a simple property
  message?: string;
  // Add more properties as needed:
  // title?: string;
  // description?: string;
  // configuration?: any;
}
```

**Key Points**:
- Define the interface that represents your item's state
- This data will be persisted in Fabric's storage
- Keep it serializable (JSON-compatible types only)
- Follow the HelloWorld pattern for consistency

### Step 3: Implement the Editor (`[ItemName]ItemEditor.tsx`)

The main editor component handles the item's primary interface. **🚨 CRITICAL: MUST use ItemEditor component!**

```typescript
// Based on HelloWorldItemEditor.tsx - Complete functional implementation with ItemEditor
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MessageBar, MessageBarBody } from "@fluentui/react-components";
import { Warning20Filled } from "@fluentui/react-icons";
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

  // Different views that are available for the [ItemName] item
  const EDITOR_VIEW_TYPES = {
    EMPTY: 'empty',
    DEFAULT: 'default',
  } as const;

  type CurrentView = keyof typeof EDITOR_VIEW_TYPES;

  // State management
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

        // Ensure item definition is properly initialized without mutation
        if (!LoadedItem.definition) {
          LoadedItem = {
            ...LoadedItem,
            definition: {
              state: undefined,
            }
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
      {
        state: EDITOR_VIEW_TYPES.DEFAULT
      });
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
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) {
      return false;
    }

    if (currentView === EDITOR_VIEW_TYPES.DEFAULT) {
      if (hasBeenSaved) {
        return false;
      }

      if (!item?.definition?.state) {
        return true;
      }

      return false;
    }

    return false;
  };

  // ItemEditor handles loading state internally
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
              tasks={[
                {
                  id: 'getting-started',
                  label: t('[ItemName]ItemEmptyView_StartButton', 'Getting Started'),
                  onClick: () => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT),
                  appearance: 'primary'
                }
              ]}
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
        // 🎯 FOR DETAIL VIEWS (L2 Pages): Add additional views here
        // {
        //   name: 'record-detail-123',
        //   component: (
        //     <ItemEditorDetailView
        //       left={{
        //         content: <PropertiesPanel />,
        //         title: "Properties",
        //         width: 240
        //       }}
        //       center={{
        //         content: <RecordEditor />
        //       }}
        //       actions={[
        //         { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        //         { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
        //       ]}
        //     />
        //   ),
        //   isDetailView: true  // ⭐ CRITICAL: Enables automatic back navigation
        // }
      ]}
      initialView={!item?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT}
    />
  );
}
```

**🚨 CRITICAL Architecture Requirements**:

1. **ItemEditor Container**:
   - MUST use `<ItemEditor>` as the root container
   - Provides fixed ribbon + scrollable content layout
   - Handles proper scroll behavior automatically
   - DO NOT create custom layout patterns

2. **View Registration System** (MANDATORY):
   - Use `views={(setCurrentView) => [...]}` prop to register views
   - Each view has `name` and `component` properties
   - Use `initialView` prop to set the starting view
   - Views are automatically managed by ItemEditor

3. **Ribbon Prop**:
   - Pass ribbon component via `ribbon={<[ItemName]ItemRibbon />}` prop
   - Ribbon will be fixed at the top (doesn't scroll)
   - Use standard Ribbon components (see Step 5)

4. **Notification Prop** (Optional):
   - Pass notification via `notification={<MessageBar />}` prop
   - Appears between ribbon and content
   - Fixed position (doesn't scroll)

5. **View Navigation**:
   - Views receive `setCurrentView` function for navigation
   - Call `setCurrentView(EDITOR_VIEW_TYPES.VIEWNAME)` to switch views
   - DO NOT use manual if/else statements in children

5. **Automatic Loading Handling**:
   - ItemEditor automatically handles loading states internally
   - DO NOT manually check `isLoading` before rendering ItemEditor
   - DO NOT import or use `ItemEditorLoadingView` - it's handled internally

**Key Features**:

- **Complete State Management**: Loading, saving, and updating item definitions
- **View Switching**: Automatic transitions between empty and loaded states
- **ItemEditor Integration**: Proper use of the standard layout component
- **Error Handling**: Proper try/catch for async operations
- **Immutable Updates**: Safe state updates using functional patterns
- **Notifications**: User feedback on save operations
- **Settings Integration**: Opens item settings when needed
- **Loading States**: Progress indicators during data operations

### Step 4: Implement the Empty State (`[ItemName]ItemEmptyView.tsx`)

The empty state is shown when users first create the item. **🚨 CRITICAL: Use ItemEditorEmptyView component**:

```typescript
// Based on HelloWorldItemEmptyView.tsx - Uses ItemEditorEmptyView component
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

/**
 * Empty state component - the first screen users see
 * This component uses the ItemEditorEmptyView control for consistency
 * across all item types.
 */
export function [ItemName]ItemEmptyView({
  workloadClient,
  item,
  onNavigateToDefaultView
}: [ItemName]ItemEmptyViewProps) {
  const { t } = useTranslation();

  // Define onboarding tasks using the standard EmptyStateTask interface
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
      description={t('[ItemName]ItemEmptyView_Description', 'This is the first screen people will see after an item is created. Include some basic information to help them continue.')}
      imageSrc="/assets/items/[ItemName]Item/EditorEmpty.svg"
      imageAlt="Empty state illustration"
      tasks={tasks}
    />
  );
}
```

**🚨 CRITICAL Requirements**:

1. **Use ItemEditorEmptyView** (MANDATORY):
   - Import from `../../components`
   - Provides consistent empty state UI across all items
   - DO NOT create custom empty state layouts

2. **EmptyStateTask Interface** (REQUIRED):
   - Use `EmptyStateTask[]` for defining action buttons
   - Standard properties: `id`, `label`, `description`, `onClick`, `appearance`
   - Tasks are automatically rendered as buttons by ItemEditorEmptyView

3. **Standard Props** (REQUIRED):
   - `title`: Main heading displayed to users
   - `description`: Explanatory text below title
   - `imageSrc`: Path to empty state illustration
   - `imageAlt`: Accessibility text for illustration
   - `tasks`: Array of EmptyStateTask for user actions

**Key Features**:

- ✅ **Consistency**: Same empty state pattern across all item editors
- ✅ **Accessibility**: Built-in ARIA labels and keyboard navigation
- ✅ **Localization**: Uses translation keys for all user-facing text
- ✅ **Standard Layout**: Follows Fabric design guidelines automatically
- ✅ **Maintainability**: Changes to empty state behavior centralized
- ✅ **Less Code**: Base component handles layout and styling

### Step 4.1: Implement the Default View (`[ItemName]ItemDefaultView.tsx`)

The default view is shown when the item has content and is the main editing interface.

#### Architecture Decision: Choose the Right Component

**For Simple Main Views** - Use standard React components with ItemEditor:

- Dashboard-style layouts with cards and summary information
- List views, tables, or data grids as primary content
- Simple editing interfaces without drill-down functionality

**For Detail/Drill-down Views (L2 Pages)** - Use ItemEditorDetailView:

- Record details, settings pages, configuration panels
- Any view that users navigate TO from another view
- Views that need context-specific actions and back navigation
- **Mark as `isDetailView: true` in view registration for automatic back navigation**

**Use the HelloWorld pattern as template for simple main views**:

```typescript
// Based on HelloWorldItemDefaultView.tsx - Complete functional implementation
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
  workloadClient,
  item
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>(item?.definition?.message || "");
  const [isEdited, setIsEdited] = useState<boolean>(false);

  // Track changes to enable save functionality
  useEffect(() => {
    setIsEdited(message !== (item?.definition?.message || ""));
  }, [message, item?.definition?.message]);

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleSaveChanges = async () => {
    if (item && isEdited) {
      try {
        await saveItemDefinition<[ItemName]ItemDefinition>(
          workloadClient,
          item.id,
          {
            ...item.definition,
            message: message
          }
        );
        setIsEdited(false);
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
    }
  };

  return (
    <div className="editor-default-view">
      <Stack tokens={{ childrenGap: 24 }} style={{ padding: '24px' }}>
        <Stack.Item>
          <Text as="h1" size={900} weight="semibold">
            {t('[ItemName]ItemDefaultView_Title', `${item?.displayName} Editor`)}
          </Text>
        </Stack.Item>
        
        <Stack.Item>
          <Card>
            <CardHeader
              header={
                <Text weight="semibold">
                  {t('[ItemName]ItemDefaultView_Content_Header', 'Content')}
                </Text>
              }
            />
            <Stack tokens={{ childrenGap: 16 }} style={{ padding: '16px' }}>
              <Stack.Item>
                <Text>
                  {t('[ItemName]ItemDefaultView_Message_Label', 'Message:')}
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Input
                  value={message}
                  onChange={(e, data) => handleMessageChange(data.value)}
                  placeholder={t('[ItemName]ItemDefaultView_Message_Placeholder', 'Enter your message here...')}
                  style={{ width: '100%' }}
                />
              </Stack.Item>
              {isEdited && (
                <Stack.Item>
                  <Button 
                    appearance="primary" 
                    onClick={handleSaveChanges}
                  >
                    {t('[ItemName]ItemDefaultView_Save_Button', 'Save Changes')}
                  </Button>
                </Stack.Item>
              )}
            </Stack>
          </Card>
        </Stack.Item>
        
        <Stack.Item>
          <Text size={400} style={{ color: 'var(--colorNeutralForeground3)' }}>
            {t('[ItemName]ItemDefaultView_Help_Text', 'This is your main editing interface. Customize this view based on your item\'s functionality.')}
          </Text>
        </Stack.Item>
      </Stack>
    </div>
  );
};
```

**Key Features**:

- **State Management**: Tracks changes and enables conditional save functionality
- **User Interface**: Clean card-based layout following Fluent UI patterns
- **Change Detection**: Automatically detects when content has been modified
- **Save Integration**: Provides inline save functionality for immediate feedback
- **Localization Support**: Uses translation keys for all user-facing text
- **Responsive Design**: Adapts to different screen sizes and container widths
- **Error Handling**: Includes proper try/catch for save operations

### Step 4.2: OneLakeStorageClient Best Practices

**🚨 CRITICAL**: When working with OneLake storage in item contexts, ALWAYS use the wrapper pattern for correct path handling.

#### ✅ **CORRECT Pattern** - Use createItemWrapper():

```typescript
// ✅ ALWAYS use this pattern for item-scoped OneLake operations
const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
const itemWrapper = oneLakeClient.createItemWrapper({
  id: props.item.id,
  workspaceId: props.item.workspaceId
});

// Now use wrapper methods with relative paths
await itemWrapper.writeFileAsBase64('Files/myfile.txt', base64Content);
const content = await itemWrapper.readFileAsText('Files/myfile.txt');
const fullPath = itemWrapper.getPath('Files/myfile.txt'); // For storage in definitions
```

#### ❌ **WRONG Pattern** - Direct client with manual paths:

```typescript
// ❌ NEVER do this - manual path construction is error-prone
const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
const filePath = `${props.item.id}/Files/myfile.txt`; // Manual path construction
await oneLakeClient.writeFileAsBase64(filePath, base64Content);
```

#### **Key Benefits of Wrapper Pattern:**

- **Automatic Path Prefixing**: Handles workspace/item ID correctly
- **Type Safety**: Ensures correct item context
- **Cleaner API**: Relative paths instead of full OneLake paths  
- **Error Prevention**: Can't accidentally use wrong workspace/item IDs
- **Consistency**: All operations use the same item context

### Step 4.3: OneLakeView Control Usage

**🚨 CRITICAL**: Use the new OneLakeView control for OneLake browsing functionality. Do NOT copy code from the sample.

#### ✅ **CORRECT Pattern** - Use the reusable control:

```typescript
// ✅ Import the OneLakeView control
import { OneLakeView } from '../../../components/OneLakeView';

// ✅ Use the control with proper configuration
<OneLakeView
  workloadClient={props.workloadClient}
  config={{
    mode: "edit", // or "view" for read-only
    allowItemSelection: true,
    allowedItemTypes: ["Lakehouse", "Warehouse", "KQLDatabase"],
    initialItem: {
      id: props.item.id,
      workspaceId: props.item.workspaceId,
      displayName: props.item.displayName
    },
    refreshTrigger: refreshTrigger
  }}
  callbacks={{
    onFileSelected: async (fileName: string, oneLakeLink: string) => {
      // Handle file selection
    },
    onTableSelected: async (tableName: string, oneLakeLink: string) => {
      // Handle table selection  
    },
    onItemChanged: async (item) => {
      // Handle item change (e.g., user selects different item from DataHub)
    }
  }}
/>
```

#### ❌ **WRONG Pattern** - Don't copy from samples:

```typescript
// ❌ NEVER copy SampleOneLakeViewComponent code
// Use the OneLakeView control instead
import { OneLakeViewComponent } from '../../../samples/views/SampleOneLakeView';

// ❌ This is a sample wrapper, not the reusable control
<OneLakeViewComponent ... />
```

#### ❌ **WRONG Pattern** - Missing configuration:

```typescript
// ❌ NEVER do this - control will show empty state without initialItem
<OneLakeView
  workloadClient={props.workloadClient}
  config={{
    mode: "view",
    allowItemSelection: true,
    // ❌ Missing initialItem - control will show empty state
  }}
  callbacks={{}}
/>
```

#### **Key Points:**

- **Use Control Not Sample**: Import from `components/OneLakeView`, not samples
- **initialItem Required**: Control needs current item to load and display content
- **All Properties Needed**: Must include `id`, `workspaceId`, and `displayName`  
- **Empty State Handling**: Control shows add button when no initialItem provided
- **Refresh Support**: Use `refreshTrigger` to force re-fetch when needed
- **Clean API**: config and callbacks are clearly separated

### Step 5: Implement the Ribbon (`[ItemName]ItemRibbon.tsx`)

The ribbon provides toolbar actions and navigation tabs. **🚨 CRITICAL: Use standard Ribbon components!**

```typescript
// Based on HelloWorldItemRibbon.tsx - Demonstrates RECOMMENDED ribbon pattern
import React from "react";
import { PageProps } from '../../App';
import { CurrentView, EDITOR_VIEW_TYPES } from "./[ItemName]ItemDefinition";
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

/**
 * Props interface for the [ItemName] Ribbon component
 */
export interface [ItemName]ItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  currentView: CurrentView;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  navigateToDefaultViewCallback: () => void;
}

/**
 * [ItemName]ItemRibbon - Implements the standard ribbon pattern
 * 
 * This demonstrates the MANDATORY pattern for creating consistent ribbons
 * across all item editors in the Fabric Extensibility Toolkit.
 * 
 * 🚨 REQUIRED COMPONENTS:
 * - Ribbon: Provides consistent ribbon structure and layout
 * - RibbonToolbar: Renders actions with automatic Tooltip + ToolbarButton pattern
 * - createRibbonTabs: Ensures Home tab is always present
 * - Standard action factories: createSaveAction, createSettingsAction
 * 
 * Key Features:
 * - Automatic accessibility (Tooltip + ToolbarButton pattern)
 * - Consistent styling across all item editors
 * - Follows Fabric design guidelines
 * - Support for custom actions when needed
 */
export function [ItemName]ItemRibbon(props: [ItemName]ItemRibbonProps) {
  const { t } = useTranslation();
  
  // Create a translation helper function for action factories
  const translate = (key: string, fallback?: string) => t(key, fallback);
  
  // 🚨 REQUIRED: Define ribbon tabs using createRibbonTabs
  // Home tab is mandatory, additional tabs can be added as second parameter
  const tabs = createRibbonTabs(
    t("ItemEditor_Ribbon_Home_Label")
    // Additional tabs can be added here:
    // [
    //   createDataTab(t("Data")),
    //   createFormatTab(t("Format"))
    // ]
  );
  
  // Define ribbon actions - mix of standard and custom actions
  const actions: RibbonAction[] = [
    // 🚨 STANDARD ACTION: Save button (mandatory for most items)
    // Use createSaveAction factory for consistent behavior
    createSaveAction(
      props.saveItemCallback,
      !props.isSaveButtonEnabled,  // disabled when save not needed
      translate
    ),
    
    // ✅ OPTIONAL ACTION: Settings button (if your item needs settings)
    // Use createSettingsAction factory for consistent behavior when needed
    createSettingsAction(
      props.openSettingsCallback,
      translate
    ),
    
    // ✅ CUSTOM ACTION EXAMPLE: View navigation
    // Define custom actions inline for item-specific functionality
    {
      key: 'navigate-default',
      icon: Rocket24Regular,
      label: t("ItemEditor_Ribbon_Navigate_Label", "Navigate to Default"),
      onClick: props.navigateToDefaultViewCallback,
      testId: 'ribbon-navigate-default-btn',
      hidden: props.currentView !== EDITOR_VIEW_TYPES.EMPTY  // Only show in EMPTY view
    }
  ];
  
  // 🚨 REQUIRED: Use Ribbon + RibbonToolbar pattern
  return (
    <Ribbon tabs={tabs}>
      <RibbonToolbar actions={actions} />
    </Ribbon>
  );
}
```

**🚨 CRITICAL Architecture Requirements**:

1. **Ribbon Component** (MANDATORY):
   - Use `<Ribbon tabs={tabs}>` as the container
   - Provides consistent structure and styling
   - DO NOT create custom ribbon layouts with `<div className="ribbon">`

2. **RibbonToolbar Component** (MANDATORY):
   - Use `<RibbonToolbar actions={actions} />` for action rendering
   - Automatically applies Tooltip + ToolbarButton pattern
   - Handles accessibility and styling automatically
   - DO NOT create custom `<Toolbar>` components

3. **createRibbonTabs Helper** (MANDATORY):
   - Use `createRibbonTabs()` to define tabs
   - Ensures Home tab is always present
   - Accepts Home tab label and optional additional tabs array

4. **Standard Action Factories** (use when needed):
   - `createSaveAction()`: Save button with standard behavior (required for most items)
   - `createSettingsAction()`: Settings button with standard behavior (optional, only if item needs settings)
   - Import from `'../../components/ItemEditor'`

5. **Custom Actions** (when needed):
   - Define inline as `RibbonAction` objects
   - Include: key, icon, label, onClick, testId
   - Optional: disabled, hidden (for conditional visibility)

**❌ INCORRECT Patterns - DO NOT USE**:

```typescript
// ❌ WRONG: Custom ribbon layout
return (
  <div className="ribbon">
    <TabList><Tab>Home</Tab></TabList>
    <Toolbar>
      <Tooltip><ToolbarButton /></Tooltip>
    </Toolbar>
  </div>
);

// ❌ WRONG: Manual Tooltip + ToolbarButton pattern
<Toolbar>
  <Tooltip content="Save" relationship="label">
    <ToolbarButton icon={<Save24Regular />} onClick={onSave} />
  </Tooltip>
</Toolbar>

// ❌ WRONG: Creating custom action factories
export function createCustomSaveAction() { ... }  // Use standard factories instead
```

**✅ CORRECT Pattern**:

```typescript
// ✅ CORRECT: Use standard components and factories
const tabs = createRibbonTabs(t("Home"));
const actions = [
  createSaveAction(onSave, disabled, label),
  createSettingsAction(onSettings, label),
  { key: 'custom', icon: Icon, label, onClick, testId }  // Custom actions inline
];

return (
  <Ribbon tabs={tabs}>
    <RibbonToolbar actions={actions} />
  </Ribbon>
);
```

**Key Benefits**:

- ✅ **Consistency**: Same ribbon pattern across all item editors
- ✅ **Accessibility**: Automatic Tooltip + ToolbarButton implementation
- ✅ **Maintainability**: Changes to ribbon behavior centralized
- ✅ **Type Safety**: TypeScript interfaces ensure correct usage
- ✅ **Less Code**: Factory functions reduce boilerplate
- ✅ **Best Practices**: Follows Fabric design guidelines automatically

### Step 5.1: Create Item-Specific Styles (`[ItemName]Item.scss`)

**🚨 MANDATORY**: Create a separate SCSS file for item-specific styling. This will be verified by the verification team.

**File Location**: `Workload/app/items/[ItemName]Item/[ItemName]Item.scss`

```scss
// [ItemName]Item.scss - Item-specific styles
// Based on HelloWorldItem.scss pattern

// 🚨 IMPORTANT: Contains ONLY item-specific styles
// Components provide their own layout/structure (DO NOT modify control files)

// Example: Item-specific view styling
.[item-name]-view {
  background-color: var(--colorNeutralBackground1);
  padding: var(--spacingVerticalL);
  border-radius: var(--borderRadiusMedium);
}

// Example: Item-specific section headers
.[item-name]-section-title {
  color: var(--colorBrandForeground1);
  font-size: var(--fontSizeBase500);
  font-weight: var(--fontWeightSemibold);
  margin-bottom: var(--spacingVerticalM);
}

// Example: Item-specific hero section
.[item-name]-hero-section {
  background: linear-gradient(135deg, var(--colorBrandBackground), var(--colorBrandBackground2));
  padding: var(--spacingVerticalXXL) var(--spacingHorizontalXL);
  border-radius: var(--borderRadiusLarge);
  color: var(--colorNeutralForegroundOnBrand);
}

// Add other item-specific styles here - NO CONTROL MODIFICATIONS
```

**Import Pattern in Components**:

```tsx
// In [ItemName]ItemEditor.tsx, [ItemName]ItemDefaultView.tsx, [ItemName]ItemRibbon.tsx, etc.
import "./[ItemName]Item.scss";       // Item-specific styles (REQUIRED)
```

**Usage Pattern**:

```tsx
// Apply item-specific classes with clear naming
<div className="[item-name]-view">
  <div className="[item-name]-section-title">
    {/* Item-specific styling and content */}
  </div>
</div>
```

**✅ DO** (Will pass verification):
- Create separate `[ItemName]Item.scss` file with all item-specific styles
- Use item-prefixed class names (`.hello-world-*`, `.data-analyzer-*`, etc.)
- Use Fabric design tokens (`var(--color*, --spacing*, --fontSize*)`)
- Follow BEM naming: `.item-name-element-modifier`
- Import only `[ItemName]Item.scss` in item components

**❌ DON'T** (Will fail verification):
- Modify control files in `Workload/app/components/` directory (ItemEditor, Ribbon, OneLakeView, etc.)
- Duplicate control layout/structure styles in item SCSS
- Use inline styles instead of SCSS file
- Override control structural styles with `!important`
- Create global styles that affect other items

### Step 6: Create Manifest Configuration

#### 6.1: Create XML Manifest Template (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`)

**Use the HelloWorld pattern exactly**:

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

**Key Elements**:

- **Location**: Place in `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`
- **Template Processing**: Use `{{WORKLOAD_NAME}}` placeholder for environment-specific generation
- **Naming Convention**: Follow `[ItemName]Item.xml` pattern
- **Category**: Fabric category (Data, Analytics, etc.)
- **Environment Generation**: Manifest generation will replace placeholders with values from .env files

#### 6.2: Create JSON Manifest (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`)

**Use the HelloWorld pattern as template**:

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

**Key Properties**:

- `name`: Internal item name
- `displayName`/`displayNamePlural`: Localization keys
- `editor.path`: Route path for the editor
- `icon`: Path to item icon in assets
- Hub support flags for where item appears in Fabric UI

### Step 7: Add Routing Configuration

Update `Workload/app/App.tsx` to add the route for your new item:

```typescript
// Add import for your editor
import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

// Add route in the Switch statement
<Route path="/[ItemName]Item-editor/:itemObjectId">
  <[ItemName]ItemEditor {...pageProps} />
</Route>
```

**Route Pattern**:
- Path must match the `editor.path` in the JSON manifest
- Include `:itemObjectId` parameter for item identification
- Route name should follow the pattern: `/[ItemName]Item-editor`

### Step 8: Create Asset Files

#### 8.1: Add Item Icon

Create an icon file: `Workload/Manifest/assets/images/[ItemName]Item-icon.png`
- **Size**: 24x24 pixels recommended
- **Format**: PNG with transparency
- **Style**: Follow Fabric design guidelines

#### 8.2: Create Editor Empty State Asset

Create an empty state illustration: `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg`

**Folder Structure**:
```
Workload/app/assets/items/
└── [ItemName]Item/
    └── EditorEmpty.svg
```

**Requirements**:
- **Format**: SVG (vector format for scalability)
- **Size**: Optimized for display in empty state components
- **Style**: Follow Fabric design system guidelines
- **Content**: Visual representation that communicates the item's purpose when empty

**Usage**: This asset is referenced in the `[ItemName]ItemEmptyView.tsx` component to provide visual guidance when the item has no content yet.

#### 8.3: Add Localization Strings

**🚨 CRITICAL: Two Different Translation Locations**

**Translation files serve different purposes and must be updated separately:**

**For Manifest Files (Product.json, [ItemName]Item.json ONLY)**:
Update `Workload/Manifest/assets/locales/en-US/translations.json`:

```json
{
  // Add these entries to the existing translations - ONLY for manifest references
  "[ItemName]Item_DisplayName": "Your Item Display Name",
  "[ItemName]Item_DisplayName_Plural": "Your Item Display Names",
  "[ItemName]Item_Description": "Description of what this item does"
}
```

**For React Components (App code with useTranslation() ONLY)**:
Update `Workload/app/assets/locales/en-US/translation.json`:

```json
{
  // Add entries for UI components, buttons, messages, etc.
  "[ItemName]ItemEditor_Loading": "Loading [Item Name]...",
  "[ItemName]ItemEditor_LoadError": "Failed to load the [item name] item.",
  "[ItemName]ItemEmptyView_Title": "Get started with [Item Name]",
  "[ItemName]ItemEmptyView_Description": "Description for empty state",
  "[ItemName]ItemRibbon_Save_Label": "Save",
  "[ItemName]ItemRibbon_Settings_Label": "Settings"
}
```

**Key Differences**:
- **Manifest translations** (`Workload/Manifest/assets/locales/`) - ONLY for keys referenced in .json manifest files
- **App translations** (`Workload/app/assets/locales/`) - ONLY for React components using `useTranslation()` hook
- **Never mix these up** - Each location serves a specific build-time purpose

**For Additional Locales**:

- Add corresponding entries in other locale files (e.g., `es/translations.json`)
- Maintain the same keys with translated values

#### 8.4: 🚨 CRITICAL - Update Product.json Configuration

**MANDATORY STEP - DO NOT SKIP**: Update `Workload/Manifest/Product.json` to register your new item in Fabric's create experience. **This step is REQUIRED for your item to appear in create dialogs.**

**Step 8.4.1 - Add to createExperience.cards array**:

The `createExperience.cards` array controls what items appear in Fabric's "Create new item" dialogs. You MUST add your item here.

```json
{
  "createExperience": {
    "description": "Workload_Description",
    "cards": [
      {
        "title": "HelloWorldItem_DisplayName",
        "description": "HelloWorldItem_Description", 
        "itemType": "HelloWorld"
        // ... existing HelloWorld configuration
      },
      {
        "title": "[ItemName]Item_DisplayName",           // ← ADD THIS BLOCK
        "description": "[ItemName]Item_Description",     // ← Use localization key
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
        "itemType": "[ItemName]",                        // ← CRITICAL: Must match JSON manifest "name" field
        "createItemDialogConfig": {
          "onCreationFailure": { "action": "item.onCreationFailure" },
          "onCreationSuccess": { "action": "item.onCreationSuccess" }
        }
      }
    ]
  }
}
```

**Step 8.4.2 - Add to recommendedItemTypes array**:

The `recommendedItemTypes` array controls which items appear on the workload home page as featured/recommended items.

```json
{
  "homePage": {
    "recommendedItemTypes": [
      "HelloWorld",        // ← Existing item
      "[ItemName]"         // ← ADD THIS - Must match itemType in createExperience
    ]
  }
}
```

**⚠️ CRITICAL Requirements**:

- **itemType Consistency**: The `itemType` field in `createExperience.cards` MUST exactly match:
  - The `name` field in your `[ItemName]Item.json` manifest
  - The entry in `recommendedItemTypes` array
- **Localization Keys**: Use translation keys (e.g., `[ItemName]Item_DisplayName`) not hardcoded strings
- **Icon Files**: Ensure icon files exist in `assets/images/` directory
- **Both Arrays Required**: Items need to be in BOTH `createExperience.cards` AND `recommendedItemTypes`

**❌ Common Mistakes - DO NOT DO THIS**:
```json
// WRONG: Missing createExperience.cards entry
{
  "homePage": {
    "recommendedItemTypes": ["HelloWorld", "MyItem"]  // ← Only this, item won't appear in create dialogs
  }
}

// WRONG: Hardcoded strings instead of localization keys  
{
  "title": "My Custom Item",              // ← Should be "[ItemName]Item_DisplayName"
  "description": "Does custom things"     // ← Should be "[ItemName]Item_Description"
}

// WRONG: itemType mismatch
{
  "createExperience": {
    "cards": [{ "itemType": "MyCustomItem" }]     // ← Different from manifest "name"
  },
  "homePage": {
    "recommendedItemTypes": ["MyItem"]            // ← Different from createExperience
  }
}
```

**✅ Correct Pattern - ALWAYS DO THIS**:
```json
{
  "createExperience": {
    "cards": [
      {
        "title": "[ItemName]Item_DisplayName",      // ← Localization key
        "description": "[ItemName]Item_Description", // ← Localization key
        "itemType": "[ItemName]",                   // ← Matches manifest "name"
        // ... complete card configuration
      }
    ]
  },
  "homePage": {
    "recommendedItemTypes": ["[ItemName]"]         // ← Matches itemType above
  }
}
```

**Validation Checklist**:
- [ ] Item added to `createExperience.cards` array
- [ ] Item added to `recommendedItemTypes` array  
- [ ] `itemType` matches JSON manifest `name` field exactly
- [ ] All text uses localization keys (no hardcoded strings)
- [ ] Icon files exist in assets directory
- [ ] `availableIn` array includes appropriate Fabric UI locations

### Step 9: 🚨 CRITICAL - Update Environment Variables

**IMPORTANT**: After creating a new item, you MUST update the `ITEM_NAMES` variable in ALL environment files, or your item will not be included in the build:

1. **Update Workload/.env.dev**:
   ```bash
   # Before
   ITEM_NAMES=HelloWorld
   
   # After - add your new item
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

2. **Update Workload/.env.test**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

3. **Update Workload/.env.prod**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

**Why This Matters**:
- The ITEM_NAMES variable controls which items are included when building the manifest package
- Missing items from this list will NOT appear in the workload
- Each environment can have different sets of items enabled
- This is required for the BuildManifestPackage.ps1 script to include your item

### Step 10: Testing and Validation

1. **Build the project**:
   ```powershell
   cd Workload
   npm run build:test
   ```

2. **Start development server**:
   ```powershell
   npm run start
   ```

3. **Test item creation**:
   - Navigate to Fabric workspace
   - Create new item of your type
   - Verify editor loads correctly
   - Test save/load functionality

### Step 11: Build and Deploy

1. **Build manifest package**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build release**:
   ```powershell
   .\scripts\Build\BuildRelease.ps1
   ```

## Quick Start: Use HelloWorld as Template

**For AI Tools**: Instead of creating empty files, copy and modify the existing HelloWorld item:

### 1. Copy HelloWorld Item Structure
```bash
# Copy the entire HelloWorld item implementation
cp -r Workload/app/items/[ItemName]Item

# Copy the manifest files
cp -r Workload/Manifest/items/[ItemName]Item
```

### 2. Find and Replace Pattern
```bash
# Replace all instances in the copied files:
HelloWorld → [ItemName]
HelloWorldItem → [ItemName]Item
HelloWorldItemDefinition → [ItemName]ItemDefinition
HelloWorldItemEditor → [ItemName]ItemEditor
HelloWorldItemEmptyView → [ItemName]ItemEmptyView
HelloWorldItemDefaultView → [ItemName]ItemDefaultView
HelloWorldItemRibbon → [ItemName]ItemRibbon
```

### 3. Update File Names
```bash
# Rename all files to match the new item name
mv [ItemName]Item/HelloWorldItemDefinition.ts [ItemName]Item/[ItemName]ItemDefinition.ts
mv [ItemName]Item/HelloWorldItemEditor.tsx [ItemName]Item/[ItemName]ItemEditor.tsx
mv [ItemName]Item/HelloWorldItemEmptyView.tsx [ItemName]Item/[ItemName]ItemEmptyView.tsx
mv [ItemName]Item/HelloWorldItemDefaultView.tsx [ItemName]Item/[ItemName]ItemDefaultView.tsx
mv [ItemName]Item/HelloWorldItemRibbon.tsx [ItemName]Item/[ItemName]ItemRibbon.tsx
# Continue for all files...
```

This approach ensures you get a **complete, functional item** rather than empty file structures.

---

## Usage

### Quick Checklist for AI Tools

When creating a new item, ensure all these components are created:

**Implementation Files** (in `Workload/app/items/[ItemName]Item/`):
- [ ] `[ItemName]ItemDefinition.ts` - Data model interface
- [ ] `[ItemName]ItemEditor.tsx` - Main editor component  
- [ ] `[ItemName]ItemEmptyView.tsx` - Empty state component
- [ ] `[ItemName]ItemDefaultView.tsx` - Default/main content view
- [ ] `[ItemName]ItemRibbon.tsx` - Ribbon/toolbar component

**Manifest Files** (in `Workload/Manifest/items/[ItemName]Item/`):
- [ ] `[ItemName]Item.xml` - XML manifest template with placeholders like `{{WORKLOAD_NAME}}`
- [ ] `[ItemName]Item.json` - JSON manifest with editor path and metadata

**product Configuration File** (in `Workload/Manifest/Product.json`):
- [ ] 🚨 **CRITICAL**: Add item to `createExperience.cards` array (item won't appear in create dialogs without this)
- [ ] 🚨 **CRITICAL**: Add item to `recommendedItemTypes` array (item won't appear on home page without this)  
- [ ] Verify `itemType` field matches JSON manifest `name` field exactly
- [ ] Use localization keys for title/description, not hardcoded strings

**Asset Files**:
- [ ] `Workload/Manifest/assets/images/[ItemName]Item-icon.png` - Item icon
- [ ] `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg` - Empty state illustration
- [ ] Localization entries in `Workload/Manifest/assets/locales/*/translations.json`

**Code Integration**:
- [ ] Route added to `Workload/app/App.tsx`
- [ ] Import statement for editor component
- [ ] Route path matches manifest `editor.path`

### Common Patterns

1. **Item Naming**: Use PascalCase for ItemName (e.g., `MyCustomItem`)
2. **File Naming**: Follow pattern `[ItemName]Item[Component].tsx`
3. **Route Naming**: Use kebab-case `/[item-name]-editor/:itemObjectId`
4. **TypeName**: Use dot notation `Org.WorkloadName.ItemName`
5. **Localization Keys**: Use underscore notation `[ItemName]Item_DisplayName`

### Troubleshooting

**Common Issues**:
- **🚨 MOST COMMON**: Item doesn't appear in create dialogs → Check `createExperience.cards` in Product.json
- **Item not on home page**: Missing from `recommendedItemTypes` array in Product.json
- **Route not found**: Ensure route path matches manifest `editor.path`
- **Icon not loading**: Verify icon file exists in assets/images/
- **Localization missing**: Check translation keys in all locale files
- **Save not working**: Verify model interface is properly defined
- **Empty state not showing**: Check onFinishEmpty callback implementation
- **Build errors**: Check `ITEM_NAMES` environment variable includes your item

---

## 🚨 FINAL VERIFICATION - NO EXCEPTIONS

**MANDATORY: Before claiming ANY item creation is complete, verify EVERY item below:**

### 📁 All Files Exist and Are Syntactically Correct
```bash
# Verify these files exist:
ls Workload/app/items/[ItemName]Item/[ItemName]ItemDefinition.ts
ls Workload/app/items/[ItemName]Item/[ItemName]ItemEditor.tsx  
ls Workload/app/items/[ItemName]Item/[ItemName]ItemEmptyView.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]ItemDefaultView.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]ItemRibbon.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]Item.scss
ls Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json
ls Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml
ls Workload/Manifest/assets/images/[ItemName]Item-icon.png
```

### 🚨 CRITICAL: Product.json Updated (MOST MISSED STEP)
```bash
# Verify both these entries exist in Product.json:
grep -n "[ItemName]" Workload/Manifest/Product.json
# Should show entries in BOTH:
# - createExperience.cards array
# - recommendedItemTypes array
```

### ✅ Translations in Correct Locations
```bash
# Manifest translations (for .json files):
grep "[ItemName]Item_DisplayName" Workload/Manifest/assets/locales/en-US/translations.json

# App translations (for React components):
grep "[ItemName]Item" Workload/app/assets/locales/en-US/translation.json
```

### 🏗️ Architecture Compliance
- **Component Discovery**: Used semantic_search to find existing Base* components before coding
- **ItemEditor used**: Check editor uses `<ItemEditor>` not custom layout  
- **Ribbon used**: Check ribbon uses `Ribbon` + `RibbonToolbar`
- **Existing Base Components**: Used ItemEditorView, ItemEditorDetailView etc. instead of reinventing
- **OneLakeStorageClient Wrapper**: Used `createItemWrapper()` for all OneLake operations, no manual path construction
- **OneLakeView Control**: Used control from `components/OneLakeView`, not sample code
- **Version number**: Must be "1.100" (copy from HelloWorld exactly)
- **SCSS overrides only**: Check .scss file doesn't duplicate layout styles

### 🔄 App Integration
- **Route added**: Check `App.tsx` has route for `/[ItemName]Item-editor/:itemObjectId`
- **Imports correct**: All import paths are valid and components exist

**IF ANY VERIFICATION FAILS, THE ITEM IS INCOMPLETE. FIX IT BEFORE PROCEEDING.**


