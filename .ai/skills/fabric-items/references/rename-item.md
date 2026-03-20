# Rename Workload Item

## Mandatory Process

Renaming an item affects multiple files and configurations. Create backups and coordinate with the team before proceeding.

### Step 0: Create Complete TODO List

Before renaming any files, create a todo list:

1. Plan the rename (current name, new name, impact assessment)
2. Rename implementation files and update contents
3. Update manifest configuration
4. Update asset files (icon, localization entries)
5. Update routing configuration in `App.tsx`
6. Update asset dependencies
7. Update `ITEM_NAMES` in all `.env` files (critical -- old name causes build failures)
8. Validate build and runtime
9. Clean up old references
10. Final verification

### Naming Conventions

- Use PascalCase for item names (e.g., `MyCustomItem`)
- Follow the pattern `[Organization].[WorkloadName].[ItemName]`
- Avoid conflicts with existing item names

## Step-by-Step Procedure

### Step 1: Plan the Rename Operation

Define your rename parameters:

1. Current item name (e.g., `OldItem`)
2. New item name (e.g., `NewItem`)
3. All files and references that need updating
4. Backup strategy (version control branch or tag)

### Step 2: Rename Implementation Files and Update Contents

Rename the directory and all files:

```text
Workload/app/items/[OldName]Item/ -> Workload/app/items/[NewName]Item/
  [OldName]ItemDefinition.ts     -> [NewName]ItemDefinition.ts
  [OldName]ItemEditor.tsx        -> [NewName]ItemEditor.tsx
  [OldName]ItemEmptyView.tsx     -> [NewName]ItemEmptyView.tsx
  [OldName]ItemDefaultView.tsx   -> [NewName]ItemDefaultView.tsx
  [OldName]ItemRibbon.tsx        -> [NewName]ItemRibbon.tsx
  [OldName]Item.scss             -> [NewName]Item.scss
```

In each file, find and replace:

- Interface names: `[OldName]ItemDefinition` -> `[NewName]ItemDefinition`
- Component names: `[OldName]ItemEditor` -> `[NewName]ItemEditor`
- Import paths: `./[OldName]ItemDefinition` -> `./[NewName]ItemDefinition`
- CSS class prefixes: `.[old-name]-view` -> `.[new-name]-view`
- Translation keys: `[OldName]Item*` -> `[NewName]Item*`

### Step 3: Update Manifest Configuration

1. Rename the manifest directory:

```text
Workload/Manifest/items/[OldName]Item/ -> Workload/Manifest/items/[NewName]Item/
```

2. Rename and update the XML manifest:

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[NewName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

3. Rename and update the JSON manifest. Update `name`, `displayName`, `displayNamePlural`, `editor.path`, `icon.name`, and `activeIcon.name` to use the new item name.

4. Update `Workload/Manifest/Product.json`:
   - Update `itemType` in `createExperience.cards`
   - Update the entry in `homePage.recommendedItemTypes`
   - Update localization key references (`title`, `description`)

### Step 4: Update Asset Files

1. Rename the icon file:

```text
Workload/Manifest/assets/images/[OldName]Item-icon.png -> [NewName]Item-icon.png
```

2. Update localization entries in all locale files. In `Workload/Manifest/assets/locales/en-US/translations.json`:

```json
"[NewName]Item_DisplayName": "Your New Item Name",
"[NewName]Item_DisplayName_Plural": "Your New Item Names",
"[NewName]Item_Description": "Description of what this item does"
```

Remove the old `[OldName]Item_*` keys.

3. Update app translations in `Workload/app/assets/locales/en-US/translation.json` -- rename all `[OldName]*` keys to `[NewName]*`.

Repeat for all supported locales.

### Step 5: Update Routing Configuration

Update `Workload/app/App.tsx`:

```typescript
// Update import
import { [NewName]ItemEditor } from "./items/[NewName]Item/[NewName]ItemEditor";

// Update route
<Route path="/[NewName]Item-editor/:itemObjectId">
  <[NewName]ItemEditor {...pageProps} />
</Route>
```

### Step 6: Update Asset Dependencies

1. Rename the assets directory:

```text
Workload/app/assets/items/[OldName]Item/ -> Workload/app/assets/items/[NewName]Item/
```

2. Update any asset references in implementation files that use old paths.

### Step 7: Update Environment Variables (Critical)

Update `ITEM_NAMES` in all environment files. The old name causes build failures.

```bash
# Workload/.env.dev, .env.test, .env.prod
# Before
ITEM_NAMES=HelloWorld,[OldName]

# After
ITEM_NAMES=HelloWorld,[NewName]
```

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
- Renamed item loads correctly in the editor
- Save and load operations work
- No references to the old name remain in the UI

### Step 9: Clean Up Old References

Search for remaining references to the old name:

```powershell
Select-String -Path "Workload\**\*" -Pattern "[OldName]" -Recurse
```

Remove any matches. Clear build artifacts:

```powershell
Remove-Item -Recurse -Force build/
```

### Step 10: Final Verification

Run a full build and test:

```powershell
cd Workload
npm run build:test
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev
npm run start
```

Verify the renamed item works end-to-end.

## Verification Checklist

- All implementation files renamed and contents updated
- Manifest directory renamed and files updated
- Product.json updated with new item name
- Icon file renamed
- Localization entries updated in all locale files (old keys removed, new keys added)
- Route updated in `App.tsx` (import and path)
- `ITEM_NAMES` updated in `.env.dev`, `.env.test`, `.env.prod`
- No references to old item name remain in codebase
- `npm run build:test` completes without errors
- `BuildManifestPackage.ps1` runs without errors
- Item loads and functions correctly in development

## Common Issues

**Build errors after rename**: Search for remaining references to the old name with `Select-String`. Common locations: import statements, route definitions, translation keys.

**Asset reference errors**: Verify icon file was renamed and manifest JSON paths updated.

**Runtime issues**: Check that `ITEM_NAMES` in `.env` files uses the new name. Verify route path matches `editor.path` in the JSON manifest.

## Rollback

Restore from version control:

1. Use `git restore` to recover original files
2. Revert `ITEM_NAMES` changes in all `.env` files
3. Run `BuildManifestPackage.ps1` to regenerate manifests
4. Test item functionality

Create a version control branch or tag before starting a rename to simplify rollback.
