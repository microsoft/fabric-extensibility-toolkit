---
name: fabric-workloads
description: Microsoft Fabric workload lifecycle management. Use when running, configuring, deploying, publishing, or cleaning workload environments.
---

# Fabric Workloads Skill

Manage the lifecycle of Microsoft Fabric workloads using the Extensibility Toolkit. This skill covers running a local development environment, updating configuration, deploying to production, publishing to the Workload Hub, and cleaning the environment.

For configuration examples, .env templates, and script invocations, see [examples.md](examples.md).

For shared Fabric platform context, see [../../references/fabric-platform.md](../../references/fabric-platform.md).

## Workload Architecture

A Fabric workload consists of two components in development:

- **DevGateway** (port 60006): Bridges between Fabric and the workload, handles authentication
- **DevServer** (port 5000/3000): Hosts the React frontend with hot reload

In production:

- **Frontend**: React/TypeScript app hosted on Azure Static Web App
- **Manifest**: NuGet package registered with Microsoft Fabric

## Configuration System

The workload uses an .env-based configuration system. Environment files are the single source of truth.

- **Environment files**: `Workload/.env.dev`, `.env.test`, `.env.prod` (primary configuration)
- **Templates**: `Workload/Manifest/` (version-controlled with `{{PLACEHOLDER}}` tokens)
- **Generated files**: `build/Manifest/`, `build/DevGateway/` (auto-generated, not committed)

For the complete variables table and template processing details, see [references/config-system.md](references/config-system.md).

## Procedures

### Run the Workload

Follow the complete procedure in [references/run-workload.md](references/run-workload.md).

Quick summary:

1. Install dependencies: `cd Workload && npm install`
2. Start DevGateway: `.\scripts\Run\StartDevGateway.ps1`
3. Start DevServer in a second terminal: `.\scripts\Run\StartDevServer.ps1`
4. Access the workload through the Fabric portal

### Update Configuration

Edit the appropriate `.env` file in the `Workload/` directory. Common updates:

**Change workload name** -- update all three `.env` files:

```powershell
(Get-Content Workload\.env.dev) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.dev
(Get-Content Workload\.env.test) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.test
(Get-Content Workload\.env.prod) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.prod
```

**Add new items** -- update `ITEM_NAMES` in all `.env` files:

```bash
# Before
ITEM_NAMES=HelloWorld

# After
ITEM_NAMES=HelloWorld,NewCustomItem
```

Then create item configuration in `Workload/Manifest/items/[NewCustomItem]Item/`.

**Update frontend App ID** -- change `FRONTEND_APPID` in all `.env` files.

**Switch deployment URLs** -- change `FRONTEND_URL` per environment:

```bash
# Development
FRONTEND_URL=http://localhost:60006/

# Production
FRONTEND_URL=https://prod-workload.azurestaticapps.net/
```

After changing configuration:

1. Commit the `.env` files to version control
2. If workload name or fundamental settings changed, each developer runs `.\scripts\Setup\SetupDevEnvironment.ps1`

**Update templates** when modifying item or workload manifest configuration:

- Item templates: `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml` (use `{{WORKLOAD_NAME}}` placeholders)
- Workload templates: `Workload/Manifest/Product.json`, `Workload/Manifest/WorkloadManifest.xml`

**Validate configuration**:

```powershell
Get-Content Workload\.env.dev | Where-Object { $_ -match "^[A-Z_]+=.+" }
```

**Switch environments locally**:

```powershell
Copy-Item Workload\.env.dev Workload\.env    # Development (default)
Copy-Item Workload\.env.test Workload\.env   # Staging
Copy-Item Workload\.env.prod Workload\.env   # Production
```

### Deploy the Workload

Follow the complete procedure in [references/deploy-workload.md](references/deploy-workload.md).

Quick summary:

1. Prepare production configuration (workload name, Entra app, `.env.prod`)
2. Build release: `.\scripts\Build\BuildRelease.ps1 -WorkloadName "Org.Name" -FrontendAppId "app-id" -WorkloadVersion "1.0.0"`
3. Deploy frontend to Azure Static Web App
4. Publish manifest NuGet package to Fabric Admin Portal
5. Validate workload registration

### Publish to Workload Hub

Follow the complete procedure in [references/publish-workload.md](references/publish-workload.md).

Publishing follows a four-stage process:

1. **Testing**: Internal validation in your own tenant
2. **Preview audience**: Limited to up to 10 test tenants
3. **Preview**: Public preview for all Fabric users
4. **General availability**: Full production release

Prerequisites: Complete the [workload registration form](https://aka.ms/fabric_workload_registration) and await Microsoft approval before publishing outside your organization.

### Clean the Environment

Use this when you need to reset configuration, change workload names, or recover from setup errors.

Prerequisites: Stop any running DevGateway or DevServer processes first.

**Step 1: Remove generated files**

```powershell
Remove-Item Workload\.env.dev -Force -ErrorAction SilentlyContinue
Remove-Item Workload\.env.test -Force -ErrorAction SilentlyContinue
Remove-Item Workload\.env.prod -Force -ErrorAction SilentlyContinue
[Environment]::SetEnvironmentVariable("FABRIC_DEV_WORKSPACE_GUID", $null, "User")
```

Optional -- clean build artifacts:

```powershell
Remove-Item build\* -Recurse -Force -ErrorAction SilentlyContinue
```

Template files (`Workload/.env.template`) and source code (`Workload/app/`) are never removed.

**Step 2: Verify cleanup**

```powershell
Test-Path Workload\.env.dev    # Should return False
Test-Path Workload\.env.test   # Should return False
Test-Path Workload\.env.prod   # Should return False
[Environment]::GetEnvironmentVariable("FABRIC_DEV_WORKSPACE_GUID", "User")  # Should return $null
```

**Step 3: Re-run setup**

```powershell
.\scripts\Setup\SetupWorkload.ps1 -WorkloadName "Org.YourWorkload"
```

Alternative -- force overwrite without cleaning first:

```powershell
.\scripts\Setup\SetupWorkload.ps1 -WorkloadName "Org.YourWorkload" -Force $true
```

Common scenarios:

- **Change workload name**: Clean, re-run setup with new name, rebuild
- **Reset authentication**: Clean, create new Entra App ID if needed, re-run setup
- **Fresh start after errors**: Clean including build artifacts, run `az login`, re-run setup

For markdown formatting standards, see [../../references/markdown-formatting.md](../../references/markdown-formatting.md).
