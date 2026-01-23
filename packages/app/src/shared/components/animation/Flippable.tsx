import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'

type FlippableProps = {
  flipped?: boolean
  front: React.ReactNode
  back: React.ReactNode
  style?: ViewStyle
}

export const Flippable = (props: FlippableProps) => {
  const { front, back, style, flipped = false } = props;
  const animatedValue = useRef(new Animated.Value(0)).current
  const [isFlipped, setIsFlipped] = useState(flipped)

  // 0..180 Grad
  const frontRotate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  })

  const backRotate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  })

  const flip = () => {
    const toValue = isFlipped ? 180 : 0

    Animated.sequence([
      Animated.delay(150), // optional
      Animated.spring(animatedValue, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }),
    ]).start(() => {
      setIsFlipped(!isFlipped)
    })
  }

  useEffect(() => {
    if (isFlipped) {
      // Startzustand korrekt setzen:
      animatedValue.setValue(180)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TouchableWithoutFeedback onPress={flip} >
      <View style={[styles.container, style]} id='flippable'>
        {/* FRONT */}
        <Animated.View
          style={[
            styles.face,
            {
              transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
            },
          ]}
        >
          {front}
        </Animated.View>

        {/* BACK */}
        <Animated.View
          style={[
            styles.face,
            {
              transform: [{ perspective: 1000 }, { rotateY: backRotate }],
            },
          ]}
        >
          {back}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
  ...StyleSheet.absoluteFillObject,
  },

  // beide Seiten identisch: absolut füllen + versteckte Rückseite
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
})
