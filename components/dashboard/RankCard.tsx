import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { RankProgressRing } from './RankProgressRing'
import { XPProgressBar } from './XPProgressBar'
import { StatBox } from './StatBox'

const LEGENDARY_ICON_COLOR = '#FF7A18'
const COUNTRIES_ICON_COLOR = '#12B981'

export function RankCard() {
  const { colors } = useTheme()
  const router = useRouter()
  const { user, progressPercent, xpToNext, stats } = useDashboardStats()

  const displayName = user.name || 'Driver'

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/rank-progression', params: { xp: user.xp.toString(), progressPercent: progressPercent.toString() } })}
      style={{
        padding: 18,
        borderRadius: 26,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Top row: profile | name + rank | ring */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ marginRight: 14, position: 'relative' }}>
          <View style={{ width: 68, height: 68, borderRadius: 18, backgroundColor: colors.surface2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={{ width: 68, height: 68 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trophy" size={14} color={colors.primaryText} />
          </View>
        </View>

        <View style={{ flex: 1, marginRight: 12, minWidth: 0 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 4 }} numberOfLines={2}>{displayName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Ionicons name="shield" size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{user.rankTitle}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>→</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{user.nextRankTitle}</Text>
          </View>
        </View>

        <RankProgressRing percent={progressPercent} colors={colors} />
      </View>

      {/* XP section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{user.xp.toLocaleString()} XP</Text> earned
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{xpToNext.toLocaleString()} XP to next rank</Text>
      </View>

      {/* Progress bar */}
      <View style={{ marginBottom: 18 }}>
        <XPProgressBar percent={progressPercent} colors={colors} />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', marginHorizontal: -5 }}>
        <StatBox
          icon="camera"
          value={stats.totalSpots}
          label="Total Spots"
          iconColor={colors.primary}
          colors={colors}
        />
        <StatBox
          icon="star"
          value={stats.legendaryCount}
          label="Legendaries"
          iconColor={LEGENDARY_ICON_COLOR}
          colors={colors}
        />
        <StatBox
          icon="earth"
          value={stats.countriesCount}
          label="Countries"
          iconColor={COUNTRIES_ICON_COLOR}
          colors={colors}
        />
      </View>
    </TouchableOpacity>
  )
}
