# Microsoft Fabric Extensibility Toolkit

This repository contains everything needed to create custom workloads for Microsoft Fabric. It includes a HelloWorld sample, build and deployment scripts, and AI-assisted development support.

## Project structure

- `Workload/app/` -- React/TypeScript frontend source code
- `Workload/Manifest/` -- Manifest templates with `{{PLACEHOLDER}}` tokens
- `Workload/app/components/` -- Shared components (never modify these files)
- `Workload/app/items/` -- Item implementations (one folder per item)
- `scripts/` -- Setup, build, run, and deployment scripts
- `build/` -- Generated artifacts (not committed)

## Build and run commands

```powershell
# Initial setup
cd scripts/Setup
.\Setup.ps1 -WorkloadName "Org.MyWorkload"

# Install dependencies
cd Workload && npm install

# Start development (two terminals)
.\scripts\Run\StartDevGateway.ps1    # Terminal 1
.\scripts\Run\StartDevServer.ps1     # Terminal 2

# Build and test
cd Workload && npm run build:test

# Build manifest package
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev
```

## Key architectural rules

1. All item editors must use `<ItemEditor>` as the root container -- no custom layouts
2. All ribbons must use `<Ribbon>` + `<RibbonToolbar>` with standard action factories (`createSaveAction`, `createSettingsAction`)
3. Never modify files in `Workload/app/components/` -- components provide standardized layouts for all items
4. Item styles go in `[ItemName]Item.scss` with prefixed class names -- never inline styles
5. Use `@fluentui/react-components` (v9), not `@fluentui/react` (v8)
6. Update `ITEM_NAMES` in all `.env` files (`.env.dev`, `.env.test`, `.env.prod`) when adding, removing, or renaming items
7. Update `Workload/Manifest/Product.json` when adding items -- required for item visibility in Fabric

## Item development pattern

Every item requires five implementation files plus a stylesheet:

```text
Workload/app/items/[ItemName]Item/
  [ItemName]ItemDefinition.ts        # Data interface and state
  [ItemName]ItemEditor.tsx           # Main editor (uses ItemEditor container)
  [ItemName]ItemEmptyView.tsx        # First-time empty state
  [ItemName]ItemDefaultView.tsx      # Default editing view
  [ItemName]ItemRibbon.tsx           # Toolbar (uses Ribbon + RibbonToolbar)
  [ItemName]Item.scss                # Item-specific styles only
```

Plus: manifest XML/JSON, icon, translations, route in App.tsx, Product.json entry, ITEM_NAMES in .env files.

## Configuration system

Environment files are the single source of truth:

- `Workload/.env.dev` -- Development (localhost, debug logging)
- `Workload/.env.test` -- Staging (staging URLs, info logging)
- `Workload/.env.prod` -- Production (production URLs, warn logging)

Key variables: `WORKLOAD_NAME`, `ITEM_NAMES`, `FRONTEND_APPID`, `FRONTEND_URL`, `WORKLOAD_VERSION`, `LOG_LEVEL`

Templates in `Workload/Manifest/` use `{{WORKLOAD_NAME}}` placeholders replaced during build.

## AI skills and references

Detailed procedures and examples are in `.ai/skills/`:

- **Item operations**: `.ai/skills/fabric-items/SKILL.md` -- create, delete, rename items with step-by-step procedures
- **Workload operations**: `.ai/skills/fabric-workloads/SKILL.md` -- run, deploy, publish, configure workloads
- **Component APIs**: `.ai/skills/fabric-items/references/item-components.md` -- ItemEditor, Ribbon, layout components
- **Platform context**: `.ai/references/fabric-platform.md` -- Fabric platform overview
- **Formatting rules**: `.ai/references/markdown-formatting.md` -- Markdown linting standards


