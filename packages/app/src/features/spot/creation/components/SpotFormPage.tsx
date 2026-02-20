import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { getDeviceLocation } from '@app/features/sensor/stores/sensorStore'
import { trailStore } from '@app/features/trail/stores/trailStore'
import { Button, Page, Stack, Text } from '@app/shared/components'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { Spot } from '@shared/contracts'
import SpotConsentForm from './SpotConsentForm'
import SpotContentForm from './SpotContentForm'
import SpotOptionsForm from './SpotOptionsForm'
import { SpotContentFormValues, SpotOptionsFormValues } from '../services/spotFormSchema'
import { buildCreateRequest, buildUpdateRequest, getSpotTrailIds } from '../services/spotFormService'
import { SpotFormStep, useSpotFormNavigation } from '../hooks/useSpotFormNavigation'

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

  const { locales, context } = useApp()
  const { styles } = useTheme(createStyles)
  const { convertToBase64 } = useImageToBase64()
  const nav = useSpotFormNavigation(isEditMode)

  // Collected data from completed steps
  const [contentData, setContentData] = useState<SpotContentFormValues | null>(null)
  const [optionsData, setOptionsData] = useState<SpotOptionsFormValues | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  // Consent state (not form-managed — simple checkboxes)
  const [consent, setConsent] = useState({
    permission: false,
    copyright: false,
    appropriate: false,
    privacy: false,
    responsibility: false,
  })

  // --- Default values ---

  const contentDefaults = useMemo<SpotContentFormValues>(() => ({
    name: spot?.name ?? '',
    description: spot?.description ?? '',
    imageBase64: spot?.image?.url,
    contentBlocks: spot?.contentBlocks ?? [],
  }), [spot])

  const optionsDefaults = useMemo<SpotOptionsFormValues>(() => ({
    visibility: spot?.options.visibility ?? 'preview',
    trailIds: spot ? getSpotTrailIds(spot.id, trailStore.getState().trailSpotIds) : [],
  }), [spot])

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

      const request = buildCreateRequest(content, options, device.location, imageBase64)
      const result = await context.spotApplication.createSpot(request)

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

  const handleEditSubmit = async (content: SpotContentFormValues, options: SpotOptionsFormValues) => {
    if (!spot) return
    setIsSubmitting(true)
    setError(undefined)

    try {
      let imageBase64: string | undefined
      if (content.imageBase64 && content.imageBase64 !== spot.image?.url) {
        imageBase64 = await convertToBase64(content.imageBase64)
      }

      const updates = buildUpdateRequest(content, options, spot, imageBase64)

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

  // --- Submit label per step ---

  const getSubmitLabel = (): string => {
    if (nav.currentStep === 'options' && isEditMode) return locales.common.save
    return locales.common.next
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
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {nav.steps.map((step, i) => (
          <Pressable
            key={step}
            style={[styles.stepDot, i <= nav.stepIndex && styles.stepDotActive]}
            onPress={() => nav.goToStep(step)}
          >
            <Text variant="caption" style={i <= nav.stepIndex ? styles.stepTextActive : undefined}>
              {stepLabels[step]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Step content */}
      <Stack spacing="lg">
        {nav.currentStep === 'content' && (
          <SpotContentForm
            defaultValues={currentContentValues}
            onSubmit={handleContentComplete}
            submitLabel={locales.common.next}
          />
        )}

        {nav.currentStep === 'options' && (
          <SpotOptionsForm
            defaultValues={currentOptionsValues}
            onSubmit={handleOptionsComplete}
            submitLabel={getSubmitLabel()}
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

        {error && <Text variant="caption" style={styles.error}>{error}</Text>}
      </Stack>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.tokens.spacing.lg,
    paddingVertical: theme.tokens.spacing.md,
  },
  stepDot: {
    alignItems: 'center',
    opacity: 0.4,
  },
  stepDotActive: {
    opacity: 1,
  },
  stepTextActive: {
    color: theme.colors.primary,
  },
  error: {
    color: theme.colors.error,
  },
})

export default SpotFormPage
