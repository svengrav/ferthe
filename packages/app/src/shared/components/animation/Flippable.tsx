import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'

type FlippableProps = {
  flipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  style?: ViewStyle
  onTap?: () => void
}

export const Flippable = ({ front, back, style, flipped, onTap }: FlippableProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current

  const didMount = useRef(false)
  const lastFlipped = useRef(flipped)

  // Initialzustand: sofort setzen (keine Animation)
  if (!didMount.current) {
    animatedValue.setValue(flipped ? 180 : 0)
  }

  const frontRotate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  })

  const backRotate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  })

  const animateTo = (next: boolean) => {
    Animated.spring(animatedValue, {
      toValue: next ? 180 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start()
  }

  useEffect(() => {
    // Mark mount done
    if (!didMount.current) {
      didMount.current = true
      lastFlipped.current = flipped
      return
    }

    // Nur animieren, wenn sich flipped wirklich geändert hat
    if (lastFlipped.current === flipped) return
    lastFlipped.current = flipped

    animateTo(flipped)
  }, [flipped])

  return (
    <TouchableWithoutFeedback onPress={onTap}>
      <View style={[styles.container, style]}>
        <Animated.View
          style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}
        >
          {front}
        </Animated.View>

        <Animated.View
          style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}
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
