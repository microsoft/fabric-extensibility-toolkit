---
applyTo: "/Workload/app/items/[ItemName]Item/"
---

# GitHub Copilot Instructions: Create New Workload Item

## � MANDATORY PROCESS - READ THIS FIRST

**BEFORE STARTING ANY ITEM CREATION:**

### 1. 📋 CREATE COMPLETE TODO LIST FIRST
Use the `manage_todo_list` tool to create a comprehensive todo list with ALL steps from the instructions:

```typescript
// REQUIRED TODO ITEMS - DO NOT SKIP ANY:
[
  {id: 1, title: "Read both instruction files", status: "not-started"},
  {id: 2, title: "🔍 DISCOVER EXISTING COMPONENTS - Search for Base* components", status: "not-started"},
  {id: 3, title: "Create [ItemName]ItemDefinition.ts", status: "not-started"},
  {id: 4, title: "Create [ItemName]ItemEditor.tsx", status: "not-started"},
  {id: 5, title: "Create [ItemName]ItemEmptyView.tsx", status: "not-started"},
  {id: 6, title: "Create [ItemName]ItemDefaultView.tsx using Base* components", status: "not-started"},
  {id: 7, title: "Create [ItemName]ItemRibbon.tsx", status: "not-started"},
  {id: 8, title: "Create [ItemName]Item.scss", status: "not-started"},
  {id: 9, title: "Add App.tsx routing", status: "not-started"},
  {id: 10, title: "Create manifest JSON/XML files", status: "not-started"},
  {id: 11, title: "Copy and rename icon file", status: "not-started"},
  {id: 12, title: "Add manifest translations", status: "not-started"},
  {id: 13, title: "Add app translations", status: "not-started"},
  {id: 14, title: "🚨 UPDATE PRODUCT.JSON - CRITICAL", status: "not-started"},
  {id: 15, title: "Verify all steps completed", status: "not-started"}
]
```

### 🔍 MANDATORY COMPONENT DISCOVERY (TODO #2)

**BEFORE CODING ANY VIEW COMPONENTS**, search for existing infrastructure:

**Required Searches (use `semantic_search` tool):**
- `"ItemEditorView left right split layout"`
- `"ItemEditorDetailView left center components"`
- `"ItemEditor* two column layout"`
- `"Base* components [your specific use case]"`

