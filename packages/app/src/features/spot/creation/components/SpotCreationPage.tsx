import { useRef, useState } from 'react'
import { StyleSheet } from 'react-native'

import { getDeviceLocation } from '@app/features/sensor'
import { getTrailSpotIds } from '@app/features/trail'
import { Button, Page, Stack, StepIndicator, Text } from '@app/shared/components'
import { setNotification } from '@app/shared/components/notification/Notification'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useStepNavigation } from '@app/shared/hooks/useStepNavigation'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Spot } from '@shared/contracts'
import { SpotContentFormValues, SpotOptionsFormValues } from '../services/spotFormSchema'
import { buildCreateRequest, buildUpdateRequest, getSpotTrailIds } from '../services/spotFormService'
import SpotConsentForm from './SpotConsentForm'
import SpotContentForm from './SpotContentForm'
import SpotOptionsForm from './SpotOptionsForm'

type SpotFormStep = 'content' | 'options' | 'consent'

const CREATE_STEPS: SpotFormStep[] = ['content', 'options', 'consent']
const EDIT_STEPS: SpotFormStep[] = ['content', 'options']

const CREATE_OVERLAY_KEY = 'spot-creation'

export const useCreateSpotPage = () => ({
  showCreateSpotPage: () =>
    setOverlay(CREATE_OVERLAY_KEY, <SpotFormPage onClose={() => closeOverlay(CREATE_OVERLAY_KEY)} />),
  closeCreateSpotPage: () => closeOverlay(CREATE_OVERLAY_KEY),
})

export const useEditSpotPage = () => ({
  showEditSpotPage: (spot: Spot) => {
    const overlayId = `spot-edit-${spot.id}`
    return setOverlay(
      overlayId,
      <SpotFormPage spot={spot} onClose={() => closeOverlay(overlayId)} />
    )
  },
  closeEditSpotPage: (spotId: string) => closeOverlay(`spot-edit-${spotId}`),
})

interface SpotFormPageProps {
  /** Pass a spot to enter edit mode. Omit for create mode. */
  spot?: Spot
  onClose: () => void
}

/**
 * Multi-step spot form for create and edit.
 * Create: Content → Options → Consent → Submit
 * Edit:   Content → Options → Submit (no consent)
 *
 * Each step uses its own Form + zod schema for validation.
 * Navigation/submit logic lives here; field logic is in step components.
 */
