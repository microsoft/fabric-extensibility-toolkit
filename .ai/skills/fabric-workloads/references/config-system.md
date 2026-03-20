# Configuration System Reference

## Architecture

The workload uses an .env-based configuration system with three layers:

- **Environment files** (`Workload/.env.dev`, `.env.test`, `.env.prod`): Primary configuration source, committed to version control
- **Templates** (`Workload/Manifest/`): Version-controlled files with `{{PLACEHOLDER}}` tokens
- **Generated files** (`build/Manifest/`, `build/DevGateway/`): Auto-generated from templates and .env files, not committed

Environment files are generated from `Workload/.env.template` during initial setup with `SetupWorkload.ps1`.

## Configuration Variables

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `WORKLOAD_VERSION` | Workload version number | `1.0.0` |
| `WORKLOAD_NAME` | Unique workload identifier (`[Organization].[WorkloadName]`) | `MyCompany.MyWorkload` |
| `ITEM_NAMES` | Comma-separated list of item names | `HelloWorld,CustomItem` |
| `FRONTEND_APPID` | Azure AD (Entra) App ID for authentication | `12345678-1234-1234-1234-123456789abc` |
| `FRONTEND_URL` | Base URL for the workload frontend | `http://localhost:60006/` |
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` |
| `ENABLE_PLAYGROUND` | Enable playground features | `true`, `false` |

## Template Processing

Templates in `Workload/Manifest/` use `{{PLACEHOLDER}}` tokens that are replaced with values from the active `.env` file during manifest generation.

Example: `{{WORKLOAD_NAME}}` in `WorkloadManifest.xml` is replaced with the value of `WORKLOAD_NAME` from the `.env` file.

The `BuildManifestPackage.ps1` script reads the `.env` file, processes all templates, and writes generated files to `build/`.

## Environment Switching

Each `.env` file targets a deployment environment:

- `.env.dev`: localhost URLs, debug logging, playground enabled
- `.env.test`: staging URLs, info logging, playground enabled
- `.env.prod`: production URLs, warn logging, playground disabled

To test a different environment locally:

```powershell
Copy-Item Workload\.env.prod Workload\.env
```

During build and deployment, the appropriate `.env` file is selected automatically based on the target environment.

## File Locations

| Category | Path | Committed |
| -------- | ---- | --------- |
| Configuration | `Workload/.env.dev`, `.env.test`, `.env.prod` | Yes |
| Templates | `Workload/Manifest/` | Yes |
| Generated | `build/Manifest/`, `build/DevGateway/` | No |
| Template source | `Workload/.env.template` | Yes |

## Validation

Check that all required variables are set:

```powershell
Get-Content Workload\.env.dev | Where-Object { $_ -match "^[A-Z_]+=.+" }
```

Compare configuration across environments:

```powershell
Get-Content Workload\.env.dev
Get-Content Workload\.env.prod
```

Verify consistency of `ITEM_NAMES` across all three files -- mismatches cause environment-specific build failures.
