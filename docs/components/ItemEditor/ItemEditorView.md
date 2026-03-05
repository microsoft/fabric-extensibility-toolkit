# ItemEditorView Component

## 📋 Overview

The `ItemEditorView` component provides a standardized layout for default/main views in Microsoft Fabric item editors. It offers consistent styling, spacing, and responsive behavior that follows Fabric design guidelines.

## ✨ Features

✅ **Fabric Design System** - Uses official design tokens and spacing  
✅ **Responsive Layout** - Adapts to different screen sizes  
✅ **Consistent Styling** - Standardized padding, margins, and card layouts  
✅ **Scroll Management** - Proper overflow handling  
✅ **Accessibility Compliant** - Semantic HTML and ARIA support  
✅ **Flexible Content** - Supports any child components  
✅ **TypeScript Support** - Full type definitions and IntelliSense  

## 🚀 Quick Start

### Basic Usage

```tsx
import { ItemEditorView } from "../../components/ItemEditor";

export function MyItemDefaultView() {
  return (
    <ItemEditorView>
      <div>
        <h2>My Item Content</h2>
        <p>Your main item editing interface goes here.</p>
      </div>
    </ItemEditorView>
  );
}
```

### With Cards

```tsx
import { ItemEditorView } from "../../components/ItemEditor";
import { Card, CardHeader, CardBody } from "@fluentui/react-components";

export function MyItemDefaultView() {
  return (
    <ItemEditorView>
      <Card>
        <CardHeader>
          <h3>Configuration</h3>
        </CardHeader>
        <CardBody>
          <p>Main configuration options...</p>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <h3>Data</h3>
        </CardHeader>
        <CardBody>
          <p>Data management interface...</p>
        </CardBody>
      </Card>
    </ItemEditorView>
  );
}
```

### In View Registration

```tsx
// Using with ItemEditor view registration
const views: RegisteredView[] = [
  {
    name: EDITOR_VIEW_TYPES.DEFAULT,
    component: (
      <ItemEditorView>
        <MyItemContent />
      </ItemEditorView>
    )
  }
];
```

## 📖 Props API

### ItemEditorViewProps

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `children` | `ReactNode` | ✅ | Content to display in the view |
| `className` | `string` | ❌ | Additional CSS classes |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | ❌ | Padding size (default: 'medium') |

## 🎯 Key Features

### Responsive Design

Automatically adapts to different screen sizes:

```scss
// Desktop (default)
padding: var(--spacingVerticalL) var(--spacingHorizontalXL);

// Tablet
@media (max-width: 1024px) {
  padding: var(--spacingVerticalM) var(--spacingHorizontalL);
}

// Mobile
@media (max-width: 768px) {
  padding: var(--spacingVerticalS) var(--spacingHorizontalM);
}
```

### Proper Scroll Behavior

```scss
.base-item-editor-view {
  overflow-y: auto;  // Scrolls when content overflows
  flex: 1;           // Takes available space
  min-height: 0;     // Allows flexbox shrinking
}
```

### Design Token Integration

Uses Fabric design tokens for consistency:

```scss
// Spacing
padding: var(--spacingVerticalL) var(--spacingHorizontalXL);
gap: var(--spacingVerticalM);

// Background
background: var(--colorNeutralBackground1);

// Typography
font-family: var(--fontFamilyBase);
```

## 🏗️ Architecture

### Component Structure

```
ItemEditorView
├── Container (scrollable)
│   └── Children Content
│       ├── Cards (recommended)
│       ├── Forms
│       ├── Custom Components
│       └── Any React content
```

### CSS Classes

```scss
.base-item-editor-view {
  // Main container
  &--padding-none {
    // No padding variant
  }
  &--padding-small {
    // Small padding variant
  }
  &--padding-medium {
    // Medium padding variant (default)
  }
  &--padding-large {
    // Large padding variant
  }
}
```

## 💡 Usage Patterns

### Pattern 1: Card-Based Layout

```tsx
export function MyItemView() {
  return (
    <ItemEditorView>
      <Card>
        <CardHeader>
          <Text variant="title3">Basic Information</Text>
        </CardHeader>
        <CardBody>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Text variant="title3">Advanced Settings</Text>
        </CardHeader>
        <CardBody>
          <Switch checked={enabled} onChange={(e) => setEnabled(e.currentTarget.checked)} />
          <Label>Enable advanced features</Label>
        </CardBody>
      </Card>
    </ItemEditorView>
  );
}
```

