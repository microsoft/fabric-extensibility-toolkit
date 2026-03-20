# Create New Workload Item

## Mandatory Process

This process has multiple steps that are easy to miss. Use disciplined execution.

### Step 0: Create Complete TODO List

Before writing any code, create a comprehensive todo list:

1. Read instruction files completely
2. Discover existing components -- search for Base* components before coding
3. Create `[ItemName]ItemDefinition.ts`
4. Create `[ItemName]ItemEditor.tsx` using ItemEditor
5. Create `[ItemName]ItemEmptyView.tsx`
6. Create `[ItemName]ItemDefaultView.tsx` using existing base components
7. Create `[ItemName]ItemRibbon.tsx` using RibbonToolbar
8. Create `[ItemName]Item.scss` with only item-specific styles
9. Add route to `App.tsx`
10. Create manifest JSON and XML files
11. Copy icon file from HelloWorld pattern
12. Add translations to `Manifest/assets/locales/en-US/translations.json`
13. Add translations to `app/assets/locales/en-US/translation.json`
14. Update Product.json (critical for item visibility)
15. Verify all files created and syntax correct

### Component Discovery Phase

Before coding any views, search for existing components:

- **ItemEditorDefaultView**: Left/center layouts (explorer + content)
- **ItemEditorDetailView**: Detail views with actions and back navigation
- **ItemEditorEmptyView**: Empty states with call-to-action tasks

For complete component API details, see [item-components.md](item-components.md).

### When to Use ItemEditorDetailView

Use ItemEditorDetailView for:

- Detail and drill-down pages (L2 pages): record details, configuration pages, property panels
- Settings and configuration: item settings, preferences, advanced options
- Individual item editing: file viewers, table schemas, record editors

Mark the view as `isDetailView: true` for automatic back navigation. See [item-components.md](item-components.md) for the full API.

### Execution Rules

1. Mark one todo in-progress before starting work
2. Complete that todo fully -- no partial work
3. Mark completed immediately after finishing
4. Never skip Product.json -- it is required for Fabric integration
5. Follow HelloWorld patterns exactly, including version numbers

## Step-by-Step Procedure

For code templates referenced below, see [../examples.md](../examples.md).

### Step 1: Create Item Implementation Structure

Create the item directory and required files:

```text
Workload/app/items/[ItemName]Item/
  [ItemName]ItemDefinition.ts
  [ItemName]ItemEditor.tsx
  [ItemName]ItemEmptyView.tsx
  [ItemName]ItemDefaultView.tsx
  [ItemName]ItemRibbon.tsx
  [ItemName]Item.scss
```

### Step 2: Implement the Model

Create `[ItemName]ItemDefinition.ts` with the interface representing your item's persisted state. Keep it serializable (JSON-compatible types only). See the definition template in [../examples.md](../examples.md).

### Step 3: Implement the Editor

Create `[ItemName]ItemEditor.tsx` using ItemEditor as the root container. This is mandatory -- do not create custom layout patterns. See the full editor template in [../examples.md](../examples.md).

The editor must:

- Use `<ItemEditor>` as the root container
- Register views with the `views` prop
- Set the starting view with `initialView`
- Pass ribbon component via the `ribbon` prop
- Let ItemEditor handle loading states internally

### Step 4: Implement the Empty State

Create `[ItemName]ItemEmptyView.tsx` using the `ItemEditorEmptyView` component. Do not create custom empty state layouts. See the empty view template in [../examples.md](../examples.md).

Required props: `title`, `description`, `imageSrc`, `imageAlt`, `tasks` (array of `EmptyStateTask`).

### Step 4.1: Implement the Default View

Create `[ItemName]ItemDefaultView.tsx` for the main editing interface. See the default view template in [../examples.md](../examples.md).

Choose the right component:

- **Simple main views**: Standard React components with ItemEditor (dashboards, list views, simple editors)
- **Detail/drill-down views (L2 pages)**: ItemEditorDetailView with `isDetailView: true`

### Step 4.2: OneLake Integration (if Needed)

For OneLake storage operations, use the `createItemWrapper()` pattern. For OneLake browsing, use the `OneLakeView` component from `components/OneLakeView`. See [item-components.md](item-components.md) for both patterns.

### Step 5: Implement the Ribbon

Create `[ItemName]ItemRibbon.tsx` using the standard Ribbon + RibbonToolbar pattern with `createSaveAction()` and `createSettingsAction()` factories. See the ribbon template in [../examples.md](../examples.md) and the full Ribbon API in [item-components.md](item-components.md).

