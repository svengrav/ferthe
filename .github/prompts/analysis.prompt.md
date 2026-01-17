---
agent: agent
---

Analyse the code and architecture and provide feedback as markdown file.
Respect the scope, if the task is to analyse a specific package, only analyse that package.

## This applies to all packages
- Check for code quality, architecture, and design patterns.
- Identify potential issues or improvements.
- Provide suggestions for best practices.
- Check if:
  - Services are stateless and pure.
  - Code is modular and reusable.
  - Applications connect to external services, stores, and other applications.
  - Only Applications in a feature are allowed to use other applications.
  - Applications are using services for complex logic or to create data structures and state objects

## This applies to the app
- Ui components are using applications to request state updates.
- Components dont use stores directly. They may use getter methods to access state.

## Analysis Output
- Save the result in `.insights/analysis-{short-slug}-{date}.md`.
- Use markdown format.
- Use a list with headings for each section.
- Use bullet points for clarity.
- Use simple and clear language.
- Reduce the use of emojis.
