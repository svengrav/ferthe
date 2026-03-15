import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import type { AppUpdate } from '@shared/contracts'
import { Button, Divider, FertheLogo, Page, SectionHeader, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, OverlayCard, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

const OVERLAY_KEY = 'appUpdate'

export const useSystemUpdatePage = () => ({
  showUpdate: (update: AppUpdate, onClose?: () => void) => setOverlay(OVERLAY_KEY,
    <SystemUpdatePage update={update} onClose={onClose} />,
    { showBackdrop: true, closeOnBackdropPress: false },
  ),
  closeUpdate: () => closeOverlay(OVERLAY_KEY),
})

interface UpdatePageProps {
  update: AppUpdate
  onClose?: () => void
}

export function SystemUpdatePage({ update, onClose }: UpdatePageProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()

  const handleOpenStore = () => {
    if (update.storeUrl) {
      Linking.openURL(update.storeUrl)
    }
  }

  const hasPatchNotes = update.patchNotes && update.patchNotes.length > 0

  const renderPatchNotes = () => (
    <>

      {update.patchNotes?.map((note, i) => (
        <Text key={i} variant='body'>{'• '}{note}</Text>
      ))}
    </>
  )

  return (
    <Page>
      <Stack spacing="md">
        <Text variant="heading">{locales.system.update.title}</Text>
        <FertheLogo style={{ alignSelf: 'center' }} />
        {update.message && (
          <Text variant='body'>{update.message}</Text>
        )}
        <SectionHeader title={locales.system.update.latestChanges} />
        <View style={styles.textBox}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {hasPatchNotes && renderPatchNotes()}
          </ScrollView>
        </View>
        <Stack style={styles.actions}>
          {update.storeUrl && (
            <Button label={locales.system.update.action} onPress={handleOpenStore} />
          )}
          {!update.force && onClose && (
            <Button label={locales.system.update.dismiss} variant='outlined' onPress={onClose} />
          )}
        </Stack>
      </Stack>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  textBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.inset.md,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  actions: {
    marginTop: 8,
    gap: 8,
  },
})
