# This script deploys the consent app to Azure Static Web Apps

# Deploy and upload the app to Azure Static Web Apps
Push-Location $PSScriptRoot

$Token = Read-Host -Prompt 'Enter your Azure Static Web Apps token'

$appName = 'app-ferthe-core-api'
$resourceGroup = 'rg-ferthe-core' 
$subscriptionId = '68b0dd0c-4183-414d-9e25-7cf8faa43717'
$tenantId = 'b567a640-5952-4fbc-8763-4182295b6e57'
$stappName = 'stapp-foxehole-app'

# Install dependencies and build the application
npm install
npm run build

# Ensure staticwebapp.config.json exists in dist folder
Copy-Item './staticwebapp.config.json' -Destination './dist/' -Force

# Deploy the application to Azure Static Web Apps
# swa login -n $appName -T $tenantId -S $subscriptionId
swa deploy ./dist/ --env production -S $subscriptionId -n $stappName --deployment-token $Token

Pop-Location