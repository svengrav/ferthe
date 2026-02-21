import { StyleSheet } from 'react-native'

import { Theme, useTheme } from '@app/shared/theme'
import Button from '../button/Button'
import Stack from '../stack/Stack'

interface StepIndicatorProps<T extends string> {
  steps: T[]
  currentIndex: number
  labels: Record<T, string>
  isFirstStep: boolean
  isLastStep: boolean
  onBack?: () => void
  onForward?: () => void
  onStepPress?: (step: T) => void
}

/**
 * Horizontal step indicator with back/forward arrows and labeled step buttons.
 * Completed and active steps are highlighted; future steps are dimmed.
 */
function StepIndicator<T extends string>(props: StepIndicatorProps<T>) {
  const { steps, currentIndex, labels, isFirstStep, isLastStep, onBack, onForward, onStepPress } = props
  const { styles } = useTheme(createStyles)

  return (
    <Stack direction="horizontal" spacing="lg" style={styles.container}>
      <Button
        icon="arrow-back"
        dense
        variant="outlined"
        style={{ opacity: isFirstStep ? 0.4 : 1 }}
        disabled={isFirstStep}
        onPress={onBack}
      />

      {steps.map((step, index) => (
        <Button
          key={step}
          variant="outlined"
          style={[styles.step, index <= currentIndex && styles.stepActive]}
          onPress={() => onStepPress?.(step)}
          label={labels[step]}
        />
      ))}

      <Button
        icon="arrow-forward"
        dense
        variant="outlined"
        style={{ opacity: isLastStep ? 0.4 : 1 }}
        disabled={isLastStep}
        onPress={onForward}
      />
    </Stack>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.tokens.spacing.md,
  },
  step: {
    alignItems: 'center',
    opacity: 0.4,
  },
  stepActive: {
    opacity: 1,
  },
})

export default StepIndicator
