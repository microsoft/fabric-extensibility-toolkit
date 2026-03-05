# ItemEditor Architecture

Visual architecture and technical design documentation for the ItemEditor control with view registration system.

## Component Architecture

### Visual Structure

```
┌──────────────────────────────────────────────────────┐
│                  ItemEditor Container                 │
│                 (100vh, flex column)                  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         base-item-editor__ribbon                      │ │
│  │         (flex-shrink: 0, z-index: 1)            │ │
│  │                                                  │ │
│  │  ┌─────────────────────────────────────────┐   │ │
│  │  │      Ribbon with ViewContext            │   │ │
│  │  │      (Back button or Tabs + Actions)    │   │ │
│  │  └─────────────────────────────────────────┘   │ │
│  │                                                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         base-item-editor__notification               │ │
│  │         (optional, fixed above content)         │ │
│  │  ┌─────────────────────────────────────────┐   │ │
│  │  │      MessageBar / Notifications         │   │ │
│  │  └─────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         base-item-editor__content                     │ │
│  │         (flex: 1, overflow-y: auto)             │ │
│  │                                                  │ │
│  │  ┌─────────────────────────────────────────┐   │ │
│  │  │                                          │   │ │
│  │  │      Registered View (Dynamic)          │   │ │
│  │  │      ├─ Empty View                      │   │ │
│  │  │      ├─ Getting Started View            │   │ │
│  │  │      ├─ Detail Views (L2)               │   │ │
│  │  │      └─ Custom Views                    │   │ │
│  │  │                                          │   │ │
│  │  │      (Content scrolls here)             │   │ │
│  │  │                                          │   │ │
│  │  └─────────────────────────────────────────┘   │ │
│  │                                                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
ItemEditor (View Registration Mode)
├── Props
│   ├── ribbon: (context: ViewContext) => ReactNode ✅ Required
│   ├── notification?: (currentView: string) => ReactNode ❌ Optional
│   ├── views: RegisteredView[] | Function ✅ Required
│   ├── initialView: string ✅ Required
│   ├── onViewChange?: (view: string) => void ❌ Optional
│   ├── className?: string ❌ Optional
│   └── contentClassName?: string ❌ Optional
│
├── State Management (Internal)
│   ├── currentView: string
│   ├── viewHistory: string[] (for detail view navigation)
│   └── ViewContext: { currentView, setCurrentView, isDetailView, goBack, viewHistory }
│
├── DOM Structure
│   ├── <div className="base-item-editor">
│   │   ├── <div className="base-item-editor__ribbon">
│   │   │   └── {ribbon(viewContext)}
│   │   │
│   │   ├── <div className="base-item-editor__notification"> (optional)
│   │   │   └── {notification(currentView)}
│   │   │
│   │   └── <div className="base-item-editor__content">
│   │       └── {resolvedViews.find(v => v.name === currentView)?.component}
│
└── CSS Classes
    ├── .base-item-editor (container)
    ├── .base-item-editor__ribbon (fixed ribbon area)
    ├── .base-item-editor__notification (optional notification area)
    └── .base-item-editor__content (scrollable content area)
```

## View Registration System

### RegisteredView Interface

```typescript
interface RegisteredView {
  /** Unique name/key for the view */
  name: string;
  /** The view component to render */
  component: ReactNode;
  /** Whether this is a detail view (L2 page) - affects ribbon behavior */
  isDetailView?: boolean;
}
```

### ViewContext Interface

```typescript
interface ViewContext {
  /** Current active view name */
  currentView: string;
  /** Function to navigate to a different view */
  setCurrentView: (view: string) => void;
  /** Whether the current view is a detail view */
  isDetailView: boolean;
  /** Function to navigate back to previous view (only available in detail views) */
  goBack: () => void;
  /** History of visited views */
  viewHistory: string[];
}
```

## Data Flow with View Registration

```
Item Editor Component
        │
        ├─────────► ItemEditor (View Registration Mode)
        │              │
        │              ├─────► ribbon={(context) => <YourRibbon />}
        │              │         │
        │              │         └─► Ribbon Component
        │              │               ├─► ViewContext received
        │              │               ├─► Back button (detail views)
        │              │               ├─► Tabs (normal views)
        │              │               └─► Actions
        │              │
        │              ├─────► views={registeredViews}
        │              │         │
        │              │         └─► View Registration
        │              │               ├─► EMPTY view
        │              │               ├─► DEFAULT view
        │              │               ├─► DETAIL views (isDetailView: true)
        │              │               └─► CUSTOM views
        │              │
        │              ├─────► initialView="empty"
        │              │
        │              └─────► notification={(currentView) => ...}
        │
        └─────────► Internal State Management
                       ├─► currentView (managed internally)
                       ├─► viewHistory (automatic tracking)
                       ├─► ViewContext (passed to ribbon)
                       └─► View resolution and rendering
```

