import React from 'react'
import { View, Text } from 'react-native'
import { RANKS } from '../../services/gamification'

interface LevelProgressProps {
  level: number
  currentXp: number
  nextLevelXp: number
  colors: { surface: string; border: string; text: string; textMuted: string; primary: string }
}

export function LevelProgress({ level, currentXp, nextLevelXp, colors }: LevelProgressProps) {
  const currentRank = RANKS.find((r) => r.rank === level)
  const levelStartXp = currentRank?.xpRequired ?? 0
  const range = nextLevelXp - levelStartXp
  const progress = range > 0 ? Math.min(100, ((currentXp - levelStartXp) / range) * 100) : 100

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Level progress</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Level {level}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
      </View>
    </View>
  )
}
