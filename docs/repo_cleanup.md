# 📦 Package Dependencies Cleanup Guide

## 🎯 Key Principles

### **Remove Unnecessary Dependencies**
- ✅ **Keep:** Real runtime dependencies (fastify, bcrypt, etc.)
- ❌ **Remove:** Internal workspace references (ferthe-core, ferthe-shared, etc.)
- ❌ **Remove:** Duplicate dev tools already in root package

### **Why Internal Dependencies Are Not Needed**
- **TypeScript Resolution:** Uses `tsconfig.json` references and path mapping
- **esbuild Bundle:** Follows TypeScript import resolution automatically
- **No Publishing:** Packages are for internal use only, not npm registry
- **Monorepo Structure:** Workspace handles internal linking

## 🧹 What to Remove

### **From Sub-Packages (ferthe-api, ferthe-core, etc.):**

```json
{
  "dependencies": {
    // ❌ Remove these internal references:
    "ferthe-app": "1.0.0",
    "ferthe-core": "1.0.0", 
    "ferthe-shared": "1.0.0",
    "ferthe-workspace": "file:.."
  },
  "devDependencies": {
    // ❌ Remove duplicates from root:
    "@types/node": "^20.0.0",
    "typescript": "^5.8.3",
    "tsx": "^4.19.4",
    "ts-node": "^10.9.2",
    "esbuild": "^0.19.0",
    "concurrently": "^9.1.2"
  }
}
```

### **Keep in Root Package Only:**
```json
{
  "devDependencies": {
    "@types/node": "^22.15.30",
    "typescript": "^5.8.3",
    "tsx": "^4.19.4",
    "ts-node": "^10.9.2", 
    "esbuild": "^0.19.0",
    "concurrently": "^9.1.2"
  }
}
```

## ✅ What to Keep

### **Runtime Dependencies Only:**
```json
{
  "dependencies": {
    // ✅ External libraries needed at runtime:
    "@fastify/cors": "^11.0.1",
    "@fastify/swagger": "^9.5.1", 
    "fastify": "^5.3.3",
    "bcrypt": "^6.0.0"
  }
}
```

## 🔧 How Resolution Works

### **TypeScript Path Mapping:**
```json
// tsconfig.json handles internal imports
{
  "compilerOptions": {
    "baseUrl": "..",
    "paths": {
      "@core/*": ["./ferthe-core/src/*"],
      "@shared/*": ["./ferthe-shared/src/*"]
    }
  }
}
```

### **esbuild Follows TypeScript:**
```typescript
// This works without package dependencies:
import { Contract } from '@shared/contracts'
import { CoreService } from '@core/services'
```

### **npm Workspaces for Dev Tools:**
```bash
# Tools available from root to all packages:
npm run build --workspace=ferthe-api
tsx src/index.ts  # Works in any package
```

## 💡 Benefits

- **🚀 Faster installs:** Fewer duplicate dependencies
- **🔧 Easier maintenance:** Single source of truth for dev tools
- **📦 Smaller bundles:** No circular dependency issues
- **✨ Cleaner code:** Clear separation of concerns
- **🎯 Production ready:** Only essential runtime dependencies

## 🚨 Exception: Production Deployment

### **For Azure App Service (bcrypt only):**
```json
// package.production.json
{
  "dependencies": {
    "bcrypt": "^6.0.0"  // Only native module
  }
}
```

**Everything else is bundled by esbuild into `dist/index.js`**

---

*Best practice for TypeScript monorepos with esbuild bundling*
