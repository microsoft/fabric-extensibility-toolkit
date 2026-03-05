# ItemEditor Quick Reference

Quick reference guide for using the `ItemEditor` control in Microsoft Fabric workload item editors.

## 🚀 Quick Start

### Basic Pattern (View Registration)

```tsx
import { ItemEditor, RegisteredView } from "../../components/ItemEditor";

export function MyItemEditor(props: PageProps) {
  const views: RegisteredView[] = [
    {
      name: 'main',
      component: <MyContent />
    }
  ];

  return (
    <ItemEditor
      views={views}
      initialView="main"
      ribbon={(viewContext) => <MyItemRibbon {...props} viewContext={viewContext} />}
    />
  );
}
```

## 📦 Import Statement

```tsx
import { ItemEditor } from "../../components/ItemEditor";
// or
import { ItemEditor, ItemEditorProps } from "../../components/ItemEditor";
```

## 🎯 Props

### ItemEditorProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `views` | `RegisteredView[]` | ✅ | Array of view definitions |
| `initialView` | `string` | ✅ | Initial view name to display |
| `ribbon` | `(context: ViewContext) => ReactNode` | ✅ | Ribbon with ViewContext |
| `className` | `string` | ❌ | Additional CSS class for container |
| `contentClassName` | `string` | ❌ | Additional CSS class for content area |

### ViewContext Interface

| Property | Type | Description |
|----------|------|-------------|
| `currentView` | `string` | Name of currently active view |
| `setCurrentView` | `(view: string) => void` | Navigate to different view |
| `isDetailView` | `boolean` | True if current view is a detail view |
| `goBack` | `() => void` | Navigate to previous view |
| `viewHistory` | `string[]` | Stack of previous views |

### RegisteredView Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Unique identifier for the view |
| `component` | `ReactNode` | ✅ | React component to render |
| `isDetailView` | `boolean` | ❌ | Enables automatic back navigation |

## 📐 Layout Structure

```
┌─────────────────────────┐
│  Ribbon (Fixed)         │  ← Always visible
├─────────────────────────┤
│                         │
│  Content (Scrolls)      │  ← Scrollable area
│                         │
└─────────────────────────┘
```

## 💡 Common Patterns

### Pattern 1: View Registration System

```tsx
const views: RegisteredView[] = [
  {
    name: 'empty',
    component: <MyEmptyView onStart={() => setCurrentView('main')} />
  },
  {
    name: 'main',
    component: <MyDefaultView item={item} />
  }
];

<ItemEditor
  views={views}
  initialView={item?.id ? 'main' : 'empty'}
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
/>
```

### Pattern 2: With Loading State

```tsx
// ItemEditor handles loading internally - no manual loading state needed
return (
  <ItemEditor
    views={views}
    initialView="main"
    ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
  />
);
```

### Pattern 3: With Custom Classes

```tsx
<ItemEditor
  views={views}
  initialView="main"
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
  className="custom-editor"
  contentClassName="custom-content"
/>
```

### Pattern 4: With Detail Views

```tsx
const views: RegisteredView[] = [
  {
    name: 'main',
    component: <MyMainView onViewDetail={(id) => setCurrentView('detail')} />
  },
  {
    name: 'detail',
    component: <MyDetailView detailId={selectedId} />,
    isDetailView: true  // ⭐ Auto back button
  }
];

<ItemEditor
  views={views}
  initialView="main"
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
/>
```

## 🎨 View Types

### Empty View

```tsx
const views = [
  {
    name: 'empty',
    component: (
      <div className="empty-state-container">
        <h2>Welcome!</h2>
        <Button onClick={onStart}>Get Started</Button>
      </div>
    )
  }
];

<ItemEditor
  views={views}
  initialView="empty"
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
/>
```

**Key Classes**: `empty-state-container`  
**Min Height**: 500px for proper centering

### Default View

```tsx
const views = [
  {
    name: 'main',
    component: (
      <div className="editor-default-view">
        <div className="main">
          <h2>My Content</h2>
          {/* Forms, cards, etc. */}
        </div>
      </div>
    )
  }
];

<ItemEditor
  views={views}
  initialView="main"
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
/>
```

**Key Classes**: `editor-default-view`, `main`

### Detail View

