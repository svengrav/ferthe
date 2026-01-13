# Architecture

## Style Guide
- Use `undefined` over `null`.
- Use functional approach over classes.
- Try to encapsulate logic into pure functions and place it in services.
- Use application entry points to access features. Use applications as orchestrators to connect features.

## Package Architecture
- Packages use `context` source code files, which serve as centralized modules for accessing shared resources and configuring applications.

## Feature Architecture
- The packages are divided into features like 'trail', 'account' etc.
- Each feature is accessed through a application entry point by other applications.
- Features should try to hide their implementation details and only expose necessary interfaces.
- A feature is a core concept and comparable to a domain in DDD (Domain-Driven Design).
- In main packages like `app` or `core`, features are implemented as modules in their own folders.
- If a feature has a service, it should be placed in a `services` folder within the feature folder and only accessed by the feature application.
- Every feature has its own store, which is a centralized state management system for the feature.
- The application connects the store with the service and the feature.
- Features have their own contracts, which define the data types and processes shared between applications.

### Features in the API
- The `api` package is a separate package that contains the API layer for the application.
- It is used to expose the features of `core` to other applications or clients.
- The `api` package contains routes and API handlers for the main features.
- It should not contain any business logic or state management.
- The `api` package should only expose the necessary endpoints for the features.
- The `api` package should use the contracts defined in the `shared` package to ensure that the data types and processes are shared between applications.
- Try to minimize the number of endpoints and keep them as simple as possible.

### Features in the App
- The `app` package contains the application features.
- The features in the `app` package have their own components, services, and ui-stores (**Zustand**) that are used to manage the state of the feature. 
- Components are the UI elements that are used to display the feature, services are the business logic that is used to manage the feature, and ui-stores are the state management system that is used to manage the state of the feature.
- Other features should not access the components, services, or ui-stores of different features directly. Instead, they should use the feature's public API to access the data and processes of the feature.

## Configuration
- Configuration should be close to the root level (`.` or `src`) of a package
- Use `.env` and `env.ts` for setup configuration
- Use index files and place package configuration and setup in the package src folder if possible
- Use a `context` file to centralize the configuration and all internal resources of the package

## Contracts
Shared package contains contracts that define which data and processes are shared between applications.
- Usaly a contract is bound to a feature, but can also be used for shared data types

### Implementation
- Contracts define interfaces and data types for exchange between application contexts
- Data types and processes must be shared for reusability
- API layer is generated based on contracts
- Behavioral contracts are encapsulated for security
- Core can extend contract interfaces internally without affecting shared contracts
- Contracts contain only data that can be shared with all packages ❗
- Packages extend contracts internally when needed

## Shared Resources
- Shared resources are used to access common resources like contract interfaces, utilities, and other shared data types.
- Shared resources are placed in the `shared` package.
- Shared resources should be used to access common resources and should not contain any business logic or state management.
- **Be aware: Shared is used by the app package and therefore should not contain any security-sensitive data.**

## Testing
- Tests are centralized in the `tests` package.
- Tests should be written in a way, that the can run independently of the react app.
- You dont need to test the react app, but the features and their contracts.
- Try to implement integration tests and try to avoid unit tests. 
- Try to test a whole workflow of a feature, not just single functions.