import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCongratsStore } from '../store/useCongratsStore'
import { useTheme } from '../contexts/theme'
import { XpPill } from '../components/postSpot/XpPill'
import { LevelProgress } from '../components/postSpot/LevelProgress'
import { TrophyCard } from '../components/postSpot/TrophyCard'

const REVEAL_INTERVAL_MS = 450

export default function PostSpotScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const payload = useCongratsStore((s) => s.payload)
  const clearPayload = useCongratsStore((s) => s.clearPayload)

  const [visiblePillCount, setVisiblePillCount] = useState(0)
  const [displayedTotalXp, setDisplayedTotalXp] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const userHasScrolled = useRef(false)
  const totalPills = payload ? payload.xpItems.length + 1 : 0

  useEffect(() => {
    if (!payload || totalPills === 0) return
    setVisiblePillCount(0)
    setDisplayedTotalXp(0)
    userHasScrolled.current = false
    let n = 0
    const id = setInterval(() => {
      n += 1
      setVisiblePillCount((c) => Math.min(c + 1, totalPills))
      if (n >= totalPills) clearInterval(id)
    }, REVEAL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [payload?.spottingId, totalPills])

  // Haptic on each pill reveal
  useEffect(() => {
    if (visiblePillCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [visiblePillCount])

  // Count-up the total XP number once the total pill becomes visible
  const totalXpPillVisible = payload != null && visiblePillCount > (payload?.xpItems.length ?? 0)
  useEffect(() => {
    if (!totalXpPillVisible || !payload) return
    const target = payload.totalXpEarned
    const DURATION = 1200
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / DURATION, 1)
      const eased = progress * (2 - progress) // ease-out quad
      setDisplayedTotalXp(Math.round(target * eased))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [totalXpPillVisible, payload?.spottingId])

  useEffect(() => {
    if (!payload || userHasScrolled.current) return
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, REVEAL_INTERVAL_MS * visiblePillCount + 100)
    return () => clearTimeout(t)
  }, [payload?.spottingId, visiblePillCount])

  const handleContinue = () => {
    clearPayload()
    router.replace('/(tabs)/index' as never)
  }

  if (!payload) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>Spot saved</Text>
        <Text style={{ color: colors.textMuted, fontSize: 15, marginBottom: 32, textAlign: 'center' }}>Your spot was saved successfully.</Text>
        <Pressable onPress={handleContinue} style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 }}>
          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>Continue</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <Pressable style={{ flex: 1, backgroundColor: colors.bg }} onPress={handleContinue}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        onScroll={() => { userHasScrolled.current = true }}
        scrollEventThrottle={100}
      >
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>SPOT SAVED!</Text>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 4 }}>{payload.car.displayTitle}</Text>
        {payload.car.displaySubtitle ? (
          <Text style={{ color: colors.textMuted, fontSize: 20, fontWeight: '600', marginBottom: 24 }}>{payload.car.displaySubtitle}</Text>
        ) : (
          <View style={{ marginBottom: 24 }} />
        )}

        {payload.xpItems.map((item, index) => (
          <XpPill
            key={item.key}
            label={item.label}
            xp={item.xp}
            visible={visiblePillCount > index}
            colors={colors}
          />
        ))}
        <XpPill
          label="Total XP earned"
          xp={displayedTotalXp}
          visible={visiblePillCount > payload.xpItems.length}
          colors={colors}
        />

        {payload.level != null && (
          <LevelProgress
            level={payload.level.level}
            currentXp={payload.level.currentXp}
            nextLevelXp={payload.level.nextLevelXp}
            colors={colors}
          />
        )}

        {payload.trophy != null && (
          <TrophyCard
            title={payload.trophy.title}
            subtitle={payload.trophy.subtitle}
            icon={payload.trophy.icon}
            colors={colors}
          />
        )}

        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 32, textAlign: 'center' }}>Tap anywhere to continue</Text>
      </ScrollView>
    </Pressable>
  )
}