```tsx
const views = [
  {
    name: 'detail',
    component: (
      <div className="editor-detail-view">
        <div className="detail-content">
          <h2>Detail View</h2>
          {/* Detail content */}
        </div>
      </div>
    ),
    isDetailView: true
  }
];

<ItemEditor
  views={views}
  initialView="detail"
  ribbon={(viewContext) => <MyRibbon viewContext={viewContext} />}
/>
```

**Key Classes**: `editor-detail-view`, `detail-content`

## 📝 Complete Example

```tsx
import React, { useState, useEffect } from "react";
import { ItemEditor } from "../../components/ItemEditor"; // Loading handled internally
import { MyItemRibbon } from "./MyItemRibbon";
import { MyItemEmpty } from "./MyItemEmpty";
import { MyItemDefault } from "./MyItemDefault";

export function MyItemEditor(props: PageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState();

  useEffect(() => {
    // Load item
    loadItem(); // ItemEditor will handle loading states
  }, []);

  const views = [
    {
      name: 'empty',
      component: <MyItemEmpty onStart={() => setCurrentView('default')} />
    },
    {
      name: 'default', 
      component: <MyItemDefault item={item} onUpdate={handleUpdate} />
    }
  ];

  return (
    <ItemEditor
      views={views}
      initialView={item?.definition?.state ? 'default' : 'empty'}
      ribbon={(viewContext) => (
        <MyItemRibbon
          {...props}
          viewContext={viewContext}
          isSaveEnabled={item?.definition?.state}
          onSave={handleSave}
        />
      )}
    />
  );
}
```

## ✅ Best Practices

### Do's
- ✅ Always use `ItemEditor` for item editors
- ✅ Keep ribbon content minimal
- ✅ Handle loading states before rendering
- ✅ Use proper view classes
- ✅ Test scrolling with long content
- ✅ Implement keyboard navigation

### Don'ts
- ❌ Don't add scroll to outer container
- ❌ Don't use fixed heights on content
- ❌ Don't put multiple ribbons
- ❌ Don't override flex properties
- ❌ Don't forget loading states

## 🎯 CSS Classes

### Applied by ItemEditor

```scss
.base-item-editor              // Main container
.base-item-editor__ribbon      // Ribbon area (fixed)
.base-item-editor__content     // Content area (scrollable)
```

### For Your Views

```scss
.empty-state-container    // Empty view
.editor-default-view      // Default view
.editor-detail-view       // Detail view
.main                     // Content card
.detail-content           // Detail card
```

## 🔧 Styling Tips

### Override Container

```scss
.my-custom-editor {
  background: custom-color;
}
```

### Override Content

```scss
.my-custom-content {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
```

### Custom Scrollbar

```scss
.base-item-editor__content {
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--colorNeutralStroke1);
  }
}
```

## 🧪 Testing

### Test Data Attributes

```tsx
data-testid="base-item-editor"         // Main container
data-testid="base-item-editor-ribbon"  // Ribbon area
data-testid="base-item-editor-content" // Content area
```

### Example Test

```tsx
const editor = screen.getByTestId('base-item-editor');
const ribbon = screen.getByTestId('base-item-editor-ribbon');
const content = screen.getByTestId('base-item-editor-content');

expect(editor).toBeInTheDocument();
expect(ribbon).toBeVisible();
expect(content).toBeVisible();
```

## 📚 Related Documentation

- **[Full ItemEditor Documentation](./README.md)**
- **[Ribbon](./Ribbon.md)** - Ribbon container
- **[RibbonToolbar](./RibbonToolbar.md)** - Toolbar actions  
- **[ItemEditorView](./ItemEditorView.md)** - Default view layout
- **[ItemEditorEmptyView](./ItemEditorEmptyView.md)** - Empty state layout
- **[ItemEditorDetailView](./ItemEditorDetailView.md)** - Detail view layout
- **[HelloWorld Sample](../../Workload/app/items/HelloWorldItem/)**

## 🆘 Common Issues

### Issue: Content Not Scrolling
**Solution**: Remove any `overflow: hidden` from parent elements

### Issue: Ribbon Not Fixed
**Solution**: Ensure no `position` CSS overrides on ribbon container

### Issue: Content Behind Ribbon
**Solution**: Don't use `position: absolute` on content

### Issue: Height Not Filling
**Solution**: Ensure parent containers have proper height (`100%` or `100vh`)

---

**Quick Tip**: Check `HelloWorldItemEditor.tsx` for a complete sample implementation!

