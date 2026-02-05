import { getAppContext } from '@app/appContext'
import { InlineEditor } from '@app/shared/components/form/InlineEditor'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { logger } from '@app/shared/utils/logger'
import React from 'react'
import { useAccountData } from '../stores/accountStore'

interface DescriptionEditorProps {
  onSubmit: () => void
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ onSubmit }) => {
  const { account } = useAccountData()
  const { accountApplication } = getAppContext()
  const { t } = useLocalizationStore()

  const handleSave = async (value: string) => {
    try {
      const result = await accountApplication.updateAccount({ description: value })
      if (result.success) {
        logger.log('Description updated successfully')
        onSubmit()
      } else {
        logger.error('Failed to update description:', result.error)
      }
    } catch (error) {
      logger.error('Error updating description:', error)
    }
  }

  return (
    <InlineEditor
      value={account?.description || ''}
      onSubmit={handleSave}
      placeholder={t.account.addDescription}
      multiline
      maxLength={200}
    />
  )
}
