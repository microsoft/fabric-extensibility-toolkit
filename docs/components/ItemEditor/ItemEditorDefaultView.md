# ItemEditorDefaultView Component

## 📋 Overview

The `ItemEditorDefaultView` component provides a flexible, two-panel layout system for building complex item editors in Microsoft Fabric. It supports optional left navigation panels and required center content areas with resizable splitters for advanced layout scenarios.

## ✨ Features

✅ **Two-Panel Layout** - Left navigation + center content  
✅ **Resizable Splitters** - Drag to resize panels with min/max constraints  
✅ **Collapsible Left Panel** - Toggle panel visibility with header controls  
✅ **Responsive Design** - Adapts to different screen sizes with mobile optimization  
✅ **Fabric Design System** - Uses official design tokens and spacing  
✅ **Accessibility Compliant** - Semantic HTML, ARIA regions, keyboard support  
✅ **TypeScript Support** - Full type definitions and IntelliSense  

## 🏗️ Architecture

### Layout Structure

```
┌────────────────────────────────────────────────────┐
│  ItemEditor (Ribbon at top)                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  ItemEditorDefaultView                       │  │
│  │  ┌────────────┬─│─┬───────────────────────┐ │  │
│  │  │ ┌──────────┐│ │ │                       │ │  │
│  │  │ │Title  [⏷]││ │ │    Center Content     │ │  │
│  │  │ └──────────┘│ │ │    (Required)         │ │  │
│  │  │            │ │ │                       │ │  │
│  │  │   Left     │ ├─┤ Main workspace/canvas │ │  │
│  │  │ (Optional) │ │ │ Editor area           │ │  │
│  │  │  Content   │ │ │ Form/Details          │ │  │
│  │  │            │ │ │                       │ │  │
│  │  └────────────┴─│─┴───────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Panel Configuration

- **Left Panel (Optional)**: Navigation trees, file explorers, property panels with collapsible header
- **Center Panel (Required)**: Main editing content, forms, canvases, detail views  
- **Resize Handles**: Drag to adjust panel widths with min/max constraints

## 🚀 Quick Start

### Basic Usage (Center Content Only)

```tsx
import { ItemEditorDefaultView } from "../../components/ItemEditor";

export function MyItemEditor() {
  return (
    <ItemEditorDefaultView
      center={{
        content: <MyMainContent />
      }}
    />
  );
}
```

### With Left Navigation Panel

```tsx
import { ItemEditorDefaultView } from "../../components/ItemEditor";

export function MyItemEditor() {
  return (
    <ItemEditorDefaultView
      left={{
        content: <NavigationTree items={navItems} />,
        title: "Navigation"
      }}
      center={{
        content: <DetailView selectedItem={selectedItem} />
      }}
    />
  );
}
```

### With Collapsible Left Panel

```tsx
import { ItemEditorDefaultView } from "../../components/ItemEditor";

