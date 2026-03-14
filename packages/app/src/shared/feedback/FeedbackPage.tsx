import { useState } from 'react'
import { ScrollView, View } from 'react-native'

import { useAccountId } from '@app/features/account'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import type { Theme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Button, Divider, Text } from '../components'
import TextInput from '../components/textInput/TextInput'
import { useLocalization } from '../localization'
import { closeOverlay, OverlayCard, setOverlay } from '../overlay'

type FeedbackType = 'other' | 'bug' | 'report' | 'feedback'
type Status = 'idle' | 'submitting' | 'success' | 'error'

interface FeedbackPageProps {
  onClose: () => void
}

const FEEDBACK_KEY = 'feedback'

export function useFeedbackPage() {
  const { locales } = useLocalization()
  const closeFeedback = () => closeOverlay(FEEDBACK_KEY)

  const showFeedback = () =>
    setOverlay(
      FEEDBACK_KEY,
      <OverlayCard title={locales.feedback.title} onClose={closeFeedback}>
        <FeedbackPage onClose={closeFeedback} />
      </OverlayCard>,
      { showBackdrop: true, closeOnBackdropPress: true },
    )

  return { showFeedback, closeFeedback, label: locales.feedback.title }
}


/**
 * Feedback form page, mirroring the web FeedbackForm.
 * Uses the shared api client from AppContext directly.
 */
function FeedbackPage({ onClose }: FeedbackPageProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const t = locales.feedback
  const accountId = useAccountId()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<FeedbackType>('other')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMessage(t.messageRequired)
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const { api } = getAppContextStore()
      const result = await api.content.submitFeedback({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        type,
        message: message.trim(),
        accountId,
      })

      if (!result.success) throw new Error(result.error?.message)

      setStatus('success')
      setTimeout(onClose, 2000)
    } catch (error) {
      logger.error('[FeedbackPage] Failed to submit feedback', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : t.errorMessage)
    }
  }

  if (status === 'success') {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successText}>{t.successMessage}</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Description */}
      <Text variant='body'>{t.description}</Text>
      <Divider />

      {/* Name */}
      <View style={styles.field}>
        <Text variant="label" style={styles.label}>{t.nameLabel} <Text style={styles.optional}>{t.optionalLabel}</Text></Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t.namePlaceholder}
          editable={status !== 'submitting'}
          autoCapitalize="words"
        />
      </View>

      {/* Email */}
      <View style={styles.field}>
        <Text variant="label" style={styles.label}>{t.emailLabel} <Text style={styles.optional}>{t.optionalLabel}</Text></Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t.emailPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={status !== 'submitting'}
        />
      </View>

      {/* Type toggle */}
      <View style={styles.field}>
        <Text variant="label" style={styles.label}>{t.typeLabel}</Text>
        <View style={styles.typeRow}>
          {([['feedback', t.typeFeedback], ['bug', t.typeBug], ['report', t.typeReport], ['other', t.typeGeneral]] as [FeedbackType, string][]).map(([option, label]) => (
            <Button
              key={option}
              label={label}
              variant={type === option ? 'primary' : 'outlined'}
              onPress={() => setType(option)}
              disabled={status === 'submitting'}
              style={styles.typeButton}
            />
          ))}
        </View>
      </View>

      {/* Message */}
      <View style={styles.field}>
        <Text variant="label" style={styles.label}>{t.messagePlaceholder} *</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t.messagePlaceholder}
          multiline
          editable={status !== 'submitting'}
          error={!!errorMessage}
        />
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Button
        label={status === 'submitting' ? t.submitting : t.submit}
        onPress={handleSubmit}
        disabled={status === 'submitting'}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const createStyles = createThemedStyles((theme: Theme) => ({
  container: {
    gap: theme.tokens.spacing.md,
  },
  field: {
    gap: theme.tokens.spacing.xs,
  },
  label: {
    color: theme.colors.onSurface,
  },
  optional: {
    color: theme.colors.onSurface ?? theme.colors.onBackground,
    fontWeight: 'normal',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.tokens.spacing.sm,
  },
  typeButton: {
    minWidth: '45%',
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.tokens.fontSize.sm,
  },
  submitButton: {
    marginTop: theme.tokens.spacing.sm,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.tokens.spacing.xl,
  },
  successText: {
    fontSize: theme.tokens.fontSize.lg,
    textAlign: 'center',
  },
}))

export default FeedbackPage
