# HelloWorld Item

A foundational template and reference implementation for creating custom Fabric items, providing developers with a complete starting point for extensibility development.

![Hello World Item Demo](./media/FET-Blog-HelloWorld.gif)

## Purpose

The HelloWorld Item is the essential starting template for Microsoft Fabric extensibility development. It provides developers with a fully functional, well-documented reference implementation that demonstrates all core patterns and best practices for building custom Fabric items.

**Primary Use Cases:**
- **Template Foundation**: Starting point for new custom Fabric item development
- **Learning Resource**: Educational example demonstrating Fabric development patterns  
- **Best Practices Reference**: Implementation guide for proper Fabric integration
- **Rapid Prototyping**: Quick foundation for proof-of-concept development

## Overview

The HelloWorld Item serves as the primary template and learning resource for developers building custom Microsoft Fabric items. It demonstrates essential patterns, best practices, and integration points while providing a functional starting point that can be customized for specific use cases.

## 📚 Documentation

- **[Architecture Overview](./Architecture.md)** - Component structure and development patterns

## 🔌 Fabric APIs & Permissions

### Required Fabric API Scopes
- **`https://api.fabric.microsoft.com/Item.ReadWrite.All`** - Basic item management operations
- **`https://api.fabric.microsoft.com/Workspace.Read.All`** - Access workspace context and navigation

### Fabric Platform APIs Used
- **Items API** (`/v1/workspaces/{workspaceId}/items/{itemId}`)
  - Load item metadata and definition
  - Save item definition and state
  - Handle item lifecycle operations (create, read, update)
- **Workload Client API** (Microsoft Fabric SDK)
  - Item CRUD operations via `getWorkloadItem()` and `saveItemDefinition()`
  - Workspace context and navigation
  - User authentication and authorization
- **Notification API** (Fabric Platform Services)
  - Display user notifications and status messages
  - Handle success and error feedback
- **Settings API** (Fabric Platform Services)
  - Access user preferences and configuration
  - Manage application settings and customization

### Template Extension Points
When extending this template, additional APIs may be required depending on functionality:

- **OneLake Storage API** - For data file operations
- **Spark Livy API** - For compute job submission
- **Power BI API** - For report and dataset integration
- **Custom Service APIs** - For domain-specific functionality

### Authentication Requirements
- **Azure AD Application Registration** with appropriate Fabric API permissions
- **Delegated Permissions** for user-context operations
- **Microsoft Authentication Library (MSAL)** integration
- **Fabric Workspace Access** for item creation and management

### Minimal Permission Set
This template demonstrates the **minimal required permissions** for Fabric item development:
- Item read/write for basic persistence
- Workspace read for context and navigation
- User authentication for security context

## Key Features

### Template Foundation
- **Complete Item Structure**: Full implementation of Fabric item patterns
- **UI Components**: Ribbon, editor, empty state, and settings pages
- **State Management**: Proper definition handling and persistence
- **Internationalization**: Multi-language support with React i18n

### Developer Experience
- **Clear Code Structure**: Well-organized, commented, and documented code
- **Extensible Architecture**: Modular design for easy customization
- **Best Practices**: Demonstrates recommended Fabric development patterns
- **Getting Started Flow**: Built-in onboarding for new items

### Fabric Integration
- **Workload Client**: Proper integration with Fabric platform APIs
- **Item Lifecycle**: Complete create, read, update, delete operations
- **Navigation**: Proper routing and URL parameter handling
- **Notifications**: Integration with Fabric notification system

## Architecture

```text
HelloWorldItem/
├── HelloWorldItemEditor.tsx              # Main editor component
├── HelloWorldItemRibbon.tsx              # Toolbar and actions
├── HelloWorldItemEmptyView.tsx           # Empty state/onboarding
├── HelloWorldItemDefaultView.tsx         # Main content view
├── HelloWorldItemDefinition.ts                # Data models and types
├── HelloWorldItem.scss                   # Item-specific styles
└── docs/                                 # Documentation
    ├── Architecture.md                   # System architecture
```

## Quick Start

### Using as Template
1. **Copy the HelloWorldItem folder** to create your new item
2. **Rename components** and update imports throughout
3. **Customize the model** in `HelloWorldItemDefinition.ts`
4. **Update UI components** to match your requirements
5. **Modify navigation** and routing configuration

### Development Workflow
1. **Load Item**: Uses `getWorkloadItem` to load existing items
2. **State Management**: Proper handling of item definition state
3. **Save Operations**: `saveItemDefinition` for persistence
4. **View Switching**: Navigate between empty and default views

### Customization Points
- **Data Model**: Extend `HelloWorldItemDefinition` interface
- **UI Components**: Replace or enhance existing components
- **Business Logic**: Add custom functionality and operations
- **Styling**: Customize appearance and branding

## Component Structure

### HelloWorldItemEditor (Main Component)
**Core responsibilities:**
- Item loading and state management
- View routing and navigation
- Save operation handling
- Integration with Fabric platform

**Key Features:**
- Automatic item loading from URL parameters
- Proper definition initialization
- View state management (empty, getting-started)
- Translation support

