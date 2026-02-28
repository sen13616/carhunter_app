import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getCurrentRank, getNextRank, getProgressPercent } from '../../services/gamification'
import { useStore } from '../../store/useStore'
import { COLORS, RARITY_COLORS, RARITY_ORDER } from '../../constants/theme'
import { StatCard } from '../../components/stats/StatCard'
import { DistributionRow } from '../../components/stats/DistributionRow'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing } from 'react-native-reanimated'

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGES = [
  { emoji: '🎯', label: 'First Spot',       earned: true,  description: 'Spotted your very first car. Every legend has to start somewhere.' },
  { emoji: '🔥', label: 'Week Streak',      earned: true,  description: 'Spotted a car every day for 7 consecutive days. Dedication!' },
  { emoji: '👑', label: 'Legendary Hunter', earned: true,  description: 'Spotted 5 Legendary-rarity cars. A true connoisseur of rare machines.' },
  { emoji: '🌍', label: 'Globe Trotter',    earned: false, description: 'Spot cars in 5 different cities. The world is your parking lot.' },
  { emoji: '🏆', label: 'Brand Loyalist',   earned: false, description: 'Spot 10 cars from the same make. You have a type.' },
  { emoji: '⚡', label: 'Speed Spotter',    earned: false, description: 'Identify a car in under 5 seconds. Blink and you miss it.' },
  { emoji: '💯', label: 'Century Club',     earned: false, description: 'Spot 100 cars total. A true CarSpotter veteran.' },
]

// ─── Leaderboard data ─────────────────────────────────────────────────────────
const LEADERBOARD_XP = [
  { username: 'speedster99', displayXP: 4820, streak: 12 },
  { username: 'rarecatcher', displayXP: 3900, streak: 8  },
  { username: 'alexspots',   displayXP: 3200, streak: 15 },
  { username: 'carnerd42',   displayXP: 2750, streak: 5  },
  { username: 'turbotrack',  displayXP: 2100, streak: 3  },
  { username: 'spotmaster',  displayXP: 1800, streak: 22 },
  { username: 'driftking',   displayXP: 1500, streak: 9  },
  { username: 'classicspotter', displayXP: 980, streak: 4 },
]

const LEADERBOARD_STREAK = [...LEADERBOARD_XP].sort((a, b) => b.streak - a.streak)

function CircularProgress({ percent }: { percent: number }) {
  return (
    <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: 16 }}>{Math.round(percent)}%</Text>
    </View>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']

