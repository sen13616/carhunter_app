import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface StatBoxProps {
  icon: keyof typeof Ionicons.glyphMap
  value: string | number
  label: string
  iconColor: string
  colors: { surface: string; border: string; text: string; textMuted: string }
}

export function StatBox({ icon, value, label, iconColor, colors }: StatBoxProps) {
  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: 5,
        padding: 15,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={22} color={iconColor} style={{ marginBottom: 8 }} />
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }} numberOfLines={1}>{String(value)}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
    </View>
  )
}
