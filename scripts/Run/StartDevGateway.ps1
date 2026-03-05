param (
    [boolean]$InteractiveLogin = $true
)

################################################
# Make sure Manifest is built
################################################
# Run BuildManifestPackage.ps1 with absolute path
$buildManifestPackageScript = Join-Path $PSScriptRoot "..\Build\BuildManifestPackage.ps1"
if (Test-Path $buildManifestPackageScript) {
    $buildManifestPackageScript = (Resolve-Path $buildManifestPackageScript).Path
    & $buildManifestPackageScript 
} else {
    Write-Host "BuildManifestPackage.ps1 not found at $buildManifestPackageScript"
    exit 1
}

################################################
# Starting the Frontend
################################################
$fileExe = ""
if($IsWindows) { 
    $fileExe = Join-Path $PSScriptRoot "..\..\tools\DevGateway\Microsoft.Fabric.Workload.DevGateway.exe"
} else { 
    $fileExe = Join-Path $PSScriptRoot "..\..\tools\DevGateway\Microsoft.Fabric.Workload.DevGateway.dll"
}

$CONFIGURATIONFILE = Resolve-Path -Path (Join-Path $PSScriptRoot "..\..\build\DevGateway\workload-dev-mode.json")
$CONFIGURATIONFILE = $CONFIGURATIONFILE.Path
Write-Host "DevGateway used: $fileExe"
Write-Host "Configuration xsfile used: $CONFIGURATIONFILE"

$token = ""
# When InteractiveLogin is false, always use az commands for authentication
if (-not $InteractiveLogin -or $env:CODESPACES -eq "true" -or $IsMacOS) {
    Write-Host "Using non-interactive authentication via az CLI..." -ForegroundColor Green
    
    # Check if already logged in
    $account = az account show 2>$null
    if (-not $account) {
        Write-Host "Not logged in. You need to perform az login..." -ForegroundColor Red
        az config set core.login_experience_v2=off | Out-Null
        $fabricTentanID = Read-Host "Enter your Fabric tenant id"
        az login -t $fabricTentanID --allow-no-subscriptions --use-device-code | Out-Null
    }

    $token = az account get-access-token --scope https://analysis.windows.net/powerbi/api/.default --query accessToken -o tsv 
    Write-Host "Successfully obtained access token via az CLI" -ForegroundColor Green
}
$config = Get-Content -Path $CONFIGURATIONFILE -Raw | ConvertFrom-Json 
$manifestPackageFilePath = $config.ManifestPackageFilePath 
$devWorkspaceId = $config.WorkspaceGuid 
$logLevel = "Information"


if($IsWindows) { 
    if ($InteractiveLogin -and [string]::IsNullOrEmpty($token)) {
        # Use interactive mode only when explicitly requested and no token available
        Write-Host "Starting DevGateway in interactive mode..." -ForegroundColor Green
        & $fileExe -DevMode:LocalConfigFilePath $CONFIGURATIONFILE
    } else {
        # Use token-based authentication
        Write-Host "Starting DevGateway with token-based authentication..." -ForegroundColor Green
        & $fileExe -LogLevel $logLevel -DevMode:UserAuthorizationToken $token -DevMode:ManifestPackageFilePath $manifestPackageFilePath -DevMode:WorkspaceGuid $devWorkspaceId
    }
} else {   
    # Check if we're on ARM64 Mac and need x64 runtime
    $arch = uname -m
    if ($arch -eq "arm64") {
        $x64DotnetPath = "/usr/local/share/dotnet/x64/dotnet"
        if (Test-Path $x64DotnetPath) {
            Write-Host "Using x64 .NET runtime for ARM64 Mac compatibility..." -ForegroundColor Yellow
            & $x64DotnetPath $fileExe -LogLevel $logLevel -DevMode:UserAuthorizationToken $token -DevMode:ManifestPackageFilePath $manifestPackageFilePath -DevMode:WorkspaceGuid $devWorkspaceId
        } else {
            Write-Host "ERROR: This application requires x64 .NET runtime, but you're on ARM64 Mac." -ForegroundColor Red
            Write-Host "Please install x64 .NET 8 Runtime from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Red
            Write-Host "Make sure to download the x64 version (not ARM64)." -ForegroundColor Red
            exit 1
        }
    } else {
        & dotnet $fileExe -LogLevel $logLevel -DevMode:UserAuthorizationToken $token -DevMode:ManifestPackageFilePath $manifestPackageFilePath -DevMode:WorkspaceGuid $devWorkspaceId
    }
}