## Layout Flow

### Flexbox Layout Strategy

```
ItemEditor {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

┌─────────────────────────┐
│  flex-shrink: 0         │  ← Ribbon (fixed size)
│  (Ribbon never shrinks) │
├─────────────────────────┤
│                         │
│  flex: 1                │  ← Content (fills space)
│  overflow-y: auto       │     (scrolls independently)
│                         │
│  (Takes remaining       │
│   vertical space)       │
│                         │
└─────────────────────────┘
```

### Height Calculation

```
Total Available Height: 100vh

┌──────────────────────┐
│  Ribbon Area         │ ← Auto height based on content
│  (flex-shrink: 0)    │    (typically 60-80px)
├──────────────────────┤
│                      │
│  Content Area        │ ← Remaining height
│  (flex: 1)           │    (100vh - ribbon height)
│  overflow-y: auto    │
│                      │
└──────────────────────┘
```

## CSS Architecture

### Block-Element-Modifier (BEM)

```scss
// Block
.base-item-editor {
  // Container styles
}

// Elements
.base-item-editor__ribbon {
  // Ribbon area styles
}

.base-item-editor__content {
  // Content area styles
}

// Modifiers (via props)
.base-item-editor.custom-class {
  // Custom overrides
}
```

### CSS Specificity

```
Level 1: Base Styles
  .base-item-editor { ... }
  .base-item-editor__ribbon { ... }
  .base-item-editor__content { ... }

Level 2: View-Specific Styles
  .base-item-editor__content .empty-state-container { ... }
  .base-item-editor__content .editor-default-view { ... }
  .base-item-editor__content .editor-detail-view { ... }

Level 3: Custom Overrides (via props)
  .base-item-editor.my-custom-editor { ... }
  .base-item-editor__content.my-custom-content { ... }
```

## Rendering Flow

```
1. Component Mounts
   └─► ItemEditor renders

2. Layout Initialization
   ├─► Container: 100vh height
   ├─► Ribbon: Fixed at top
   └─► Content: Fills remaining space

3. Content Rendering
   ├─► Children render inside content area
   ├─► View determines content height
   └─► Scrollbar appears if content > viewport

4. User Interaction
   ├─► Ribbon: Always visible (fixed)
   ├─► Content: Scrolls independently
   └─► State changes: Re-render children only
```

## State Management Pattern

```
Item Editor Component
├── Local State
│   ├── isLoading
│   ├── item
│   ├── currentView
│   └── other item-specific state
│
├── Derived State
│   ├── isSaveEnabled
│   ├── shouldShowEmpty
│   └── active tab/view
│
└── Callbacks
    ├── handleSave
    ├── handleNavigate
    ├── handleSettingsOpen
    └── other actions

          ↓ Passed to

ItemEditor (Stateless)
├── ribbon prop
│   └─► Receives callbacks and state
│
└── children prop
    └─► Receives item data and callbacks
```

## Integration Points

### With Ribbon System

```
ItemEditor
   │
   └─► ribbon prop
        │
        └─► Ribbon
             ├─► Tabs (via StandardRibbonTabs)
             │   └─► Home (mandatory)
             │       Additional tabs (optional)
             │
             └─► Toolbars
                 ├─► Standard Actions
                 │   ├─► Save
                 │   ├─► Settings
                 │   └─► About
                 │
                 └─► Custom Actions
                     └─► Item-specific actions
```

### With View System

```
ItemEditor
   │
   └─► children prop
        │
        ├─► Empty View
        │   └─► First-time experience
        │       └─► Call-to-action
        │
        ├─► Default View
        │   └─► Main editing interface
        │       ├─► Forms
        │       ├─► Cards
        │       └─► Sections
        │
        ├─► Detail Views
        │   └─► Level 2 navigation
        │       ├─► Focused content
        │       └─► Back navigation
        │
        └─► Custom Views
            └─► Item-specific content
```

## Scroll Behavior

### Scroll Management

```
Outer Container (base-item-editor)
├─► overflow: hidden ← Prevents outer scroll
│
└─► Content Area (base-item-editor__content)
    └─► overflow-y: auto ← Enables inner scroll

User scrolls ↓
    │
    └─► Only content area scrolls
         Ribbon stays fixed at top
```

### Scroll Position

