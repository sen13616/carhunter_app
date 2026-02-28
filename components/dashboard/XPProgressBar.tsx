import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'

interface XPProgressBarProps {
  percent: number
  colors: { surface2: string; primary: string }
}

export function XPProgressBar({ percent, colors }: XPProgressBarProps) {
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withTiming(Math.min(percent, 100), { duration: 800, easing: Easing.out(Easing.cubic) })
  }, [percent])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View style={{ height: 12, backgroundColor: colors.surface2, borderRadius: 6, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 12, backgroundColor: colors.primary, borderRadius: 6 }, fillStyle]} />
    </View>
  )
}
