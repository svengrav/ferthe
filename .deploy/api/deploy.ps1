# Simple API Deployment Script using Azure CLI
# Uses to bundle the API with esbuild and deploy it to Azure App Service
#  "build:production": "esbuild src/index.ts --bundle 
# --platform=node --target=node22 --outfile=dist/index.js --sourcemap",

$ErrorActionPreference = 'Stop'

# Configuration
Set-Location $PSScriptRoot\..\..

$appName = 'app-ferthe-core-api'
$resourceGroup = 'rg-ferthe-core' 
$subscriptionId = '68b0dd0c-4183-414d-9e25-7cf8faa43717'
$tenantId = 'b567a640-5952-4fbc-8763-4182295b6e57'
$clientSecret = 'JKD8Q~pqXRn7MCfMb-hl1vojfh2v7QjEnHCUKa1K' # Deploy Only Secret
$clientId = 'a26fc789-e34c-48f3-9d5d-112177c6d2d5'

# Build all apps
npm run build

Write-Host '🚀 Starting API deployment...' -ForegroundColor Green

Write-Host '🔐 Logging in with Service Principal...' -ForegroundColor Cyan
az login --service-principal -u $clientId -p $clientSecret --tenant $tenantId
az account set --subscription $subscriptionId

Write-Host '🚀 Starting API deployment...' -ForegroundColor Green

# DISABLE build automation - we're providing pre-built packages
Write-Host '🦾 Set to production mode...' -ForegroundColor Yellow
az webapp config appsettings set --resource-group $resourceGroup --name $appName `
  --settings PRODUCTION=TRUE

# FIXED VERSION - Copy local packages directly to build directory

Write-Host '🔨 Building project locally...' -ForegroundColor Yellow

# Build all workspace packages from root
Remove-Item -Path './ferthe-api/dist' -Recurse -Force -ErrorAction SilentlyContinue
npm run build:production --prefix ./ferthe-api
npm install --package-lock-only --prefix ./ferthe-api

Write-Host '📦 Creating build directory...' -ForegroundColor Cyan
Remove-Item -Path './_build/api' -Recurse -Force -ErrorAction SilentlyContinue
$buildDir = New-Item -Path './_build/api' -ItemType Directory -Force
$distDir = New-Item -Path "$buildDir\dist" -ItemType Directory -Force

# Copy API files
Write-Host '📋 Copying API files...' -ForegroundColor Cyan
Get-Item -Path './ferthe-api/dist/index.js' | Copy-Item -Destination $distDir\index.js -Force
Get-Item -Path './ferthe-api/package.json' | Copy-Item -Destination $buildDir -Force
Get-Item -Path './ferthe-api/package-lock.json' | Copy-Item -Destination $buildDir -Force
Get-Item -Path './.deploy/api/web.config' | Copy-Item -Destination $buildDir -Force

# Copy web.config

Write-Host '🔄 Deploying folder to Azure (ZIP)...' -ForegroundColor Yellow
Compress-Archive -Path "$buildDir/*" -DestinationPath "$buildDir/deploy.zip" -Force

az webapp deploy --resource-group $resourceGroup --name $appName --src-path "$buildDir/deploy.zip" --type zip
Write-Host '🎉 Done!' -ForegroundColor Green