```
┌─────────────────────────┐
│  Ribbon (Fixed)         │ ← Always visible
├─────────────────────────┤ ← Scroll starts here
│  [Content Visible]      │
│                         │
│  [Content Visible]      │
│                         │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤ ← Viewport bottom
│  [Content Hidden]       │
│  (below scroll)         │
└─────────────────────────┘
```

## Z-Index Layering

```
Layer 3: Dialogs/Modals (z-index: 1000+)
         │
Layer 2: Ribbon (z-index: 1)
         │
Layer 1: Content (z-index: auto/0)
         │
Layer 0: Background
```

## Responsive Behavior

### Desktop (> 768px)

```
┌──────────────────────────┐
│  Ribbon: 8px padding     │
├──────────────────────────┤
│                          │
│  Content: 8px padding    │
│                          │
└──────────────────────────┘
```

### Mobile (≤ 768px)

```
┌──────────────────────────┐
│  Ribbon: 4px padding     │
├──────────────────────────┤
│                          │
│  Content: 4px padding    │
│                          │
└──────────────────────────┘
```

## Performance Characteristics

### Rendering

```
Initial Render
├─► ItemEditor: O(1)
├─► Ribbon: O(n) where n = number of actions
└─► Content: O(m) where m = complexity of view

State Updates
├─► Ribbon props change: Re-render ribbon only
├─► Content props change: Re-render content only
└─► View switch: Re-render content, ribbon stays mounted
```

### Memory

```
ItemEditor Container: ~1KB
├─► DOM nodes: 3 (container + ribbon + content)
├─► Event listeners: 0 (CSS-only scrolling)
└─► React components: 1 + children
```

### Scrolling Performance

```
Scrolling Method: Native CSS (overflow-y: auto)
├─► No JavaScript involved
├─► GPU accelerated
├─► Smooth 60fps
└─► No layout thrashing
```

## Browser Compatibility

### Layout Support

- **Flexbox**: All modern browsers ✅
- **100vh**: All modern browsers ✅
- **CSS Variables**: All modern browsers ✅
- **Custom Scrollbar**: Webkit browsers ⚠️ (graceful degradation)

### Tested Browsers

- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile Safari (14+)
- ✅ Mobile Chrome (90+)

## Accessibility Architecture

### Semantic Structure

```html
<div class="base-item-editor" role="main">
  <div class="base-item-editor__ribbon" role="banner">
    <!-- Navigation/Actions -->
  </div>
  <div class="base-item-editor__content" role="region">
    <!-- Main content -->
  </div>
</div>
```

### Focus Management

```
Tab Order:
1. Ribbon actions (via Ribbon)
2. Content area (focusable)
3. Interactive elements in content
4. Return to ribbon (cycle)
```

### Screen Reader Announcements

```
Page Load
  └─► "Main content loaded"

View Switch
  └─► "Now viewing [view name]"

Save Action
  └─► "Item saved successfully"
```

## Testing Architecture

### Component Testing

```
Unit Tests
├─► ItemEditor renders correctly
├─► Props are passed correctly
├─► Ribbon is rendered
├─► Content is rendered
└─► CSS classes applied

Integration Tests
├─► With Ribbon
├─► With view components
├─► View switching
└─► Scroll behavior

E2E Tests
├─► Full editor workflow
├─► Save functionality
├─► Navigation
└─► Responsive behavior
```

### Test Selectors

```tsx
// Container
screen.getByTestId('base-item-editor')

// Ribbon area
screen.getByTestId('base-item-editor-ribbon')

// Content area
screen.getByTestId('base-item-editor-content')
```

## File Dependencies

```
ItemEditor.tsx
├─► Imports
│   └─► React
│
├─► Exports
│   ├─► ItemEditor (component)
│   └─► ItemEditorProps (type)
│
└─► Styles
    └─► ./ItemEditor.scss

ItemEditor.scss
├─► Imports
│   └─► Fabric design tokens (CSS vars)
│
└─► Exports
    ├─► .base-item-editor
    ├─► .base-item-editor__ribbon
    └─► .base-item-editor__content

components/index.ts
├─► Exports
│   ├─► ItemEditor (from ./ItemEditor)
│   └─► ItemEditorProps (from ./ItemEditor)
│
└─► Re-exported by
    └─► Item editors
```

## Design Tokens Used

```scss
// Backgrounds
--colorNeutralBackground1  // #ffffff (cards)
--colorNeutralBackground2  // #f3f2f1 (container)

// Borders
--colorNeutralStroke1      // #d1d1d1 (scrollbar)
--colorNeutralStroke1Hover // #b3b3b3 (scrollbar hover)

// Focus
--colorBrandStroke1        // #0078d4 (focus outline)

// Shadows
box-shadow: 0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-10-06  
**Status**: Production Ready

