---
name: react
agent: agent
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web']
description: This prompt is used to refactor code according to specified guidelines for React Native components and hooks.
---

# Introduction
- Firstly the code should be refactored to follow the guidelines.
- First thing to do ist to check, which code (component, hook, service, application) type it is and print it out. 
- Shortly describe your refactor plan.
- Then the code should be refactored to follow the guidelines of this type and the general guidelines.

# General Guidelines
- Only use logger for logging, remove console.log statements.
- Use async/await instead of .then()/.catch() for better readability.
- Remove unnecessary and boilerplate code. Try to be simple and readable.
- Try to avoid complex solutions, use simple and readable code.
- Try to avoid magic strings and numbers, use constants `VALUE_X` instead. (Only for important values in business logic, NOT for style values)
- Don't use extra config objects or interfaces for constants. Define constants directly.
- Try to comment logical sections of the code, not every line.
- Try to avoid deeply nested code structures.
- Group Related Functions
- Comment major functions and logical sections of the code.
- Try to avoid any or cast to any!

# Styles
- Remove not used styles.
- Place styles outside the component.
- Use `useTheme` hook for themed styles.
- Define styles in a separate `createStyles` function outside the component.
- Use inline styles only for dynamic styles that depend on props, state or complex logic.

## Components 
- Reuse shared components like Text instead of direct React Native components.
- Make use of variants and themes for these components if possible. 
- Use Icon Component instead of any emojis.

## Localization
- **Never use hardcoded text strings** in components (e.g., `"Save"`, `"Cancel"`, `"Enter your name"`).
- All user-facing text must be defined in `LocalizationSet` interface.
- Check if there are already existing keys for the text you want to use before adding new ones. 
- Check if its is a common key like "save" or "cancel" that could be used across the app, or if it is a specific key that is only used in one place.
- Access localized strings via `useLocalizationStore().t` or `useApp().locales`.
- Examples:
  - Bad: `<Button label="Save" />`
  - Good: `<Button label={t.common.save} />`
  - Bad: `placeholder="Enter your name"`
  - Good: `placeholder={t.account.displayNamePlaceholder}`
- Add new keys to:
  - `packages/app/src/shared/localization/locales/locales.definition.ts` (TypeScript interface)
  - `packages/app/src/shared/localization/locales/locales.en.ts` (English translations)
  - `packages/app/src/shared/localization/locales/locales.de.ts` (German translations)
 
## Patterns

### Pages
- Components which have Page should use the Page component from shared components. 
- They should provide a usePage hook that provides a function to show the page. This function should be used in the parent component to show the page.
```
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

## Import Organization
- Group imports: React/React Native → Third-party → Local imports
- Use absolute imports with @ aliases
- Remove unused imports

## Performance Guidelines
- Use useCallback only for:
  - Functions passed to child components that use React.memo
  - Dependencies in other hooks
- Use useMemo only for:
  - Expensive calculations (> 5ms)
  - Object/array creation that causes unnecessary re-renders

# React Native Component Development Guidelines

- When no question is asked, the default response should be a refactoring of the provided file. 

When developing React Native components, please adhere to the following guidelines:
- Use props in interfaces to define component inputs and deconstruct it in the component function.
- Components should be written in TypeScript and use React Native.
- Components should be functional components.
- Try to avoid to much logic in the component, keep it simple.
- Use custom hooks for complex logic. Place internal hooks at the top of the file. 
  - Only apply this rule on comlex logic, not on every component. > 10 lines of logic.
- No need for specific return type
- Remove not used styles and props.
- Place styles outside the component.
- Use function Component over arrow function for components (not hooks).
- Use arrow functions for hooks and logic
- Use `useTheme` hook to get themed styles.
- Use `useApp` hook to get app context,locales (only when needed).
- Only use inline styles for dynamic styles that depend on props, state or complex logic.
- For inline styles try to use const functions.
- If views are deeply nested or complex, consider extracting them into separate const functions.
- **Avoid deeply nested conditional rendering (ternary chains)**: Extract complex conditional JSX into separate const functions or subcomponents
  - Bad: `{condition && (<View>{anotherCondition ? <ComponentA /> : <ComponentB />}</View>)}`
  - Good: Extract into `const renderUserContent = () => { ... }` and call `{renderUserContent()}`
  - Or extract as separate subcomponent `<UserContent />`
- **Avoid pure wrapper components**: If a component only wraps another component and passes props through, move the logic (hooks, handlers) into it
  - Bad: Component that only renders `<SharedComponent />` with prop pass-through
  - Good: Move hooks and business logic (e.g., `useReactionHandlers`) into the wrapper component to give it real responsibility
  - This applies when the wrapper would otherwise just be a thin layer without value

```TSX
const MAGIC_NUMBER = 42

/**
  * Add a brief description of the component here.
  * Only add a hook if the component has complex logic! 
**/
const useComponentLogic = () => {
  // Define any complex logic here
} 

interface ComponentProps {
  // Define any props that the component might need
}

/**
  * Brief description of the component.
  * Props interface for type safety, deconstruct in function body.
**/
function Component(props: ComponentProps) {
  // Deconstruct props in the function body for clarity and readability
  const { prop1, prop2 } = props
  
  // Use useTheme for themed styles
  const { styles } = useTheme(createStyles)
  
  // Use useApp for app context, or locales (only when needed)
  const { locales } = useApp()

  const deeplyNestedView = () => {
    // This function can be used to render deeply nested views
    // Or consider extracting as a separate subcomponent
    return <View style={styles.nestedView}></View>
  }

  return (<View>{deeplyNestedView()}</View>)
}

const createStyles = (theme: Theme) => StyleSheet.create({
  nestedView: {
    backgroundColor: theme.colors.surface,
  }
})

export default Component
```


```


```

# React Native Hook Development Guidelines
- Hooks should be written in TypeScript and use React Native.
- Hooks should be functional hooks.
- Hooks should be used for complex logic, not for every component.
- Keep it simple
- Organize code logically: Props extraction → State → Effects → Helpers → Event handlers → Return
- Use direct constants instead of config objects for magic numbers and strings.
- Check if useCallback or useMemo can be used to optimize performance. (But be careful, only if important!)
