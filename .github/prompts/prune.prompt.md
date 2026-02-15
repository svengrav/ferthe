---
agent: agent
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'agent']
---

Find any code that is unused or redundant in the provided codebase. Ensure that all imports, exports, functions, types, and variables are necessary for the functionality of the application. List all with the cmd **npx ts-prune --error** then check the code to confirm if they can be safely removed without affecting the application's behavior. Provide a summary of the findings. Dont remove any code yet, just provide the analysis.