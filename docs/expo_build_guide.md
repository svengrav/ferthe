# Hot Reload Issues
# If you are experiencing issues with hot reloading, try the following:
- https://github.com/expo/expo/issues/23104#issuecomment-1689566248
- import '@expo/metro-runtime'; // This line is required for web support in Expo projects // Hot Reload! 
- Its has to be the first import in your entry file (e.g., App.tsx or index.tsx)


## Clear cache if you have issues
- npx expo start --web --clear

# Check this for bundler errors
```
$env:EXPO_DEBUG=true
npx expo export --platform web
```

# Clean and Reliable Expo Build Setup (Monorepo)

## Goals

- Avoid version mismatches (e.g., multiple Expo SDKs)
- Ensure stable and reproducible builds locally and on EAS Cloud
- Keep monorepo dependency management clean and centralized

---

## 1. Lockfiles

- Always commit lockfiles (`package-lock.json`, `yarn.lock`, etc.)
- In a monorepo, prefer **only one lockfile at the root**
- Avoid having lockfiles in individual sub-packages (e.g., `apps/my-app/package-lock.json`)

### Why

- Guarantees reproducible installs
- Ensures consistency between local and EAS Cloud builds

---

## 2. `node_modules` location

- Only allow a single `node_modules/` at the monorepo root
- Delete all `node_modules/` folders in sub-packages

### Why

- Prevents duplicated package versions
- Avoids Metro and Gradle conflicts (e.g., duplicate `react`, mismatched `expo-modules-core`)

---

## 3. Installation

- Install dependencies **only from the monorepo root**

```bash
npm install    # from root
```

- Do not run `npm install` inside subdirectories like `ferthe-app/`

---

## 4. Using `expo install`

- Always install Expo-compatible packages using:

```bash
npx expo install expo-file-system
```

- Never use `npm install` directly for Expo SDK-managed packages

### Why

- Ensures the correct version that matches the current Expo SDK

---

## 5. Expo SDK Versioning

- Your app’s `package.json` must contain exactly one `expo` dependency
- Stick to the version range that matches your SDK, e.g.:

```json
"expo": "~52.0.0"
```

- Avoid having multiple `expo` versions in the dependency tree

### Check for duplicates

```bash
npm list expo
```

- If you see multiple versions (e.g. `52.x` and `53.x`), clean and reinstall (see section 6)

---

## 6. Cleaning and Resetting

```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm package-lock.json     # or yarn.lock
npm install              # from root
```

- Rebuild native directories (if needed):

```bash
npx expo prebuild --clean
```

---

## 7. EAS Cloud Build

- EAS Cloud uses the committed lockfile and your directory structure as-is
- Make sure the directory containing `eas.json` also contains the correct `package.json` and lockfile
- Use `--no-cache` if you're testing version fixes:

```bash
eas build --platform android --no-cache
```

---

## 8. Summary

| Task                | Best Practice                                               |
| ------------------- | ----------------------------------------------------------- |
| Dependency installs | Always from root                                            |
| Lockfiles           | Commit root lockfile only                                   |
| Expo SDK            | One version only, installed via `expo install`              |
| Node modules        | Only in root, not in subprojects                            |
| EAS Build           | Clean, committed structure with correct version constraints |

---

## Recommended Tools

- [`npm dedupe`](https://docs.npmjs.com/cli/v9/commands/npm-dedupe)
- `npm ls expo`
- `expo doctor`
- `npx expo install <pkg>`

