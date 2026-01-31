import React, { useEffect, useRef } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

type FlippableProps = {
  flipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  style?: ViewStyle
  onTap?: () => void
}

export const Flippable = ({ front, back, style, flipped, onTap }: FlippableProps) => {
  const rotation = useSharedValue(flipped ? 180 : 0)
  const didMount = useRef(false)
  const lastFlipped = useRef(flipped)

  useEffect(() => {
    // Mark mount done
    if (!didMount.current) {
      didMount.current = true
      lastFlipped.current = flipped
      rotation.value = flipped ? 180 : 0
      return
    }

    // Nur animieren, wenn sich flipped wirklich geändert hat
    if (lastFlipped.current === flipped) return
    lastFlipped.current = flipped

    rotation.value = withSpring(flipped ? 180 : 0, {
      damping: 100,
      stiffness: 100,
    })
  }, [flipped])

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180])
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
    }
  })

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360])
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
    }
  })

  return (
    <TouchableWithoutFeedback onPress={onTap}>
      <View style={[styles.container, style]}>
        <Animated.View
          pointerEvents={flipped ? 'none' : 'auto'}
          style={[styles.face, frontAnimatedStyle]}
        >
          {front}
        </Animated.View>

        <Animated.View
          pointerEvents={flipped ? 'auto' : 'none'}
          style={[styles.face, backAnimatedStyle]}
        >
          {back}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  face: { ...StyleSheet.absoluteFillObject, backfaceVisibility: 'hidden' },
})