### Pattern 2: Form-Based Layout

```tsx
export function MyItemForm() {
  return (
    <ItemEditorView>
      <div className="form-section">
        <Text variant="title2">Configuration</Text>
        
        <Field label="Item Name" required>
          <Input value={name} onChange={handleNameChange} />
        </Field>
        
        <Field label="Category">
          <Dropdown value={category} onOptionSelect={handleCategoryChange}>
            <Option value="type1">Type 1</Option>
            <Option value="type2">Type 2</Option>
          </Dropdown>
        </Field>
        
        <Field label="Settings">
          <Checkbox checked={setting1} onChange={handleSetting1}>
            Enable Setting 1
          </Checkbox>
          <Checkbox checked={setting2} onChange={handleSetting2}>
            Enable Setting 2
          </Checkbox>
        </Field>
      </div>
    </ItemEditorView>
  );
}
```

### Pattern 3: Custom Padding

```tsx
export function FullWidthView() {
  return (
    <ItemEditorView padding="none">
      <div style={{ padding: '0 24px' }}>
        {/* Custom spacing control */}
        <MyCustomContent />
      </div>
    </ItemEditorView>
  );
}
```

### Pattern 4: Split Layout

```tsx
export function SplitLayoutView() {
  return (
    <ItemEditorView>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <Card>
            <CardBody>Left content</CardBody>
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card>
            <CardBody>Right content</CardBody>
          </Card>
        </div>
      </div>
    </ItemEditorView>
  );
}
```

## ♿ Accessibility

### Semantic HTML

```tsx
// Good - uses semantic elements
<ItemEditorView>
  <section>
    <h2>Configuration</h2>
    <form>
      <fieldset>
        <legend>Basic Settings</legend>
        {/* form fields */}
      </fieldset>
    </form>
  </section>
</ItemEditorView>
```

### ARIA Support

```tsx
// With proper ARIA labels
<ItemEditorView>
  <div role="main" aria-label="Item configuration">
    <h2 id="config-title">Configuration</h2>
    <div aria-labelledby="config-title">
      {/* configuration content */}
    </div>
  </div>
</ItemEditorView>
```

## 🎨 Styling

### Design Tokens

```scss
// Recommended card styling
.my-card {
  background: var(--colorNeutralBackground1);
  border: 1px solid var(--colorNeutralStroke2);
  border-radius: var(--borderRadiusLarge);
  box-shadow: var(--shadow4);
  padding: var(--spacingVerticalM) var(--spacingHorizontalL);
  margin-bottom: var(--spacingVerticalM);
}
```

### Custom Styling

```tsx
<ItemEditorView className="my-custom-view">
  <MyContent />
</ItemEditorView>
```

```scss
.my-custom-view {
  // Custom styling
  .my-section {
    background: var(--colorNeutralBackground2);
    padding: var(--spacingVerticalS);
    border-radius: var(--borderRadiusMedium);
  }
}
```

## 🔧 Best Practices

### ✅ Do's

✅ **Use Card components** for grouping related content  
✅ **Follow Fabric spacing** with design tokens  
✅ **Test responsive behavior** on different screen sizes  
✅ **Use semantic HTML** for accessibility  
✅ **Keep content focused** - one main task per view  
✅ **Test scroll behavior** with long content  

### ❌ Don'ts

❌ **Don't add scroll to children** - ItemEditorView handles scrolling  
❌ **Don't use fixed heights** - let content flow naturally  
❌ **Don't override padding** unless using padding="none"  
❌ **Don't nest scrollable containers** - creates usability issues  
❌ **Don't ignore responsive design** - test on mobile  

## 🔗 Related Components

- **[ItemEditor](./README.md)** - Main container with view registration
- **[ItemEditorEmptyView](./ItemEditorEmptyView.md)** - Empty state layout
- **[ItemEditorDetailView](./ItemEditorDetailView.md)** - Detail view layout
- **[Ribbon](./Ribbon.md)** - Ribbon container component

## 📝 Examples

For complete examples, see:
- [Sample Implementation](../../Workload/app/items/HelloWorldItem/HelloWorldItemDefaultView.tsx) - HelloWorld reference implementation
- [ItemEditor README](./README.md) - Integration patterns