### HelloWorldItemRibbon (Toolbar)
**Provides:**
- Primary action buttons
- Settings and about page navigation
- Context-sensitive actions
- Consistent Fabric UI patterns

### HelloWorldItemEmptyView (Onboarding)
**Purpose:**
- First-time user experience
- Getting started guidance
- Call-to-action for initial setup
- Easy removal or customization

### HelloWorldItemDefaultView (Main View)
**Architecture:**
- Uses `ItemEditorDefaultView` for structured multi-panel layout
- Left panel: Welcome section with hero branding, getting started steps, and message input field
- Center panel: Resource hub with expandable item details and documentation cards
- Responsive design with configurable panel widths and resizable interface

**Contains:**
- Welcome messaging and workload development guidance
- Interactive getting started steps with numbered action items
- Resource cards linking to documentation, samples, and UX guidelines
- Expandable item details section showing workspace context and metadata

**Layout Features:**
- Multi-panel architecture with left/center content organization
- Resizable interface with 600px default width and 350px minimum for left panel
- Clean, semantic HTML structure with proper accessibility attributes
- Interactive elements including expandable sections and hover states

### HelloWorldItemDefinition (Data)
**Defines:**
- Item definition interface
- View type constants
- Type definitions
- State management structures

## Data Model

### HelloWorldItemDefinition
```typescript
interface HelloWorldItemDefinition {
  state?: string;  // Flexible state storage
}
```

### View Types
```typescript
const EDITOR_VIEW_TYPES = {
  EMPTY: 'empty',
  DEFAULT: 'default'
} as const;
```

## Integration Patterns

### Fabric Platform Integration
- **WorkloadClient API**: Primary interface to Fabric services
- **Item CRUD Operations**: Create, read, update, delete functionality
- **Navigation Controller**: Proper URL routing and parameters
- **Notification System**: User feedback and status updates

### State Management
- **Definition Persistence**: Automatic saving of item state
- **View State**: Proper handling of UI state transitions
- **Loading States**: User feedback during async operations
- **Error Handling**: Graceful error recovery and user notification

### UI/UX Patterns
- **Fluent UI Components**: Consistent Microsoft design system integration
- **Multi-Panel Layout Architecture**: Uses ItemEditorDefaultView for flexible content organization
- **Structured Content Areas**: Left panel for welcome/getting started, center panel for resources
- **Responsive Interface**: Resizable panels with configurable constraints and accessibility support
- **Interactive Elements**: Expandable sections, hover states, and semantic navigation
- **Theme Support**: Integration with Fabric theme system and design tokens

## Development Best Practices

### Code Organization
- **Component Separation**: Clear separation of concerns
- **Model Definitions**: Centralized type definitions
- **Asset Management**: Proper image and resource handling
- **Styling**: Consistent CSS class naming and organization

### Error Handling
- **Async Operations**: Proper promise handling and error catching
- **User Feedback**: Meaningful error messages and notifications
- **Graceful Degradation**: Fallback behavior for failed operations
- **Loading States**: Visual feedback during operations

### Performance
- **Lazy Loading**: Components loaded only when needed
- **State Optimization**: Minimal re-renders and efficient updates
- **Asset Optimization**: Optimized images and resources
- **Memory Management**: Proper cleanup and resource disposal

## Customization Guide

### Creating a New Item Type
1. **Copy Template**: Start with HelloWorldItem as foundation
2. **Rename Components**: Update all component names and files
3. **Update Model**: Define your custom data structure
4. **Implement Logic**: Add your business logic and functionality
5. **Customize UI**: Design your user interface
6. **Configure Routing**: Update navigation and URL handling
7. **Test Integration**: Ensure proper Fabric platform integration

### Common Customizations
- **Add new views**: Extend view types and routing
- **Custom data fields**: Enhance the definition interface
- **Additional actions**: Add ribbon buttons and functionality
- **Settings page**: Customize user preferences and configuration
- **Validation**: Add data validation and business rules

## Translation Support

The HelloWorld Item includes comprehensive internationalization support:

### Translation Keys
- `HelloWorldItemEmptyView_Title`: Welcome screen title
- `HelloWorldItemEmptyView_Description`: Onboarding description
- `HelloWorldItemEmptyView_StartButton`: Getting started button

### Adding Translations
1. **Define Keys**: Add translation keys to components
2. **Update i18n Files**: Add translations for supported languages
3. **Use useTranslation**: Implement React i18n hooks
4. **Test Languages**: Verify translations in different locales

## Testing and Validation

### Development Testing
- **Component Rendering**: Verify all components render correctly
- **State Management**: Test state transitions and persistence
- **API Integration**: Validate Fabric platform integration
- **Error Scenarios**: Test error handling and recovery

### User Acceptance Testing
- **User Flows**: Test complete user workflows
- **Accessibility**: Verify screen reader and keyboard support
- **Performance**: Test with realistic data loads
- **Cross-browser**: Validate across supported browsers

This HelloWorld Item provides a comprehensive foundation for Fabric item development, demonstrating essential patterns while remaining simple enough to understand and customize.
