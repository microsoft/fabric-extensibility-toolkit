# Item Component Reference

Canonical reference for all item editor components in the Fabric Extensibility Toolkit. This is the single source of truth for component APIs, patterns, and constraints.

## ItemEditor Container

All item editors must use `ItemEditor` as the root container (`Workload/app/components/ItemEditor/ItemEditor.tsx`).

Capabilities:

- Consistent layout: fixed ribbon + scrollable content
- Full-height iframe rendering
- Proper scroll behavior (ribbon stays fixed, content scrolls)
- Automatic loading state handling

Do not create custom layout patterns. Do not manually check `isLoading` before rendering ItemEditor.

## Ribbon Components

### Ribbon + RibbonToolbar pattern

```typescript
import {
  Ribbon,
  RibbonToolbar,
  RibbonAction,
  createSaveAction,
  createSettingsAction,
  createRibbonTabs
} from '../../components/ItemEditor';

const tabs = createRibbonTabs(t("ItemEditor_Ribbon_Home_Label"));

const homeToolbarActions: RibbonAction[] = [
  createSaveAction(props.saveItemCallback, !props.isSaveButtonEnabled, translate),
  createSettingsAction(props.openSettingsCallback, translate)
];

// Optional: additional tabs for complex items
const additionalToolbars = [
  { key: 'data', label: t('Data'), actions: [/* custom actions */] }
];

return (
  <Ribbon tabs={tabs}>
    <RibbonToolbar actions={homeToolbarActions} />
  </Ribbon>
);
```

Key rules:

- Every ribbon has a mandatory Home tab via `createRibbonTabs()`
- Use `createSaveAction()` and `createSettingsAction()` factories for standard actions
- `RibbonToolbar` automatically applies Tooltip + ToolbarButton patterns for accessibility
- Add `additionalToolbars` only when needed
- Do not create custom `<Toolbar>` or `<div className="ribbon">` layouts

### Custom Actions

Define custom actions inline as `RibbonAction` objects:

```typescript
{
  key: 'custom-action',
  icon: MyIcon24Regular,
  label: t("My_Action_Label"),
  onClick: handleAction,
  testId: 'ribbon-custom-btn',
  disabled: false,    // optional
  hidden: false       // optional, for conditional visibility
}
```

## ItemEditorDefaultView

Multi-panel layout system for the main editing experience.

```typescript
import { ItemEditorDefaultView } from '../../components/ItemEditor';

// Basic single-panel layout
<ItemEditorDefaultView
  center={{ content: <MyMainContent /> }}
/>

// Multi-panel with navigation and editor
<ItemEditorDefaultView
  left={{
    content: <FileExplorer />,
    title: "Files",
    width: 320,
    collapsible: true,
    onCollapseChange: (collapsed) => savePreference('collapsed', collapsed),
    enableUserResize: true
  }}
  center={{
    content: <CodeEditor />,
    ariaLabel: "Code editor workspace"
  }}
/>
```

Panel configuration:

- **Left panel (optional)**: Navigation trees, file explorers, OneLakeView, catalog browsers. Supports collapsible headers and resizable splitters.
- **Center panel (required)**: Main editing content, forms, canvases, detail views.
- Resizable splitters with min/max constraints and live preview (controlled via `enableUserResize` in left panel config).
- State management with notification callbacks.
- Responsive design with adaptive layouts.

## ItemEditorDetailView

For drill-down detail views (L2 pages), use the dedicated DetailView component.

```typescript
import { ItemEditorDetailView } from '../../components/ItemEditor';

{
  name: 'item-details',
  component: (
    <ItemEditorDetailView
      center={{ content: <ItemDetailsForm item={selectedItem} /> }}
      toolbarActions={[
        { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
      ]}
    />
  ),
  isDetailView: true  // Enables automatic back navigation
}
```

L2 detail view use cases:

- Item property and configuration screens
- Record detail forms
- Settings dialogs
- Data preview and inspection views
- Any drill-down content requiring back navigation

Do not create custom detail layouts. ItemEditorDetailView provides automatic back navigation, context-specific actions, optional left panel, consistent layout, and built-in accessibility.

## ItemEditorEmptyView

For items without definition or state (first-time usage).

```typescript
import { ItemEditorEmptyView, EmptyStateTask } from '../../components/ItemEditor';

const tasks: EmptyStateTask[] = [
  {
    id: 'setup',
    label: 'Setup Data Source',
    description: 'Connect to your data source to get started',
    icon: Database24Regular,
    onClick: () => setCurrentView('setup'),
    appearance: 'primary'
  }
];

<ItemEditorEmptyView
  title="Welcome to MyCustomItem!"
  description="Get started by configuring your item below"
  imageSrc="/assets/items/MyCustomItem/empty-state.svg"
  imageAlt="Empty state illustration"
  tasks={tasks}
/>
```

Best practices:

- Clear value proposition: explain what the item does
- Progressive disclosure: start with 1-2 primary actions
- Visual appeal: include illustration or icon
- Action-oriented: use verbs for button labels (Setup, Import, Connect)

