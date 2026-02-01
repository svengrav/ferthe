import { getAppContext } from '@app/appContext'
import { InlineEditor } from '@app/shared/components/form/InlineEditor'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { logger } from '@app/shared/utils/logger'
import React from 'react'
import { useAccountData } from '../stores/accountStore'

interface DisplayNameEditorProps {
  onSubmit: () => void
}

export const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({ onSubmit }) => {
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const { accountApplication } = getAppContext()

  const handleSave = async (value: string) => {
    try {
      const result = await accountApplication.updateAccount({ displayName: value })
      if (result.success) {
        logger.log('Display name updated successfully')
        onSubmit()
      } else {
        logger.error('Failed to update display name:', result.error)
      }
    } catch (error) {
      logger.error('Error updating display name:', error)
    }
  }

  return (
    <InlineEditor
      value={account?.displayName || ''}
      onSubmit={handleSave}
      placeholder={t.account.displayNamePlaceholder}
      validator={(value) => value.trim().length > 0}
    />
  )
}
