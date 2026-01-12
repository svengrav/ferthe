# Features

This directory contains feature modules that represent distinct functional areas of the application.

## Purpose

The Features directory organizes code into domain-specific modules, each representing a discrete piece of application functionality. This supports a modular architecture where related code is co-located and feature boundaries are clearly defined.

## Structure

Each feature module has types, stores, components and applications.

## Guidelines

- Keep features focused on a single responsibility
- Separate logic (application.ts) from hooks and components
- Components should use application functions to set state
- Components should use store to read state
- Export a clean public API through index.ts
- Use shared components for UI elements that aren't feature-specific
- Minimize dependencies between features

## Example

```typescript
// Feature structure example
features / settings / components / SettingsForm.tsx
hooks / useSettings.ts
types / types.ts
store.ts
application.ts
index.ts
```
