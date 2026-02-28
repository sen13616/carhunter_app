import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface TrophyCardProps {
  title: string
  subtitle: string
  icon?: string
  colors: { surface: string; border: string; text: string; textMuted: string; primary: string }
}

export function TrophyCard({ title, subtitle, icon, colors }: TrophyCardProps) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 2, borderColor: colors.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={(icon as any) ?? 'trophy'} size={22} color={colors.primaryText} />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Trophy unlocked</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 14 }}>{subtitle}</Text>
    </View>
  )
}