// ─── Badge modal ──────────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: typeof BADGES[0] | null; onClose: () => void }) {
  const scale     = useSharedValue(0.8)
  const opacity   = useSharedValue(0)
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  useEffect(() => {
    if (!badge) return
    scale.value   = 0.8
    opacity.value = 0
    scale.value   = withSpring(1, { damping: 15, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
  }, [badge])

  if (!badge) return null

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        Outer Pressable = the backdrop.
        flex:1 fills the entire Modal window (including behind status bar).
        backgroundColor gives the dark overlay.
        onPress closes the modal when tapping outside the card.
      */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        {/*
          Inner Pressable wraps the card to stop tap events from
          propagating up to the backdrop Pressable.
        */}
        <Pressable onPress={() => {}}>
          <Animated.View style={[{
            backgroundColor: COLORS.backgroundCard,
            borderRadius: 24,
            padding: 32,
            width: 280,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
          }, cardStyle]}>
            <Text style={{ fontSize: 64 }}>{badge.emoji}</Text>
            <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
              {badge.label}
            </Text>
            {badge.earned ? (
              <>
                <View style={{ backgroundColor: '#16a34a22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 }}>
                  <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}>✓ Earned</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20, fontSize: 14 }}>
                  {badge.description}
                </Text>
              </>
            ) : (
              <>
                <View style={{ backgroundColor: COLORS.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>🔒 Locked</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20, fontSize: 14 }}>
                  {badge.description}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={{ marginTop: 20, paddingHorizontal: 28, paddingVertical: 10, backgroundColor: COLORS.accent, borderRadius: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function StatsScreen() {
  const cars = useStore((s) => s.spots)
  const user = useStore((s) => s.user)
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[0] | null>(null)
  const [leaderTab, setLeaderTab] = useState<'xp' | 'streak'>('xp')
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  // §3.1 XP progress bar
  const xpBarAnim     = useSharedValue(0)
  // §3.4 Challenge bars
  const dailyBarAnim  = useSharedValue(0)
  const weeklyBarAnim = useSharedValue(0)

  const xpBarStyle     = useAnimatedStyle(() => ({ width: `${xpBarAnim.value}%` as any }))
  const dailyBarStyle  = useAnimatedStyle(() => ({ width: `${dailyBarAnim.value}%` as any }))
  const weeklyBarStyle = useAnimatedStyle(() => ({ width: `${weeklyBarAnim.value}%` as any }))

  // §2.7 Leaderboard sliding pill
  const [tabContainerW, setTabContainerW] = useState(0)
  const pillX     = useSharedValue(0)
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }))

  const currentRank     = getCurrentRank(user.totalXP)
  const nextRank        = getNextRank(user.totalXP)
  const progressPercent = getProgressPercent(user.totalXP)

  useEffect(() => {
    xpBarAnim.value = 0
    xpBarAnim.value = withTiming(progressPercent, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [user.totalXP])

  useEffect(() => {
    dailyBarAnim.value  = withTiming(30, { duration: 700, easing: Easing.out(Easing.cubic) })
    weeklyBarAnim.value = withDelay(100, withTiming(50, { duration: 700, easing: Easing.out(Easing.cubic) }))
  }, [])

  // §2.7 Slide pill when tab or container width changes
  useEffect(() => {
    if (tabContainerW === 0) return
    const pw = (tabContainerW - 6) / 2
    pillX.value = withSpring(leaderTab === 'xp' ? 0 : pw, { damping: 15, stiffness: 200 })
  }, [leaderTab, tabContainerW])

  const makeCount = useMemo(() => cars.reduce((acc, car) => {
    acc[car.prediction.make] = (acc[car.prediction.make] || 0) + 1; return acc
  }, {} as Record<string, number>), [cars])

  const topMakes     = useMemo(() => Object.entries(makeCount).sort(([,a],[,b]) => b - a).slice(0, 8), [makeCount])
  const maxMakeCount = topMakes[0]?.[1] || 1

  const rarityCount = useMemo(() =>
    RARITY_ORDER.map(rarity => ({ rarity, count: cars.filter(c => c.rarity === rarity).length }))
  , [cars])

  const leaderData = leaderTab === 'xp' ? LEADERBOARD_XP : LEADERBOARD_STREAK

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' }}>Dashboard</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Rank Card (tappable) ── */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/rank-progression', params: { xp: user.totalXP.toString(), progressPercent: progressPercent.toString() } })}
          activeOpacity={0.85}
          style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, marginBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: COLORS.accent, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="shield" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, textTransform: 'uppercase' }}>RANK {currentRank.rank}</Text>
              <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{currentRank.title}</Text>
              <Text style={{ color: COLORS.accent, fontSize: 14 }}>
                {user.totalXP} / {nextRank?.xpRequired ?? currentRank.xpRequired} XP to next rank
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <CircularProgress percent={progressPercent} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>View all</Text>
                <Ionicons name="chevron-forward" size={12} color={COLORS.textSecondary} />
              </View>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 4 }}>
            <Animated.View style={[{ height: 8, backgroundColor: COLORS.accent, borderRadius: 4 }, xpBarStyle]} />
          </View>
        </TouchableOpacity>

        {/* ── Stats Row ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <StatCard icon="camera" title="TOTAL SPOTS" value={cars.length.toString()} />
          <StatCard icon="flame"  title="STREAK"      value={user.streak.toString()} subtitle={`🔥 ${user.streak} days`} />
        </View>

        {/* ── Daily Challenge ── */}
        <View style={{ borderLeftWidth: 4, borderLeftColor: '#f59e0b', backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="flash" size={20} color="#f59e0b" />
            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Daily Challenge</Text>
            <View style={{ backgroundColor: '#f59e0b22', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>+25 XP</Text>
            </View>
          </View>
          <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>Spot 3 different car brands today</Text>
          <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 8 }}>
            <Animated.View style={[{ height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }, dailyBarStyle]} />
          </View>
          <TouchableOpacity onPress={() => router.push('/paywall')}>
            <Text style={{ color: COLORS.textSecondary }}>🔒 Requires Season Pass — <Text style={{ color: COLORS.accent }}>Upgrade</Text></Text>
          </TouchableOpacity>
        </View>

        {/* ── Weekly Challenge ── */}
        <View style={{ borderLeftWidth: 4, borderLeftColor: '#7c3aed', backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="calendar" size={20} color="#7c3aed" />
            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Weekly Challenge</Text>
            <View style={{ backgroundColor: '#7c3aed22', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#7c3aed', fontWeight: 'bold' }}>+100 XP</Text>
            </View>
          </View>
          <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>Spot 10 cars this week</Text>
          <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 8 }}>
            <Animated.View style={[{ height: 8, backgroundColor: '#7c3aed', borderRadius: 4 }, weeklyBarStyle]} />
          </View>
          <TouchableOpacity onPress={() => router.push('/paywall')}>
            <Text style={{ color: COLORS.textSecondary }}>🔒 Requires Season Pass — <Text style={{ color: COLORS.accent }}>Upgrade</Text></Text>
          </TouchableOpacity>
        </View>

        {/* ── Leaderboard ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Leaderboard</Text>
          <View
            onLayout={e => setTabContainerW(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row', backgroundColor: COLORS.backgroundCard, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: COLORS.border }}
          >
            {/* Sliding pill */}
            {tabContainerW > 0 && (
              <Animated.View style={[{
                position: 'absolute',
                left: 3,
                top: 3,
                bottom: 3,
                width: (tabContainerW - 6) / 2,
                backgroundColor: COLORS.accent,
                borderRadius: 8,
                zIndex: 0,
              }, pillStyle]} />
            )}
            {(['xp', 'streak'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setLeaderTab(tab)}
                style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, zIndex: 1 }}
              >
                <Text style={{ color: leaderTab === tab ? 'white' : COLORS.textSecondary, fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>
                  {tab === 'xp' ? 'Top XP' : 'Top Streak'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
          {leaderData.map((entry, idx) => (
            <View key={entry.username}>
              <Pressable
                onPress={() => router.push({ pathname: '/user-profile', params: { username: entry.username } })}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 }}
                android_ripple={{ color: COLORS.border }}
              >
                <Text style={{ width: 28, fontSize: idx < 3 ? 20 : 14, color: COLORS.textSecondary, textAlign: 'center' }}>
                  {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                </Text>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 }}>
                  <Ionicons name="person" size={18} color={COLORS.textSecondary} />
                </View>
                <Text style={{ flex: 1, color: COLORS.accent, fontWeight: '600', fontSize: 14 }}>@{entry.username}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                    {leaderTab === 'xp' ? `${entry.displayXP.toLocaleString()} XP` : `${entry.streak}d`}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                    {leaderTab === 'xp' ? `${entry.streak}d streak` : `${entry.displayXP.toLocaleString()} XP`}
                  </Text>
                </View>
              </Pressable>
              {idx < leaderData.length - 1 && (
                <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 74 }} />
              )}
            </View>
          ))}
        </View>

        {/* ── Collectibles ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Collectibles</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {BADGES.map((badge, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedBadge(badge)}
              activeOpacity={0.75}
              style={{ width: 80, height: 90, backgroundColor: COLORS.backgroundCard, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, opacity: badge.earned ? 1 : 0.4 }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>{badge.emoji}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' }}>{badge.label}</Text>
              {!badge.earned && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} style={{ position: 'absolute', top: 4, right: 4 }} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Make Distribution ── */}
        <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Make Distribution</Text>
        {topMakes.map(([make, count], index) => (
          <DistributionRow key={make} make={make} count={count} maxCount={maxMakeCount} index={index} />
        ))}

        {/* ── Rarity Distribution ── */}
        <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 16 }}>Rarity Distribution</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {rarityCount.map(item => (
            <View key={item.rarity} style={{ width: '50%', padding: 4 }}>
              <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, alignItems: 'center' }}>
                <View style={{ backgroundColor: RARITY_COLORS[item.rarity], borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }}>
                  <Text style={{ color: 'white', fontSize: 12 }}>{item.rarity}</Text>
                </View>
                <Text style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Badge popup — rendered outside ScrollView so Modal is a true root-level overlay ── */}
      <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </>
  )
}
