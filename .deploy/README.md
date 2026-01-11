# Ferthe API Deployment Guide

- Endpoint: https://foxhole.ferthe.eu/api
**IMPORTANT:** Don't use native modules in production builds - bundle them externally!

## Build & Bundle

### Production Build
- esbuild bundles all modules into `dist/index.js`
- Native modules (bcrypt) remain external for Linux compatibility
- Output: `ferthe-api/dist/index.js` + sourcemap

```bash
# Local build with esbuild
npm run build:production --prefix ./ferthe-api
```

### esbuild Configuration
```json
{
  "scripts": {
    "build:production": "esbuild src/index.ts --bundle --platform=node --target=node22 --outfile=dist/index.js --external:bcrypt --sourcemap"
  }
}
```

**Important Parameters:**
- `--external:bcrypt` - Don't bundle native modules
- `--platform=node` - Server environment
- `--target=node22` - Node.js version
- `--sourcemap` - Debug support

## Azure App Service Deployment

### Automated Deployment (deploy.ps1)
```powershell
# 1. Local build
npm run build:production --prefix ./ferthe-api

# 2. Azure build settings
az webapp config appsettings set --name $appName --settings PRODUCTION=TRUE

# 3. Copy files and create zip package
# - dist/index.js (Bundle)
# - package.json (Dependencies)  
# - package-lock.json (Lock file)
# - web.config (IIS Configuration)

# 4. Deploy
az webapp deploy --src-path $buildDir --type zip
```

## Deployment Checklist

### Azure Settings
```bash
SCM_DO_BUILD_DURING_DEPLOYMENT=true  # For npm install
PORT=8080  # Azure default port
```

### Required Files
```
_build/api/
├── dist/index.js        # esbuild Bundle
├── package.json         # Only bcrypt dependency
├── package-lock.json    # Platform detection
└── web.config          # IIS Configuration
```

## Common Issues

### Problem: "No native build found for bcrypt"
**Solution:** Use `--external:bcrypt` and enable Azure build
```bash
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Problem: "Could not detect platform nodejs"
**Solution:** Include `package-lock.json` in deployment
```bash
npm install --package-lock-only
```

### Problem: "Invalid argument 'options'"
**Solution:** Check Fastify listen configuration
```typescript
// Correct:
await server.listen({ host: '0.0.0.0', port: 8080 })
```

## Debugging

### Azure Logs
```bash
# Live logs
az webapp log tail --name $appName --resource-group $resourceGroup

# SSH access
az webapp ssh --name $appName --resource-group $resourceGroup
```

### Check Server Status
```bash
# In Kudu Console: https://yourapp.scm.azurewebsites.net
ps aux | grep node
netstat -tlnp | grep :8080
curl -I http://localhost:8080
```

## File Structure

### Development
```
ferthe-api/
├── src/           # TypeScript Source
├── dist/          # Build Output (after esbuild)
├── package.json   # Dev Dependencies
└── tsconfig.json  # TypeScript Config
```

### Production Deployment
```
_build/api/
├── dist/index.js       # Complete Bundle (except bcrypt)
├── package.json        # Only: { "dependencies": { "bcrypt": "^6.0.0" } }
├── package-lock.json   # Platform Detection
└── web.config         # IIS Configuration
```

## Quick Deploy
```bash
# One-liner for complete deployment
.\\.deploy\\api\\deploy.ps1
```