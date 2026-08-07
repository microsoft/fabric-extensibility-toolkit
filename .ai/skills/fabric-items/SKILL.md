---
name: fabric-items
description: Microsoft Fabric item development patterns and procedures. Use when creating, modifying, deleting, or renaming workload items in the Extensibility Toolkit.
---

# Fabric Items Skill

Develop custom items for Microsoft Fabric workloads using the Extensibility Toolkit. This skill covers the required architecture patterns, component APIs, and step-by-step procedures for creating, deleting, and renaming items.

## Item Development Pattern

Every workload item requires exactly five implementation files plus a stylesheet:

```text
Workload/app/items/[ItemName]Item/
  [ItemName]ItemDefinition.ts        # Data interface and state
  [ItemName]ItemEditor.tsx           # Main editor component
  [ItemName]ItemEmptyView.tsx        # First-time empty state
  [ItemName]ItemDefaultView.tsx      # Default editing view
  [ItemName]ItemRibbon.tsx           # Toolbar and navigation
  [ItemName]Item.scss                # Item-specific styles only
```

In addition to implementation files, each item needs:

- Manifest files: `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml` and `.json`
- Icon: `Workload/Manifest/assets/images/[ItemName]Item-icon.png`
- Empty state asset: `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg`
- Translations in both `Workload/Manifest/assets/locales/` and `Workload/app/assets/locales/`
- Route in `Workload/app/App.tsx`
- Entry in `Workload/Manifest/Product.json` (critical for item visibility)
- Item name added to `ITEM_NAMES` in all `.env` files

## Mandatory Architecture Constraints

These rules apply to every item. Violations fail verification.

### ItemEditor Container (Required)

All item editors must use `<ItemEditor>` as the root container. It provides fixed ribbon + scrollable content layout. Do not create custom layout patterns or scroll handling.

### Ribbon Pattern (Required)

Use `<Ribbon>` + `<RibbonToolbar>` with standard action factories (`createSaveAction`, `createSettingsAction`). Do not create custom toolbar layouts. Import all ribbon components from `../../components/ItemEditor`.

### Styling Rules (Required)

- Create `[ItemName]Item.scss` in your item folder with only item-specific styles
- Use prefixed class names: `.my-item-view`, `.my-item-section-title`
- Never modify files in `Workload/app/components/` directory
- Never duplicate component structural styles
- Use Fluent UI v9 (`@fluentui/react-components`), not v8 (`@fluentui/react`)
- Use Fabric design tokens: `var(--colorBrandForeground1)`, `var(--spacingVerticalL)`

### View Registration (Required)

Register views using the `views` prop on ItemEditor. Use `initialView` for the starting view. Navigate between views with `setCurrentView()`. Do not use manual if/else statements in children.

### OneLake Patterns

- Use `oneLakeClient.createItemWrapper()` for item-scoped storage operations
- Use the `OneLakeView` component from `components/OneLakeView`, not sample code

For complete component API details (ItemEditorDefaultView, ItemEditorDetailView, ItemEditorEmptyView, ItemSettings, Ribbon), see [references/item-components.md](references/item-components.md).

For shared Fabric platform context, see [../../references/fabric-platform.md](../../references/fabric-platform.md).

## Procedures

### Create a New Item

Follow the complete step-by-step procedure in [references/create-item.md](references/create-item.md).

Code templates for all five implementation files are in [examples.md](examples.md).

Critical steps that are commonly missed:

1. Update `Workload/Manifest/Product.json` -- add to both `createExperience.cards` and `recommendedItemTypes`
2. Update `ITEM_NAMES` in all `.env` files (`.env.dev`, `.env.test`, `.env.prod`)
3. Add translations to both manifest and app locale files (different locations, different purposes)

### Delete an Item

Follow the complete procedure in [references/delete-item.md](references/delete-item.md).

Critical: Remove the item from `ITEM_NAMES` in all `.env` files or the build will fail trying to find deleted manifest files.

### Rename an Item

Follow the complete procedure in [references/rename-item.md](references/rename-item.md).

Critical: Update `ITEM_NAMES` in all `.env` files -- the old name causes build failures.

## Quick Start: Copy HelloWorld

Instead of creating empty files, copy and modify the existing HelloWorld item:

1. Copy `Workload/app/items/HelloWorldItem/` to `Workload/app/items/[ItemName]Item/`
2. Find and replace `HelloWorld` with `[ItemName]` in all file contents
3. Rename all files from `HelloWorld*` to `[ItemName]*`
4. Update manifest, routing, translations, Product.json, and `.env` files

This approach produces a complete, functional item rather than empty file structures.

## Verification Checklist

Before claiming any item operation is complete, verify every item below:

- All implementation files exist and are syntactically correct
- `Product.json` updated with `createExperience.cards` entry and `recommendedItemTypes` entry
- Translations added to both `Workload/Manifest/assets/locales/` and `Workload/app/assets/locales/`
- `ItemEditor` used as container (no custom editor layout)
- `Ribbon` + `RibbonToolbar` used (no custom ribbon layout)
- Styles in separate `[ItemName]Item.scss` file in item directory
- No modifications to any files in `components/` directory
- Route added to `App.tsx` matching `editor.path` in JSON manifest
- `ITEM_NAMES` updated in all `.env` files
- Icon file exists in `assets/images/`

For markdown formatting standards, see [../../references/markdown-formatting.md](../../references/markdown-formatting.md).
