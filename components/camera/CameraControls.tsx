import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useTheme } from '../../contexts/theme'

interface CameraControlsProps {
  onPress: () => void
  disabled?: boolean
}

export function CameraControls({ onPress, disabled }: CameraControlsProps) {
  const { colors } = useTheme()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={[animStyle, { opacity: disabled ? 0.4 : 1 }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 8, stiffness: 300 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 8, stiffness: 300 }) }}
        disabled={disabled}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          borderColor: colors.text,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent'
        }}
      >
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: disabled ? colors.border : colors.surface
          }}
        />
      </TouchableOpacity>
    </Animated.View>
  )
}
