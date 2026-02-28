import React, { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { RANKS } from '../services/gamification'
import { COLORS } from '../constants/theme'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated'

const RANK_ICONS = ['🌱', '🔍', '🚗', '🔭', '🏹', '🧭', '👁️', '⭐', '💎', '🏅', '🏆', '👑', '⚡', '🌟']

function RankRow({ rank, idx, achieved, isCurrent, animate, totalRanks }: {
  rank: typeof RANKS[0]
  idx: number
  achieved: boolean
  isCurrent: boolean
  animate: boolean
  totalRanks: number
}) {
  const opacity    = useSharedValue(animate ? 0 : 1)
  const translateX = useSharedValue(animate ? 30 : 0)
  const rowStyle   = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }))

  useEffect(() => {
    if (!animate) return
    opacity.value    = withDelay(idx * 40, withTiming(1, { duration: 300 }))
    translateX.value = withDelay(idx * 40, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }))
  }, [])

  return (
    <Animated.View style={rowStyle}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: isCurrent ? COLORS.accent + '18' : 'transparent',
      }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: achieved ? (isCurrent ? COLORS.accent : COLORS.accent + '33') : COLORS.border,
          justifyContent: 'center', alignItems: 'center', marginRight: 14,
        }}>
          <Text style={{ fontSize: 20, opacity: achieved ? 1 : 0.4 }}>{RANK_ICONS[idx]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: achieved ? COLORS.textPrimary : COLORS.textSecondary, fontWeight: isCurrent ? 'bold' : '600', fontSize: 15 }}>
              {rank.title}
            </Text>
            {isCurrent && (
              <View style={{ backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={{ color: achieved ? COLORS.accent : COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
            {rank.xpRequired.toLocaleString()} XP required
          </Text>
        </View>
        {achieved ? (
          <Ionicons name={isCurrent ? 'radio-button-on' : 'checkmark-circle'} size={22} color={isCurrent ? COLORS.accent : '#16a34a'} />
        ) : (
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.border} />
        )}
      </View>
      {idx < totalRanks - 1 && (
        <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 74 }} />
      )}
    </Animated.View>
  )
}

export default function RankProgressionScreen() {
  const { xp: xpParam, progressPercent: ppParam } = useLocalSearchParams<{ xp: string; progressPercent: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const totalXP = Number(xpParam ?? 0)
  const progressPercent = Number(ppParam ?? 0)

  const xpBarAnim  = useSharedValue(0)
  const xpBarStyle = useAnimatedStyle(() => ({ width: `${xpBarAnim.value}%` as any }))

  useEffect(() => {
    xpBarAnim.value = withTiming(Math.min(progressPercent, 100), { duration: 800, easing: Easing.out(Easing.cubic) })
  }, [])

  // Find current rank index
  const currentRankIndex = RANKS.slice().reverse().findIndex(r => totalXP >= r.xpRequired)
  const currentIdx = currentRankIndex === -1 ? 0 : RANKS.length - 1 - currentRankIndex
  const currentRank = RANKS[currentIdx]
  const nextRank = RANKS[currentIdx + 1] ?? null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' }}>Rank Progression</Text>
      </View>

      {/* Current rank hero card */}
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 2, borderColor: COLORS.accent }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 40, marginRight: 14 }}>{RANK_ICONS[currentIdx]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
              YOUR RANK
            </Text>
            <Text style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{currentRank.title}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              Rank #{currentRank.rank} · {totalXP} XP
            </Text>
          </View>
        </View>
        {nextRank ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{currentRank.title}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{nextRank.title} ({nextRank.xpRequired} XP)</Text>
            </View>
            <View style={{ height: 10, backgroundColor: COLORS.border, borderRadius: 5 }}>
              <Animated.View style={[{ height: 10, backgroundColor: COLORS.accent, borderRadius: 5 }, xpBarStyle]} />
            </View>
            <Text style={{ color: COLORS.accent, fontSize: 12, marginTop: 6 }}>
              {nextRank.xpRequired - totalXP} XP to next rank
            </Text>
          </>
        ) : (
          <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏆 Maximum Rank Achieved!</Text>
        )}
      </View>

      {/* All ranks list */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
        All Ranks
      </Text>
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
        {RANKS.map((rank, idx) => (
          <RankRow
            key={rank.rank}
            rank={rank}
            idx={idx}
            achieved={totalXP >= rank.xpRequired}
            isCurrent={idx === currentIdx}
            animate={idx < 8}
            totalRanks={RANKS.length}
          />
        ))}
      </View>
    </ScrollView>
  )
}
