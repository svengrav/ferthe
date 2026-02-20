import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { Icon } from '@app/shared/components/icon/Icon'
import { Theme, useTheme } from '@app/shared/theme'

interface DraggableListProps<T> {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T, index: number) => React.ReactNode
  onReorder: (fromIndex: number, toIndex: number) => void
  gap?: number
}

const SPRING_CONFIG = { damping: 28, stiffness: 180, overshootClamping: true }

/**
 * Generic drag-and-drop reorderable list.
 * Long-press on the drag handle to activate, pan to reorder.
 */
function DraggableList<T>(props: DraggableListProps<T>) {
  const { data, keyExtractor, renderItem, onReorder, gap = 8 } = props
  const { styles, theme } = useTheme(createStyles)

  const activeIndex = useSharedValue(-1)
  const dragY = useSharedValue(0)
  const itemHeights = useSharedValue<number[]>(new Array(data.length).fill(60))

  const handleMeasure = useCallback((index: number, height: number) => {
    const current = itemHeights.value
    if (current[index] !== height) {
      const updated = [...current]
      updated[index] = height
      itemHeights.value = updated
    }
  }, [])

  const handleReorder = useCallback((from: number, to: number) => {
    onReorder(from, to)
  }, [onReorder])

  return (
    <View style={[styles.container, { gap }]}>
      {data.map((item, index) => (
        <DraggableItem
          key={keyExtractor(item)}
          index={index}
          itemCount={data.length}
          activeIndex={activeIndex}
          dragY={dragY}
          itemHeights={itemHeights}
          gap={gap}
          onMeasure={handleMeasure}
          onReorder={handleReorder}
          handleColor={theme.colors.secondary}
          handleSize={20}
          handlePadding={theme.tokens.spacing.sm}
        >
          {renderItem(item, index)}
        </DraggableItem>
      ))}
    </View>
  )
}

// --- Draggable item wrapper ---

interface DraggableItemProps {
  children: React.ReactNode
  index: number
  itemCount: number
  activeIndex: SharedValue<number>
  dragY: SharedValue<number>
  itemHeights: SharedValue<number[]>
  gap: number
  onMeasure: (index: number, height: number) => void
  onReorder: (from: number, to: number) => void
  handleColor: string
  handleSize: number
  handlePadding: number
}

/**
 * Computes the target drop index based on drag displacement.
 * Finds which original center position is nearest to the dragged item's center.
 */
function computeTargetIndex(
  ai: number,
  displacement: number,
  heights: number[],
  gap: number,
): number {
  'worklet'
  const n = heights.length
  if (n <= 1) return ai

  // Compute original center Y of each item
  const centers: number[] = []
  let y = 0
  for (let i = 0; i < n; i++) {
    centers[i] = y + heights[i] / 2
    y += heights[i] + gap
  }

  const draggedCenter = centers[ai] + displacement

  let target = ai
  let minDist = Infinity

  for (let i = 0; i < n; i++) {
    const dist = Math.abs(draggedCenter - centers[i])
    if (dist < minDist) {
      minDist = dist
      target = i
    }
  }

  return target
}

function DraggableItem(props: DraggableItemProps) {
  const {
    children,
    index,
    itemCount,
    activeIndex,
    dragY,
    itemHeights,
    gap,
    onMeasure,
    onReorder,
    handleColor,
    handleSize,
    handlePadding,
  } = props

  const gesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      'worklet'
      activeIndex.value = index
      dragY.value = 0
    })
    .onUpdate((e) => {
      'worklet'
      dragY.value = e.translationY
    })
    .onEnd(() => {
      'worklet'
      const target = computeTargetIndex(
        activeIndex.value,
        dragY.value,
        itemHeights.value,
        gap,
      )

      const from = activeIndex.value
      activeIndex.value = -1
      dragY.value = 0

      if (target !== from) {
        runOnJS(onReorder)(from, target)
      }
    })
    .onFinalize(() => {
      'worklet'
      activeIndex.value = -1
      dragY.value = 0
    })

  const animatedStyle = useAnimatedStyle(() => {
    const ai = activeIndex.value

    // No drag active — reset
    if (ai < 0) {
      return {
        transform: [{ translateY: withSpring(0, SPRING_CONFIG) }],
        zIndex: 0,
        opacity: 1,
      }
    }

    // This item is being dragged
    if (index === ai) {
      return {
        transform: [{ translateY: dragY.value }],
        zIndex: 100,
        opacity: 0.95,
      }
    }

    // Calculate target and determine shift
    const heights = itemHeights.value
    const draggedHeight = heights[ai] || 0
    const target = computeTargetIndex(ai, dragY.value, heights, gap)
    const shiftAmount = draggedHeight + gap

    if (ai < target && index > ai && index <= target) {
      return {
        transform: [{ translateY: withSpring(-shiftAmount, SPRING_CONFIG) }],
        zIndex: 0,
        opacity: 1,
      }
    }
    if (ai > target && index >= target && index < ai) {
      return {
        transform: [{ translateY: withSpring(shiftAmount, SPRING_CONFIG) }],
        zIndex: 0,
        opacity: 1,
      }
    }

    return {
      transform: [{ translateY: withSpring(0, SPRING_CONFIG) }],
      zIndex: 0,
      opacity: 1,
    }
  })

  return (
    <Animated.View
      style={animatedStyle}
      onLayout={(e) => onMeasure(index, e.nativeEvent.layout.height)}
    >
      <View style={itemStyles.row}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={{ padding: handlePadding }}>
            <Icon name="drag-handle" size={handleSize} color={handleColor} />
          </Animated.View>
        </GestureDetector>
        <View style={itemStyles.content}>
          {children}
        </View>
      </View>
    </Animated.View>
  )
}

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
  },
})

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
})

export default DraggableList
