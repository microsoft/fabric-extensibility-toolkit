# GitHub Copilot instructions for Microsoft Fabric Extensibility Toolkit

## Overview

This file contains GitHub Copilot-specific instructions that extend the platform-agnostic AI skills in the `.ai/` folder. Copilot should reference the skills first, then apply the enhancements below.

## AI skills and references

Reference the platform-agnostic skills for all procedures and context:

- **Item development**: `.ai/skills/fabric-items/SKILL.md` -- create, delete, rename items
- **Item code templates**: `.ai/skills/fabric-items/examples.md` -- all implementation templates
- **Component APIs**: `.ai/skills/fabric-items/references/item-components.md` -- ItemEditor, Ribbon, layout components
- **Workload operations**: `.ai/skills/fabric-workloads/SKILL.md` -- run, deploy, publish, configure
- **Platform context**: `.ai/references/fabric-platform.md` -- Microsoft Fabric platform overview
- **Formatting rules**: `.ai/references/markdown-formatting.md` -- Markdown linting standards

## GitHub Copilot enhanced features

### Agent activation

Use `@fabric` or these keywords for specialized assistance:

- `fabric workload` -- Extensibility Toolkit development help
- `fabric item` -- Item creation with code generation
- `fabric auth` -- Authentication patterns
- `fabric api` -- API integration
- `fabric deploy` -- Deployment automation

### Skill integration

| Skill | Copilot enhancement |
| ----- | ------------------- |
| `.ai/skills/fabric-items/SKILL.md` | Auto-generates 5-file structure with TypeScript interfaces |
| `.ai/skills/fabric-items/references/delete-item.md` | Validates dependencies before suggesting removal |
| `.ai/skills/fabric-workloads/references/run-workload.md` | Provides environment validation and startup optimization |
| `.ai/skills/fabric-workloads/SKILL.md` (update) | Suggests configuration updates with impact analysis |
| `.ai/skills/fabric-workloads/references/deploy-workload.md` | Validates deployment readiness with security checks |
| `.ai/skills/fabric-workloads/references/publish-workload.md` | Ensures production-ready manifest compliance |

## Behavioral rules

### Smart suggestions

- **File creation**: When creating items, suggest the 5-file pattern structure (Definition, Editor, EmptyView, DefaultView, Ribbon)
- **Import resolution**: Auto-import Fabric platform types and client libraries
- **Fluent UI**: Prefer components from `@fluentui/react-components` (v9) over `@fluentui/react` (v8). Replace imports like `import { DefaultButton } from '@fluentui/react'` with `import { Button } from '@fluentui/react-components'`
- **Ribbon pattern**: Always suggest `Ribbon` + `RibbonToolbar` with `createSaveAction()`, `createSettingsAction()` factories from `components/ItemEditor`
- **Toolbar components**: Always use `Tooltip` + `ToolbarButton` pattern for toolbar actions with proper accessibility attributes
- **OneLakeStorageClient**: Always use `createItemWrapper()` for item-scoped OneLake operations. Never use direct client methods with manual path construction
- **OneLakeView**: Always use component from `components/OneLakeView`, not sample code. Initialize with `initialItem` config for content display
- **Error recovery**: Provide specific fixes for common Fabric authentication and manifest issues
- **Code completion**: Understand Fabric-specific patterns like `callNotificationOpen()` and `saveItemDefinition()`

### Workspace intelligence

- **Manifest sync**: Detect when implementation changes require manifest updates
- **Environment awareness**: Suggest appropriate `.env` configurations based on current context
- **Build validation**: Predict build issues before they occur
- **Routing updates**: Automatically suggest route additions when new items are created

## Auto-completion patterns

Copilot recognizes Fabric patterns and suggests:

- **Ribbon components**: `homeToolbarActions` array (mandatory) with `createSaveAction()`, `createSettingsAction()` factories, plus optional `additionalToolbars` for complex items
- **Toolbar integration**: Mandatory `Tooltip` + `ToolbarButton` patterns for all toolbar implementations
- **OneLake storage**: `itemWrapper = oneLakeClient.createItemWrapper({id, workspaceId})` for item-scoped operations
- **OneLake explorer**: Component from `components/OneLakeView`, not sample code
- **ItemEditor view registration**: Static view registration pattern with `views` prop. Define views as static array
- **ItemEditor initial view**: Use `initialView` prop for data-dependent view determination
- **ItemEditor scrolling**: Never implement scrolling in item views. ItemEditor center panel handles all overflow with automatic vertical scrolling
- **View navigation**: `setCurrentView()` in view wrapper components for navigation between views
- **ItemEditorDefaultView**: Two-panel layouts with `left`/`center` panel configurations, resizable splitters, and collapsible panels
- **Panel usage**:
  - Left panel (optional): Navigation trees, OneLakeView, file explorers, catalog browsers
  - Center panel (required): Main content, editors, primary workspace
- **Detail view navigation**: `ItemEditorDetailView` with `isDetailView: true` for L2 drill-down pages
- **Empty view pattern**: `ItemEditorEmptyView` for items without definition/state, with call-to-action buttons
- **Item properties**: `ItemSettings` pattern for general item properties (version, endpoint configuration, descriptions) through the settings flyout
- **Panel configuration**: `collapsible: true`, panel titles, min/max width constraints, accessibility labels
- **Manifest updates**: Template processing with `{{PLACEHOLDER}}` replacement
- **Route configuration**: Automatic route registration matching `editor.path` in JSON manifest
- **Environment management**: `.env`-based configuration patterns

### Workspace-aware features

- **File relationships**: Understand manifest template to implementation dependencies
- **Environment detection**: Suggest appropriate configurations for dev/test/prod
- **Template processing**: Recognize placeholder patterns like `{{WORKLOAD_NAME}}`
- **Error resolution**: Provide specific fixes for Fabric development issues
- **Pattern learning**: Adapt suggestions based on existing codebase patterns

## Reference architecture

For complete understanding, reference:

- **Platform-agnostic skills**: All files in `.ai/skills/` and `.ai/references/`
- **Copilot enhancements**: This file's specific Copilot features
- **Live workspace**: Current implementation patterns and recent changes

## Response guidelines

- Clean up unsuccessful code attempts immediately when finding the correct solution
- Only leave changes that actually contribute to the working solution