export function MyItemEditor() {
  return (
    <ItemEditorDefaultView
      left={{
        content: <FileExplorer files={files} />,
        title: "Files",
        width: 320,
        minWidth: 240,
        collapsible: true,
        collapsed: false,
        enableUserResize: true,
        onCollapseChange: (collapsed) => console.log('Panel collapsed:', collapsed)
      }}
      center={{
        content: <CodeEditor file={currentFile} />,
        ariaLabel: "Code editor workspace"
      }}
    />
  );
}
```

## 📖 Props API

### ItemEditorDefaultViewProps

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `left` | `LeftPanelConfig` | ❌ | - | Optional left panel configuration |
| `center` | `CentralPanelConfig` | ✅ | - | Required center content area configuration |
| `className` | `string` | ❌ | `""` | Additional CSS classes |

### LeftPanelConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `content` | `ReactNode` | ✅ | - | Left panel content (navigation, tree view, file explorer) |
| `title` | `string` | ❌ | `"Panel"` | Optional title for the left panel header |
| `width` | `number` | ❌ | `280` | Width of the left panel in pixels |
| `minWidth` | `number` | ❌ | `200` | Minimum width for resizing |
| `maxWidth` | `number` | ❌ | `600` | Maximum width for resizing |
| `collapsible` | `boolean` | ❌ | `false` | Whether the left panel is collapsible |
| `collapsed` | `boolean` | ❌ | `false` | Initial collapsed state (managed internally after init) |
| `enableUserResize` | `boolean` | ❌ | `true` | Whether to enable user resizing via drag handle |
| `onCollapseChange` | `(isCollapsed: boolean) => void` | ❌ | - | Callback when collapse state changes (notification only) |
| `onWidthChange` | `(newWidth: number) => void` | ❌ | - | Callback when panel width changes (resizable only) |

### CentralPanelConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `content` | `ReactNode` | ✅ | - | Main content area (editor, form, canvas, workspace) |
| `className` | `string` | ❌ | `""` | Optional className for custom styling |
| `ariaLabel` | `string` | ❌ | `"Main content"` | Optional ARIA label for accessibility |

## 🎯 Key Features

### Left Panel Collapse Behavior

The left panel supports header-based toggle controls:

```typescript
// Collapse state is managed internally
const leftConfig: LeftPanelConfig = {
  content: <NavigationTree />,
  title: "Navigation",
  collapsible: true,
  collapsed: false, // Initial state only
  onCollapseChange: (collapsed) => {
    // Notification callback - state is managed internally
    console.log(`Panel is now ${collapsed ? 'collapsed' : 'expanded'}`);
  }
};
```

**Collapse States:**
- **Expanded**: Shows title on left, collapse button (⏷) on right  
- **Collapsed**: Shows only expand button (⏵) in vertical strip
- **Pattern**: Follows OneLakeView design for consistency

### Resizable Splitter

Enable draggable resize handles between panels:

```typescript
<ItemEditorDefaultView
  left={{
    content: <FileTree />,
    width: 300,
    minWidth: 200,
    maxWidth: 500,
    enableUserResize: true // ⭐ Enables drag-to-resize
  }}
  center={{
    content: <Editor />
  }}
/>
```

**Resize Features:**
- **Drag Handle**: Visual resize handle between left and center panels
- **Constraints**: Respects minWidth/maxWidth settings  
- **Live Preview**: Immediate feedback during resize
- **Callbacks**: onWidthChange notifications for persistence

### Responsive Design

Automatically adapts to different screen sizes:

```scss
// Desktop (default)
.item-editor-view__left { width: 280px; }

// Tablet
@media (max-width: 1024px) {
  .item-editor-view__left { width: 240px; }
}

