import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated'
import { useTheme } from '../../contexts/theme'

interface DistributionRowProps {
  make: string
  count: number
  maxCount: number
  index: number
}

export function DistributionRow({ make, count, maxCount, index }: DistributionRowProps) {
  const { colors } = useTheme()
  const targetWidth = (count / maxCount) * 100
  const barAnim  = useSharedValue(0)
  const barStyle = useAnimatedStyle(() => ({ width: `${barAnim.value}%` as any }))

  useEffect(() => {
    barAnim.value = withDelay(index * 60, withTiming(targetWidth, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [targetWidth])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
      <Text style={{ color: colors.text, flex: 1 }}>{make}</Text>
      <Text style={{ color: colors.textMuted, marginRight: 8 }}>{count}</Text>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, flex: 2 }}>
        <Animated.View style={[{ height: 8, backgroundColor: colors.primary, borderRadius: 4 }, barStyle]} />
      </View>
    </View>
  )
}
