<#
  This scripts is used to start a local Android emulator for development,
  and installs the latest APK from a remote development server via SCP.
#>
param (
    [string] $EmulatorName = 'Medium_Phone_API_36',
    [string] $RemoteHost = 'devbox.home',
    [string] $RemoteUser = 'root',
    [string] $RemoteApkPath = '/root/workspace/ferthe/packages/app/dist/*.apk',
    [string] $LocalArtifactDir = "$($HOME)\android-dev",
    [string] $AppPackage = 'de.ferthe.app',
    [int] $ExpoPort = 19000
)

$ErrorActionPreference = 'Stop'

$ExecutionContext.SessionState.LanguageMode = 'FullLanguage'

Write-Host '=== Ferthe Android Emulator Development Setup ===' -ForegroundColor Cyan
Write-Host ''

# ============================================
# STEP 1: Download APK from remote server
# ============================================
Write-Host '[1/7] Downloading APK from remote server...' -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $LocalArtifactDir | Out-Null
$localApk = Join-Path $LocalArtifactDir 'ferthe-app.apk'

try {
    # Get remote APK file path (newest)
    $remoteApkFile = ssh "${RemoteUser}@${RemoteHost}" "ls -t $RemoteApkPath 2>/dev/null | head -n1"
    
    if ([string]::IsNullOrWhiteSpace($remoteApkFile)) {
        Write-Host "✗ No APK found on remote server at: $RemoteApkPath" -ForegroundColor Red
        exit 1
    }
    
    # Get remote file size
    $remoteSize = ssh "${RemoteUser}@${RemoteHost}" "stat -c %s '$remoteApkFile'"
    
    # Check if local APK exists and compare file sizes
    $needsDownload = $true
    if (Test-Path $localApk) {
        $localSize = (Get-Item $localApk).Length
        
        if ($localSize -eq [long]$remoteSize) {
            Write-Host "✓ APK already up-to-date ($('{0:N0}' -f $localSize) bytes), skipping download" -ForegroundColor Green
            $needsDownload = $false
        } else {
            Write-Host "  Local: $('{0:N0}' -f $localSize) bytes, Remote: $('{0:N0}' -f $remoteSize) bytes" -ForegroundColor Gray
        }
    }
    
    if ($needsDownload) {
        scp "${RemoteUser}@${RemoteHost}:$remoteApkFile" $localApk
        Write-Host "✓ APK downloaded to: $localApk" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to download APK: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: Kill all running emulator processes
# ============================================
Write-Host "`n[2/7] Stopping all emulator processes..." -ForegroundColor Yellow
$emulatorProcesses = Get-Process | Where-Object { $_.Name -like '*emulator*' -or $_.Name -like '*qemu*' }

if ($emulatorProcesses.Count -gt 0) {
    $emulatorProcesses | ForEach-Object { 
        Stop-Process -Id $_.Id -Force
        Write-Host "  Killed PID $($_.Id) ($($_.Name))" -ForegroundColor Gray
    }
    Start-Sleep -Seconds 2
    Write-Host '✓ All emulators stopped' -ForegroundColor Green
} else {
    Write-Host '✓ No emulator processes running' -ForegroundColor Green
}

# ============================================
# STEP 3: Start Android Emulator
# ============================================
Write-Host "`n[3/7] Starting emulator: $EmulatorName..." -ForegroundColor Yellow
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"

if (!(Test-Path $emulatorPath)) {
    Write-Host "✗ Emulator not found at: $emulatorPath" -ForegroundColor Red
    exit 1
}

Start-Process $emulatorPath -ArgumentList "-avd $EmulatorName" -WindowStyle Hidden
Write-Host '✓ Emulator started' -ForegroundColor Green

# ============================================
# STEP 4: Wait for emulator to boot
# ============================================
Write-Host "`n[4/7] Waiting for emulator to boot..." -ForegroundColor Yellow

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (!(Test-Path $adbPath)) {
    Write-Host "✗ ADB not found at: $adbPath" -ForegroundColor Red
    exit 1
}

Write-Host "  Waiting 45 seconds for emulator startup..." -ForegroundColor Gray
Start-Sleep -Seconds 45
Write-Host '✓ Emulator should be ready' -ForegroundColor Green

# ============================================
# STEP 5: Install APK
# ============================================
Write-Host "`n[5/7] Installing APK..." -ForegroundColor Yellow
& $adbPath uninstall $AppPackage 2>$null | Out-Null
& $adbPath install -r $localApk

if ($LASTEXITCODE -eq 0) {
    Write-Host '✓ APK installed' -ForegroundColor Green
} else {
    Write-Host '✗ APK installation failed' -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 6: Setup SSH tunnel for Expo Dev Server
# ============================================
Write-Host "`n[6/7] Setting up SSH tunnel (port $ExpoPort)..." -ForegroundColor Yellow
$sshJob = Start-Job -ScriptBlock {
    param($RemoteUser, $RemoteHost, $ExpoPort)
    ssh -N -L ${ExpoPort}:localhost:${ExpoPort} "${RemoteUser}@${RemoteHost}"
} -ArgumentList $RemoteUser, $RemoteHost, $ExpoPort

Start-Sleep -Seconds 2
if ($sshJob.State -eq 'Running') {
    Write-Host "✓ SSH tunnel active (Job ID: $($sshJob.Id))" -ForegroundColor Green
} else {
    Write-Host '✗ SSH tunnel failed to start' -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 7: Launch app on emulator
# ============================================
Write-Host "`n[7/7] Launching app..." -ForegroundColor Yellow
& $adbPath shell monkey -p $AppPackage -c android.intent.category.LAUNCHER 1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host '✓ App launched' -ForegroundColor Green
} else {
    Write-Host '✗ App launch failed' -ForegroundColor Red
}

# ============================================
# Summary
# ============================================
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Emulator: $EmulatorName" -ForegroundColor White
Write-Host "App Package: $AppPackage" -ForegroundColor White
Write-Host "SSH Tunnel: localhost:$ExpoPort -> ${RemoteHost}:$ExpoPort" -ForegroundColor White
Write-Host "SSH Job ID: $($sshJob.Id) (Stop with: Stop-Job $($sshJob.Id))" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop SSH tunnel and exit." -ForegroundColor Gray

# Keep script running to maintain SSH tunnel
try {
    Wait-Job $sshJob
} finally {
    Stop-Job $sshJob -ErrorAction SilentlyContinue
    Remove-Job $sshJob -ErrorAction SilentlyContinue
    Write-Host "`nSSH tunnel stopped." -ForegroundColor Yellow
}