## ItemSettings Pattern

For general item properties and configuration, use the settings flyout instead of editor panels.

```typescript
import { createSettingsAction } from '../../components/ItemEditor';

const homeToolbarActions: RibbonAction[] = [
  createSaveAction(handleSave, !isSaveEnabled, translate),
  createSettingsAction(handleOpenSettings, translate)
];

function handleOpenSettings() {
  // Platform handles settings flyout display
  // Custom settings are registered via WorkloadManifest.xml
}
```

Use cases:

- Version and endpoint configuration
- Connection strings and service URLs
- Authentication settings
- Performance settings (timeouts, retry policies)
- Feature toggles
- Metadata (tags, categories, custom properties)

The settings flyout automatically manages item names and descriptions.

## Authentication Integration

```typescript
import { WorkloadClientAPI } from '@ms-fabric/workload-client';

const workloadClient = new WorkloadClientAPI();
const accessToken = await workloadClient.authentication.acquireAccessToken(scopes);
```

## OneLakeStorageClient Pattern

Always use `createItemWrapper()` for item-scoped OneLake operations.

```typescript
// Correct pattern
const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
const itemWrapper = oneLakeClient.createItemWrapper({
  id: props.item.id,
  workspaceId: props.item.workspaceId
});

await itemWrapper.writeFileAsBase64('Files/myfile.txt', base64Content);
const content = await itemWrapper.readFileAsText('Files/myfile.txt');
const fullPath = itemWrapper.getPath('Files/myfile.txt');
```

Do not use direct OneLakeStorageClient methods with manual path construction.

## OneLakeView Component

Use the component from `components/OneLakeView`, not sample code.

```typescript
import { OneLakeView } from '../../../components/OneLakeView';

<OneLakeView
  workloadClient={props.workloadClient}
  config={{
    mode: "edit",
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
    onFileSelected: async (fileName, oneLakeLink) => { /* handle */ },
    onTableSelected: async (tableName, oneLakeLink) => { /* handle */ },
    onItemChanged: async (item) => { /* handle */ }
  }}
/>
```

Requirements:

- Import from `components/OneLakeView`, not samples
- `initialItem` is required to load and display content
- Include `id`, `workspaceId`, and `displayName` in initialItem
- Use `refreshTrigger` to force re-fetch when needed

## Styling Requirements

1. **Component styles (never modify)**: Do not edit any files in `Workload/app/components/` directory. This includes `ItemEditor.scss`, `Ribbon.scss`, `OneLakeView.scss`, `Wizard.scss`, and all other component stylesheets.

2. **Item-specific styles (required)**: Create `[ItemName]Item.scss` in your item folder. Import with `import "./[ItemName]Item.scss";`. Define only item-specific branding, colors, and content styling.

3. **Class naming**: Use prefixed class names (`.hello-world-view`, `.data-analyzer-section`). Use Fabric design tokens (`var(--colorBrandForeground1)`, `var(--spacingVerticalL)`).

4. **Verification checklist**:
   - ItemEditor used (no custom editor layout)
   - Ribbon + RibbonToolbar used (no custom ribbon layout)
   - Styles in separate `[ItemName]Item.scss` file
   - No modifications to any files in `components/` directory
   - Item-specific class naming pattern used
   - Import pattern: `import "./[ItemName]Item.scss";` (no global imports)

## Item Loading Optimization

Prevent unnecessary API calls when the same item is already loaded:

```typescript
async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
  if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
    console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
    return;
  }
  setIsLoading(true);
  // ... rest of loading logic
}
```

This prevents API calls when navigating between views of the same item, avoids UI flicker from unnecessary loading states, and preserves unsaved changes.

## Best Practices

### Development Guidelines

1. Use PascalCase for item names, maintain consistency
2. Implement user-friendly error messages and recovery options
3. Use Fluent UI v9 (`@fluentui/react-components`), not v8 (`@fluentui/react`)
4. Content padding: ItemEditor panels have zero padding. View content must add `padding: var(--spacingVerticalM, 12px)` to root CSS class
5. Use Redux Toolkit patterns for complex state management
6. Implement lazy loading and code splitting for large applications

### Security Considerations

1. Request only necessary OAuth scopes
2. Validate all user inputs and API responses
3. Use secure storage for sensitive configuration data
4. Ensure all backend communications use HTTPS

### Testing Strategies

1. Unit tests for individual components and business logic
2. Integration tests for API integrations and authentication flows
3. End-to-end tests for complete user workflows and item lifecycles
4. Performance tests for loading times and responsiveness

### Common Issues

- **Authentication problems**: Verify Entra app configuration and scope permissions. Implement proper error handling and token refresh logic.
- **Manifest validation errors**: Ensure XML/JSON syntax is correct and all required fields are present. Use schema validation and consistent naming patterns.
- **Performance issues**: Use item loading optimization pattern. Implement code splitting and lazy loading.
- **Development environment issues**: Verify DevGateway configuration and network connectivity. Use provided setup scripts and validate environment configuration.
