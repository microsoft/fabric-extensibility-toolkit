# Microsoft Fabric Extensibility Toolkit

This repository contains everything needed to create custom workloads for Microsoft Fabric. It includes a HelloWorld sample, build and deployment scripts, and comprehensive AI-assisted development support.

## Project structure

- `Workload/app/` -- React/TypeScript frontend source code
- `Workload/Manifest/` -- Manifest templates with `{{PLACEHOLDER}}` tokens
- `Workload/app/components/` -- Shared components (never modify these files)
- `Workload/app/items/` -- Item implementations (one folder per item)
- `scripts/` -- Setup, build, run, and deployment scripts
- `build/` -- Generated artifacts (not committed)
- `.ai/skills/` -- AI development skills for item and workload operations
- `.ai/references/` -- Shared platform knowledge

## Build and run commands

```powershell
# Initial setup
cd scripts/Setup
.\Setup.ps1 -WorkloadName "Org.MyWorkload"

# Install dependencies
cd Workload
npm install

# Start development (two terminals)
.\scripts\Run\StartDevGateway.ps1    # Terminal 1
.\scripts\Run\StartDevServer.ps1     # Terminal 2

# Build
cd Workload
npm run build:test

# Build manifest package
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev

# Build release
.\scripts\Build\BuildRelease.ps1 -WorkloadName "Org.Name" -FrontendAppId "app-id" -WorkloadVersion "1.0.0"
```

## Key architectural rules

1. All item editors must use `<ItemEditor>` as the root container -- no custom layouts
2. All ribbons must use `<Ribbon>` + `<RibbonToolbar>` with standard action factories
3. Never modify files in `Workload/app/components/` -- components provide standardized layouts
4. Item styles go in `[ItemName]Item.scss` with prefixed class names only
5. Use `@fluentui/react-components` (v9), not `@fluentui/react` (v8)
6. Update `ITEM_NAMES` in all `.env` files when adding, removing, or renaming items
7. Update `Product.json` when adding items (required for visibility in Fabric)

## AI skills

For item development (create, delete, rename items):

- Skill entry: `.ai/skills/fabric-items/SKILL.md`
- Code templates: `.ai/skills/fabric-items/examples.md`
- Component APIs: `.ai/skills/fabric-items/references/item-components.md`

For workload operations (run, deploy, publish, configure):

- Skill entry: `.ai/skills/fabric-workloads/SKILL.md`
- Config and deployment examples: `.ai/skills/fabric-workloads/examples.md`

## Platform and formatting references

@.ai/references/fabric-platform.md
@.ai/references/markdown-formatting.md
