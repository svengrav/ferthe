---
name: Refactor Code According to React Native Guidelines
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
- Try to avoid magic strings and numbers, use constants `VALUE_X` instead. (Only for important values)
- Don't use extra config objects or interfaces for constants. Define constants directly.
- Try to comment logical sections of the code, not every line.
- Try to avoid deeply nested code structures.
- Group Related Functions
- Comment major functions and logical sections of the code.
- Try to avoid any

# Styles
- Remove not used styles.
- Place styles outside the component.
- Use createThemedStyles for styles that depend on the theme.
- Use inline styles only for dynamic styles that depend on props, state or complex logic.

## Components 
- Reuse shared components like Text instead of direct React Native components.
- Make use of variants and themes for these components if possible. 

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
- Use `useApp` hook to get the theme and styles.
- Only use inline styles for dynamic styles that depend on props, state or complex logic.
- For inline styles try to use const functions.
- If views are deeply nested or complex, consider extracting them into separate const functions.

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
  * Add a brief description of the component here.
**/
function Component(props: ComponentProps) {
  // Use the app hook to get the theme and styles and context
  const { styles, theme, locales } = useApp(theme => useStyles(theme))

  const deeplyNestedView = () => {
    // This function can be used to render deeply nested views
    return <View style={styles.nestedView}></View>
  }

  return (<View>{deeplyNestedView()}</View>)
}

const useStyles = createThemedStyles(theme => ({
  ...
}))

export default Component
```

# React Native Hook Development Guidelines
- Hooks should be written in TypeScript and use React Native.
- Hooks should be functional hooks.
- Hooks should be used for complex logic, not for every component.
- Keep it simple
- Organize code logically: Props extraction → State → Effects → Helpers → Event handlers → Return
- Use direct constants instead of config objects for magic numbers and strings.
- Check if useCallback or useMemo can be used to optimize performance. (But be careful, only if important!)
