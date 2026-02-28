import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated'
import { Prediction } from '../../types'
import { COLORS } from '../../constants/theme'

interface ConfidenceBarProps {
  prediction: Prediction
  index: number
}

export function ConfidenceBar({ prediction, index }: ConfidenceBarProps) {
  const { make, model, confidence } = prediction
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(index * 150, withTiming(confidence / 100, { duration: 500 }))
  }, [index, confidence])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }))

  return (
    <View style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: COLORS.textPrimary }}>{make} {model}</Text>
        <Text style={{ color: COLORS.textSecondary }}>{confidence}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginTop: 4 }}>
        <Animated.View style={[{ height: 8, backgroundColor: COLORS.accent, borderRadius: 4 }, animatedStyle]} />
      </View>
    </View>
  )
}