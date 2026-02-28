import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/theme'
import { RARITY_ORDER } from '../../constants/theme'
import { RankCard } from '../../components/dashboard/RankCard'
import { DistributionRow } from '../../components/stats/DistributionRow'

export default function StatsScreen() {
  const { colors, rarityColors } = useTheme()
  const cars = useStore((s) => s.spots)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const makeCount = useMemo(
    () => cars.reduce((acc, car) => {
      acc[car.prediction.make] = (acc[car.prediction.make] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    [cars]
  )
  const topMakes = useMemo(() => Object.entries(makeCount).sort(([, a], [, b]) => b - a).slice(0, 8), [makeCount])
  const maxMakeCount = topMakes[0]?.[1] || 1
  const rarityCount = useMemo(
    () => RARITY_ORDER.map((rarity) => ({ rarity, count: cars.filter((c) => c.rarity === rarity).length })),
    [cars]
  )

  return (
    <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Dashboard</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 24 }}>
          <RankCard />
        </View>

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Make Distribution</Text>
        {topMakes.length === 0 ? (
          <Text style={{ color: colors.textMuted, marginBottom: 16 }}>No spots yet</Text>
        ) : (
          topMakes.map(([make, count], index) => (
            <DistributionRow key={make} make={make} count={count} maxCount={maxMakeCount} index={index} />
          ))
        )}

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 16 }}>Rarity Distribution</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {rarityCount.map((item) => (
            <View key={item.rarity} style={{ width: '50%', padding: 4 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
                <View style={{ backgroundColor: rarityColors[item.rarity], borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }}>
                  <Text style={{ color: colors.primaryText, fontSize: 12 }}>{item.rarity}</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>
    </ScrollView>
  )
}
