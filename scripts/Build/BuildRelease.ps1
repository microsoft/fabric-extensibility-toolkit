param ( 
    # The name of the workload, used for the Entra App and the workload in the Fabric portal
    [String]$WorkloadName = "Org.MyWorkload",
    # The Entra Application ID for the frontend
    # If not provided, the user will be prompted to enter it or create a new one.
    [String]$FrontendAppId = "00000000-0000-0000-0000-000000000000",
    # Not used in the current setup, but can be used for future backend app configurations
    # If not provided, it will default to an empty string.
    [String]$BackendAppId,
    # The version of the workload, used for the manifest package
    [String]$WorkloadVersion = "1.0.0",
    # Environment that should be build
    [ValidateSet("dev", "test", "prod")]
    [String]$Environment = "prod"
)

# Define key-value dictionary for replacements
$replacements = @{
    "WORKLOAD_NAME" = $WorkloadName
    "FRONTEND_APPID" = $FrontendAppId
    "BACKEND_APPID" = $BackendAppId
    "WORKLOAD_VERSION" = $WorkloadVersion
}

$realeaseDir = Join-Path $PSScriptRoot "..\..\release"
if ((Test-Path $realeaseDir)) {
    Write-Output "Release directory already exists at $realeaseDir. Deleting it."
    Remove-Item -Path $realeaseDir -Recurse -Force
} 
New-Item -ItemType Directory -Path $realeaseDir | Out-Null
$realeaseDir = Resolve-Path $realeaseDir

###############################################################################
# Creating the release manifest
# 
###############################################################################
# Run BuildManifestPackage.ps1 with absolute path
$buildManifestPackageScript = Join-Path $PSScriptRoot "..\Build\BuildManifestPackage.ps1"
if (Test-Path $buildManifestPackageScript) {
    $buildManifestPackageScript = (Resolve-Path $buildManifestPackageScript).Path
    & $buildManifestPackageScript -Environment "prod"
} else {
    Write-Host "BuildManifestPackage.ps1 not found at $buildManifestPackageScript"
    exit 1
}

# Copy the nuget package to the release directory
$buildManifestDir = Join-Path $PSScriptRoot "..\..\build\Manifest"
$realeaseManifestDir = Join-Path $realeaseDir ""

Move-Item -Path "$buildManifestDir\*.nupkg" -Destination $realeaseManifestDir -Force

Write-Host “✅ Moved the new ManifestPackage to $realeaseManifestDir." -ForegroundColor Blue


###############################################################################
# Creating the app release
# 
###############################################################################

$realeaseApptDir = Join-Path $realeaseDir "app"

#TODO: overwrite the .env.$Environment file with the correct settings

Write-Host "Building the app release ..."
$workloadDir = Join-Path $PSScriptRoot "..\..\Workload"
Push-Location $workloadDir
try {
    npm run build:$Environment
    if (!(Test-Path $realeaseApptDir)) {
        New-Item -ItemType Directory -Path $realeaseApptDir | Out-Null
    }

} finally {
    Pop-Location
}

Write-Host ""
Write-Host "All release information has been build an is available under the" -ForegroundColor Green
Write-Host "$realeaseDir"
Write-Host ""
Write-Host "You can now upload the manifest package and the app release to the Fabric portal." 
Write-Host "The manifest package is located at $realeaseManifestDir"
Write-Host ""
write-Host "To upload the app release, to Azuer you can use the Deploy scripts."
Write-Host "The app release is located at $realeaseApptDir"


