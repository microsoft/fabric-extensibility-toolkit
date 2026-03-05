# ItemEditorEmptyView Component

## 📋 Overview

The `ItemEditorEmptyView` component provides a standardized empty state experience for Microsoft Fabric item editors. It offers a consistent onboarding flow with customizable tasks, illustrations, and call-to-action buttons that guide users to get started.

## ✨ Features

✅ **Fabric Design System** - Uses official design tokens and styling  
✅ **Customizable Tasks** - Define onboarding steps with descriptions and actions  
✅ **Optional Illustration** - Support for custom images/SVGs  
✅ **Flexible Content** - Custom content or task-based onboarding  
✅ **Responsive Design** - Works across different screen sizes  
✅ **Accessibility Compliant** - ARIA labels, keyboard navigation, semantic HTML  
✅ **TypeScript Support** - Full type definitions and IntelliSense  

## 🚀 Quick Start

### Basic Usage

```tsx
import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";

export function MyItemEmptyView() {
  const tasks: EmptyStateTask[] = [
    {
      id: 'start',
      label: 'Get Started',
      description: 'Learn the basics and create your first item',
      onClick: () => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT),
      appearance: 'primary'
    }
  ];

  return (
    <ItemEditorEmptyView
      title="Welcome to MyItem!"
      description="Get started by completing the tasks below"
      imageSrc="/assets/items/MyItem/empty.svg"
      imageAlt="Empty state illustration"
      tasks={tasks}
    />
  );
}
```

### Multiple Tasks

```tsx
import { DocumentRegular, BookRegular, VideoRegular } from "@fluentui/react-icons";

export function MyItemEmptyView() {
  const tasks: EmptyStateTask[] = [
    {
      id: 'quickstart',
      label: 'Quick Start Guide',
      description: 'Learn the basics in 5 minutes',
      icon: BookRegular,
      onClick: () => openGuide(),
      appearance: 'primary'
    },
    {
      id: 'template',
      label: 'Use Template',
      description: 'Start with a pre-built template',
      icon: DocumentRegular,
      onClick: () => useTemplate()
    },
    {
      id: 'tutorial',
      label: 'Watch Tutorial',
      description: 'Video walkthrough of key features',
      icon: VideoRegular,
      onClick: () => openTutorial(),
      appearance: 'subtle'
    }
  ];

  return (
    <ItemEditorEmptyView
      title="Create Your First Item"
      description="Choose how you'd like to get started"
      tasks={tasks}
    />
  );
}
```

### In View Registration

```tsx
// Using with ItemEditor view registration
const views: RegisteredView[] = [
  {
    name: EDITOR_VIEW_TYPES.EMPTY,
    component: (
      <ItemEditorEmptyView
        title="Welcome!"
        description="Get started with your new item"
        tasks={onboardingTasks}
      />
    )
  }
];
```

## 📖 Props API

### ItemEditorEmptyViewProps

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | ✅ | Main heading text |
| `description` | `string` | ❌ | Subtitle/description text |
| `imageSrc` | `string` | ❌ | URL to illustration image |
| `imageAlt` | `string` | ❌ | Alt text for image (required if imageSrc provided) |
| `tasks` | `EmptyStateTask[]` | ❌ | Array of onboarding tasks |
| `children` | `ReactNode` | ❌ | Custom content instead of tasks |
| `className` | `string` | ❌ | Additional CSS classes |

### EmptyStateTask Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the task |
| `label` | `string` | ✅ | Button text |
| `description` | `string` | ❌ | Task description |
| `icon` | `FluentIcon` | ❌ | Fluent UI icon component |
| `onClick` | `() => void` | ✅ | Click handler function |
| `appearance` | `'primary' \| 'secondary' \| 'subtle'` | ❌ | Button appearance |
| `disabled` | `boolean` | ❌ | Whether the task is disabled |

## 🎯 Key Features

### Centered Layout

Automatically centers content with proper minimum height:

```scss
.base-item-editor-empty-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 500px;  // Ensures proper centering
  padding: var(--spacingVerticalXXL);
}
```

### Responsive Behavior

Adapts to different screen sizes:

```scss
// Desktop: Large spacing and images
// Tablet: Medium spacing
// Mobile: Compact layout with smaller images
@media (max-width: 768px) {
  .empty-view-image {
    max-width: 200px;
  }
  
  .empty-view-content {
    padding: var(--spacingVerticalL);
  }
}
```

### Task Integration

Tasks are rendered as accessible buttons with proper spacing:

```tsx
// Each task becomes:
<Tooltip content={task.description} relationship="label">
  <Button
    appearance={task.appearance || 'secondary'}
    icon={task.icon && <task.icon />}
    onClick={task.onClick}
    disabled={task.disabled}
  >
    {task.label}
  </Button>
</Tooltip>
```

## 🏗️ Architecture

### Component Structure

```
ItemEditorEmptyView
├── Container (centered)
│   ├── Image (optional)
│   ├── Content
│   │   ├── Title
│   │   └── Description (optional)
│   ├── Tasks (if provided)
│   │   └── Button + Tooltip (for each task)
│   └── Children (if no tasks)
```

### CSS Classes

```scss
.base-item-editor-empty-view {
  // Main container
  
  &__image {
    // Illustration styling
  }
  
  &__content {
    // Text content area
  }
  
  &__title {
    // Main heading
  }
  
  &__description {
    // Subtitle text
  }
  
  &__tasks {
    // Task button container
  }
}
```

## 💡 Usage Patterns

### Pattern 1: Simple Get Started

