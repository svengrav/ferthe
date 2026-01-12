$ErrorActionPreference = 'Stop'

$Root = 'C:\Workspace\Repositories\ferthe\source'
$BuildDir = "$Root\_build\android"
$ExposeToken = ''

# Create build directory
$null = New-Item -Path $BuildDir -ItemType Directory -Force
    
# Change to root directory for proper context
Push-Location $Root
    
# Build Docker image
Write-Host 'Building Docker image...'
docker build -t expo-android-builder -f 'ferthe-app\.docker\Dockerfile' .
    
# Create archive from root
Write-Host 'Creating source archive...'
git archive --format=zip --output="$BuildDir\build.zip" HEAD
    
# Extract archive
Write-Host 'Extracting archive...'
Expand-Archive -Path "$BuildDir\build.zip" -DestinationPath $BuildDir -Force
    
# Convert Windows path to Docker-compatible path
$DockerBuildDir = $BuildDir.Replace('\', '/')
if ($DockerBuildDir.StartsWith('C:')) {
  $DockerBuildDir = $DockerBuildDir.Replace('C:', '/c')
}
    
# Install dependencies
Write-Host 'Installing dependencies...'
$installCmd = 'npm install --progress=true --color=always&& npx expo install'
docker run --rm -t -v "${DockerBuildDir}:/app" expo-android-builder /bin/sh -c "$installCmd"
#docker run -it --rm -v "${DockerBuildDir}:/app" expo-android-builder
# Build Android App (typo fixed)
Write-Host 'Building Android app...'#
$buildCmd = 'git init && cd ferthe-app && eas build --platform android --profile preview --local'
docker run --rm -v "${DockerBuildDir}/ferthe-app:/app" -e EXPO_TOKEN=$exposeToken expo-android-builder /bin/sh -c "$buildCmd"
    
Write-Host 'Done'