function SpotFormPage(props: SpotFormPageProps) {
  const { spot, onClose } = props
  const isEditMode = !!spot
  const context = getAppContextStore()

  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)
  const { convertToBase64 } = useImageToBase64()
  const nav = useStepNavigation(isEditMode ? EDIT_STEPS : CREATE_STEPS)

  // Collected data from completed steps
  const [contentData, setContentData] = useState<SpotContentFormValues | null>(null)
  const [optionsData, setOptionsData] = useState<SpotOptionsFormValues | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  // Refs to trigger form submission from outside (StepIndicator forward/step press)
  const contentSubmitRef = useRef<(() => void) | undefined>(undefined)
  const optionsSubmitRef = useRef<(() => void) | undefined>(undefined)

  const triggerCurrentStepSubmit = () => {
    if (nav.currentStep === 'content') contentSubmitRef.current?.()
    else if (nav.currentStep === 'options') optionsSubmitRef.current?.()
  }

  const handleStepPress = (step: SpotFormStep) => {
    const targetIndex = (isEditMode ? EDIT_STEPS : CREATE_STEPS).indexOf(step)
    if (targetIndex < nav.stepIndex) nav.goToStep(step)
    else if (targetIndex > nav.stepIndex) triggerCurrentStepSubmit()
  }

  // Consent state — single confirm checkbox
  const [consent, setConsent] = useState(false)

  // --- Default values ---

  const contentDefaults: SpotContentFormValues = {
    name: spot?.name ?? '',
    description: spot?.description ?? '',
    imageBase64: spot?.image?.url,
    contentBlocks: spot?.contentBlocks ?? [],
  }

  const optionsDefaults: SpotOptionsFormValues = {
    visibility: spot?.options.visibility ?? 'preview',
    trailIds: spot ? getSpotTrailIds(spot.id, getTrailSpotIds()) : [],
  }

  // Use last-confirmed data when re-entering a step, or defaults on first visit
  const currentContentValues = contentData ?? contentDefaults
  const currentOptionsValues = optionsData ?? optionsDefaults

  const stepLabels: Record<SpotFormStep, string> = {
    content: locales.spotCreation.stepContent,
    options: locales.spotCreation.stepOptions,
    consent: locales.spotCreation.stepConsent,
  }

  // --- Step completion handlers ---

  const handleContentComplete = (data: SpotContentFormValues) => {
    setContentData(data)
    setError(undefined)
    nav.goNext()
  }

  const handleOptionsComplete = async (data: SpotOptionsFormValues) => {
    setOptionsData(data)
    setError(undefined)

    if (isEditMode) {
      await handleEditSubmit(contentData ?? contentDefaults, data)
    } else {
      nav.goNext()
    }
  }

  // --- Submit handlers ---

  const handleCreateSubmit = async () => {
    const content = contentData ?? contentDefaults
    const options = optionsData ?? optionsDefaults

    setIsSubmitting(true)
    setError(undefined)

    try {
      const device = getDeviceLocation()
      if (!device.location || (device.location.lat === 0 && device.location.lon === 0)) {
        setError(locales.spotCreation.locationRequired)
        setIsSubmitting(false)
        return
      }

      let imageBase64: string | undefined
      if (content.imageBase64) {
        imageBase64 = await convertToBase64(content.imageBase64)
      }

      // Convert content block image local URIs to base64
      const processedBlocks = await Promise.all(
        content.contentBlocks.map(async block => {
          if (block.type === 'image' && block.data.imageUrl && !block.data.imageUrl.startsWith('http')) {
            const base64 = await convertToBase64(block.data.imageUrl)
            return { ...block, data: { ...block.data, imageUrl: base64 } }
          }
          return block
        })
      )

      const request = buildCreateRequest({ ...content, contentBlocks: processedBlocks }, options, device.location, imageBase64)
      const result = await context.spotApplication.createSpot(request)

      if (result.success) {
        setNotification(locales.spotCreation.created, '')
        onClose()
      } else {
        setError(result.error?.message ?? locales.spotCreation.error)
      }
    } catch {
      setError(locales.spotCreation.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (content: SpotContentFormValues, options: SpotOptionsFormValues) => {
    if (!spot) return
    setIsSubmitting(true)
    setError(undefined)

    try {
      let imageBase64: string | undefined
      if (content.imageBase64 && content.imageBase64 !== spot.image?.url) {
        imageBase64 = await convertToBase64(content.imageBase64)
      }

      // Convert content block image local URIs to base64
      const processedBlocks = await Promise.all(
        content.contentBlocks.map(async block => {
          if (block.type === 'image' && block.data.imageUrl && !block.data.imageUrl.startsWith('http')) {
            const base64 = await convertToBase64(block.data.imageUrl)
            return { ...block, data: { ...block.data, imageUrl: base64 } }
          }
          return block
        })
      )

      const updates = buildUpdateRequest({ ...content, contentBlocks: processedBlocks }, options, spot, imageBase64)

      if (!updates) {
        onClose()
        return
      }

      const result = await context.spotApplication.updateSpot(spot.id, updates)

      if (result.success) {
        onClose()
      } else {
        setError(result.error?.message ?? locales.spotCreation.error)
      }
    } catch {
      setError(locales.spotCreation.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Page
      title={isEditMode ? locales.spotCreation.editTitle : locales.spotCreation.title}
      leading={
        <Button
          icon={nav.isFirstStep ? "close" : "arrow-back"}
          variant="outlined"
          onPress={nav.isFirstStep ? onClose : nav.goBack}
        />
      }
      scrollable
    >

      <StepIndicator
        steps={nav.steps}
        currentIndex={nav.stepIndex}
        labels={stepLabels}
        isFirstStep={nav.isFirstStep}
        isLastStep={nav.isLastStep}
        onBack={nav.isFirstStep ? undefined : nav.goBack}
        onForward={nav.isLastStep ? undefined : triggerCurrentStepSubmit}
        onStepPress={handleStepPress}
      />


      {/* Step content */}
      <Stack spacing="lg">
        {nav.currentStep === 'content' && (
          <SpotContentForm
            defaultValues={currentContentValues}
            onSubmit={handleContentComplete}
            submitRef={contentSubmitRef}
          />
        )}

        {nav.currentStep === 'options' && (
          <SpotOptionsForm
            defaultValues={currentOptionsValues}
            onSubmit={handleOptionsComplete}
            submitRef={optionsSubmitRef}
          />
        )}

        {nav.currentStep === 'consent' && (
          <SpotConsentForm
            consent={consent}
            onConsentChange={setConsent}
            onSubmit={handleCreateSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {isEditMode && nav.isLastStep && (
          <Button
            label={isSubmitting ? locales.spotCreation.creating : locales.common.save}
            variant="primary"
            onPress={triggerCurrentStepSubmit}
            disabled={isSubmitting}
          />
        )}

        {error && <Text variant="caption" style={styles.error}>{error}</Text>}
      </Stack>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  error: {
    color: theme.colors.error,
  },
})

export default SpotFormPage
