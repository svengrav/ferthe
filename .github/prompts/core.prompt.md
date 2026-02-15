---
name: core
agent: agent
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web']
description: This prompt is used to refactor code according to specified guidelines for React Native components and hooks.
---

# Introduction
- Firstly the code should be refactored to follow the guidelines.
- First thing to do ist to check, which code application, service, feature type it is and print it out. 

- The architecture is divided into three layers: Feature, Application, Service. 
- A application type should not use stores of a feature directly, instead it should use the feature service to interact with the feature.


## Architecture

- For Application Contract with **create<XYZ>** think about "objects" as input for functions instead of multiple parameters. This improves readability and allows easier extension in the future. 
  - Use input as object with named properties instead of multiple parameters.
  - Example: `createCommunity: (context: AccountContext, input: { name... })`