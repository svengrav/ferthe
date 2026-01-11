import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'

type FlippableProps = {
  startFlipped?: boolean
  flipped?: boolean
  front: React.ReactNode
  back: React.ReactNode
  style?: ViewStyle
}

export const Flippable: React.FC<FlippableProps> = ({ front, back, style, startFlipped }) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const [flipped, setFlipped] = useState(false)

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  })

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  })

  const flip = () => {
    Animated.delay(1000).start(() => {
      Animated.spring(animatedValue, {
        toValue: flipped ? 0 : 180,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }).start()
      setFlipped(!flipped)
    })
  }

  useEffect(() => {
    if (startFlipped) {
      flip()
    }
  }, [])

  return (
    <TouchableWithoutFeedback onPress={flip}>
      <View style={[styles.container, style]}>
        <Animated.View style={[styles.card, { transform: [{ rotateY: frontInterpolate }] }]}>
          {front}
        </Animated.View>
        <Animated.View style={[styles.card, styles.back, { transform: [{ rotateY: backInterpolate }] }]}>
          {back}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 300,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  back: {
    position: 'absolute',
  },
})