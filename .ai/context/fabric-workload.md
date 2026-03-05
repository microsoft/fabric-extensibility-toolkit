# Extensibility Toolkit Knowledge

## Context

The Microsoft Fabric Extensibility Toolkit enables partners and customers to create custom workloads that integrate seamlessly with the Fabric platform. This knowledge applies to developing, deploying, and maintaining custom Fabric workloads.

## Key Concepts

### Workload Architecture
- **Frontend**: React/TypeScript application running in Fabric's web experience
- **Backend**: Optional REST API service hosted separately (Azure, on-premises, or other cloud)
- **Manifest**: XML/JSON configuration defining workload capabilities and integration points
- **Authentication**: Integrated with Entra ID (Azure AD) for seamless user authentication

### Core Components
- **Items**: Custom data types and experiences (e.g., custom reports, datasets, models)
- **Editors**: UI components for creating and editing workload items
- **Viewers**: Read-only views for displaying workload content
- **APIs**: RESTful interfaces for backend integration and data operations

## Implementation Patterns

### Item Development Pattern
Every workload item requires exactly four components:

```typescript
// 1. Model - Data interface and state definition
[ItemName]ItemDefinition.ts

// 2. Editor - Main editing experience
[ItemName]ItemEditor.tsx

// 3. Ribbon - Toolbar and navigation commands
[ItemName]ItemEditorRibbon.tsx

// 3. Empty View - Initial view that is shown if the item does not have a state
[ItemName]ItemEditorEmptyView.tsx

// 4. Default View - Default view that contains the default editor experience 
[ItemName]ItemEditorDefaultView.tsx
```

### Authentication Integration
```typescript
// Standard pattern for API authentication
import { WorkloadClientAPI } from '@ms-fabric/workload-client';

const workloadClient = new WorkloadClientAPI();
const accessToken = await workloadClient.authentication.acquireAccessToken(scopes);
```

### Ribbon Pattern
The toolkit provides a standardized Ribbon component with a clean API for consistent ribbon experiences:

```typescript
// Recommended pattern - mandatory homeToolbarActions, optional additionalToolbars
import { Ribbon, createSaveAction, createSettingsAction } from '../../components/ItemEditor';

export function MyItemRibbon(props: RibbonProps) {
  const { t } = useTranslation();
  
  // Create a translation helper function
  const translate = (key: string, fallback?: string) => t(key, fallback);
  
  // Define mandatory Home tab actions
  const homeToolbarActions: RibbonAction[] = [
    createSaveAction(
      props.saveItemCallback,
      !props.isSaveButtonEnabled,
      translate
    ),
    createSettingsAction(
      props.openSettingsCallback,
      translate
    )
  ];
  
  // Optional: Define additional tabs for complex items
  const additionalToolbars = [
    {
      key: 'data',
      label: t('Data'),
      actions: [/* custom actions */]
    }
  ];
  
  return (
    <Ribbon 
      homeToolbarActions={homeToolbarActions}           // Mandatory
      additionalToolbars={additionalToolbars}     // Optional
      viewContext={viewContext} 
    />
  );
}

// Simple pattern - just home actions (like HelloWorld)
return (
  <Ribbon 
    homeToolbarActions={homeToolbarActions}
    viewContext={viewContext} 
  />
);
```

Key Benefits:

- **Consistent API**: Every ribbon has a mandatory Home tab with `homeToolbarActions`
- **Standard Actions**: Use `createSaveAction()`, `createSettingsAction()` factories
- **Optional Complexity**: Add `additionalToolbars` only when needed
- **Accessibility**: Built-in Tooltip + ToolbarButton patterns

### Layout Components

#### ItemEditorDefaultView - Multi-Panel Layout System

The toolkit provides `ItemEditorDefaultView` for flexible multi-panel layouts with advanced features:

```typescript
import { ItemEditorDefaultView } from '../../components/ItemEditor';

// Basic single-panel layout
<ItemEditorDefaultView
  center={{ content: <MyMainContent /> }}
/>

// Multi-panel with navigation, editor, and output
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

**Key Features:**

- **Left Panel (Optional)**: Navigation trees, file explorers, OneLakeView, and secondary views (list views, catalog browsers, workspace explorers) with collapsible headers
- **Center Panel (Required)**: Main editing content, forms, canvases, detail views
- **Resizable Splitters**: Drag-to-resize with min/max constraints and live preview (controlled via `enableUserResize` in left panel config)
- **Collapse Controls**: Header-based toggle following OneLakeView patterns
- **State Management**: Internal state management with notification callbacks
- **Responsive Design**: Mobile-friendly with adaptive layouts

#### ItemEditorDetailView - L2 Navigation Pattern

For drill-down detail views (L2 pages), always use the dedicated DetailView component:

```typescript
import { ItemEditorDetailView } from '../../components/ItemEditor';

