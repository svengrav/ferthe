import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { Circle, G, Path, Svg } from 'react-native-svg'

const AnimatedPath = Animated.createAnimatedComponent(Path)

interface Props {
  size?: number
}

export function SpotCircleIcon({ size = 200 }: Props) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start()
  }, [anim])

  const fill0 = anim.interpolate({ inputRange: [0, 1], outputRange: ['#ef7864', '#cb5146'] })
  const fill2 = anim.interpolate({ inputRange: [0, 1], outputRange: ['#fbc155', '#da9b2e'] })
  const fill1 = anim.interpolate({ inputRange: [0, 1], outputRange: ['#4f7a63', '#2f3864'] })

  return (
    <Svg viewBox="0 0 200 200" width={size} height={size}>
      <G>
        <AnimatedPath
          fill={fill0}
          d="M100,0C44.8,0,0,44.8,0,100c0,13.6,2.7,26.6,7.6,38.4c39.1-31.3,103.1-82.7,149.8-120.2
            C141.2,6.7,121.4,0,100,0z"
        />
        <AnimatedPath
          fill={fill1}
          d="M17,155.7c18,26.7,48.4,44.3,83,44.3c51,0,93-38.1,99.2-87.4L17,155.7z"
        />
        <AnimatedPath
          fill={fill2}
          d="M200,100c0-33.9-16.8-63.8-42.6-81.9C110.7,55.7,46.8,107.1,7.6,138.4c2.5,6.1,5.7,11.9,9.3,17.4l182.3-43.2
            C199.7,108.5,200,104.3,200,100z"
        />
      </G>
      <Path
        fill="rgb(18, 18, 20)"
        d="M162,147.6c0.2-0.4-0.1-0.9-0.6-0.8c-3.4,0.7-8.5,3.1-13.4,6.2c-0.5,0.3-1.1-0.2-0.9-0.7
          c2.8-7.9,9.4-16.2,15.5-19.5c4.1-2.2,8.4-2.9,12.9-2.5c0.4,0,1.1,0.1,1.7,0.1c0.3,0,0.6-0.3,0.5-0.6c-0.9-4.3-2.3-8.2-5-11.6
          c-5.5-6.7-12.6-9.8-20.8-10.6c-12.3-1.1-22.3,3.9-30.8,12.7c-7.5,7.7-21.7,32.5-27.4,41.9c-8.3,13.8-21.1,15.1-25.6,14.7
          c-0.7-0.1-1-1.2-0.4-1.5c9.4-4.2,16.2-8,16.8-16.2c-23.7-12.3-27.6-34.8-27.5-36.8c0.1-2.1,1.3-3.9,3.4-4
          c2.6-0.1,5.1,0.8,7.5,1.7c4.7,1.8,9.5,3.3,14.5,4c8.5,1.2,15.9-1.3,21.9-7.6c0.7-0.7,1.2-1.7,1.7-2.5c0.5-0.8,0.4-1.6-0.5-2.1
          c-1.1-0.7-2.3-1.5-3.4-2.2c-4.8-2.9-9.3-6.1-12.5-10.9c-1.5-2.3-2.5-5-3.7-7.5c-2.3-5-8.6-13-10.3-14.5
          c-0.6-0.5-0.9-0.8-0.6-1.7c1.6-6.1,3.2-12.2,4.7-18.3c0.4-1.5,0.7-2.9,1-4.5c0.5-2.8,0.4-3.3-1.5-2.8
          c-3.5,1.1-6.5,3.2-9.4,5.5c-3.8,3-7,6.6-10.1,10.5c-0.2,0.3-0.6,0.3-0.9,0.1c-1.5-1.4-2.6-4.2-3-6.1
          c-0.9-3.9,0.2-8.7-0.8-12.5c-0.1-0.6-0.7-0.9-1.2-0.6c-3.9,1.7-7.2,4.3-10.2,7.3c-6.2,6.1-11,13.3-13.8,21.8
          c-0.2,0.4-0.5,0.9-0.8,1.1c-8.5,6.8-15.3,15.2-20.5,24.9c-0.5,0.9-0.9,1.8-1.3,2.8c-0.1,0.3,0.2,0.6,0.4,0.4
          c2.8-1.3,5.8-2.8,9-3.9c0.7-0.2,1,0.2,0.6,0.8c-1.1,1.7-3.2,4.8-4.2,6.6c-3.9,7.4-6.6,15.1-8.2,23.2
          c13.1,39.9,50.7,68.7,95,68.7c12.7,0,24.8-2.4,35.9-6.7c6.5-7.7,12.1-17.2,16.1-25.9C155.2,160.7,158,153.9,162,147.6z"
      />
      <Circle fill="#FFFFFF" cx={154.9} cy={70.8} r={22.9} />
    </Svg>
  )
}
