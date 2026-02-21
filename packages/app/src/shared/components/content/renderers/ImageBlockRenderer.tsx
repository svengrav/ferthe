import Stack from '@app/shared/components/stack/Stack'
import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import { ImageBlockData } from '@shared/contracts'
import { Image, StyleSheet } from 'react-native'

interface ImageBlockRendererProps {
  data: ImageBlockData
}

function ImageBlockRenderer(props: ImageBlockRendererProps) {
  const { data } = props
  const { styles } = useTheme(createStyles)

  return (
    <Stack spacing="xs">
      <Image source={{ uri: data.imageUrl }} style={styles.image} />
      {data.caption && <Text variant="caption">{data.caption}</Text>}
    </Stack>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.tokens.borderRadius.md,
  },
})

export default ImageBlockRenderer