**Available Base Components (MUST USE - DON'T REINVENT):**
- **ItemEditorView**: Left/center split layouts - PERFECT for explorer + content
- **ItemEditorDetailView**: Detail views with actions  
- **ItemEditorEmptyView**: Empty state with tasks
- **Ribbon + RibbonToolbar**: Standard ribbon
- **createSaveAction, createSettingsAction**: Standard actions

**🚨 CRITICAL RULE**: If a Base* component exists for your pattern, YOU MUST USE IT.

### 2. 🔄 DISCIPLINED EXECUTION
- **Mark ONE todo as in-progress before starting work**
- **Complete that specific todo fully**
- **Mark it completed IMMEDIATELY after finishing**
- **Move to next todo - NO SKIPPING**

### 3. 🚨 CRITICAL STEP VERIFICATION
Before marking ANY todo as completed, verify:
- ✅ File exists and is syntactically correct
- ✅ Follows exact patterns from HelloWorld example
- ✅ Uses mandatory architecture components
- ✅ Product.json is updated (Step 13 is MANDATORY)

### 4. 🚫 ANTI-PATTERNS TO AVOID
- ❌ Rushing through "boring" configuration steps
- ❌ Marking todos completed before actually finishing them
- ❌ Skipping Product.json thinking "I'll do it later"
- ❌ Assuming patterns instead of copying exactly
- ❌ Creating files without following HelloWorld version numbers

---

## �🔗 Base Instructions

**REQUIRED**: First read the complete generic instructions at `.ai/commands/item/createItem.md` before proceeding.

This file provides GitHub Copilot-specific enhancements for item creation beyond the base generic process.

## 🤖 GitHub Copilot Enhanced Features

### 🚨 CRITICAL: Mandatory Architecture Patterns

**BEFORE GENERATING ANY ITEM CODE**: All item editors MUST use these standardized components:

1. **ItemEditor Component** (MANDATORY):
   - Container for ALL item editors
   - Import: `import { ItemEditor } from "../../components/ItemEditor";`
   - Provides fixed ribbon + scrollable content layout
   - DO NOT create custom layouts with Stack or div

2. **Standard Ribbon Components** (MANDATORY):
   - `Ribbon`: Ribbon container
   - `RibbonToolbar`: Action toolbar
   - `createRibbonTabs`: Tab creation helper
   - `createSaveAction`: Standard Save button
   - `createSettingsAction`: Standard Settings button
   - Import: `import { Ribbon, RibbonToolbar, createRibbonTabs, createSaveAction, createSettingsAction, RibbonAction } from '../../components/ItemEditor';`

3. **Item-Specific SCSS File** (MANDATORY - VERIFIED):
   - Create `[ItemName]Item.scss` in item folder  
   - Contains ONLY item-specific styles (no component modifications)
   - DO NOT modify any files in `components/` directory
   - Import: `import "./[ItemName]Item.scss";`
   - **Verification team will check this pattern**

### 🚨 CRITICAL: Styling Rules (VERIFIED BY TEAM)

GitHub Copilot MUST follow these styling rules. **Violations will fail verification**:

**✅ REQUIRED**:
1. Create separate `[ItemName]Item.scss` file in item folder
2. Import item styles: `import "./[ItemName]Item.scss";`
3. Use item-prefixed class names: `.[item-name]-view`, `.[item-name]-section-title`
4. Style only item content, not control structure
5. Use design tokens: `var(--colorBrand*, --spacing*, --fontSize*)`
6. **🚫 FORBIDDEN**: Modify any files in `Workload/app/components/` directory
7. **ADD CONTENT PADDING**: ItemEditor panels have zero padding - your content MUST handle its own padding

**🎨 MANDATORY: Content Padding Requirements**

ItemEditorDefaultView panels have **zero internal padding**. Your content components **MUST** add their own padding:

```scss
// [ItemName]Item.scss - REQUIRED content padding
.[item-name]-view {
  padding: var(--spacingVerticalM, 12px);  // ✅ REQUIRED for proper spacing
  width: 100%;
  height: 100%;
  box-sizing: border-box;  // ✅ CRITICAL: Include padding in width/height
  overflow: hidden;        // ✅ Prevent content overflow
  // Your custom styles...
}
```

```tsx
// [ItemName]ItemDefaultView.tsx - Apply padding class to content
<ItemEditorDefaultView
  left={{
    content: <div className="[item-name]-view">{leftContent}</div>  // ✅ Has padding
  }}
  center={{
    content: <div className="[item-name]-view">{centerContent}</div>  // ✅ Has padding  
  }}
/>
```

**❌ PROHIBITED** (Will fail verification):
1. Modifying any files in `Workload/app/components/` directory (ItemEditor, Ribbon, OneLakeView, etc.)
2. Using inline styles instead of SCSS file
3. Duplicating control styles in item SCSS
4. Creating custom ribbon/editor container styles
5. Overriding control structural styles
6. Not creating separate `[ItemName]Item.scss` file
7. **Forgetting content padding** - content will touch panel edges

**Example - Correct Pattern**:
```scss
// [ItemName]Item.scss - ONLY item-specific styles
.[item-name]-view {
  padding: var(--spacingVerticalM, 12px);  // ✅ REQUIRED for content spacing
  // Add your item-specific styles here (colors, typography, spacing)
  // ❌ DON'T duplicate control styles or modify components
}
```

```tsx
// [ItemName]ItemEditor.tsx - Import item styles only
import "./[ItemName]Item.scss";    // ✅ Item-specific styles

// Use item-specific classes
<div className="[item-name]-view">
```

### Smart Code Generation
When creating a new item, GitHub Copilot provides:

#### Auto-Complete Item Structure with ItemEditor
Type `fabric item create [ItemName]` to trigger:
- Automatic 4-file structure generation in `Workload/app/items/[ItemName]Item/`
- **Editor with ItemEditor container** (MANDATORY)
- **Ribbon with standard components** (Ribbon + RibbonToolbar)
- Intelligent TypeScript interface suggestions
- Pre-configured Fluent UI component templates
- Smart import resolution for Fabric APIs
- Manifest template generation with placeholder support

#### Pattern Recognition with Architecture Compliance
GitHub Copilot learns from existing items and suggests:
- **ItemEditor wrapper pattern** (core architecture requirement)
- **Standard Ribbon pattern** (Ribbon + RibbonToolbar architecture)
- **Standard View patterns** (Empty, Default, Detail views)
- Consistent naming conventions ([ItemName]Item pattern with View suffix)
- Similar state management patterns
- Matching component structures
- Proper TypeScript type definitions

**Note**: HelloWorld components serve as sample implementations of the ItemEditor architecture.

### Real-time Validation
- **Manifest Sync Detection**: Warns when implementation doesn't match manifest templates
- **Route Validation**: Suggests route additions when creating new items
- **Import Optimization**: Auto-suggests required imports for Fabric integration
- **Type Safety**: Provides immediate feedback on TypeScript errors
- **Template Processing**: Validates placeholder usage in XML templates

### Context-Aware Suggestions

#### Model Creation (`[ItemName]ItemDefinition.ts`)
```typescript
// Copilot suggests based on existing patterns:
// Model contains ONLY data that needs to be persisted
export interface [ItemName]ItemDefinition {
  // Data that gets saved to Fabric
  message?: string;          // User-entered data
  // NO UI state, view types, or temporary data here
}
```

**Architecture Note**: EDITOR_VIEW_TYPES enum belongs in the Editor component, not the model.

#### Component Templates
GitHub Copilot auto-generates components with:
- Pre-configured Fluent UI components
- Proper error handling patterns
- Integrated authentication flows
- Fabric-specific hooks and utilities

### Intelligent File Relationships
GitHub Copilot understands:
- When to update `App.tsx` routing
- Which manifest files need corresponding updates
- Asset management for icons and translations
- Build script implications

## 🚀 Copilot Quick Actions

### One-Line Item Creation
```typescript
// Type this comment to trigger full item generation:
// fabric create MyCustomItem with fluent ui table editor
```

### Smart Completions with Standard Architecture
- `fabric.editor` → Expands to ItemEditor with ribbon and children pattern
- `fabric.ribbon` → Expands to Ribbon + RibbonToolbar with standard actions
- `fabric.save` → Expands to complete saveWorkloadItem pattern
- `fabric.load` → Expands to complete getWorkloadItem pattern  
- `fabric.notify` → Expands to callNotificationOpen with proper typing
- `fabric.action` → Creates custom RibbonAction object

### Editor Template Expansion (MANDATORY PATTERN - Current ViewSetter System)
When typing `fabric.editor`, GitHub Copilot expands to the CURRENT viewSetter pattern:

```typescript
// 🚨 CORRECT: ItemEditor with viewSetter system
return (
  <ItemEditor
    isLoading={isLoading}
    loadingMessage={t("[ItemName]ItemEditor_Loading", "Loading item...")}
    ribbon={(context) => (
      <[ItemName]ItemRibbon
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
```

**Key Concepts**:
1. **ItemEditor manages loading and view state internally** - pass `isLoading` and `loadingMessage` props
2. **Ribbon receives** `(context)` - ViewContext with `currentView` and `setCurrentView` for navigation
3. **MessageBar uses static registration** - array of RegisteredNotification objects with showInViews targeting
4. **Views uses static array** - no function wrapper, direct array of view objects
5. **viewSetter prop** - receives ItemEditor's internal setCurrentView function for programmatic control
6. **useEffect for automatic view switching** - calls stored viewSetter when item loading completes

**View Registration Pattern**:
```typescript
// Static view definitions - no function wrapper needed!
const views = [
  {
    name: EDITOR_VIEW_TYPES.EMPTY,
    component: <EmptyViewWrapper />
  },
  {
    name: EDITOR_VIEW_TYPES.DEFAULT,
    component: <DefaultViewWrapper />
  }
];

// State to store the view setter function
const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);

// Effect to set correct view after loading completes
useEffect(() => {
  if (!isLoading && item && viewSetter) {
    const correctView = !item?.definition?.message ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT;
    viewSetter(correctView);
  }
}, [isLoading, item, viewSetter]);
```

**View Navigation with useViewNavigation Hook**:
```typescript
// Wrapper component for views that need navigation
const EmptyViewWrapper = () => {
  const { setCurrentView } = useViewNavigation();
  
  return (
    <[ItemName]ItemEmptyView
      onNavigateToGettingStarted={() => {
        // Update state then navigate
        setCurrentDefinition(prev => ({ ...prev, message: "Hello!" }));
        setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
      }}
    />
  );
};
```

**MessageBar Static Registration**:
```typescript
// Static notification definitions
const notifications: RegisteredNotification[] = [
  {
    name: 'welcome-message',
    showInViews: [EDITOR_VIEW_TYPES.DEFAULT], // Only show in DEFAULT view
    component: showWarning ? (
      <MessageBar intent="info">
        <MessageBarBody>Welcome to your new item!</MessageBarBody>
      </MessageBar>
    ) : null
  }
];
```

**❌ NEVER generate these patterns that don't match current implementation**:
```typescript
// ❌ WRONG 1: Old function-based patterns
return (
  <ItemEditor
    views={(setCurrentView) => [...]}           // ❌ Views is now static array
    ribbon={(currentView, setCurrentView) => ...} // ❌ Ribbon receives context object
  />
);

// ❌ WRONG 2: Manual view switching with if/else  
const [currentView, setCurrentView] = useState('empty');
return (
  <ItemEditor ribbon={<Ribbon />}>
    {currentView === 'empty' ? <Empty /> : <Main />}
  </ItemEditor>
);

// ❌ WRONG 3: Old getInitialView pattern (deprecated)
<ItemEditor
  getInitialView={getInitialView} // ❌ Should use viewSetter prop instead
/>

// ❌ WRONG 4: Missing viewSetter for programmatic control
<ItemEditor
  views={views}  // ❌ Missing viewSetter prop for automatic view switching
/>
```

### Ribbon Template Expansion (MANDATORY PATTERN)
When typing `fabric.ribbon`, GitHub Copilot expands to:
```typescript
// 🚨 CORRECT: Ribbon with standard components
const tabs = createRibbonTabs(t("ItemEditor_Ribbon_Home_Label"));
const actions: RibbonAction[] = [
  createSaveAction(onSave, !isSaveEnabled, t("Save")),
  createSettingsAction(onSettings, t("Settings")),
  { key: 'custom', icon: Icon, label: t("Custom"), onClick: onCustom, testId: 'custom-btn' }
];

return (
  <Ribbon tabs={tabs}>
    <RibbonToolbar actions={actions} />
  </Ribbon>
);
```

**❌ NEVER generate this OLD pattern**:
```typescript
// ❌ WRONG: Manual Toolbar with Tooltip wrapping
return (
  <div className="ribbon">
    <TabList><Tab>Home</Tab></TabList>
    <Toolbar>
      <Tooltip content="Save" relationship="label">
        <ToolbarButton icon={<Save24Regular />} onClick={onSave} />
      </Tooltip>
    </Toolbar>
  </div>
);
```

### SCSS File Generation (MANDATORY - VERIFIED)
When creating a new item, GitHub Copilot MUST generate `[ItemName]Item.scss`:

```scss
// 🚨 CORRECT: Item-specific styles only (2-tier architecture)
// [ItemName]Item.scss

// Content padding for proper spacing (typically required)
.[item-name]-view {
  padding: var(--spacingVerticalM, 12px);  // Prevent content from touching edges
}

// Item-specific branding and styling
.[item-name]-settings-panel-container {
  background-color: var(--colorBrandBackground2);
  color: var(--colorBrandForeground2);
  
  .item-settings-section-header {
    color: var(--colorBrandForeground1);
  }
}

// Hero section with item branding
.[item-name]-hero-section {
  background: linear-gradient(135deg, var(--colorBrandBackground), var(--colorBrandBackground2));
}
```

**❌ NEVER generate**:
```scss
// ❌ WRONG: Don't duplicate control structural styles  
.item-name-settings-panel-container {
  display: flex;              // ❌ Components handle their own layout
  flex-direction: column;     // ❌ Components handle their own layout
  padding: 24px;              // ❌ Components handle their own padding
  background-color: blue;     // ✅ Only item-specific styles like this
}
```

**Import Pattern in Every Component**:
```typescript
// ✅ CORRECT: Import only item-specific styles
import "./[ItemName]Item.scss";    // Item-specific styles only
```

### Auto-Import Intelligence
GitHub Copilot automatically suggests and adds:
```typescript
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { Stack, TextField, PrimaryButton } from "@fluentui/react";
import { getWorkloadItem, saveWorkloadItem } from "../../controller/ItemCRUDController";
```

### Template Expansion with Standard Architecture
When creating components, GitHub Copilot expands to MANDATORY patterns:
- **Editor components**: ItemEditor container with ribbon and children
- **Ribbon components**: Ribbon + RibbonToolbar with standard actions
- **Empty state components**: Proper onboarding flow with navigation callback
- **Model interfaces**: Fabric-compatible data types for persisted state only
- **Editor view types**: EDITOR_VIEW_TYPES enum defined in the Editor component
- **SCSS files**: Separate `[ItemName]Item.scss` with item-specific styles only (2-tier architecture)

## ✅ Pre-Generation Verification Checklist

Before generating any item code, GitHub Copilot should verify:

**Architecture Compliance** (MANDATORY):
- [ ] Editor uses `<ItemEditor>` container with view registration
- [ ] View registration pattern: `views={(setCurrentView) => [...]}`
- [ ] Ribbon render prop: `ribbon={(currentView, setCurrentView) => ...}`
- [ ] Notification render prop: `notification={(currentView) => ...}`
- [ ] Initial view expression: `initialView={!item?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT}`
- [ ] Detail views use `<ItemEditorDetailView>` component
- [ ] Detail views define `DetailViewAction[]` for ribbon
- [ ] Back navigation provided in detail views
- [ ] Ribbon uses `<Ribbon>` + `<RibbonToolbar>`
- [ ] Standard action factories used (`createSaveAction`, `createSettingsAction`)
- [ ] No custom Stack/div layouts for editor container
- [ ] No manual Tooltip + ToolbarButton wrapping
- [ ] No manual view state management (useState for currentView) in parent

**Styling Compliance** (VERIFIED BY TEAM):
- [ ] `[ItemName]Item.scss` file created in item folder
- [ ] Item styles imported: `./[ItemName]Item.scss` (no global imports)
- [ ] Item-specific class naming used: `.[item-name]-view`, etc.
- [ ] Only item content styled, not control structure
- [ ] Design tokens used: `var(--color*, --spacing*, --fontSize*)`
- [ ] No modifications to any files in `Workload/app/components/` directory

**File Structure** (REQUIRED):
- [ ] `[ItemName]ItemDefinition.ts` - Data model with persisted state interfaces only
- [ ] `[ItemName]ItemEditor.tsx` - Main editor with ItemEditor + view registration + EDITOR_VIEW_TYPES enum
- [ ] `[ItemName]ItemEmptyView.tsx` - Empty state component (onboarding)
- [ ] `[ItemName]ItemDefaultView.tsx` - Main/default view component
- [ ] `[ItemName]ItemRibbon.tsx` - Ribbon with standard components
- [ ] `[ItemName]Item.scss` - Item-specific style overrides

**Import Verification**:
- [ ] `import { ItemEditor } from "../../components/ItemEditor";` (loading handled internally)
- [ ] `import { ItemEditorDetailView, DetailViewAction } from "../../components/ItemEditor";` (for detail views only)
- [ ] `import { Ribbon, RibbonToolbar, createSaveAction, createSettingsAction } from '../../components/ItemEditor';`
- [ ] `import "./[ItemName]Item.scss";` (item-specific styles only)
- [ ] No import of `RegisteredView` type (not needed, inline definition sufficient)

## 🎯 Workspace Intelligence

### Context Detection
GitHub Copilot detects:
- **ItemEditor architecture** as the primary pattern (mandatory for all items)
- **Standard View patterns** in HelloWorld sample implementation (Empty, Default, Detail views)
- **Standard Ribbon pattern** in HelloWorld sample implementation as reference
- Existing item patterns to maintain consistency
- Available Fabric API clients in the workspace
- Component libraries already in use
- Authentication patterns from other items

**Note**: HelloWorld serves as a sample implementation of ItemEditor architecture - the ItemEditor components are the foundation.

### Architecture Validation
- **Verifies ItemEditor usage**: Warns if custom layouts are detected
- **Checks Ribbon components**: Ensures Ribbon + RibbonToolbar pattern
- **Validates action factories**: Confirms use of createSaveAction, createSettingsAction
- **Suggests manifest updates** when items are created
- **Validates TypeScript compilation** in real-time
- **Checks for missing dependencies**
- **Ensures proper export statements**

### Error Prevention with Architecture Compliance
- **Warns about missing ItemEditor**: Prevents custom layout implementations
- **Warns about manual Tooltip + ToolbarButton**: Suggests RibbonToolbar instead
- **Warns about custom ribbon layouts**: Requires Ribbon component
- Warns about common Fabric integration mistakes
- Suggests proper error handling for async operations
- Validates component prop interfaces
- Checks for proper cleanup in useEffect hooks

---

**Reference**: For complete step-by-step instructions, always consult `.ai/commands/item/createItem.md` first, then apply these Copilot-specific enhancements.

## 🚨 MANDATORY: Step 3 Editor Implementation Pattern (Current ViewSetter System)

**Purpose**:
- Create main editor component with ItemEditor
- MUST use viewSetter prop for programmatic view control
- MUST use useEffect to automatically switch views after item loads
- ItemEditor manages view state internally with loading support
- Views, ribbon, and notifications access current view via ViewContext

**🚨 CRITICAL**: GitHub Copilot MUST generate the CURRENT pattern with viewSetter and useEffect for automatic view switching:

```typescript
// 🚨 CORRECT: ItemEditor with current viewSetter implementation pattern
import { ItemEditor, useViewNavigation, RegisteredNotification } from "../../components/ItemEditor";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";

/**
 * Different views that are available for the [ItemName] item
 */
export const EDITOR_VIEW_TYPES = {
  EMPTY: 'empty',
  DEFAULT: 'default',
} as const;

export function [ItemName]ItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const { t } = useTranslation();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<[ItemName]ItemDefinition>>();
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState<[ItemName]ItemDefinition>({});
  const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);

  // Load item data with optimization to prevent unnecessary reloads
  useEffect(() => {
    async function loadItem() {
      // Performance optimization: Prevent unnecessary reload if the same item is already loaded
      if (itemObjectId && item && item.id === itemObjectId) {
        console.log(`Item ${itemObjectId} is already loaded, skipping reload`);
        return;
      }
      
      setIsLoading(true);
      const loadedItem = await getWorkloadItem<[ItemName]ItemDefinition>(
        workloadClient, 
        itemObjectId
      );
      setItem(loadedItem);
      setCurrentDefinition(loadedItem.definition || {});
      setIsLoading(false);
    }
    loadItem();
  }, [itemObjectId]);

  // 🚨 CRITICAL: Effect to set the correct view after loading completes
  useEffect(() => {
    if (!isLoading && item && viewSetter) {
      // Determine the correct view based on item state
      const correctView = !item?.definition?.message ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT;   
      viewSetter(correctView);
    }
  }, [isLoading, item, viewSetter]);

  // Handlers
  const handleSave = async () => {
    // Update the item definition with current values
    item.definition = {
        ...currentDefinition,
        message: currentDefinition.message || "Hello, Fabric!"
      }

    var successResult = await saveWorkloadItem<[ItemName]ItemDefinition>(
      workloadClient,
      item,
      );
    const wasSaved = Boolean(successResult);
    setHasBeenSaved(wasSaved);
  };

  const isSaveEnabled = (currentView: string) => {
    return currentView !== EDITOR_VIEW_TYPES.EMPTY && !hasBeenSaved;
  };

  // Wrapper component for empty view that uses navigation hook
  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    
    return (
      <[ItemName]ItemEmptyView
        workloadClient={workloadClient}
        item={item}
        onNavigateToGettingStarted={() => {
          setCurrentDefinition(prev => ({ ...prev, message: "Hello!" }));
          setHasBeenSaved(false);
          setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
        }}
      />
    );
  };

  // Wrapper component for default view
  const DefaultViewWrapper = () => {
    return (
      <[ItemName]ItemDefaultView
        workloadClient={workloadClient}
        item={item}
        definitionData={currentDefinition}
        onDataChange={(newData) => {
          setCurrentDefinition(newData);
          setHasBeenSaved(false);
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
      component: <DefaultViewWrapper />
    }
  ];

  // Static notification definitions
  const notifications: RegisteredNotification[] = [
    {
      name: 'welcome-message',
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT], // Only show in DEFAULT view
      component: (
        <MessageBar intent="info">
          <MessageBarBody>Welcome to your new item!</MessageBarBody>
        </MessageBar>
      )
    }
  ];

  return (
    <ItemEditor
      isLoading={isLoading}
      loadingMessage={t("[ItemName]ItemEditor_Loading", "Loading item...")}
      ribbon={(context) => (
        <[ItemName]ItemRibbon
          {...props}
          viewContext={context}
          isSaveButtonEnabled={isSaveEnabled(context.currentView)}
          saveItemCallback={handleSave}
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
```

**❌ NEVER generate these outdated patterns**:
```typescript
// ❌ WRONG 1: Function-based view props (old pattern)
<ItemEditor
  views={(setCurrentView) => [...]}           // ❌ Now static array with viewSetter
  ribbon={(currentView, setCurrentView) => ...} // ❌ Now receives context object
/>

// ❌ WRONG 2: Missing viewSetter prop
<ItemEditor
  views={views}  // ❌ Missing viewSetter for programmatic control
/>

// ❌ WRONG 3: Missing automatic view switching effect
export function MyItemEditor() {
  // ❌ Missing useEffect to switch views after loading
  return <ItemEditor views={views} />
}
```

**Key Architecture Points**:
1. **viewSetter prop** - Receives the ItemEditor's internal setCurrentView function
2. **viewSetter state** - Store the function to use after item loading completes  
3. **Automatic view switching** - useEffect calls viewSetter to switch views based on item state
4. **Static view array** - views is a static array, not a function
5. **ViewContext pattern** - ribbon receives (context) with currentView and setCurrentView
6. **Loading support** - Pass isLoading and loadingMessage props to ItemEditor
7. **useViewNavigation hook** - Views that need navigation use this hook in wrapper components

**Critical Implementation Details**:
1. **Must store viewSetter function**: `const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);`
2. **Must provide viewSetter callback**: Pass function to ItemEditor that stores the setCurrentView function
3. **Must include automatic view switching effect**: useEffect that calls viewSetter when item loads
4. **Must check all conditions**: Only call viewSetter when `!isLoading && item && viewSetter`

---

## 🚨 MANDATORY: Step 3.5 Detail Views (L2/Level 2 Pages) Pattern

**Purpose**:
- Create detail/drill-down pages for specific records or sub-sections
- MUST use ItemEditorDetailView as foundation
- Detail views have their own ribbon actions (context-specific)
- Back button navigation built-in

**When to Use Detail Views**:
- Viewing/editing individual records from a list
- Drill-down into specific configurations
- Multi-step workflows requiring focused views
- Any "Level 2" (L2) page accessed from main view

**🚨 CRITICAL**: Detail views MUST be based on ItemEditorDetailView:

```typescript
// 🚨 CORRECT: Detail view using ItemEditorDetailView
import { ItemEditorDetailView, DetailViewAction } from "../../components/ItemEditor";

interface [ItemName]ItemDetailViewProps {
  workloadClient: WorkloadClientAPI;
  item: ItemWithDefinition<[ItemName]ItemDefinition>;
  recordId: string;
}

export function [ItemName]ItemDetailView({
  workloadClient,
  item,
  recordId,
  onBack
}: [ItemName]ItemDetailViewProps) {
  const { t } = useTranslation();
  const [record, setRecord] = useState<RecordType>();
  const [actions, setActions] = useState<DetailViewAction[]>([]);
  
  // Load record data
  useEffect(() => {
    async function loadRecord() {
      const data = await fetchRecord(recordId);
      setRecord(data);
    }
    loadRecord();
  }, [recordId]);
  
  // Define detail view specific actions
  useEffect(() => {
    const detailActions: DetailViewAction[] = [      {
        id: 'save-detail',
        label: t('Save'),
        icon: <Save24Regular />,
        onClick: handleSaveDetail,
        appearance: 'primary',
        testId: 'save-detail-btn'
      },
      {
        id: 'delete',
        label: t('Delete'),
        icon: <Delete24Regular />,
        onClick: handleDelete,
        appearance: 'subtle',
        testId: 'delete-btn'
      }
    ];
    setActions(detailActions);
  }, [record, onBack]);
  
  // Detail view content
  const detailContent = (
    <Stack tokens={{ childrenGap: 16 }} style={{ padding: '24px' }}>
      <Text size={500} weight="semibold">{record?.name}</Text>
      <TextField label={t('Name')} value={record?.name} onChange={...} />
      <TextField label={t('Description')} value={record?.description} onChange={...} />
      {/* More detail fields */}
    </Stack>
  );
  
  return (
    <ItemEditorDetailView
      center={detailContent}
      actions={actions}
      onActionsChange={setActions}  // Propagates to ribbon
    />
  );
}
```

**Integrating Detail Views with View Registration**:

```typescript
// In [ItemName]ItemEditor.tsx
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
            onClick: () => setCurrentView(EDITOR_VIEW_TYPES.DETAIL),
            appearance: 'primary'
          }
        ]}
      />
    )
  },
  {
    name: EDITOR_VIEW_TYPES.DETAIL,
    component: (
      <[ItemName]ItemDefaultView
        workloadClient={workloadClient}
        item={item}
        // Navigate to detail view
        onShowDetail={(recordId) => setCurrentView(`detail-${recordId}`)}
      />
    )
  },
  // Dynamic detail views
  ...(selectedRecordId ? [{
    name: `detail-${selectedRecordId}`,
    component: (
      <[ItemName]ItemDetailView
        workloadClient={workloadClient}
        item={item}
        recordId={selectedRecordId}
        // Navigate back to main
        onBack={() => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT)}
      />
    )
  }] : [])
]}
```

**Detail View Ribbon Actions**:

```typescript
// Ribbon automatically receives actions from ItemEditorDetailView
ribbon={(currentView, setCurrentView) => {
  // Detail views expose their actions via DetailViewAction[]
  const isDetailView = currentView.startsWith('detail-');
  
  return (
    <[ItemName]ItemRibbon
      currentView={currentView}
      onViewChange={setCurrentView}
      // Ribbon shows different actions based on view
      showDetailActions={isDetailView}
    />
  );
}}
```

**Key Detail View Concepts**:
1. **ItemEditorDetailView** - Foundation for all detail pages
2. **DetailViewAction** - Context-specific actions (save, delete, back)
3. **onActionsChange** - Propagates actions to ribbon automatically
4. **Back navigation** - Always provide way back to parent view
5. **Dynamic views** - Generate detail views based on selected record

**❌ NEVER create detail views without ItemEditorDetailView**:
```typescript
// ❌ WRONG: Custom detail view without standard foundation
export function DetailView() {
  return (
    <Stack>
      <div className="custom-header">
        <Button onClick={onBack}>Back</Button>
      </div>
      <div className="custom-content">{content}</div>
    </Stack>
  );
}
```

---

## 🚨 MANDATORY: Step 5 Ribbon Implementation Pattern

## 🚨 MANDATORY: Step 5 Ribbon Implementation Pattern

**Purpose**:
- Create ribbon with standard components
- MUST use Ribbon as container
- MUST use RibbonToolbar for actions
- MUST use standard action factories

**🚨 CRITICAL**: GitHub Copilot MUST generate this pattern:

```typescript
// 🚨 CORRECT: Ribbon with standard components
import { 
  Ribbon, 
  RibbonToolbar, 
  RibbonAction,
  createSaveAction,
  createSettingsAction,
  createRibbonTabs
} from '../../components/ItemEditor';

export function [ItemName]ItemRibbon(props: [ItemName]ItemRibbonProps) {
  const { t } = useTranslation();
  
  const tabs = createRibbonTabs(t("ItemEditor_Ribbon_Home_Label"));
  
  const actions: RibbonAction[] = [
    createSaveAction(props.saveItemCallback, !props.isSaveButtonEnabled, t("Save")),
    createSettingsAction(props.openSettingsCallback, t("Settings")),
    // Custom actions inline:
    { 
      key: 'custom', 
      icon: CustomIcon24Regular, 
      label: t("Custom"), 
      onClick: props.customCallback,
      testId: 'custom-btn'
    }
  ];
  
  return (
    <Ribbon tabs={tabs}>
      <RibbonToolbar actions={actions} />
    </Ribbon>
  );
}
```

**❌ NEVER generate**:
```typescript
// ❌ WRONG: Manual Toolbar with Tooltip wrapping
return (
  <div className="ribbon">
    <TabList><Tab>Home</Tab></TabList>
    <Toolbar>
      <Tooltip content="Save" relationship="label">
        <ToolbarButton icon={<Save24Regular />} onClick={onSave} />
      </Tooltip>
    </Toolbar>
  </div>
);
```

**Key Requirements**:
- Import from `'../../components/ItemEditor'`
- Use `createRibbonTabs()` for tabs
- Use `createSaveAction()` and `createSettingsAction()` for standard actions
- Define custom actions inline as `RibbonAction` objects
- Return `<Ribbon><RibbonToolbar /></Ribbon>` structure

---

## 📋 DEPRECATED Patterns (DO NOT USE)

The following section shows the OLD pattern that GitHub Copilot should NOT generate:

### ❌ DEPRECATED: Old Ribbon Implementation Pattern

The following shows the OLD pattern with manual Toolbar and Tooltip wrapping. **This pattern is DEPRECATED and should NOT be generated by GitHub Copilot.**

**⚠️ WARNING**: This code example is kept for reference only. DO NOT generate code following this pattern.

```typescript
// ❌❌❌ DEPRECATED PATTERN - DO NOT USE ❌❌❌
// This example shows what NOT to do
import React from "react";
import { Tab, TabList } from '@fluentui/react-tabs';
import { Toolbar } from '@fluentui/react-toolbar';
import {
  ToolbarButton, Tooltip
} from '@fluentui/react-components';
import {
  Save24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { PageProps } from '../../App';
import './[ItemName]Item.scss';  // ❌ WRONG: Should use standard components instead
import { t } from "i18next";

const [ItemName]ItemEditorRibbonHomeTabToolbar = (props: [ItemName]ItemEditorRibbonProps) => {
  
  async function onSaveClicked() {
    await props.saveItemCallback();
    return;
  }

  async function onCustomActionClicked() {
    // Add your custom action logic here
    return;
  }

  return (
    <Toolbar>
      <Tooltip
        content={t("[ItemName]Item_Ribbon_Save_Label")}
        relationship="label">
        <ToolbarButton
          disabled={!props.isSaveButtonEnabled}
          aria-label={t("[ItemName]Item_Ribbon_Save_Label")}
          data-testid="[ItemName]-item-editor-save-btn"
          icon={<Save24Regular />}
          onClick={onSaveClicked} />
      </Tooltip>
      <Tooltip
        content={t("[ItemName]Item_Ribbon_Settings_Label")}
        relationship="label">
        <ToolbarButton
          aria-label={t("[ItemName]Item_Ribbon_Settings_Label")}
          data-testid="[ItemName]-item-editor-settings-btn"
          icon={<Settings24Regular />}
          onClick={onCustomActionClicked} />
      </Tooltip>
    </Toolbar>
  );
};

export interface [ItemName]ItemEditorRibbonProps extends PageProps {
  isRibbonDisabled?: boolean;
  isSaveButtonEnabled?: boolean;
  saveItemCallback: () => Promise<void>;
  onTabChange?: (tabValue: string) => void;
  selectedTab?: string;
}

export function [ItemName]ItemEditorRibbon(props: [ItemName]ItemEditorRibbonProps) {
  const { isRibbonDisabled } = props;
  
  return (
    <div className="ribbon">
      <TabList disabled={isRibbonDisabled}>
        <Tab value="home" data-testid="home-tab-btn">
          {t("[ItemName]Item_Ribbon_Home_Label")}
        </Tab>
      </TabList>
      <div className="toolbarContainer">
        <[ItemName]ItemEditorRibbonHomeTabToolbar {...props} />
      </div>
    </div>
  );
}
// ❌❌❌ END DEPRECATED PATTERN ❌❌❌
```

**Why This Pattern is DEPRECATED**:
- ❌ Manual Tooltip wrapping - repetitive and error-prone
- ❌ Custom ribbon div - not using Ribbon component
- ❌ No standardization - each ribbon implements differently
- ❌ Accessibility issues - inconsistent implementation
- ❌ Hard to maintain - changes require updates in all ribbons
- ❌ More code - ~80 lines vs ~30 lines with Ribbon pattern

**✅ USE THIS INSTEAD**: See "MANDATORY: Step 5 Ribbon Implementation Pattern" above for the correct Ribbon + RibbonToolbar pattern with action factories.

---

## 📋 Manifest Configuration (Step 6)

### Step 6: Create Manifest Configuration

#### 6.1: Create XML Manifest Template (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`)

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

**GitHub Copilot Enhancement**: 
- Auto-suggests placeholder patterns like `{{WORKLOAD_NAME}}` for environment-specific generation
- Validates XML structure against Fabric schemas
- Recognizes template processing patterns

#### 6.2: Create JSON Manifest (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`)

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
  "supportedInMonitoringHub": true,
  "supportedInDatahubL1": true,
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

#### 8.2: Add Localization Strings

**🚨 CRITICAL: Two Different Translation Locations**

**Translation files serve different purposes and must be updated separately:**

**For Manifest Files (Product.json, [ItemName]Item.json ONLY)**:
Update `Workload/Manifest/assets/locales/en-US/translations.json`:

```json
{
  // Add these entries to the existing translations
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
  "[ItemName]Item_Loading": "Loading [Item Name]...",
  "[ItemName]Item_SaveSuccess": "[Item Name] saved successfully",
  "[ItemName]Item_Ribbon_Save_Label": "Save",
  "[ItemName]Item_Ribbon_Settings_Label": "Settings"
}
```

**Key Differences**:
- **Manifest translations** (`Workload/Manifest/assets/locales/`) - ONLY for keys referenced in .json manifest files
- **App translations** (`Workload/app/assets/locales/`) - ONLY for React components using `useTranslation()` hook
- **Never mix these up** - Each location serves a specific build-time purpose

**For Additional Locales**:
- Add corresponding entries in other locale files (e.g., `es/translations.json`)
- Maintain the same keys with translated values
- Update BOTH manifest and app translation files

#### 8.3: 🚨 CRITICAL: Update Product.json Configuration

**MANDATORY STEP - DO NOT SKIP**: Update `Workload/Manifest/Product.json` to register your new item in Fabric's create experience. This step is REQUIRED for your item to appear in create dialogs.

**Step 8.3.1: Add to createExperience.cards array**:
```json
{
  "createExperience": {
    "cards": [
      {
        "title": "HelloWorldItem_DisplayName", // ← Existing item
        "itemType": "HelloWorld"
      },
      {
        "title": "[ItemName]Item_DisplayName",           // ← ADD THIS
        "description": "[ItemName]Item_Description",     // ← ADD THIS  
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
        "itemType": "[ItemName]",                        // ← CRITICAL: Must match JSON manifest name
        "createItemDialogConfig": {
          "onCreationFailure": { "action": "item.onCreationFailure" },
          "onCreationSuccess": { "action": "item.onCreationSuccess" }
        }
      }
    ]
  }
}
```

**Step 8.3.2: Add to recommendedItemTypes array**:
```json
{
  "homePage": {
    "recommendedItemTypes": [
      "HelloWorld",        // ← Existing item
      "[ItemName]"         // ← ADD THIS - Must match itemType above
    ]
  }
}
```

**⚠️ CRITICAL NOTES**:
- **createExperience.cards**: Controls what appears in "Create new item" dialogs
- **recommendedItemTypes**: Controls what's featured on the workload home page  
- **itemType field**: Must EXACTLY match the "name" field in your JSON manifest
- **Localization**: Use translation keys (e.g., `[ItemName]Item_DisplayName`) not hardcoded text
- **availableIn**: Controls where the create button appears in Fabric UI

**❌ WRONG - Missing createExperience**:
```json
// DON'T DO THIS - Item won't appear in create dialogs
{
  "homePage": {
    "recommendedItemTypes": ["HelloWorld", "MyItem"]  // ← Only this, missing createExperience
  }
}
```

**✅ CORRECT - Complete configuration**:
```json
// DO THIS - Item will appear everywhere it should
{
  "createExperience": {
    "cards": [/* ... include your item card ... */]     // ← REQUIRED
  },
  "homePage": {
    "recommendedItemTypes": ["HelloWorld", "MyItem"]    // ← ALSO REQUIRED
  }
}
```

**GitHub Copilot Enhancement**: 
- Auto-detects when Product.json updates are missing
- Suggests complete createExperience configuration patterns
- Validates itemType consistency across manifest files

### Step 9: 🚨 CRITICAL: Update Environment Variables

**IMPORTANT**: After creating a new item, you MUST update the `ITEM_NAMES` variable in ALL environment files, or your item will not be included in the build:

1. **Update `Workload/.env.dev`**:
   ```bash
   # Current repository has HelloWorld item
   ITEM_NAMES=HelloWorld
   
   # After adding your new item
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

2. **Update `Workload/.env.test`**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

3. **Update `Workload/.env.prod`**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

**Why This Matters**: The `ITEM_NAMES` variable controls which items are included when building the manifest package. If you forget this step, your new item won't appear in the workload.

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

## Step 11: Update Product.json Configuration

**🚨 CRITICAL: Product.json Must Be Updated for Item Visibility**

The `Workload/Manifest/Product.json` file controls which items appear in Fabric's create experience and home page. **Without updating this file, your new item will not be discoverable by users.**

### 11.1: Add to createExperience.cards

Add your item to the cards array for the create hub:

```json
{
  "createExperience": {
    "cards": [
      // ... existing cards ...
      {
        "title": "[ItemName]Item_DisplayName",           // ← ADD THIS
        "description": "[ItemName]Item_Description",     // ← ADD THIS  
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
        "itemType": "[ItemName]",                        // ← CRITICAL: Must match JSON manifest name
        "createItemDialogConfig": {
          "onCreationFailure": { "action": "item.onCreationFailure" },
          "onCreationSuccess": { "action": "item.onCreationSuccess" }
        }
      }
    ]
  }
}
```

### 11.2: Add to recommendedItemTypes

Add your item to the recommended types for the home page:

```json
{
  "homePage": {
    "newSection": {
      "recommendedItemTypes": [
        "HelloWorld", // ... existing items ...
        "[ItemName]Item"  // Add your item here
      ]
    }
  }
}
```

### 11.3: Verification

After updating Product.json:
1. The item should appear in the "Create" hub in Fabric
2. The item should be recommended on the home page
3. Use translation keys defined in `Workload/Manifest/assets/locales/en-US/translations.json`

**Example Complete Entry**:
```json
{
  "createExperience": {
    "cards": [
       {
          "title": "SampleItem_DisplayName",
          "description": "SampleItem_Description",
          "icon": {
            "name": "assets/images/SampleItem-icon.png"
          },
          "icon_small": {
            "name": "assets/images/SampleItem-icon.png"
          },
          "availableIn": [
            "home",
            "create-hub",
            "workspace-plus-new",
            "workspace-plus-new-teams"
          ],
          "itemType": "SampleItem",
          "createItemDialogConfig": {
            "onCreationFailure": { "action": "item.onCreationFailure" },
            "onCreationSuccess": { "action": "item.onCreationSuccess" }
          }
        }
    ]
  },
  "homePage": {
    "newSection": {
      "recommendedItemTypes": [
        "HelloWorld",
        "SampleItem"  
      ]
    }
  }
}
```

### Step 12: Build and Deploy

1. **Build manifest package**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build release**:
   ```powershell
   .\scripts\Build\BuildRelease.ps1
   ```

## Current Repository Structure

The repository currently contains one fully implemented item:

**Implemented Items**:
- `HelloWorldItem` - A sample implementation demonstrating ItemEditor architecture and standard patterns

**Core Architecture Focus**:
The ItemEditor component system is the foundation. HelloWorld serves as one example of how to implement it.

**Repository Items Folder Structure**:
```
Workload/app/items/
└── HelloWorldItem/                    ← Sample Implementation
    ├── HelloWorldItemDefinition.ts         ← Data model
    ├── HelloWorldItemEditor.tsx       ← Main editor using ItemEditor
    ├── HelloWorldItemEmptyView.tsx    ← Empty state view
    ├── HelloWorldItemDefaultView.tsx  ← Main content view  
    ├── HelloWorldItemRibbon.tsx       ← Ribbon using Ribbon
    └── HelloWorldItem.scss            ← Item-specific styles
```

**Core Architecture** (ItemEditor components are the foundation):
- **ItemEditor**: Main container component (mandatory)
- **Ribbon & RibbonToolbar**: Standard ribbon components
- **Standard View Types**: Empty, Default, Detail patterns
- **HelloWorld**: Sample implementation demonstrating the architecture

**Manifest Structure**:
```
Workload/Manifest/items/
└── HelloWorldItem/
    ├── HelloWorldItem.json
    ├── HelloWorldItem.xml
    └── ItemDefinition/
```

## Usage

### Quick Checklist for AI Tools

When creating a new item, ensure all these components are created:

**Implementation Files** (in `Workload/app/items/[ItemName]Item/`):
- [ ] `[ItemName]Item.scss` - Data model interface (persistable data only)
- [ ] `[ItemName]ItemDefinition.ts` - Data model interface (persistable data only)
- [ ] `[ItemName]ItemEditor.tsx` - Main editor component  
- [ ] `[ItemName]ItemEmptyView.tsx` - Empty state component
- [ ] `[ItemName]ItemDefaultView.tsx` - Default/main content view component
- [ ] `[ItemName]ItemRibbon.tsx` - Ribbon/toolbar component

**Manifest Files** (in `Workload/Manifest/`):
- [ ] `[ItemName]Item.xml` - XML manifest configuration
- [ ] `[ItemName]Item.json` - JSON manifest with editor path and metadata
- [ ] Update `Product.json` - Add createExperience.cards and recommendedItemTypes entries

**Configuration Updates**:
- [ ] Update `Workload/app/App.tsx` routing for new item
- [ ] Add route mapping in routing configuration

**Asset Files**:
- [ ] `Workload/Manifest/assets/images/[ItemName]Item-icon.png` - Item icon
- [ ] Manifest localization in `Workload/Manifest/assets/locales/*/translations.json`
- [ ] App localization in `Workload/app/assets/locales/*/translation.json`

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
- **Route not found**: Ensure route path matches manifest `editor.path`
- **Icon not loading**: Verify icon file exists in assets/images/
- **Localization missing**: Check translation keys in all locale files
- **Save not working**: Verify model interface is properly defined
- **Empty state not showing**: Check onFinishEmpty callback implementation

---

## 🚨 FINAL VERIFICATION CHECKLIST

**BEFORE CLAIMING COMPLETION - VERIFY ALL:**

### 📁 Files Created (ALL REQUIRED)
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]ItemDefinition.ts`
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]ItemEditor.tsx`
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]ItemEmptyView.tsx`
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]ItemDefaultView.tsx`
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]ItemRibbon.tsx`
- [ ] `Workload/app/items/[ItemName]Item/[ItemName]Item.scss`
- [ ] `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`
- [ ] `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`
- [ ] `Workload/Manifest/assets/images/[ItemName]Item-icon.png`

### 🔧 Configuration Updated (CRITICAL)
- [ ] **Product.json updated with item in createExperience.cards**
- [ ] **Product.json updated with item in recommendedItemTypes**
- [ ] App.tsx route added for `/[ItemName]Item-editor/:itemObjectId`
- [ ] Manifest translations added to `Manifest/assets/locales/en-US/translations.json`
- [ ] App translations added to `app/assets/locales/en-US/translation.json`

### ✅ Architecture Compliance
- [ ] **Component Discovery Performed**: Searched for existing Base* components before coding
- [ ] **ItemEditorView used**: For left/right split layouts (don't create custom flex layouts)
- [ ] Uses ItemEditor (not custom layout)
- [ ] Uses Ribbon + RibbonToolbar  
- [ ] SCSS file contains ONLY overrides (no duplicated layout)
- [ ] Version number matches HelloWorld ("1.100")
- [ ] All imports use correct paths

### 🎯 Functionality Complete
- [ ] Empty state displays and allows progression to default view
- [ ] Default view loads and displays content properly
- [ ] Save functionality works (if applicable)
- [ ] All strings use translation keys (no hardcoded text)

**If ANY checkbox is unchecked, the item is NOT complete. Go back and finish that step.**

