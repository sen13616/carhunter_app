import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

// iOS-style shutter button dimensions
const BUTTON_SIZE = 80   // outer ring outer diameter
const RING_BORDER = 3    // ring border width
const GAP = 5            // gap between ring inner edge and inner circle
const INNER_SIZE = BUTTON_SIZE - RING_BORDER * 2 - GAP * 2  // = 64

interface CameraControlsProps {
  onPress: () => void
  disabled?: boolean
}

export function CameraControls({ onPress, disabled }: CameraControlsProps) {
  const scale = useSharedValue(1)
  const innerAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <View style={{ opacity: disabled ? 0.4 : 1 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          onPress()
        }}
        onPressIn={() => { scale.value = withSpring(0.88, { damping: 10, stiffness: 400 }) }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 10, stiffness: 400 }) }}
        disabled={disabled}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: RING_BORDER,
          borderColor: 'white',
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={[{
            width: INNER_SIZE,
            height: INNER_SIZE,
            borderRadius: INNER_SIZE / 2,
            backgroundColor: 'white',
          }, innerAnimStyle]}
        />
      </TouchableOpacity>
    </View>
  )
}
