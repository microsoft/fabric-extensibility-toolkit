# Fabric Workloads: Examples

Configuration templates, script invocations, and deployment examples for workload lifecycle management.

## Environment File Templates

### Development (.env.dev)

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=Org.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=http://localhost:60006/
LOG_LEVEL=debug
ENABLE_PLAYGROUND=true
```

### Staging (.env.test)

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-staging-url.azurestaticapps.net/
LOG_LEVEL=info
ENABLE_PLAYGROUND=true
```

### Production (.env.prod)

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-production-url.azurestaticapps.net/
LOG_LEVEL=warn
ENABLE_PLAYGROUND=false
```

## Script Invocations

### Setup

```powershell
# Initial setup
.\scripts\Setup\Setup.ps1 -WorkloadName "Org.MyWorkload"

# Update developer environment after config changes
.\scripts\Setup\SetupDevEnvironment.ps1

# Create a new item scaffold
.\scripts\Setup\CreateNewItem.ps1
```

### Run

```powershell
# Start DevGateway (first terminal)
.\scripts\Run\StartDevGateway.ps1

# Start DevServer (second terminal)
.\scripts\Run\StartDevServer.ps1
```

### Build

```powershell
# Build manifest package for dev
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev

# Build full release
.\scripts\Build\BuildRelease.ps1 `
  -WorkloadName "YourOrganization.YourWorkloadName" `
  -FrontendAppId "your-production-aad-app-id" `
  -WorkloadVersion "1.0.0"
```

## Template Placeholder Examples

Templates in `Workload/Manifest/` use `{{PLACEHOLDER}}` tokens replaced during build:

```xml
<!-- WorkloadManifest.xml -->
<Workload WorkloadName="{{WORKLOAD_NAME}}" HostingType="FERemote">
    <Version>{{WORKLOAD_VERSION}}</Version>
</Workload>
```

```xml
<!-- [ItemName]Item.xml -->
<Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
</Item>
```

## DevGateway Configuration

The `workload-dev-mode.json` file is auto-generated during setup:

```json
{
    "WorkspaceGuid": "your-workspace-id-here",
    "ManifestPackageFilePath": "path-to-manifest-package.nupkg"
}
```

## Static Web App Configuration

Create `staticwebapp.config.json` in the release/app directory:

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "responseOverrides": {
    "401": { "redirect": "/" },
    "403": { "redirect": "/" },
    "404": { "redirect": "/" }
  },
  "globalHeaders": {
    "content-security-policy": "frame-ancestors 'self' https://*.analysis.windows-int.net https://*.analysis-df.windows.net https://*.powerbi.com https://teams.microsoft.com https://*.fabric.microsoft.com"
  }
}
```

## GitHub Actions Deployment

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd Workload
          npm install

      - name: Build release
        run: |
          pwsh ./scripts/Build/BuildRelease.ps1 `
            -WorkloadName "${{ secrets.WORKLOAD_NAME }}" `
            -FrontendAppId "${{ secrets.FRONTEND_APPID }}" `
            -WorkloadVersion "1.0.0"

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/release/app"
          output_location: "/"
```

## Azure CLI Commands

```powershell
# Create resource group
az group create --name "rg-your-workload" --location "eastus"

# Create Static Web App
az staticwebapp create `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --location "eastus" `
  --source "path/to/release/app" `
  --branch "main" `
  --app-location "/" `
  --output-location "/"

# Set environment variables
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "WORKLOAD_NAME=YourOrganization.YourWorkloadName"

# Enable Application Insights
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "APPINSIGHTS_INSTRUMENTATIONKEY=your-app-insights-key"
```

## Manifest Upload via REST API

```powershell
$accessToken = az account get-access-token `
  --scope https://analysis.windows.net/powerbi/api/.default `
  --query accessToken -o tsv

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type"  = "application/octet-stream"
}

Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workloads" `
  -Method POST `
  -Headers $headers `
  -InFile "release/ManifestPackage.1.0.0.nupkg"
```
