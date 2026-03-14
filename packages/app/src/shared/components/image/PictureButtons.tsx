import { Theme, useTheme } from '@app/shared/theme'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Button from '../button/Button'

interface PictureButtonsProps {
  /** Called when the user wants to pick from gallery */
  onGallery: () => void
  /** Called when the user wants to take a photo */
  onCamera: () => void
  /** Called when the user wants to remove the current image. If omitted, the remove button is hidden. */
  onRemove?: () => void
  /** Optional style override for the row container */
  style?: StyleProp<ViewStyle>
}

/**
 * Standardized row of picture action buttons: gallery, camera, and (optionally) remove.
 * Use this wherever image pick/change/remove actions are needed to ensure consistent UX.
 */
function PictureButtons(props: PictureButtonsProps) {
  const { onGallery, onCamera, onRemove, style } = props
  const { styles } = useTheme(createStyles)

  return (
    <View style={[styles.row, style]}>
      <Button icon="image" variant="outlined" size="sm" onPress={onGallery} />
      <Button icon="camera" variant="outlined" size="sm" onPress={onCamera} />
      {onRemove && (
        <Button icon="close" variant="outlined" size="sm" onPress={onRemove} />
      )}
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.tokens.spacing.sm,
    },
  })

export default PictureButtons
