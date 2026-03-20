# Publish Workload to Fabric Workload Hub

## Mandatory Process

Publishing makes your workload available to other organizations through the Fabric Workload Hub. It follows a four-stage process: Testing, Preview Audience, Preview, and General Availability.

### Prerequisites

- Fabric admin account with publishing permissions
- Production Fabric tenant for workload lifecycle management
- Completed [workload registration form](https://aka.ms/fabric_workload_registration) with Microsoft approval
- NuGet manifest package built and tested
- Registered unique Workload ID in format `[Publisher].[Workload]`

## Publishing Stages

### Stage 1: Testing

Internal validation in your own tenant.

1. Build the production manifest package:

```powershell
.\scripts\Build\BuildManifestPackage.ps1 -ValidateFiles $true
```

2. Upload to your test tenant:
   - Sign in to [Fabric](https://powerbi.com/) with an admin account
   - Navigate to Settings > Admin portal > Workloads
   - Select "Upload workload" and browse to your `.nupkg` file
   - Select the uploaded workload, choose the version, and select "Add"
   - Status should show "Active in tenant"

3. Validate:
   - Workload appears in experience switcher
   - Item creation functions correctly
   - Editor loads and operates properly
   - Authentication flows work
   - All supported browsers and devices work

### Stage 2: Preview Audience

Limited testing with up to 10 additional tenants.

1. Contact Microsoft through your registration contact to request preview audience access
2. Provide up to 10 tenant IDs for testing
3. Each test tenant administrator enables the workload:
   - Navigate to Fabric Admin Portal > Tenant settings
   - Enable the workload preview feature
4. Collect feedback from test organizations
5. Address identified issues before proceeding

Preview audience characteristics:

- Workload shows a preview indication
- Available to all users in enabled tenants
- Limited to specified test tenants only

### Stage 3: Preview

Public preview for all Fabric users.

1. Submit the [publishing request form](https://aka.ms/fabric_workload_publishing) specifying "Preview"
2. Microsoft validates:
   - Technical functionality and integration
   - Security controls and compliance
   - Documentation completeness
   - [Publishing requirements](https://learn.microsoft.com/en-us/fabric/workload-development-kit/publish-workload-requirements) compliance
3. Upon approval, the workload appears in the Workload Hub for all Fabric users with a preview indication
4. Monitor adoption, collect feedback, and address issues

### Stage 4: General Availability

Full production release.

1. Submit the [publishing request form](https://aka.ms/fabric_workload_publishing) specifying "GA"
2. Microsoft validates enhanced requirements:
   - Demonstrated stability metrics
   - Support infrastructure (24/7 where required)
   - Complete user and admin documentation
   - Enhanced security validation
3. Upon approval, preview indication is removed, workload has full production status

## Admin Portal Workflow

### Upload a Manifest Package

1. Sign in to [Fabric](https://powerbi.com/) with a Fabric admin account
2. Select Settings (gear icon) > Admin portal
3. Select Workloads in the left navigation
4. Select "Upload workload"
5. Browse to the `.nupkg` file and select "Open"
6. The workload appears in the workloads list

### Activate a Workload Version

1. Select the uploaded workload name
2. Select the version to activate
3. Select "Add" and confirm
4. Status changes to "Active in tenant"

### Update a Workload Version

1. Select the workload in the Admin portal > Workloads section
2. On the "Add" tab, select "Edit"
3. Select the new version to activate
4. Select "Add" to confirm

### Deactivate a Workload

1. Select the workload
2. On the "Add" tab, select "Deactivate"
3. Confirm deactivation

### Delete a Workload Version

1. Select the workload, go to the "Uploads" tab
2. Select the delete icon next to the version
3. You cannot delete an active version -- deactivate it first

## Verification Checklist

- Manifest package builds without errors
- All item types function correctly in your test tenant
- Authentication flows work
- Performance meets requirements
- User and admin documentation is complete
- Support contact information and processes are established
- Workload registration form submitted and approved by Microsoft

## Troubleshooting

**Package upload fails**: Verify the `.nupkg` file is not corrupted. Check manifest syntax and validation. Ensure all required files are included.

**Workload not appearing after upload**: Refresh the admin portal page. Verify the workload ID matches your registration.

**Activation fails**: Verify manifest syntax is correct. Check all dependencies are satisfied.

**Preview audience cannot see workload**: Verify tenant IDs are correct. Check tenant settings are enabled. Allow up to 24 hours for propagation.

**Publishing request rejected**: Review feedback from Microsoft. Address all identified requirements gaps. Resubmit after resolving issues.
