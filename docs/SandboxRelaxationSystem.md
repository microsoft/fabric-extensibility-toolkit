# Sandbox Relaxation System Implementation

This document describes the comprehensive iframe sandbox relaxation system implemented for the Excel Embed feature in the Microsoft Fabric Extensibility Toolkit.

## Overview

The sandbox relaxation system provides fine-grained control over iframe permissions for embedded content like Excel documents. It includes consent flows, permission management, and security controls to balance functionality with security.

## Architecture

### 1. Workload Manifest Configuration

**File**: `Workload/Manifest/WorkloadManifest.xml`

The manifest includes comprehensive sandbox relaxation documentation:

```xml
<!-- 
  EnableSandboxRelaxation: Allows iframe sandbox relaxation for embedded content
  Required OAuth Scopes for advanced iframe permissions (register in AAD):
  - Fabric.Extend.AllowDownloads: Enables allow-downloads sandbox attribute
  - Fabric.Extend.AllowForms: Enables allow-forms sandbox attribute  
  - Fabric.Extend.AllowPopups: Enables allow-popups sandbox attribute
  - Fabric.Extend.AllowNavigation: Enables allow-top-navigation sandbox attribute
  - Fabric.Extend.AllowModals: Enables allow-modals sandbox attribute
  - Fabric.Extend.AllowCamera: Enables camera permissions policy
  - Fabric.Extend.AllowMicrophone: Enables microphone permissions policy
  - Fabric.Extend.AllowClipboard: Enables clipboard-read/write permissions policy
  - Fabric.Extend.AllowFullscreen: Enables fullscreen permissions policy
  - Fabric.Extend.AllowAutoplay: Enables autoplay permissions policy
-->
<EnableSandboxRelaxation>true</EnableSandboxRelaxation>
```

### 2. Sandbox Relaxation Service

**File**: `Workload/app/services/SandboxRelaxationService.ts`

Core service managing consent flows and iframe attribute generation:

#### Key Interfaces

```typescript
export interface SandboxRelaxationScopes {
  'Fabric.Extend.AllowDownloads': boolean;
  'Fabric.Extend.AllowForms': boolean;
  'Fabric.Extend.AllowPopups': boolean;
  // ... additional scopes
}

export interface SandboxRelaxationConfig {
  mode: 'mandatory' | 'optional';
  requiredScopes: (keyof SandboxRelaxationScopes)[];
  optionalScopes: (keyof SandboxRelaxationScopes)[];
}

export interface IframeSandboxState {
  sandboxRelaxed: boolean;
  grantedScopes: Partial<SandboxRelaxationScopes>;
  sandboxAttributes: string;
  permissionsPolicy: string;
  hasOptionalFeatures?: boolean;
}
```

#### Core Methods

- `initialize()`: Initialize service with current consent state
- `requestConsent(scopes)`: Request OAuth consent for specific scopes
- `hasConsent(scopes)`: Check if scopes have been consented to
- `getIframeSandboxState(config)`: Generate iframe attributes based on consent
- `buildSandboxAttributes()`: Build sandbox attribute string
- `buildPermissionsPolicy()`: Build permissions policy string

### 3. Consent Dialog Component

**File**: `Workload/app/components/SandboxConsentDialog.tsx`

React component providing user consent flow:

#### Features

- **Required Permissions**: Mandatory scopes that must be granted
- **Optional Permissions**: Enhanced features users can choose to enable
- **Scope Descriptions**: User-friendly explanations of each permission
- **Error Handling**: Graceful handling of consent failures
- **Visual Design**: Professional UI using Fluent UI components

### 4. Excel Embed Integration

**File**: `Workload/app/items/ExcelEmbedItem/ExcelEmbedItemEditorDefault.tsx`

Updated Excel embed component with sandbox relaxation:

#### Dynamic Iframe Attributes

```typescript
<iframe
  src={src}
  sandbox={sandboxState?.sandboxAttributes || fallbackAttributes}
  allow={sandboxState?.permissionsPolicy || fallbackPolicy}
  // ... other attributes
/>
```

