# Run Workload

## Mandatory Process

The workload runs using two components that must be started in order. DevGateway connects your workload to Fabric. DevServer hosts the React frontend.

### Prerequisites

1. Project setup complete (`Setup.ps1` has been run)
2. Node.js dependencies installed in `Workload/`
3. Azure CLI authenticated (`az login`)
4. Development workspace configured in Fabric

## Step-by-Step Procedure

### Step 1: Prepare the Environment

Navigate to the project root:

```powershell
cd "path\to\fabric-extensibility-toolkit"
```

Install dependencies if not already done:

```powershell
cd Workload
npm install
cd ..
```

Verify the DevGateway configuration exists:

```powershell
Test-Path "config\DevGateway\workload-dev-mode.json"
```

Expected configuration:

```json
{
    "WorkspaceGuid": "your-workspace-id-here",
    "ManifestPackageFilePath": "path-to-manifest-package.nupkg"
}
```

### Step 2: Start the DevGateway

Start DevGateway first -- it handles the connection to Fabric:

```powershell
.\scripts\Run\StartDevGateway.ps1
```

This script:

1. Builds the manifest package automatically
2. Authenticates with Azure (opens browser for login)
3. Starts the DevGateway process
4. Registers the workload with the development workspace

Verify successful startup:

- "Manifest package built successfully"
- "Authentication completed"
- "DevGateway started on port 60006"
- "Workload registered with workspace"

### Step 3: Start the DevServer

Open a second terminal. Keep the DevGateway terminal running.

```powershell
.\scripts\Run\StartDevServer.ps1
```

This script:

1. Navigates to `Workload/devServer`
2. Detects the environment (local vs. Codespaces)
3. Starts the Webpack dev server with hot reload

Local development uses `npm start`. GitHub Codespaces uses `npm run start:codespace` with reduced memory.

Verify successful startup:

- "webpack compiled successfully"
- "DevServer started on http://localhost:5000" (or port 3000)
- No compilation errors

### Step 4: Access and Test the Workload

Access the workload through the Fabric portal:

1. Navigate to your Fabric workspace
2. Find the workload in the experience switcher
3. Create a new item using your workload item types
4. Verify the editor loads and functions correctly

Test basic functionality:

- Item creation works
- Editor loads without errors
- Save and load operations succeed
- Navigation between views works

### Step 5: Monitor and Debug

Keep both terminals visible:

- **DevGateway terminal**: Fabric API communication, authentication status, workload registration
- **DevServer terminal**: Webpack compilation, hot reload events, JavaScript errors

Log locations:

- DevGateway: Console output in DevGateway terminal
- DevServer: Console output in DevServer terminal
- Browser: Developer Tools console and network tabs

## Troubleshooting

**DevGateway authentication fails**: Run `az login` to refresh Azure credentials.

**DevServer compilation errors**: Check for TypeScript errors. Run `npm run build:test` for detailed output.

**Workload not appearing in Fabric**: Verify DevGateway registered successfully. Check the workspace GUID in `workload-dev-mode.json`.

**Port conflicts**: DevGateway uses port 60006, DevServer uses port 5000 or 3000. Check for other processes on these ports.

**Codespaces-specific issues**: Use `npm run start:codespace` instead of `npm start`. Hot reload is disabled for stability in Codespaces.
