import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { getSensorDevice } from '@app/features/sensor/stores/sensorStore'
import { trailStore } from '@app/features/trail/stores/trailStore'
import { Button, Page, Stack, Text } from '@app/shared/components'
import { useImageToBase64 } from '@app/shared/hooks/useImageToBase64'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { ContentBlock, CreateSpotRequest, Spot, SpotContent, SpotVisibility, UpdateSpotRequest } from '@shared/contracts'
import SpotConsentForm from './SpotConsentForm'
import SpotContentForm from './SpotContentForm'
import SpotOptionsForm from './SpotOptionsForm'

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

type Step = 'content' | 'options' | 'consent'

/**
 * Unified multi-step spot form for create and edit.
 * Create: Content → Options → Consent → Submit
 * Edit:   Content → Options → Submit (no consent)
 */
function SpotFormPage(props: SpotFormPageProps) {
  const { spot, onClose } = props
  const isEditMode = !!spot

  const { locales, context } = useApp()
  const { styles } = useTheme(createStyles)
  const { convertToBase64 } = useImageToBase64()

  // Steps depend on mode
  const steps: Step[] = isEditMode
    ? ['content', 'options']
    : ['content', 'options', 'consent']

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('content')

  // Form state
  const [content, setContent] = useState<SpotContent>(
    spot
      ? { name: spot.name, description: spot.description }
      : { name: '', description: '' }
  )
  const [visibility, setVisibility] = useState<SpotVisibility>(
    spot?.options.visibility ?? 'preview'
  )
  const [selectedTrailIds, setSelectedTrailIds] = useState<string[]>([])
  const [consent, setConsent] = useState({
    permission: false,
    copyright: false,
    appropriate: false,
    privacy: false,
    responsibility: false,
  })
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    spot?.contentBlocks ?? []
  )

  // Load trail IDs for this spot from store (edit mode)
  useEffect(() => {
    if (!spot) return

    const trailSpotIds = trailStore.getState().trailSpotIds
    const spotTrailIds: string[] = []

    for (const [trailId, spotIds] of Object.entries(trailSpotIds)) {
      if (spotIds.includes(spot.id)) {
        spotTrailIds.push(trailId)
      }
    }

    setSelectedTrailIds(spotTrailIds)
  }, [spot?.id])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const stepIndex = steps.indexOf(currentStep)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const stepLabels: Record<Step, string> = {
    content: locales.spotCreation.stepContent,
    options: locales.spotCreation.stepOptions,
    consent: locales.spotCreation.stepConsent,
  }

  const canProceed = (): boolean => {
    if (currentStep === 'content') return content.name.trim().length > 0
    if (currentStep === 'options') return true
    return false
  }

  const goNext = () => {
    if (!isLastStep) setCurrentStep(steps[stepIndex + 1])
  }

  const goBack = () => {
    if (!isFirstStep) setCurrentStep(steps[stepIndex - 1])
  }

  const goToStep = (step: Step) => {
    setCurrentStep(step)
  }

  // --- Submit handlers ---

  const handleCreateSubmit = async () => {
    setIsSubmitting(true)
    setError(undefined)

    try {
      const device = getSensorDevice()
      if (!device.location || (device.location.lat === 0 && device.location.lon === 0)) {
        setError(locales.spotCreation.locationRequired)
        setIsSubmitting(false)
        return
      }

      let imageBase64: string | undefined
      if (content.imageBase64) {
        imageBase64 = await convertToBase64(content.imageBase64)
      }

      const request: CreateSpotRequest = {
        content: {
          name: content.name.trim(),
          description: content.description.trim(),
          imageBase64,
        },
        location: device.location,
        visibility,
        trailIds: selectedTrailIds.length > 0 ? selectedTrailIds : undefined,
        consent: true,
      }

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

  const handleEditSubmit = async () => {
    if (!spot) return
    setIsSubmitting(true)
    setError(undefined)

    try {
      let imageBase64: string | undefined
      if (content.imageBase64 && content.imageBase64 !== spot.image?.url) {
        imageBase64 = await convertToBase64(content.imageBase64)
      }

      const updates: UpdateSpotRequest = {
        content: {
          name: content.name.trim() !== spot.name ? content.name.trim() : undefined,
          description: content.description.trim() !== spot.description ? content.description.trim() : undefined,
          imageBase64,
        },
        visibility: visibility !== spot.options.visibility ? visibility : undefined,
        trailIds: selectedTrailIds,
      }

      if (!updates.content?.name && !updates.content?.description && !updates.content?.imageBase64 && !updates.visibility) {
        delete updates.content
        delete updates.visibility
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

  const handleSubmit = isEditMode ? handleEditSubmit : handleCreateSubmit

  // --- Navigation footer ---

  const renderNavigation = () => {
    // Consent step has its own submit button
    if (currentStep === 'consent') return null

    // Last step in edit mode → show save button
    if (isLastStep && isEditMode) {
      return (
        <View style={styles.navigation}>
          <Button
            label={locales.common.save}
            variant="primary"
            onPress={handleSubmit}
            disabled={isSubmitting || !canProceed()}
          />
        </View>
      )
    }

    // Not last step → show next button
    if (!isLastStep) {
      return (
        <View style={styles.navigation}>
          <Button
            label={locales.common.next}
            variant="primary"
            onPress={goNext}
            disabled={!canProceed()}
          />
        </View>
      )
    }

    return null
  }

  return (
    <Page
      title={isEditMode ? locales.spotCreation.editTitle : locales.spotCreation.title}
      leading={
        <Button
          icon={isFirstStep ? "close" : "arrow-back"}
          variant="outlined"
          onPress={isFirstStep ? onClose : goBack}
        />
      }
      scrollable
    >
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {steps.map((step, i) => (
          <Pressable
            key={step}
            style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}
            onPress={() => goToStep(step)}
          >
            <Text variant="caption" style={i <= stepIndex ? styles.stepTextActive : undefined}>
              {stepLabels[step]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Step content */}
      <Stack spacing="lg">
        {currentStep === 'content' && (
          <SpotContentForm
            value={content}
            onChange={setContent}
            contentBlocks={contentBlocks}
            onContentBlocksChange={setContentBlocks}
          />
        )}

        {currentStep === 'options' && (
          <SpotOptionsForm
            visibility={visibility}
            selectedTrailIds={selectedTrailIds}
            onVisibilityChange={setVisibility}
            onTrailIdsChange={setSelectedTrailIds}
          />
        )}

        {currentStep === 'consent' && (
          <SpotConsentForm
            consent={consent}
            onConsentChange={setConsent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {error && <Text variant="caption" style={styles.error}>{error}</Text>}

        {renderNavigation()}
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
  navigation: {
    paddingTop: theme.tokens.spacing.md,
  },
  error: {
    color: theme.colors.error,
  },
})

export default SpotFormPage
