# Design System Naming Cheat Sheet

> **Scope:** Naming conventions & structural rules
> **Out of scope:** Visual style, layout rules, colors, typography


---



---

## 1. Component Hierarchy

Use a **clear structural hierarchy**. Prefer **composition over inheritance**.

### Levels

```text
Primitive (Atom)
└── Component (Molecule)
    └── Composite (Organism)
        └── View
            └── Page / Screen
```

## 2. Component Naming Rules

### General Rules

* Use **PascalCase** for components
* Use **singular nouns**
* Avoid visual or stylistic terms
* Name by **responsibility**, not appearance

### Good

```text
Button
IconButton
ListItem
CardHeader
FormField
ResourceList
PageHeader
```

### Avoid

```text
BlueButton
RoundedCard
BigList
FancyHeader
```

---

## 4. Variants

Variants describe **intent**, not style.

### Common Variant Names

```text
primary
secondary
tertiary
danger
warning
success
ghost
```

### Component-Specific Variants

```text
Button:
- solid
- outline
- ghost

Alert:
- info
- success
- warning
- error
```

---

## 5. Sizes

Use a **small, consistent scale**.

```text
xs
sm
md
lg
xl
```

### Usage

```text
Button size="sm"
Input size="md"
```

---

## 6. States

States are **explicit and universal**.

```text
default
hover
active
focus
disabled
loading
error
success
```

### Rule

> Every interactive component MUST define all applicable states.

---

## 7. Spacing & Sizing Tokens

Never use raw values.
Always use **design tokens**.

### Spacing Tokens

```text
space-0
space-xs
space-sm
space-md
space-lg
space-xl
```

or numeric scale:

```text
space-1
space-2
space-3
space-4
space-5
```

### Usage

```text
padding: space-md
margin-bottom: space-sm
gap: space-lg
```

---

## 8. Design Tokens (General Pattern)

Use **semantic tokens**, not visual ones.

```text
color-background-default
color-background-surface
color-text-primary
color-text-secondary

radius-sm
radius-md
radius-lg

elevation-1
elevation-2
```

---

## 9. Component API Shape (Developer Mental Model)

Components behave like APIs.

### Example

```text
Button
├── variant
├── size
├── icon
├── state
└── disabled
```

```jsx
<Button
  variant="primary"
  size="md"
  disabled
/>
```

---

## 10. View vs Page vs Screen

### View

* Logical UI composition
* Reusable
* No routing responsibility

```text
UserListView
SettingsView
```

### Page / Screen

* Route-aware
* Application-level concern

```text
UserListPage
SettingsScreen
```

---

## 11. Anti-Patterns

❌ Encoding layout into names

```text
TwoColumnCard
LeftSidebarView
```

❌ Encoding platform or framework

```text
ReactButton
MobileCard
```

❌ Encoding visuals

```text
ShadowCard
RoundedButton
```

---

## 12. Reference Design Systems (Conceptual)

* Material Design
* Carbon Design System
* Polaris (Shopify)
* Atlassian Design System

Use them as **language references**, not style templates.

---

## 13. Core Principle (Summary)

> **Name things by responsibility, intent, and behavior – never by appearance.**