// Register as detail view for automatic back navigation
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
  isDetailView: true  // ⭐ Enables automatic back navigation
}
```

**L2 Detail View Use Cases:**
- Item property/configuration screens  
- Record detail forms
- Settings dialogs
- Data preview/inspection views
- Any drill-down content requiring back navigation

#### ItemSettings Pattern - General Item Configuration

For general item properties and configuration, use the ItemSettings pattern instead of editor panels:

```typescript
// Use createSettingsAction() in ribbon to open settings flyout
import { createSettingsAction } from '../../components/ItemEditor';

const homeToolbarActions: RibbonAction[] = [
  createSaveAction(handleSave, !isSaveEnabled, translate),
  createSettingsAction(handleOpenSettings, translate)  // ⭐ Opens settings flyout
];

// Settings flyout automatically includes:
// - Item name and description (managed by platform)
// - Custom settings sections for your item
function handleOpenSettings() {
  // Platform handles settings flyout display
  // Custom settings are registered via WorkloadManifest.xml
}
```

**ItemSettings Use Cases:**
- **Version configuration**: API versions, schema versions
- **Endpoint configuration**: Connection strings, service URLs  
- **Authentication settings**: Credentials, tokens, connection modes
- **Performance settings**: Timeout values, retry policies
- **Feature toggles**: Enable/disable item features
- **Metadata**: Tags, categories, custom properties

**Benefits:**
- **Consistent UX**: Standard Fabric settings flyout pattern
- **Platform Integration**: Item names/descriptions managed automatically  
- **Separation of Concerns**: Configuration separate from editing workflow
- **Discoverability**: Users expect settings in the ribbon settings action

#### ItemEditorEmptyView - First-Time User Experience

For items without definition/state (first-time usage), use the Empty View pattern:

```typescript
import { ItemEditorEmptyView } from '../../components/ItemEditor';

// Register as initial view for new items
{
  name: 'empty',
  component: (
    <ItemEditorEmptyView
      title="Welcome to MyCustomItem!"
      description="Get started by configuring your item below"
      imageSrc="/assets/items/MyCustomItem/empty-state.svg"
      tasks={[
        {
          id: 'setup',
          label: 'Setup Data Source',
          description: 'Connect to your data source to get started',
          icon: Database24Regular,
          onClick: () => setCurrentView('setup'),
          appearance: 'primary'
        },
        {
          id: 'import',
          label: 'Import Existing',
          description: 'Import configuration from another item',
          icon: CloudArrowUp24Regular,
          onClick: handleImport,
          appearance: 'secondary'
        }
      ]}
    />
  )
}

// Use as initial view based on item state
<ItemEditor
  initialView={!item?.definition?.state ? 'empty' : 'main'}
  views={views}
  ribbon={ribbon}