#### Security Status Display

The component shows users the current security mode:
- Relaxed mode: All features enabled
- Strict mode: Basic features only with security warnings

## Permission Scopes

### Required Scopes for Excel Embeds

1. **Fabric.Extend.AllowForms**: Essential for Excel form submissions and interactivity
2. **Fabric.Extend.AllowDownloads**: Required for Excel download functionality

### Optional Enhancement Scopes

1. **Fabric.Extend.AllowPopups**: Enhanced sharing and external links
2. **Fabric.Extend.AllowNavigation**: Full navigation capabilities
3. **Fabric.Extend.AllowModals**: Rich modal and presentation features
4. **Fabric.Extend.AllowCamera**: Media capture for rich content
5. **Fabric.Extend.AllowMicrophone**: Audio features and collaboration
6. **Fabric.Extend.AllowClipboard**: Advanced copy/paste functionality
7. **Fabric.Extend.AllowFullscreen**: Immersive viewing experiences
8. **Fabric.Extend.AllowAutoplay**: Automatic media playback

## Operating Modes

### Mandatory Mode

- Iframe will NOT open without required consent
- Used for features that cannot function without specific permissions
- Provides clear error messaging when consent is missing

### Optional Mode (Recommended)

- Iframe opens in strict mode if consent is missing
- Enhanced features available with consent
- Graceful degradation of functionality
- Better user experience for basic use cases

## Security Features

### Console Warning Management

The system properly handles browser security warnings:

```typescript
// Expected permissions policy violations for:
// - autoplay, camera, fullscreen, microphone
// - clipboard-read, clipboard-write, display-capture
// - keyboard-map, and other advanced features

// These warnings indicate security controls are working properly
```

### Comprehensive Sandbox Attributes

```typescript
const fullSandboxAttributes = [
  'allow-scripts',
  'allow-same-origin', 
  'allow-forms',
  'allow-popups',
  'allow-downloads',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-modals',
  'allow-presentation',
  'allow-orientation-lock',
  'allow-pointer-lock'
].join(' ');
```

### Permissions Policy Integration

```typescript
const fullPermissionsPolicy = [
  "autoplay 'self'",
  "camera 'self'", 
  "microphone 'self'",
  "clipboard-read 'self'",
  "clipboard-write 'self'", 
  "fullscreen 'self'",
  "display-capture 'self'",
  "keyboard-map 'self'"
].join('; ');
```

## Implementation Example

### Excel Embed Configuration

```typescript
export const EXCEL_EMBED_SANDBOX_CONFIG: SandboxRelaxationConfig = {
  mode: 'optional', // Allow iframe to open in strict mode
  requiredScopes: [
    'Fabric.Extend.AllowForms',      // Essential for Excel functionality
    'Fabric.Extend.AllowDownloads'   // Required for Excel downloads
  ],
  optionalScopes: [
    'Fabric.Extend.AllowPopups',     // Enhanced sharing
    'Fabric.Extend.AllowNavigation', // Full navigation
    'Fabric.Extend.AllowModals',     // Rich presentation
    'Fabric.Extend.AllowCamera',     // Media features
    'Fabric.Extend.AllowMicrophone', // Audio collaboration
    'Fabric.Extend.AllowClipboard',  // Advanced copy/paste
    'Fabric.Extend.AllowFullscreen', // Immersive viewing
    'Fabric.Extend.AllowAutoplay'    // Automatic playback
  ]
};
```

### Usage in Components

```typescript
const [sandboxState, setSandboxState] = useState<IframeSandboxState | null>(null);

useEffect(() => {
  const initializeSandbox = async () => {
    const service = SandboxRelaxationService.getInstance();
    await service.initialize();
    const state = service.getIframeSandboxState(EXCEL_EMBED_SANDBOX_CONFIG);
    setSandboxState(state);
  };
  
  initializeSandbox();
}, []);
```

## Azure AD Integration

### Required AAD Configuration

To implement the full consent flow, register these scopes in your Azure AD application:

