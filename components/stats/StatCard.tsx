import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSharedValue, withTiming, Easing, useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import { useTheme } from '../../contexts/theme'

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  value: string | number
  subtitle?: string
}

export function StatCard({ icon, title, value, subtitle }: StatCardProps) {
  const { colors } = useTheme()
  const numericVal  = typeof value === 'string' ? parseFloat(value) : Number(value)
  const isCountable = !isNaN(numericVal) && isFinite(numericVal) && numericVal >= 0
  const startFrom   = isCountable && numericVal > 1000 ? Math.floor(numericVal * 0.7) : 0

  const animNum = useSharedValue(isCountable ? startFrom : 0)
  const [displayNum, setDisplayNum] = useState(isCountable ? startFrom.toString() : String(value))

  useAnimatedReaction(
    () => Math.round(animNum.value),
    (cur) => { runOnJS(setDisplayNum)(cur.toString()) }
  )

  useEffect(() => {
    if (!isCountable) return
    animNum.value = startFrom
    animNum.value = withTiming(numericVal, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [numericVal])

  return (
    <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase' }}>{title}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>
        {isCountable ? displayNum : String(value)}
      </Text>
      {subtitle && <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  )
}