// Mobile  
@media (max-width: 768px) {
  .item-editor-view { flex-direction: column; }
  .item-editor-view__left { width: 100%; height: auto; }
}
```

## 💡 Usage Patterns

### Pattern 1: Navigation + Main Content

```tsx
export function NavigationBasedEditor() {
  const [selectedItem, setSelectedItem] = useState<string>();

  return (
    <ItemEditorDefaultView
      left={{
        content: (
          <NavigationTree 
            items={navItems}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
          />
        ),
        title: "Navigation",
        collapsible: true
      }}
      center={{
        content: <ItemDetails item={selectedItem} />
      }}
    />
  );
}
```

### Pattern 2: File Explorer + Code Editor

```tsx
export function CodeEditorLayout() {
  const [currentFile, setCurrentFile] = useState<string>();

  return (
    <ItemEditorDefaultView
      left={{
        content: (
          <FileExplorer 
            files={files}
            selectedFile={currentFile}
            onSelect={setCurrentFile}
          />
        ),
        title: "Files",
        width: 320,
        minWidth: 240,
        maxWidth: 480,
        collapsible: true,
        enableUserResize: true
      }}
      center={{
        content: (
          <CodeEditor 
            file={currentFile}
          />
        ),
        ariaLabel: "Code editor"
      }}
    />
  );
}
```

### Pattern 3: Properties Panel + Designer

```tsx
export function DesignToolLayout() {
  const [selectedElement, setSelectedElement] = useState<DesignElement>();

  return (
    <ItemEditorDefaultView
      left={{
        content: (
          <PropertiesPanel 
            element={selectedElement}
            onUpdate={handlePropertyUpdate}
          />
        ),
        title: "Properties",
        width: 300,
        collapsible: true,
        enableUserResize: true,
        onCollapseChange: (collapsed) => {
          // Save panel state preference
          localStorage.setItem('propertiesPanelCollapsed', String(collapsed));
        }
      }}
      center={{
        content: (
          <DesignCanvas 
            elements={elements}
            selectedElement={selectedElement}
            onSelect={setSelectedElement}
          />
        ),
        className: "design-workspace"
      }}
    />
  );
}
```

### Pattern 4: Development Environment Layout

```tsx
export function IDELayout() {
  return (
    <ItemEditorDefaultView
      left={{
        content: (
          <div>
            <ProjectExplorer />
            <PropertiesPanel />
          </div>
        ),
        title: "Explorer",
        width: 350,
        minWidth: 250,
        maxWidth: 500,
        collapsible: true,
        enableUserResize: true
      }}
      center={{
        content: <CodeEditor />
      }}
    />
  );
}
```

## 🎨 Styling

### CSS Architecture

The component uses BEM (Block Element Modifier) naming:

```scss
.item-editor-view                    // Block
  .item-editor-view__top-section     // Element
  .item-editor-view__left            // Element
    .item-editor-view__left-header   // Element
    .item-editor-view__left-content  // Element
  .item-editor-view__center          // Element  
  .item-editor-view__resize-handle   // Element
```

### Design Tokens

Uses Fabric design tokens for consistency:

```scss
// Panel spacing
var(--spacingVerticalM)      // 12px vertical spacing
var(--spacingHorizontalL)    // 16px horizontal spacing

// Panel backgrounds  
var(--colorNeutralBackground1)  // White panels
var(--colorNeutralBackground2)  // Light gray container

// Borders and handles
var(--colorNeutralStroke2)      // Panel borders
var(--colorBrandStroke1)        // Resize handle active

// Typography
var(--fontFamilyBase)           // Base font family
var(--fontSizeBase400)          // Panel titles
```

### Resize Handle Styling

```scss
.item-editor-view__resize-handle {
  width: 4px;
  background: var(--colorNeutralStroke2);
  cursor: col-resize;
  transition: background 0.2s ease;

  &:hover,
  &.resizing {
    background: var(--colorBrandStroke1);
  }
}
```

### Panel State Classes

```scss
.item-editor-view__left {
  &.collapsed {
    width: 40px !important;
    min-width: 40px !important;
  }
}

.item-editor-view__left-header {
  &.collapsed {
    writing-mode: vertical-rl;
    padding: var(--spacingVerticalS);
  }
}
```

## ♿ Accessibility

### Semantic HTML Structure

```tsx
<div className="item-editor-view">
  <div className="item-editor-view__top-section">
    <aside 
      role="complementary"
      aria-label="Navigation panel"
    >
      {leftContent}
    </aside>
    <main 
      role="main"
      aria-label="Main content"
    >
      {centerContent}
    </main>
  </div>
</div>
```

### Keyboard Support

- **Tab**: Navigate through panel controls
- **Enter/Space**: Toggle panel collapse
- **Arrow Keys**: Navigate within panels  
- **Escape**: Close dialogs or panels

### Screen Reader Support

```tsx
// Collapse button accessibility
<Button 
  aria-label="Collapse panel"
  title="Collapse panel"
  icon={<ChevronDoubleLeft20Regular />}
  onClick={handleToggleCollapse}
/>

