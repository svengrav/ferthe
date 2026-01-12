# Architecture for shared components

- Architecture for shared components should follow the principles of modularity, reusability, and simplicity. 
- Each component should be designed to be self-contained, with minimal dependencies on external state or logic. Components should use hooks for managing state and side effects, and they should be styled using a consistent theme.

```TypeScript
interface ComponentProps {
  ... 
}

const Component = ({ ... }: ComponentProps) => {
  const { t } = useLocalizationStore()
  const theme = useThemeStore()
  const styles = createStyles(theme)

  const handleButtonPress = () => {
    // Handle button press logic
  }

  return (
    <>...</>
  )
}

export default Component

const createStyles = (theme: Theme) =>
  StyleSheet.create({
   ...
  })

```