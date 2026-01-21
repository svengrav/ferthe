import { getAppContext } from '@app/appContext'
import { Card, IconButton } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import React, { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { useAccountData } from '../stores/accountStore'

interface DisplayNameEditorProps { 
  onSubmit: () => void
}

export const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({ onSubmit }) => {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const { accountApplication } = getAppContext()
  const [displayName, setDisplayName] = useState(account?.displayName || '')
  const [isSaving, setIsSaving] = useState(false)
  const styles = createStyles(theme)

  const handleSave = async () => {
    if (!displayName.trim()) return

    setIsSaving(true)
    try {
      const result = await accountApplication.updateAccount({ displayName: displayName.trim() })
      if (result.success) {
        logger.log('Display name updated successfully')
        logger.error('Failed to update display name:', result.error)
      }
    } catch (error) {
      logger.error('Error updating display name:', error)
    }
            onSubmit()
    setIsSaving(false)
  }

  return (
    <Card style={styles.card}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t.account.displayNamePlaceholder}
          placeholderTextColor={theme.deriveColor(theme.colors.onSurface, 0.5)}
        />
        <IconButton
          name="check"
          onPress={handleSave}
          disabled={isSaving || !displayName.trim() || displayName === account?.displayName}
          variant="outlined"
        />
      </View>
    </Card>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: '100%',
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 8,
      padding: 8,
      fontSize: 16,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
  })
