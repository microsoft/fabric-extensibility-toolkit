# Sandbox Relaxation Fix for Excel Integration

## Issue Resolution
Fixed the popup blocking issue preventing Excel for the Web from opening by adding the missing `devSandboxRelaxation: true` configuration to the development server.

## Root Cause
The Microsoft Fabric workload was configured for sandbox relaxation in the manifest (`<EnableSandboxRelaxation>true</EnableSandboxRelaxation>`) but the development server was missing the `devSandboxRelaxation: true` parameter needed to enable this functionality in dev mode.

## Solution Applied

### 1. Updated Development Server Configuration
**File**: `Workload/devServer/manifestApi.js`

Added `devSandboxRelaxation: true` to the devParameters object:

```javascript
const devParameters = {
  name: process.env.WORKLOAD_NAME,
  url: "http://127.0.0.1:60006",
  devAADFEAppConfig: {
    appId: process.env.DEV_AAD_CONFIG_FE_APPID,
  },
  devSandboxRelaxation: true  // ← Added this line
};
```

### 2. Enhanced Excel Component with Proper Consent Flow
**File**: `Workload/app/items/ExcelEmbedItem/ExcelEmbedItemEditorDefault.tsx`

- Integrated with existing `SandboxRelaxationService` 
- Added `SandboxConsentDialog` for user consent
- Implemented proper popup permission checking before Excel opening
- Uses `@microsoft/connected-workbooks` for official Excel integration

## Architecture Overview

### Microsoft Fabric Sandbox Relaxation Flow
1. **Workload Manifest**: `EnableSandboxRelaxation: true` enables global relaxation capability
2. **Dev Server**: `devSandboxRelaxation: true` enables it in development mode
3. **MSAL Consent**: User grants permission for specific scopes (POP-UP, FORMS, DOWNLOAD)
4. **Iframe Attributes**: Dynamically applied based on consented scopes

### Security Model
- **Mandatory Consent**: Users must explicitly grant permissions
- **Scoped Permissions**: Only requested capabilities are enabled
- **Session-based**: Consent persists during browser session
- **Graceful Degradation**: Features unavailable without consent

## Testing Instructions

1. **Start Development Server**:
   ```powershell
   .\scripts\Run\StartDevServer.ps1
   ```

2. **Access ExcelEmbed Item** in your Fabric workspace

3. **Test Excel Integration**:
   - Click "🔗 Open Data in Excel for the Web" button
   - If consent not granted, you'll see the permission dialog
   - Grant "POP-UP" permission when prompted
   - Excel for the Web should open successfully with sample data

## Expected Behavior

### Before Fix
- Console error: "Blocked opening '...' in a new window because the request was made in a sandboxed frame whose 'allow-popups' permission is not set"
- Excel integration completely blocked

### After Fix
- Clean console output
- Consent dialog appears for first-time users
- Excel for the Web opens seamlessly after consent
- Full editing capabilities available

## Related Components

- **SandboxRelaxationService**: Handles MSAL consent flow and permission management
- **SandboxConsentDialog**: UI for user consent with security explanations
- **@microsoft/connected-workbooks**: Official Microsoft library for Excel integration
- **Microsoft Fabric Platform**: Provides sandbox relaxation infrastructure

## Security Benefits

- **No Iframe Escape**: Uses official Microsoft APIs instead of iframe manipulation
- **User Control**: Explicit consent required for each capability
- **Attack Prevention**: Protects against clickjacking, formjacking, and drive-by downloads
- **Audit Trail**: All permission grants are logged and trackable

This implementation follows the official Microsoft Fabric LWW (Live Web Windows) Design Document specifications for secure iframe sandbox relaxation.