### Step 5.1: Create Item-Specific Styles

Create `[ItemName]Item.scss` in your item folder. Import with `import "./[ItemName]Item.scss";`. See the SCSS template in [../examples.md](../examples.md) and styling rules in [item-components.md](item-components.md).

### Step 6: Create Manifest Configuration

#### 6.1: Create XML Manifest Template

Create `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`. Use the `{{WORKLOAD_NAME}}` placeholder for environment-specific generation. See the XML template in [../examples.md](../examples.md).

#### 6.2: Create JSON Manifest

Create `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`. This defines the item's display name, editor path, icon, and lifecycle hooks. See the JSON template in [../examples.md](../examples.md).

### Step 7: Add Routing Configuration

Update `Workload/app/App.tsx`:

```typescript
import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

<Route path="/[ItemName]Item-editor/:itemObjectId">
  <[ItemName]ItemEditor {...pageProps} />
</Route>
```

The route path must match `editor.path` in the JSON manifest.

### Step 8: Create Asset Files

#### 8.1: Add Item Icon

Create `Workload/Manifest/assets/images/[ItemName]Item-icon.png` (24x24 PNG with transparency).

#### 8.2: Create Empty State Asset

Create `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg` (SVG for the empty state illustration).

#### 8.3: Add Localization Strings

Two different translation locations serve different purposes:

**Manifest translations** (`Workload/Manifest/assets/locales/en-US/translations.json`): Only for keys referenced in `.json` manifest files (display names, descriptions).

**App translations** (`Workload/app/assets/locales/en-US/translation.json`): Only for React components using the `useTranslation()` hook (UI text, button labels, messages).

Never mix these up -- each location serves a specific build-time purpose. See the translation templates in [../examples.md](../examples.md).

#### 8.4: Update Product.json Configuration (Critical)

This step is required for your item to appear in create dialogs. Update `Workload/Manifest/Product.json`:

1. **Add to `createExperience.cards` array**: This controls what items appear in Fabric's "Create new item" dialogs
2. **Add to `homePage.recommendedItemTypes` array**: This controls which items appear on the workload home page

See the Product.json entry template in [../examples.md](../examples.md).

Critical requirements:

- `itemType` must exactly match the `name` field in your `[ItemName]Item.json` manifest
- `itemType` must exactly match the entry in `recommendedItemTypes`
- Use localization keys (not hardcoded strings) for `title` and `description`
- Ensure icon files exist in `assets/images/`
- Items need entries in both arrays

### Step 9: Update Environment Variables

Add the item name to `ITEM_NAMES` in all environment files:

- `Workload/.env.dev`
- `Workload/.env.test`
- `Workload/.env.prod`

```bash
# Before
ITEM_NAMES=HelloWorld

# After
ITEM_NAMES=HelloWorld,[ItemName]
```

The `ITEM_NAMES` variable controls which items are included when building the manifest package. Missing items cause build failures.

### Step 10: Testing and Validation

1. Build the project: `cd Workload && npm run build:test`
2. Verify no import errors, manifest generation errors, or missing assets
3. Start the development server and test item creation, editor loading, save/load, and navigation

### Step 11: Build and Deploy

Build for your target environment using the workload lifecycle procedures. See the [fabric-workloads skill](../../fabric-workloads/SKILL.md) for run, deploy, and publish procedures.

## Quick Start: Copy HelloWorld

Instead of creating empty files, copy and modify the existing HelloWorld item:

1. Copy `Workload/app/items/HelloWorldItem/` to `Workload/app/items/[ItemName]Item/`
2. Find and replace `HelloWorld` with `[ItemName]` in all file contents
3. Rename all files from `HelloWorld*` to `[ItemName]*`
4. Update manifest, routing, translations, Product.json, and `.env` files

## Verification Checklist

Before claiming item creation is complete, verify every item:

- All implementation files exist and are syntactically correct
- Product.json updated with `createExperience.cards` entry and `recommendedItemTypes` entry
- Translations in both manifest and app locale directories
- ItemEditor used as container (no custom editor layout)
- Ribbon + RibbonToolbar used (no custom ribbon layout)
- Styles in separate `[ItemName]Item.scss` file
- No modifications to files in `components/` directory
- Route added to `App.tsx` matching JSON manifest `editor.path`
- `ITEM_NAMES` updated in all `.env` files
- Icon file exists in `assets/images/`

If any verification fails, the item is incomplete. Fix it before proceeding.
