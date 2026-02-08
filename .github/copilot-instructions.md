---
applyTo: '**/*.ts'
---

Coding standards, domain knowledge, and preferences that AI should follow.

# Refactoring & Coding Guidelines (TypeScript / React Native)

## Workflow

1. Determine the **code type** (component, hook, service, application) and print it.
2. Describe the **refactor plan** briefly.
3. Refactor according to the guidelines below.
4. Default behavior: if no question is asked, **refactor the provided file**.

---

# Global Standards

- Use **English only** for code, comments, and documentation.
- Follow the existing architecture and coding style.
- Generate **minimal**, specific code; avoid over-engineering.
- Prefer simple, readable solutions over complex ones.
- Avoid boilerplate and deeply nested control flow.
- Group related functions and comment **major functions / logical sections** (not every line).

---

# Architecture

## Principles

- Prefer modular architecture.
- Separate responsibilities:
  - **Components**: UI + minimal glue
  - **Hooks**: UI-oriented state/side-effects (only when needed)
  - **Services**: pure functions (business logic)
  - **Applications**: connect UI ↔ store ↔ services

## Roles

- **Services are always pure functions.**
- **Applications** are the connection between UI, store, and services.
- A **component**:
  - uses the **store** to read state
  - uses the **application** to update state / trigger actions
- Avoid config objects for simple values; prefer direct constants.

---

# TypeScript Guidelines

- Prefer functional programming; avoid classes.
- Use TypeScript for all code.
- Use `interface` for data structures and type definitions.
- Prefer immutability (`const`).
- Use optional chaining `?.` and nullish coalescing `??`.
- Avoid `any` and casts to `any`.

---

# Logging & Error Handling

- Use `logger` only; remove `console.log`.
- For async operations:
  - use `async/await`
  - use `try/catch`
  - always log errors with contextual information

React:
- Implement proper error boundaries where applicable (app-level / page-level).

---

# React / React Native Components

## Component Style

- Functional components in TypeScript.
- Use `function ComponentName(props: Props)` (not arrow) for components.
- Define props with an interface and destructure inside the component body.
- Keep components small and focused; avoid “pure wrapper” components without responsibility.

## Logic Placement

- Keep logic out of components when it grows:
  - extract complex logic (> ~10 lines) into a hook
  - keep services pure and push business rules there when possible
- Avoid deeply nested conditional rendering:
  - extract to `renderX()` helpers or subcomponents when JSX gets complex.

## Imports

- Order imports: React/React Native → Third-party → Local
- Use absolute `@` aliases
- Remove unused imports

## Performance

- `useCallback` only if:
  - passed to memoized child components
  - needed as dependency of other hooks
- `useMemo` only for:
  - expensive computations (> ~5ms)
  - preventing re-renders due to new object/array creation

---

# Styling

- Remove unused styles.
- Styles live outside the component in `createStyles`.
- Use `useTheme(createStyles)` for themed styles.
- Inline styles only for dynamic styles derived from props/state/complex logic.

---

# UI Components

- Reuse shared components (e.g., Text) instead of raw React Native components.
- Prefer variants/themes of shared components.
- Use an Icon component instead of emojis.

---

# Localization

- Never use hardcoded user-facing strings.
- All text must come from localization (`t` or `locales`).
- Reuse existing common keys before adding new ones.
- If new keys are needed, update:
  - `packages/app/src/shared/localization/locales/locales.definition.ts`
  - `packages/app/src/shared/localization/locales/locales.en.ts`
  - `packages/app/src/shared/localization/locales/locales.de.ts`

---

# Page / Overlay Pattern

Pages should:
- use the shared `Page` component
- expose a corresponding `usePage` hook with show/close functions

Example:

```ts
export const useSettingsPage = () => ({
  showSettings: () => setOverlay(
    'settingsForm',
    <SettingsPage
      onClose={() => closeOverlay('settingsForm')}
      onSubmit={() => closeOverlay('settingsForm')}
    />
  ),
  closeSettings: () => closeOverlay('settingsForm'),
})
```

---

# Naming Conventions

* PascalCase: components, interfaces, type aliases
* camelCase: variables, functions, methods
* ALL_CAPS: constants
