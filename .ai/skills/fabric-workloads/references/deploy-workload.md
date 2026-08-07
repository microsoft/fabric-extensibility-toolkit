# Deploy Workload to Fabric

## Mandatory Process

Deployment involves building a release package and publishing both the frontend to Azure Static Web App and the manifest to Fabric.

### Prerequisites

**Azure requirements**:

- Active Azure subscription with appropriate permissions
- Dedicated resource group for the workload
- Azure Static Web Apps service enabled
- Azure CLI installed and authenticated (`az login`)

**Fabric requirements**:

- Production workload name registered (not "Org" prefix)
- Production Entra App configured with SPA redirect URIs
- Fabric workspace for workload registration

**Development prerequisites**:

- Workload tested and validated in development
- Production settings configured in `.env.prod`
- All npm packages installed

## Step-by-Step Procedure

### Step 1: Prepare Production Configuration

#### 1.1: Update Production Environment Variables

Update `.env.prod` with production values:

```bash
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=YourItem,AnotherItem
FRONTEND_APPID=your-production-app-id
FRONTEND_URL=https://your-static-web-app.azurestaticapps.net/
```

#### 1.2: Configure Production Entra Application

Create a production Azure AD application if one does not exist:

```powershell
az ad app create --display-name "Your Workload Production App" --sign-in-audience "AzureADMyOrg"
```

Required Entra App configuration:

- **Redirect URIs**: Add your Azure Static Web App URL
- **API permissions**: Fabric API permissions
- **Authentication**: Single-page application type
- **Certificates and secrets**: If using client secrets

### Step 2: Build the Release Package

#### 2.1: Run the Build Script

```powershell
.\scripts\Build\BuildRelease.ps1 `
  -WorkloadName "YourOrganization.YourWorkloadName" `
  -FrontendAppId "your-production-aad-app-id" `
  -WorkloadVersion "1.0.0"
```

The script cleans the release directory, processes manifest templates with production values, builds the NuGet package, compiles the React app, and generates deployable artifacts.

#### 2.2: Verify Build Output

```text
release/
  ManifestPackage.[version].nupkg    # Fabric workload manifest
  app/                                # Frontend application files
    index.html
    bundle.[hash].js
    assets/
    web.config
```

### Step 3: Deploy Frontend to Azure Static Web App

#### 3.1: Create the Static Web App

Using Azure CLI:

```powershell
az group create --name "rg-your-workload" --location "eastus"

az staticwebapp create `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --location "eastus"
```

Alternatively, create through the Azure Portal: navigate to Create Resource > Static Web Apps, select subscription, resource group, name, plan type, and region.

#### 3.2: Deploy Application Files

**Option A: GitHub Actions (recommended)**

See [../examples.md](../examples.md) for the complete GitHub Actions workflow YAML.

**Option B: Azure CLI**

See [../examples.md](../examples.md) for Azure CLI deployment commands.

#### 3.3: Configure Static Web App Settings

Create `staticwebapp.config.json` in the `release/app` directory for SPA routing and content security policy. See [../examples.md](../examples.md) for the complete template.

Configure environment variables:

```powershell
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "WORKLOAD_NAME=YourOrganization.YourWorkloadName"
```

#### 3.4: Update Workload Manifest with Production URL

Update the workload manifest to point to the Static Web App:

```xml
<!-- In WorkloadManifest.xml -->
<ServiceEndpoint>
  <Name>Frontend</Name>
  <Url>https://your-static-web-app.azurestaticapps.net/</Url>
  <IsEndpointResolutionService>false</IsEndpointResolutionService>
</ServiceEndpoint>
```

Rebuild the manifest package:

```powershell
.\scripts\Build\BuildManifestPackage.ps1
```

### Step 4: Publish Manifest to Fabric

#### 4.1: Upload Through Fabric Admin Portal

1. Sign in to [Fabric](https://powerbi.com/) with an admin account
2. Navigate to Settings > Admin portal > Workloads
3. Select "Upload workload"
4. Browse to `release/ManifestPackage.[version].nupkg` and upload
5. Select the uploaded workload, choose the version, and activate
6. Status should show "Active in tenant"

#### 4.2: Programmatic Upload (Advanced)

See [../examples.md](../examples.md) for the REST API upload pattern.

#### 4.3: Validate Workload Registration

1. Verify workload status shows "Active" in Admin Portal
2. Verify workload appears in experience switcher in a Fabric workspace
3. Test item creation and editor loading
4. Confirm authentication flows work correctly

### Step 5: Monitor and Maintain

#### 5.1: Configure Monitoring

Enable Application Insights for the Static Web App:

```powershell
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "APPINSIGHTS_INSTRUMENTATIONKEY=your-key"
```

Monitor workload usage through the Fabric Admin Portal.

#### 5.2: Update Process

**Frontend updates**:

1. Build new release with updated version
2. Deploy to Azure Static Web App
3. Test in production environment

**Manifest updates**:

1. Update manifest files with new version
2. Build new manifest package
3. Upload through Fabric Admin Portal
4. Coordinate with frontend deployment if needed

## Verification Checklist

- Production `.env.prod` values are correct
- Entra app configured with proper redirect URIs
- `BuildRelease.ps1` completes without errors
- Static Web App created and frontend deployed
- `staticwebapp.config.json` configured for SPA routing and CSP
- Manifest package uploaded and activated in Fabric Admin Portal
- Workload appears in Fabric experience switcher
- Items can be created and editors load correctly
- Authentication flows work in production

## Troubleshooting

**Build fails with missing dependencies**: Run `cd Workload && npm install` before building. Verify Node.js version matches requirements.

**Static Web App shows 404 errors**: Verify `staticwebapp.config.json` has the SPA fallback route configured. Check that `app_location` and `output_location` are correct in deployment config.

**Workload not appearing in Fabric**: Verify manifest package was uploaded and activated in Admin Portal. Check that the workload status shows "Active in tenant".

**Authentication failures**: Verify Entra App redirect URIs include the Static Web App URL. Check that `FRONTEND_APPID` in `.env.prod` matches the production Entra App ID.

**CORS or CSP errors**: Update the `content-security-policy` in `staticwebapp.config.json` to include required Fabric domains. See [../examples.md](../examples.md) for the correct CSP header values.