```json
{
  "appRoles": [
    {
      "id": "...",
      "displayName": "Fabric.Extend.AllowDownloads",
      "description": "Allow downloading files from embedded content",
      "value": "Fabric.Extend.AllowDownloads",
      "allowedMemberTypes": ["User"]
    },
    {
      "id": "...", 
      "displayName": "Fabric.Extend.AllowForms",
      "description": "Allow form submissions in embedded content",
      "value": "Fabric.Extend.AllowForms",
      "allowedMemberTypes": ["User"]
    }
    // ... additional scopes
  ]
}
```

### Admin Consent Scripts

PowerShell example for granting admin consent:

```powershell
# Grant admin consent for iframe relaxation scopes
Connect-AzureAD

$servicePrincipal = Get-AzureADServicePrincipal -Filter "AppId eq 'your-app-id'"
$fabricResource = Get-AzureADServicePrincipal -Filter "AppId eq 'fabric-api-id'"

New-AzureADServiceAppRoleAssignment `
  -ObjectId $servicePrincipal.ObjectId `
  -PrincipalId $servicePrincipal.ObjectId `
  -ResourceId $fabricResource.ObjectId `
  -Id $fabricResource.AppRoles[0].Id
```

## Testing

### E2E Test Validation

```typescript
// Test sandbox attributes in both modes
describe('Sandbox Relaxation', () => {
  it('should use strict sandbox without consent', async () => {
    const iframe = await page.$('iframe');
    const sandbox = await iframe.getAttribute('sandbox');
    expect(sandbox).toBe('allow-scripts');
  });

  it('should use relaxed sandbox with consent', async () => {
    // Grant consent first
    await grantSandboxConsent(['Fabric.Extend.AllowForms']);
    
    const iframe = await page.$('iframe');
    const sandbox = await iframe.getAttribute('sandbox');
    expect(sandbox).toContain('allow-forms');
  });
});
```

### Validation Utilities

```typescript
export function validateIframeSandboxAttributes(
  iframe: HTMLIFrameElement,
  expectedMode: 'strict' | 'relaxed'
): boolean {
  const sandbox = iframe.getAttribute('sandbox') || '';
  
  if (expectedMode === 'strict') {
    return sandbox === 'allow-scripts';
  } else {
    return sandbox.includes('allow-forms') && 
           sandbox.includes('allow-downloads');
  }
}
```

## Security Considerations

1. **Principle of Least Privilege**: Only request necessary permissions
2. **User Transparency**: Clear explanations of what each permission enables
3. **Admin Control**: All permissions can be managed centrally via Azure AD
4. **Graceful Degradation**: Core functionality works without enhanced permissions
5. **Audit Trail**: All consent decisions are logged and auditable

## Browser Compatibility

The system handles modern browser security policies including:

- **Permissions Policy**: Explicit control over feature access
- **Sandbox Attributes**: Fine-grained iframe restrictions
- **CORS Policies**: Cross-origin resource sharing controls
- **CSP Integration**: Content Security Policy compliance

## Troubleshooting

### Common Issues

1. **Form Submission Blocked**: Ensure `allow-forms` is in sandbox attribute
2. **Download Failures**: Verify `allow-downloads` permission is granted
3. **Popup Blocking**: Check `allow-popups` scope consent
4. **Navigation Errors**: Confirm `allow-top-navigation` is enabled

### Debug Console Messages

Expected browser console messages when working properly:

```
[Violation] Potential permissions policy violation: camera is not allowed
[Violation] Potential permissions policy violation: autoplay is not allowed
[Violation] Potential permissions policy violation: fullscreen is not allowed
```

These warnings indicate the security system is functioning correctly.

## Future Enhancements

1. **Dynamic Scope Requests**: Request additional permissions on-demand
2. **Permission Analytics**: Track usage patterns and permission effectiveness
3. **Custom Scope Definitions**: Allow workloads to define custom permission scopes
4. **Integration with Fabric SDK**: Direct integration with platform consent APIs
5. **Enhanced Error Recovery**: Better handling of consent failures and timeouts