// Resize handle accessibility  
<div 
  className="resize-handle"
  title="Drag to resize panel"
  role="separator"
  aria-orientation="vertical"
/>
```

### Focus Management

Proper focus handling during panel state changes:

```tsx
// Focus management on collapse
useEffect(() => {
  if (isLeftPanelCollapsed && document.activeElement?.closest('.item-editor-view__left-content')) {
    // Move focus to expand button when panel collapses
    expandButtonRef.current?.focus();
  }
}, [isLeftPanelCollapsed]);
```

## 🔧 Best Practices

### 🎨 Content Styling Requirements

**⚠️ IMPORTANT: Panel Content Padding**

The `ItemEditorDefaultView` panels have **zero internal padding** to give maximum control to content components. **Your content components must handle their own padding/margin** for proper spacing.

```tsx
// ❌ Wrong - Content will touch panel edges
<ItemEditorDefaultView
  center={{
    content: <div>Content with no padding</div>
  }}
/>

// ✅ Correct - Content handles its own padding
<ItemEditorDefaultView
  center={{
    content: (
      <div className="my-content" style={{ padding: 'var(--spacingVerticalM, 12px)' }}>
        Content with proper padding
      </div>
    )
  }}
/>

// ✅ Better - Use a CSS class with design tokens
<ItemEditorDefaultView
  center={{
    content: <div className="my-item-view">Content</div> // .my-item-view has padding: 12px
  }}
/>
```

**Recommended Approach:**
- Add padding to your root content component class
- Use Fabric design tokens: `var(--spacingVerticalM, 12px)` for consistency
- Apply the same padding to all panels (left, center, bottom) for visual alignment
- Test your layout with different content types and lengths

**Example CSS Class:**
```scss
.my-item-view {
  padding: var(--spacingVerticalM, 12px);
  width: 100%;
  height: 100%;
  box-sizing: border-box; /* CRITICAL: Include padding in dimensions */
  overflow: hidden; /* Prevent content overflow */
  // Your custom styles...
}
```

### ✅ Do's

✅ **Use semantic content** in panels (navigation in left, main content in center)  
✅ **Provide meaningful titles** for collapsible panels  
✅ **Add proper padding** to your content components (panels have zero padding)  
✅ **Test resize behavior** with different content types  
✅ **Handle responsive breakpoints** appropriately  
✅ **Use proper ARIA labels** for accessibility  
✅ **Test keyboard navigation** through all panels  
✅ **Consider content overflow** in all panels  
✅ **Save panel preferences** (width, collapse state) when appropriate  

### ❌ Don'ts

❌ **Don't rely on panel padding** - panels have zero padding, add it to your content  
❌ **Don't nest scroll containers** - let panels handle their own scrolling  
❌ **Don't use fixed pixel heights** for variable content  
❌ **Don't override resize constraints** without good reason  
❌ **Don't put essential actions** in collapsible panels  
❌ **Don't ignore mobile responsiveness** - test on small screens  
❌ **Don't create overly complex layouts** - keep it simple and functional  

## 🔗 Related Components

- **[ItemEditor](./README.md)** - Main container with view registration system
- **[ItemEditorView](./ItemEditorView.md)** - Simple single-panel layout  
- **[ItemEditorEmptyView](./ItemEditorEmptyView.md)** - Empty state layout
- **[Ribbon](./Ribbon.md)** - Ribbon container component
- **[OneLakeView](../OneLakeView.md)** - Example left panel content

## 📝 Examples

For complete examples, see:
- [HelloWorld Implementation](../../Workload/app/items/HelloWorldItem/HelloWorldItemDefaultView.tsx) - Updated reference implementation
- [ItemEditor README](./README.md) - Integration patterns with view registration

---

**Component**: `ItemEditorDefaultView`  
**Location**: `Workload/app/components/ItemEditor/ItemEditorDefaultView.tsx`  
**Version**: 2.2.0 - Simplified Two-Panel Layout with Resizable Splitters
