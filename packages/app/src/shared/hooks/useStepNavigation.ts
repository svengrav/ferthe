import { useState } from 'react'

interface StepNavigation<T> {
  currentStep: T
  stepIndex: number
  steps: T[]
  isFirstStep: boolean
  isLastStep: boolean
  goNext: () => void
  goBack: () => void
  /** Navigate to a previously visited step. Forward jumps are ignored. */
  goToStep: (step: T) => void
}

/** Generic step navigation for multi-step flows. */
export function useStepNavigation<T>(steps: T[]): StepNavigation<T> {
  const [currentStep, setCurrentStep] = useState<T>(steps[0])

  const stepIndex = steps.indexOf(currentStep)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const goNext = () => {
    if (!isLastStep) setCurrentStep(steps[stepIndex + 1])
  }

  const goBack = () => {
    if (!isFirstStep) setCurrentStep(steps[stepIndex - 1])
  }

  const goToStep = (step: T) => {
    const targetIndex = steps.indexOf(step)
    if (targetIndex >= 0 && targetIndex < stepIndex) setCurrentStep(step)
  }

  return { currentStep, stepIndex, steps, isFirstStep, isLastStep, goNext, goBack, goToStep }
}
