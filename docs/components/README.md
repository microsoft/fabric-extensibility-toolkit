# Components Documentation

This directory contains documentation for all reusable components in the Microsoft Fabric Extensibility Toolkit. These components are designed to accelerate workload development while maintaining consistency with Fabric Design System guidelines.

## 🏗️ Control Architecture

Components are organized in a layered architecture:

- **Foundation**: ItemEditor provides the base structure for all item editors
- **Specialized**: Purpose-built components for specific workflows (OneLakeView, Wizard)
- **Extensible**: All components can be customized while maintaining UX compliance

## 📋 Available Components

### Core Components (Required)

#### [ItemEditor Component](./ItemEditor.md)
**Purpose**: Foundational component system for building item editors  
**Status**: **MANDATORY** for all item editors  
**Features**: View registration, ribbon integration, consistent layouts (multi-panel, empty state, detail views)  
**Documentation**: [ItemEditor/](./ItemEditor/) - Comprehensive documentation with examples and implementation guides

### Workflow Components (Optional)

#### [Wizard Component](./Wizard.md)
**Purpose**: Step-by-step guided workflow control  
**Use Cases**: Complex multi-step processes, setup wizards, configuration workflows  
**Features**: Automatic navigation, validation, context sharing between steps

### Data Components (Optional)

#### [OneLakeView Component](./OneLakeView.md)
**Purpose**: OneLake item browsing and selection  
**Use Cases**: File/folder exploration, data source selection, OneLake integration  
**Features**: Tree navigation, file/table selection, item management

## 🎯 Component Selection Guide

### For Item Editors
- **Always use**: [ItemEditor](./ItemEditor.md) as the foundation
- **Add as needed**: Other components based on functionality requirements

### For Complex Workflows
- **Multi-step processes**: [Wizard](./Wizard.md) for guided experiences
- **OneLake integration**: [OneLakeView](./OneLakeView.md) for data exploration

### For Custom Requirements
- **Build on foundation**: Extend ItemEditor for custom layouts
- **Follow patterns**: Reference existing component implementations
- **Maintain compliance**: Use Fabric Design System guidelines

## 🚀 Quick Start

### Basic Item Editor
```typescript
import { ItemEditor } from '../../components/ItemEditor';

// Minimal setup - see ItemEditor docs for full examples
```

### Adding OneLake Integration
```typescript
import { OneLakeView } from '../../components/OneLakeView';

// OneLake browsing - see OneLakeView docs for configuration
```

### Multi-Step Workflows
```typescript
import { WizardControl } from '../../components/Wizard';

// Step-by-step processes - see Wizard docs for step configuration
```

## 📚 Documentation Structure

- **[ItemEditor/](./ItemEditor/)** - Complete documentation for the core component system
- **[OneLakeView.md](./OneLakeView.md)** - OneLake integration patterns
- **[Wizard.md](./Wizard.md)** - Workflow and wizard patterns

## 🔧 Implementation Guidelines

### Code Location
- **Import from**: `Workload/app/components/[ComponentName]`
- **Documentation**: `docs/components/[ComponentName].md` or `docs/components/[ComponentName]/`

### Best Practices
- **Use components, don't copy**: Import from components directory, never copy sample code
- **Follow patterns**: Reference documentation examples for proper usage
- **Maintain consistency**: Use provided components for standard functionality
- **Extend thoughtfully**: Build custom components following established patterns

## 🎨 Design Compliance

All components follow Microsoft Fabric Design System guidelines:
- **Consistent theming** with Fabric design tokens
- **Accessible** with proper ARIA labels and keyboard navigation
- **Responsive** design for various screen sizes
- **High contrast** support for accessibility

---

For detailed implementation guides and examples, see the individual control documentation linked above.