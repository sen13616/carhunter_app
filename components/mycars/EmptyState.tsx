import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'

export function EmptyState() {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Ionicons name="car-outline" size={64} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontSize: 18, marginTop: 16 }}>No cars spotted yet</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>Start spotting cars to fill your garage!</Text>
    </View>
  )
}