import React from 'react'
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

type BlurableProps = {
  previewSource: any     // z. B. require(...) oder { uri: ... }
  source: any            // das "scharfe" Bild
  style?: ImageStyle     // Größe etc.
  containerStyle?: ViewStyle
  fadeDuration?: number  // ms
}

export const Blurable: React.FC<BlurableProps> = ({
  previewSource,
  source,
  style,
  containerStyle,
  fadeDuration = 400,
}) => {
  const opacity = useSharedValue(0)

  const onImageLoad = () => {
    opacity.value = withTiming(1, { duration: fadeDuration })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Blurred Vorschau */}
      <Image
        source={previewSource}
        style={[style, styles.absolute]}
        blurRadius={10}
        resizeMode="cover"
      />
      {/* Finale scharfe Version mit Fade */}
      <Animated.Image
        source={source}
        style={[
          style,
          styles.absolute,
          animatedStyle,
        ]}
        onLoad={onImageLoad}
        resizeMode="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  absolute: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
})
