import { useState } from 'react'

export type SpotFormStep = 'content' | 'options' | 'consent'

/** Manages step navigation for the multi-step spot form. */
export function useSpotFormNavigation(isEditMode: boolean) {
  const steps: SpotFormStep[] = isEditMode
    ? ['content', 'options']
    : ['content', 'options', 'consent']

  const [currentStep, setCurrentStep] = useState<SpotFormStep>('content')

  const stepIndex = steps.indexOf(currentStep)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const goNext = () => {
    if (!isLastStep) setCurrentStep(steps[stepIndex + 1])
  }

  const goBack = () => {
    if (!isFirstStep) setCurrentStep(steps[stepIndex - 1])
  }

  /** Navigate to a previous step. Forward jumps are ignored (use Next button). */
  const goToStep = (step: SpotFormStep) => {
    const targetIndex = steps.indexOf(step)
    if (targetIndex < stepIndex) setCurrentStep(step)
  }

  return { currentStep, stepIndex, steps, isFirstStep, isLastStep, goNext, goBack, goToStep }
}
