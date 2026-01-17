---
applyTo: '**/*.ts'
---

Coding standards, domain knowledge, and preferences that AI should follow.

# Project coding standards

## Architecture

- Try to be specific and generate minimal code
- Use functional programming principles where possible
- Avoid boilerplate code
- Simple and readable code is preferred over complex solutions
- Avoid over-engineering and bloating the code
- Use a modular architecture
- Separate logic from hooks and from components
- Design minimal components
- Services are always pure functions
- Applications are the connections between the UI, store and the services
- A component should use the application to set a state
- A component uses the store to get a state
- Use direct constants instead of config objects for simple values

## TypeScript Guidelines

- Avoid classes and prefer functional programming
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const)
- Use optional chaining (?.) and nullish coalescing (??) operators

## React Guidelines

- Use functional components
- Try to seperate logik from hooks and from componentes
- Follow the React hooks rules (no conditional hooks)
- Keep components small and focused

## Naming Conventions

- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Use ALL_CAPS for constants

## Error Handling

- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information
