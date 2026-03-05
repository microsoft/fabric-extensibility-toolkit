# OneLakeView Control

The **OneLakeView** is a reusable control that provides comprehensive OneLake item browsing functionality. Use this control when you need to display OneLake items, files, tables, or provide OneLake navigation in your workload.

## 🎯 When to Use This Control

- **Item Browsing**: Display files and tables from OneLake items (Lakehouses, Warehouses, etc.)
- **Data Selection**: Allow users to select files or tables for processing
- **Content Navigation**: Provide tree-based navigation through OneLake structure
- **Item Management**: Support creating folders, shortcuts, and organizing content

## ❌ What NOT to Do

- **Don't copy from samples**: Never copy code from `SampleOneLakeView` 
- **Don't create your own**: Use this control instead of building custom OneLake explorers
- **Don't use the sample wrapper**: Import from `components/OneLakeView`, not from samples

## 📦 Import and Usage

### Basic Import
```typescript
import { OneLakeView } from '../../../components/OneLakeView';
```

### Complete Example
```typescript
import React, { useState } from 'react';
import { OneLakeView } from '../../../components/OneLakeView';

export function MyItemEditor(props: ItemEditorProps) {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  return (
    <OneLakeView
      workloadClient={props.workloadClient}
      config={{
        mode: "edit", // "edit" | "view"
        initialItem: {
          id: props.item.id,
          workspaceId: props.item.workspaceId,
          displayName: props.item.displayName
        },
        allowItemSelection: true,
        allowedItemTypes: ["Lakehouse", "Warehouse", "KQLDatabase"],
        refreshTrigger: refreshTrigger
      }}
      callbacks={{
        onFileSelected: async (fileName: string, oneLakeLink: string) => {
          console.log(`Selected file: ${fileName}`, oneLakeLink);
          // Handle file selection
        },
        onTableSelected: async (tableName: string, oneLakeLink: string) => {
          console.log(`Selected table: ${tableName}`, oneLakeLink);
          // Handle table selection
        },
        onItemChanged: async (item: Item) => {
          console.log('Item changed:', item);
          // Handle when user selects different item from DataHub
        }
      }}
    />
  );
}
```

## ⚙️ Configuration Options

### Config Object
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `mode` | `"edit" \| "view"` | No | Controls if user can create/delete files. Default: `"view"` |
| `initialItem` | `OneLakeViewItem` | No* | Item to display initially. Shows empty state if not provided |
| `allowItemSelection` | `boolean` | No | Shows "Add" button to open DataHub for item selection |
| `allowedItemTypes` | `string[]` | No | Item types allowed in DataHub selection |
| `refreshTrigger` | `number` | No | Change this value to trigger a data refresh |

*Note: While `initialItem` is optional, the control shows an empty state without it. Users can select an item via DataHub if `allowItemSelection` is true.

### Callbacks Object
| Callback | Parameters | Description |
|----------|------------|-------------|
| `onFileSelected` | `fileName: string, oneLakeLink: string` | Called when user clicks a file |
| `onTableSelected` | `tableName: string, oneLakeLink: string` | Called when user clicks a table |  
| `onItemChanged` | `item: Item` | Called when user selects different item via DataHub |

## 🎨 Features Included

### Empty State
- **Icon and message** when no item is selected
- **Add button** to open DataHub (if `allowItemSelection: true`)
- **Clean visual design** consistent with Fabric UX

### Tree Navigation
- **Files folder** with file system hierarchy
- **Tables folder** with schema grouping (if available)
- **Context menus** for create/delete operations (in edit mode)
- **Expand/collapse** for folders and schemas

### CRUD Operations (Edit Mode)
- **Create folders** in Files directory
- **Create shortcuts** to other OneLake items
- **Delete files** and shortcut folders
- **Shortcut content loading** for external references

### Loading States
- **Spinner** during data loading
- **Error states** with user-friendly messages
- **Empty folder indicators** with helpful text

## 🔧 Advanced Usage

### Refresh Data
```typescript
const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

// Trigger refresh when needed
const refreshData = () => {
  setRefreshTrigger(Date.now());
};

<OneLakeView
  config={{
    refreshTrigger: refreshTrigger,
    // ... other config
  }}
  // ... other props
/>
```

### Handle File Selection
```typescript
const handleFileSelected = async (fileName: string, oneLakeLink: string) => {
  // Process the selected file
  try {
    const content = await oneLakeClient.readFile(oneLakeLink);
    setFileContent(content);
  } catch (error) {
    console.error('Failed to read file:', error);
  }
};
```

### Handle Item Changes
```typescript
const handleItemChanged = async (newItem: Item) => {
  // Update your component state when user selects different item
  setCurrentItem(newItem);
  
  // Optionally update parent component
  if (props.onItemChanged) {
    await props.onItemChanged(newItem);
  }
};
```

## 🎨 Styling

The control includes its own SCSS styles. You can override specific parts if needed:

```scss
.onelake-view__empty {
  // Override empty state styling
}

.onelake-view__tree {
  // Override tree styling  
}
```

## 🚨 Common Issues

### Empty Control
**Problem**: Control shows empty state even with data
**Solution**: Ensure `initialItem` has `id`, `workspaceId`, and `displayName`

### No Add Button  
**Problem**: Empty state doesn't show Add button
**Solution**: Set `allowItemSelection: true` in config

### Permission Errors
**Problem**: "Error loading data" message
**Solution**: Verify workload has OneLake.Read.All permission and user has access to the item

## 📚 Related Documentation

- **ItemEditor**: For overall item editing patterns
- **OneLakeStorageClient**: For direct OneLake operations
- **DataHub Integration**: For item selection workflows

## 🔗 Type Definitions

All types are exported from the control:

```typescript
import { 
  OneLakeViewProps,
  OneLakeViewConfig,
  OneLakeViewCallbacks,
  TableMetadata,
  FileMetadata
} from '../../../components/OneLakeView';
```
