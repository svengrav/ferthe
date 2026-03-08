import { useRef, useState } from 'react'
import { StyleSheet } from 'react-native'

import { getDeviceLocation } from '@app/features/sensor'
import { getTrailSpotIds } from '@app/features/trail'
import { Button, Page, showSnackbar, Stack, StepIndicator, Text } from '@app/shared/components'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { useStepNavigation } from '@app/shared/hooks/useStepNavigation'
import { closeOverlay, OverlayCard, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { GeoLocation } from '@shared/geo'
import { Spot } from '@shared/contracts'
import { SpotContentFormValues, SpotOptionsFormValues } from '../services/spotFormSchema'
import { buildCreateRequest, buildUpdateRequest, getSpotTrailIds } from '../services/spotFormService'
import SpotConsentForm from './SpotConsentForm'
import SpotContentForm from './SpotContentForm'
import SpotOptionsForm from './SpotOptionsForm'

type SpotFormStep = 'content' | 'options'

const CREATE_STEPS: SpotFormStep[] = ['content', 'options']
const EDIT_STEPS: SpotFormStep[] = ['content', 'options']

const CREATE_OVERLAY_KEY = 'spot-creation'
const CONSENT_OVERLAY_KEY = 'spot-creation-consent'

export const useCreateSpotPage = () => ({
  showCreateSpotPage: (initialLocation?: GeoLocation, options?: { initialTrailIds?: string[]; onSpotCreated?: (spot: Spot) => void }) =>
    setOverlay(CREATE_OVERLAY_KEY, <SpotFormPage
      initialLocation={initialLocation}
      initialTrailIds={options?.initialTrailIds}
      onSpotCreated={options?.onSpotCreated}
      onClose={() => closeOverlay(CREATE_OVERLAY_KEY)}
    />),
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
  /** Pre-fill location (e.g. from Stumble Mode). Skips GPS check when provided. */
  initialLocation?: GeoLocation
  /** Pre-select trails for the new spot (e.g. from Stumble Mode). */
  initialTrailIds?: string[]
  /** Called after successful creation with the new spot. */
  onSpotCreated?: (spot: Spot) => void
  onClose: () => void
}

/**
 * Multi-step spot form for create and edit.
 * Create: Content → (Options, optional) → Consent overlay → Submit
 *   - ✓ button skips Options and opens Consent directly from any step
 * Edit:   Content → Options → Submit (no consent)
 */
function SpotFormPage(props: SpotFormPageProps) {
  const { spot, initialLocation, initialTrailIds, onSpotCreated, onClose } = props
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

  // Refs to trigger form submission from outside
  const contentSubmitRef = useRef<(() => void) | undefined>(undefined)
  const optionsSubmitRef = useRef<(() => void) | undefined>(undefined)
  // When true, next step completion opens consent overlay instead of advancing
  const skipToConsentRef = useRef(false)

  const triggerCurrentStepSubmit = () => {
    if (nav.currentStep === 'content') contentSubmitRef.current?.()
    else if (nav.currentStep === 'options') optionsSubmitRef.current?.()
  }

  const handleConfirmPress = () => {
    skipToConsentRef.current = true
    triggerCurrentStepSubmit()
  }

  const handleStepPress = (step: SpotFormStep) => {
    const targetIndex = (isEditMode ? EDIT_STEPS : CREATE_STEPS).indexOf(step)
    if (targetIndex < nav.stepIndex) nav.goToStep(step)
    else if (targetIndex > nav.stepIndex) triggerCurrentStepSubmit()
  }

  const contentDefaults: SpotContentFormValues = {
    name: spot?.name ?? '',
    description: spot?.description ?? '',
    imageBase64: spot?.image?.url,
    contentBlocks: spot?.contentBlocks ?? [],
  }

  const optionsDefaults: SpotOptionsFormValues = {
    visibility: spot?.options.visibility ?? 'preview',
    trailIds: spot ? getSpotTrailIds(spot.id, getTrailSpotIds()) : (initialTrailIds ?? []),
  }

  // Use last-confirmed data when re-entering a step, or defaults on first visit
  const currentContentValues = contentData ?? contentDefaults
  const currentOptionsValues = optionsData ?? optionsDefaults

  const stepLabels: Record<SpotFormStep, string> = {
    content: locales.spotCreation.stepContent,
    options: locales.spotCreation.stepOptions,
  }

  // --- Step completion handlers ---

  const openConsentOverlay = (content: SpotContentFormValues, options: SpotOptionsFormValues) => {
    setOverlay(
      CONSENT_OVERLAY_KEY,
      <OverlayCard onClose={() => closeOverlay(CONSENT_OVERLAY_KEY)} title={locales.spotCreation.createSpot} >
        <SpotConsentOverlay
          onConfirm={async () => {
            closeOverlay(CONSENT_OVERLAY_KEY)
            await handleCreateSubmit(content, options)
          }}
        />
      </OverlayCard>
    )
  }

  const handleContentComplete = (data: SpotContentFormValues) => {
    setContentData(data)
    setError(undefined)
    if (skipToConsentRef.current) {
      skipToConsentRef.current = false
      openConsentOverlay(data, optionsData ?? optionsDefaults)
    } else {
      nav.goNext()
    }
  }

  const handleOptionsComplete = async (data: SpotOptionsFormValues) => {
    skipToConsentRef.current = false
    setOptionsData(data)
    setError(undefined)

    if (isEditMode) {
      await handleEditSubmit(contentData ?? contentDefaults, data)
    } else {
      openConsentOverlay(contentData ?? contentDefaults, data)
    }
  }

  // --- Submit handlers ---

  const handleCreateSubmit = async (content: SpotContentFormValues, options: SpotOptionsFormValues) => {

    setIsSubmitting(true)
    setError(undefined)

    try {
      const device = getDeviceLocation()
      const location = initialLocation ?? device.location

      if (!location || (location.lat === 0 && location.lon === 0)) {
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

      const request = buildCreateRequest({ ...content, contentBlocks: processedBlocks }, options, location, imageBase64)
      const result = await context.spotApplication.createSpot(request)

      if (result.success) {
        showSnackbar(locales.spotCreation.created)
        onSpotCreated?.(result.data!)
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
      keyboardAware
      leading={
        <Button
          icon={nav.isFirstStep ? "close" : "arrow-back"}
          variant="outlined"
          onPress={nav.isFirstStep ? onClose : nav.goBack}
        />
      }
      trailing={
        <Button icon='check' variant="primary" onPress={handleConfirmPress} disabled={isSubmitting} />
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

        {error && <Text variant="caption" style={styles.error}>{error}</Text>}
      </Stack>
    </Page>
  )
}

const createStyles = (_theme: Theme) => StyleSheet.create({
  error: {
    color: _theme.colors.error,
  },
})

export default SpotFormPage

// --- Consent overlay (self-contained, opened via overlay system) ---

interface SpotConsentOverlayProps {
  onConfirm: () => Promise<void>
}

function SpotConsentOverlay({ onConfirm }: SpotConsentOverlayProps) {
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onConfirm()
    setIsSubmitting(false)
  }

  return (
    <SpotConsentForm
      consent={consent}
      onConsentChange={setConsent}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