/>
```

**Empty View Use Cases:**
- **New items**: Items created but not yet configured
- **No definition**: Items without saved state or configuration  
- **Onboarding**: Guide users through initial setup steps
- **Call-to-action**: Present clear next steps for getting started

**Empty View Best Practices:**
- **Clear Value Proposition**: Explain what the item does and why it's useful
- **Progressive Disclosure**: Start with 1-2 primary actions, not overwhelming choices
- **Visual Appeal**: Include illustration or icon to make the state feel intentional
- **Action-Oriented**: Use verbs for button labels ('Setup', 'Import', 'Connect')
- **Help Documentation**: Provide links to getting started guides or samples

### Manifest Configuration

- **WorkloadManifest.xml**: Defines workload metadata, capabilities, and permissions
- **[ItemName]Item.xml**: Defines individual item types, their properties, and behaviors
- **Product.json**: Frontend metadata including routes, translations, and assets

## Best Practices

### Development Guidelines

1. **Follow Naming Conventions**: Use PascalCase for item names, maintain consistency
2. **Implement Error Handling**: Provide user-friendly error messages and recovery options
3. **Use Fluent UI**: Leverage @fluentui/react-components for consistent visual design
4. **Ribbon Pattern**: Use Ribbon with `homeToolbarActions` (mandatory) and optional `additionalToolbars`. Import action factories from components/ItemEditor
5. **Toolbar Components**: ALWAYS use `Tooltip` + `ToolbarButton` pattern for toolbar actions. Import from `@fluentui/react-components` and wrap each `ToolbarButton` in a `Tooltip` for accessibility
6. **Content Padding**: ItemEditor panels have ZERO padding. Your view content components MUST add `padding: var(--spacingVerticalM, 12px)` to their root CSS class for proper spacing
7. **State Management**: Use Redux Toolkit patterns for complex state management
8. **Performance**: Implement lazy loading and code splitting for large applications
9. **Item Loading Optimization**: Prevent unnecessary item reloads when the same item is already loaded

#### Item Loading Optimization Pattern

When implementing item editors, prevent unnecessary API calls and loading states by checking if the requested item is already loaded:

```typescript
// RECOMMENDED: Optimize loadDataFromUrl to prevent unnecessary reloads
async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
  // Prevent unnecessary reload if the same item is already loaded
  if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
    console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
    return;
  }

  setIsLoading(true);
  // ... rest of loading logic
}
```

**Benefits of this optimization:**
- **Prevents API calls** when the same item is already loaded
- **Avoids unnecessary loading states** that cause UI flicker  
- **Preserves current state** (like unsaved changes) when navigating within the same item
- **Reduces server load** by eliminating redundant requests

**When this optimization helps:**
- Navigating between different views of the same item
- URL changes that don't actually change the item being edited
- Browser history navigation within the same item context
- Parent component re-renders that trigger useEffect dependencies

**Implementation Notes:**
- Add the check as the first step in your `loadDataFromUrl` function
- Compare `pageContext.itemObjectId` with the currently loaded `item.id`
- Include logging to help with debugging when the optimization is active
- The function will still reload when the `itemObjectId` actually changes

### Security Considerations
1. **Minimal Scopes**: Request only necessary OAuth scopes for operations
2. **Input Validation**: Validate all user inputs and API responses
3. **Secure Storage**: Use secure storage for sensitive configuration data
4. **HTTPS Only**: Ensure all backend communications use HTTPS

### Testing Strategies
1. **Unit Tests**: Test individual components and business logic
2. **Integration Tests**: Verify API integrations and authentication flows
3. **E2E Tests**: Test complete user workflows and item lifecycles
4. **Performance Tests**: Validate loading times and responsiveness

## Common Issues

### Authentication Problems
- **Issue**: Token acquisition failures
- **Solution**: Verify Entra app configuration and scope permissions
- **Prevention**: Implement proper error handling and token refresh logic

### Manifest Validation Errors
- **Issue**: Build failures due to invalid XML/JSON
- **Solution**: Use schema validation and consistent naming patterns
- **Prevention**: Regular validation during development process

### Performance Issues
- **Issue**: Slow loading or unresponsive UI
- **Solution**: Implement code splitting, lazy loading, and efficient state management
- **Prevention**: Regular performance profiling and optimization

### Development Environment Issues
- **Issue**: Local development server connection problems
- **Solution**: Verify DevGateway configuration and network connectivity
- **Prevention**: Use provided setup scripts and validate environment configuration

## Development Workflow

### Setup Process
1. Run `scripts/Setup/SetupWorkload.ps1` with appropriate parameters
2. Configure environment variables in `.env.*` files
3. Install dependencies: `npm install` in Workload directory
4. Build manifest package: `scripts/Build/BuildManifestPackage.ps1`

### Development Loop
1. Start DevGateway: `scripts/Run/StartDevGateway.ps1`
2. Start DevServer: `scripts/Run/StartDevServer.ps1`
3. Implement changes in `Workload/app/` directory
4. Test in browser at configured development URL
5. Build and validate: `scripts/Build/BuildRelease.ps1`

### Deployment Process
1. Build production release with organization name
2. Create Azure Web App or alternative hosting
3. Deploy using `scripts/Deploy/DeployToAzureWebApp.ps1`
4. Register workload with Fabric tenant
5. Test in production environment

## Integration Points

### Fabric Platform APIs
- **Items API**: CRUD operations for workload items
- **Workspaces API**: Workspace management and permissions
- **OneLake API**: Data storage and access patterns
- **Job Scheduler API**: Background task execution

### Microsoft Services
- **Power BI**: Embedding reports and dashboards
- **Azure Services**: Backend hosting and data services
- **Microsoft 365**: Integration with Office applications
- **Entra ID**: Authentication and user management

## References

- [Extensibility Toolkit Documentation](https://learn.microsoft.com/en-us/fabric/workload-development-kit/)
- [Fabric REST APIs](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [React Development Guide](https://reactjs.org/docs/getting-started.html)
- [Fluent UI Components](https://react.fluentui.dev/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
