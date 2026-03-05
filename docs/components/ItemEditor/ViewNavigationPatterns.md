# View Navigation and Notifications in ItemEditor

## Overview

The ItemEditor uses a static registration pattern for both views and notifications, similar to how ribbon actions are defined.
Views and notifications are defined as simple arrays and use hooks for navigation and state management.

## View Registration Pattern

### Define Views Statically

```tsx
import { ItemEditor, RegisteredView, useViewNavigation } from '../../components/ItemEditor';

// Create wrapper components that use the navigation hook
const EmptyViewWrapper = () => {
  const { setCurrentView } = useViewNavigation();
  
  return (
    <EmptyView 
      onNavigate={() => setCurrentView('default')}
    />
  );
};

const DefaultViewWrapper = () => {
  const { setCurrentView } = useViewNavigation();
  
  return (
    <DefaultView 
      onShowDetail={(id) => setCurrentView(`detail-${id}`)}
    />
  );
};

const DetailViewWrapper = () => {
  const { goBack } = useViewNavigation();
  
  return (
    <DetailView 
      onBack={goBack}
    />
  );
};

// Define views as static array - like ribbon actions
const views: RegisteredView[] = [
  {
    name: 'empty',
    component: <EmptyViewWrapper />
  },
  {
    name: 'default',
    component: <DefaultViewWrapper />
  },
  {
    name: 'detail-123',
    component: <DetailViewWrapper />,
    isDetailView: true  // Enables automatic back navigation
  }
];

// Usage
<ItemEditor 
  views={views} 
  initialView="empty"
  ribbon={(context) => <MyRibbon viewContext={context} />}
/>
```

## Key Benefits

1. **Simple Definition**: Views defined as static array like ribbon actions
2. **Clean Navigation**: Use `useViewNavigation()` hook in components  
3. **Automatic Back Navigation**: Detail views get back navigation for free
4. **Better TypeScript**: No complex function wrapper types
5. **Easier Testing**: View components can be tested independently
6. **Consistent Pattern**: Matches ribbon action definition pattern

## Navigation Hook API

```tsx
const { 
  setCurrentView,  // (view: string) => void - Navigate to any view
  goBack,          // () => void - Navigate back (for detail views)
  viewHistory      // string[] - Array of visited views
} = useViewNavigation();
```

## Notification Registration Pattern

### Define Notifications Statically

```tsx
import { RegisteredNotification } from '../../components/ItemEditor';
import { MessageBar, MessageBarBody, Button } from '@fluentui/react-components';

// Static notification definitions - like views!
const notifications: RegisteredNotification[] = [
  {
    name: 'default-warning',
    showInViews: ['default'], // Only show in specific views
    component: showWarning ? (
      <MessageBar intent="warning">
        <MessageBarBody>
          This content can be deleted at any time.
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button onClick={() => setShowWarning(false)}>
              Dismiss
            </Button>
          }
        />
      </MessageBar>
    ) : null
  },
  {
    name: 'global-info',
    showInViews: [], // Empty array = show in all views
    component: (
      <MessageBar intent="info">
        <MessageBarBody>
          This notification appears in all views.
        </MessageBarBody>
      </MessageBar>
    )
  }
];

// Usage
<ItemEditor 
  views={views}
  notifications={notifications}
  initialView="empty"
/>
```

### Notification Features

- **View-specific**: Use `showInViews` array to control which views show the notification
- **Global notifications**: Empty `showInViews` array shows in all views
- **State-driven**: Notifications can respond to component state changes
- **Conditional rendering**: Return `null` to hide notification dynamically

## Detail Views

Mark views as detail views to enable automatic back navigation:

```tsx
{
  name: 'detail-record',
  component: <DetailViewWrapper />,
  isDetailView: true  // ⭐ This enables automatic back navigation
}
```

When `isDetailView: true`:

- ItemEditor automatically tracks navigation history
- `goBack()` function navigates to previous view
- Ribbon receives `context.isDetailView = true`
- Ribbon can show back button instead of tabs

## Complete Example

```tsx
import { ItemEditor, useViewNavigation, RegisteredNotification } from '../../components/ItemEditor';
import { MessageBar, MessageBarBody, Button } from '@fluentui/react-components';

export function MyItemEditor() {
  const [showWarning, setShowWarning] = useState(true);
  
  // View wrapper components
  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    return <EmptyView onStart={() => setCurrentView('main')} />;
  };
  
  const MainViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();
    return <MainView onShowDetail={(id) => setCurrentView(`detail-${id}`)} />;
  };
  
  const DetailViewWrapper = () => {
    const { goBack } = useViewNavigation();
    return <DetailView onBack={goBack} />;
  };

  // Static view definitions
  const views = [
    { name: 'empty', component: <EmptyViewWrapper /> },
    { name: 'main', component: <MainViewWrapper /> },
    { name: 'detail-123', component: <DetailViewWrapper />, isDetailView: true }
  ];

  // Static notification definitions
  const notifications: RegisteredNotification[] = [
    {
      name: 'main-warning',
      showInViews: ['main'],
      component: showWarning ? (
        <MessageBar intent="warning">
          <MessageBarBody>
            You can delete this content at any time.
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button onClick={() => setShowWarning(false)}>
                Dismiss
              </Button>
            }
          />
        </MessageBar>
      ) : null
    }
  ];

  return (
    <ItemEditor
      views={views}
      notifications={notifications}
      initialView="empty"
      ribbon={(context) => (
        <Ribbon
          showBackButton={context.isDetailView}
          onBack={context.goBack}
          currentView={context.currentView}
        />
      )}
    />
  );
}
```

