# Delete Workload Item

## Mandatory Process

Deleting an item is irreversible. Verify backups exist and confirm the item is not in use before proceeding.

### Step 0: Create Complete TODO List

Before deleting any files, create a todo list:

1. Verify deletion safety (dependencies, deployment status, team coordination)
2. Remove item implementation files
3. Remove manifest configuration
4. Remove asset files (icon, localization entries)
5. Remove routing configuration from `App.tsx`
6. Update `ITEM_NAMES` in all `.env` files (critical -- build fails if skipped)
7. Remove asset dependencies
8. Validate build and runtime
9. Clean build artifacts
10. Update documentation

## Step-by-Step Procedure

### Step 1: Verify Deletion Safety

Before deleting, check for dependencies:

1. Confirm no critical data relies on this item type
2. Verify the item is not deployed in production environments
3. Back up the item implementation if it might be needed later
4. Coordinate with the team to confirm removal is intentional

### Step 2: Remove Item Implementation Files

Delete the entire item directory:

```text
Workload/app/items/[ItemName]Item/
```

Verify no other files import components from this directory.

### Step 3: Remove Manifest Configuration

1. Delete `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`
2. Delete `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`
3. Delete the entire directory: `Workload/Manifest/items/[ItemName]Item/`
4. Remove the item's entries from `Workload/Manifest/Product.json`:
   - Remove from `createExperience.cards` array
   - Remove from `homePage.recommendedItemTypes` array

### Step 4: Remove Asset Files

1. Delete `Workload/Manifest/assets/images/[ItemName]Item-icon.png`
2. Delete `Workload/app/assets/items/[ItemName]Item/` directory (empty state images, etc.)
3. Remove localization entries from all locale files:

In `Workload/Manifest/assets/locales/en-US/translations.json`, remove:

```json
"[ItemName]Item_DisplayName": "...",
"[ItemName]Item_DisplayName_Plural": "...",
"[ItemName]Item_Description": "..."
```

In `Workload/app/assets/locales/en-US/translation.json`, remove all `[ItemName]*` keys.

Repeat for all supported locales.

### Step 5: Remove Routing Configuration

Update `Workload/app/App.tsx`:

1. Remove the import statement for the deleted editor component
2. Remove the route definition matching the item's editor path
3. Verify no other components import from the deleted item directory

### Step 6: Update Environment Variables (Critical)

Remove the item from `ITEM_NAMES` in all environment files. The build fails if deleted items remain in this list.

```bash
# Workload/.env.dev, .env.test, .env.prod
# Before
ITEM_NAMES=HelloWorld,[ItemName],CustomItem

# After
ITEM_NAMES=HelloWorld,CustomItem
```

The `BuildManifestPackage.ps1` script looks for manifest files for every item in this list.

### Step 7: Remove Asset Dependencies

1. Remove any additional assets in `Workload/app/assets/items/[ItemName]/`
2. Check shared CSS files for item-specific styles
3. Check shared configuration files for item references

### Step 8: Validate Build and Runtime

Build the project:

```powershell
cd Workload
npm run build:test
```

Test manifest generation:

```powershell
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev
```

Start the development server and verify:

- Application starts without errors
- Remaining items still work correctly
- No broken routes or missing components

### Step 9: Clean Build Artifacts

```powershell
Remove-Item -Recurse -Force build/
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev
```

### Step 10: Update Documentation

1. Update README or documentation that references the deleted item
2. Remove item from examples or samples if used as reference
3. Update deployment guides if they mention the item

## Verification Checklist

- Item implementation directory completely removed
- Manifest directory completely removed
- Product.json cleaned of item entries
- Icon file removed
- Localization entries removed from all locale files
- Route removed from `App.tsx`
- Import statement removed from `App.tsx`
- `ITEM_NAMES` updated in `.env.dev`, `.env.test`, `.env.prod`
- `npm run build:test` completes without errors
- `BuildManifestPackage.ps1` runs without errors
- No references to deleted item in generated files

## Common Issues

**"Cannot find module '[ItemName]ItemEditor'"**: Remove all import statements referencing the deleted item.

**"Manifest file not found for item [ItemName]"**: Remove the item from `ITEM_NAMES` in all `.env` files.

**Deleted item still appears in deployed workload**: Rebuild and redeploy the manifest package with updated `ITEM_NAMES`.

## Rollback

Restore from version control:

1. Use `git restore` to recover deleted files
2. Re-add the item to `ITEM_NAMES` in all `.env` files
3. Run `BuildManifestPackage.ps1` to regenerate manifests
4. Test item functionality

Use version control tags or branches before major deletions to simplify rollback.
