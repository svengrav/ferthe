import { getDeviceLocation } from '@app/features/sensor'
import settingsStore, { useOnboardingFlag } from '@app/features/settings/stores/settingsStore'
import { Button, FertheLogo, Stack, Text } from '@app/shared/components'
import { useStepNavigation } from '@app/shared/hooks'
import { closeOverlay, OverlayCard, OverlayContainer, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccount } from '../stores/accountStore'

const ONBOARDING_KEY = 'onboarding'

interface OnboardingSlide {
  title: string
  description: string
}

// Slide content — extend here as needed
const SLIDES: OnboardingSlide[] = [
  {
    title: 'Willkommen bei ferthe',
    description: 'Du nutzt eine frühe Version von Ferthe, daher kann es noch zu Fehlern kommen. Neuigkeiten und Feedback findest du auf ferthe.de.',
  },
  {
    title: 'Trails erkunden',
    description: 'Starte einen Trail und entdecke Spot für Spot neue Inhalte in deiner Umgebung.',
  }
]

interface AccountOnboardingScreenProps {
  onDone: () => void
}

/**
 * Fullscreen onboarding flow shown once on first app launch.
 * Slides are defined in SLIDES — add new entries to extend.
 */
function AccountOnboarding({ onDone }: AccountOnboardingScreenProps) {
  const { styles, theme } = useTheme(useStyles)
  const insets = useSafeAreaInsets()
  const { currentStep, stepIndex, isLastStep, goNext } = useStepNavigation(SLIDES)

  const handleNext = () => {
    if (isLastStep) {
      onDone()
    } else {
      goNext()
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={{ gap: 20, justifyContent: 'center' }}>
        <View style={styles.logoArea}>
          <FertheLogo style={styles.logo} fill={theme.colors.primary} />
        </View>

        <Stack style={styles.content} spacing='lg'>
          <Text variant='heading' align='center'>{currentStep.title}</Text>
          <Text variant='body' align='center'>{currentStep.description}</Text>
        </Stack>

        <View style={styles.footer}>
          {/* Step dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Button
            label={isLastStep ? 'Los geht\'s' : 'Weiter'}
            variant='primary'
            onPress={handleNext}
          />
        </View>
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.opacity(theme.colors.background, 0.98),
    paddingHorizontal: theme.tokens.inset.lg,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: theme.tokens.spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: theme.tokens.spacing.md,
    paddingBottom: theme.tokens.spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.tokens.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.disabled,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 20,
  },
}))

/**
 * Shows the onboarding overlay if the user hasn't seen it yet.
 * Safe to call outside React components (uses store directly).
 */
export function showOnboardingIfNeeded() {
  const { settings, setFlag } = settingsStore.getState()
  if (settings.flags?.hasSeenOnboarding) return

  const handleDone = () => {
    setFlag({ hasSeenOnboarding: true })
    closeOverlay(ONBOARDING_KEY)
    triggerWelcomeDiscovery()
  }

  setOverlay(ONBOARDING_KEY, <OverlayContainer><OverlayCard><AccountOnboarding onDone={handleDone} /></OverlayCard></OverlayContainer>, { showBackdrop: false })
}

export function useAccountOnboarding() {
  const { hasSeenOnboarding } = useOnboardingFlag()
  const account = useAccount()

  useEffect(() => {
    if (!account) return
    if (hasSeenOnboarding) return

    showOnboardingIfNeeded()
  }, [account, hasSeenOnboarding])
}

/**
 * Fires a welcome discovery at the user's current GPS location.
 * Waits for first valid fix, then calls the backend to persist spot + discovery.
 */
function triggerWelcomeDiscovery() {
  const { sensorApplication, discoveryApplication } = getAppContextStore()

  const doCreate = (location: { lat: number; lon: number }) => {
    discoveryApplication.createWelcomeDiscovery(location).catch(err =>
      logger.error('triggerWelcomeDiscovery: createWelcomeDiscovery failed', err)
    )
  }

  // Use current location directly if already valid, otherwise wait for next update
  const current = getDeviceLocation()
  if (current.location.lat !== 0 || current.location.lon !== 0) {
    doCreate(current.location)
    return
  }

  const unsubscribe = sensorApplication.onDeviceUpdate(device => {
    if (device.location.lat !== 0 || device.location.lon !== 0) {
      unsubscribe()
      doCreate(device.location)
    }
  })
}

export default AccountOnboarding