```tsx
export function SimpleEmptyView() {
  return (
    <ItemEditorEmptyView
      title="Welcome to MyItem"
      description="Click below to create your first item"
      tasks={[
        {
          id: 'start',
          label: 'Get Started',
          onClick: () => setCurrentView('default'),
          appearance: 'primary'
        }
      ]}
    />
  );
}
```

### Pattern 2: Multiple Onboarding Options

```tsx
export function OnboardingEmptyView() {
  const tasks: EmptyStateTask[] = [
    {
      id: 'scratch',
      label: 'Start from Scratch',
      description: 'Create a completely new item',
      icon: AddRegular,
      onClick: () => createNew(),
      appearance: 'primary'
    },
    {
      id: 'import',
      label: 'Import Existing',
      description: 'Upload and import an existing item',
      icon: DocumentArrowUpRegular,
      onClick: () => showImport()
    },
    {
      id: 'template',
      label: 'Use Template',
      description: 'Start with a pre-built template',
      icon: DocumentTemplateRegular,
      onClick: () => showTemplates()
    }
  ];

  return (
    <ItemEditorEmptyView
      title="Create Your Item"
      description="Choose how you'd like to get started"
      imageSrc="/assets/create-item.svg"
      imageAlt="Create new item"
      tasks={tasks}
    />
  );
}
```

### Pattern 3: Custom Content

```tsx
export function CustomEmptyView() {
  return (
    <ItemEditorEmptyView
      title="No Data Available"
      description="Connect your data source to get started"
    >
      <div style={{ marginTop: '24px' }}>
        <Text variant="body1">Available data sources:</Text>
        <ul>
          <li>SQL Database</li>
          <li>REST API</li>
          <li>File Upload</li>
        </ul>
        <Button appearance="primary" onClick={handleConnect}>
          Connect Data Source
        </Button>
      </div>
    </ItemEditorEmptyView>
  );
}
```

### Pattern 4: Loading State

```tsx
export function LoadingEmptyView() {
  const [isLoading, setIsLoading] = useState(false);

  const tasks: EmptyStateTask[] = [
    {
      id: 'start',
      label: isLoading ? 'Creating...' : 'Create Item',
      onClick: async () => {
        setIsLoading(true);
        await createItem();
        setIsLoading(false);
      },
      disabled: isLoading,
      appearance: 'primary'
    }
  ];

  return (
    <ItemEditorEmptyView
      title="Ready to Create"
      tasks={tasks}
    />
  );
}
```

## ♿ Accessibility

### ARIA Support

- **Semantic HTML**: Uses proper heading hierarchy (h1, h2)
- **Button Labels**: Task buttons have accessible names
- **Image Alt Text**: Required when images are provided
- **Tooltips**: Task descriptions provide additional context

### Keyboard Navigation

- **Tab Order**: Logical tab sequence through tasks
- **Enter/Space**: Activate task buttons
- **Focus Indicators**: Clear focus styling

### Example with Enhanced Accessibility

```tsx
<ItemEditorEmptyView
  title="Create Your Dashboard"
  description="Choose a starting point for your new dashboard"
  tasks={[
    {
      id: 'blank',
      label: 'Blank Dashboard',
      description: 'Start with an empty canvas. Best for custom layouts.',
      onClick: createBlank,
      appearance: 'primary'
    }
  ]}
/>
```

## 🎨 Styling

### Design Tokens

```scss
// Typography
.empty-view-title {
  font-size: var(--fontSizeHero700);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground1);
}

.empty-view-description {
  font-size: var(--fontSizeBase300);
  color: var(--colorNeutralForeground2);
}

// Spacing
.empty-view-content {
  gap: var(--spacingVerticalM);
  margin-bottom: var(--spacingVerticalL);
}

// Images
.empty-view-image {
  max-width: 320px;
  margin-bottom: var(--spacingVerticalL);
}
```

### Custom Styling

```tsx
<ItemEditorEmptyView
  className="my-custom-empty"
  title="Custom Empty State"
  tasks={tasks}
/>
```

```scss
.my-custom-empty {
  background: var(--colorNeutralBackground2);
  
  .empty-view-title {
    color: var(--colorBrandForeground1);
  }
}
```

## 🔧 Best Practices

### ✅ Do's

✅ **Use clear, action-oriented titles** - "Create Your First Report"  
✅ **Provide helpful descriptions** - Explain what users will achieve  
✅ **Limit tasks to 3-5 options** - Avoid overwhelming users  
✅ **Use primary appearance** for the main action  
✅ **Include illustrations** when they add value  
✅ **Test responsive behavior** on different screen sizes  

### ❌ Don'ts

❌ **Don't use vague titles** - Avoid "Welcome" or "Getting Started"  
❌ **Don't overcrowd with tasks** - Too many options reduce clarity  
❌ **Don't forget alt text** for images  
❌ **Don't use complex layouts** - Keep it simple and focused  
❌ **Don't make it skippable** - Provide clear path forward  

## 🔗 Related Components

- **[ItemEditor](./README.md)** - Main container with view registration
- **[ItemEditorView](./ItemEditorView.md)** - Default view layout
- **[ItemEditorDetailView](./ItemEditorDetailView.md)** - Detail view layout
- **[Ribbon](./Ribbon.md)** - Ribbon container component

## 📝 Examples

For complete examples, see:
- [Sample Implementation](../../Workload/app/items/HelloWorldItem/HelloWorldItemEmptyView.tsx) - HelloWorld reference implementation
- [ItemEditor README](./README.md) - Integration patterns

