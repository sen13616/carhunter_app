import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/theme'
import { useStore } from '../store/useStore'

export default function UserProfileScreen() {
  const { colors } = useTheme()
  const { username: paramUsername } = useLocalSearchParams<{ username?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const currentUser = useStore((s) => s.user)
  const spots = useStore((s) => s.spots)

  const isOwnProfile = !paramUsername || paramUsername === currentUser.username
  const user = isOwnProfile ? currentUser : null

  if (!user || !user.id) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>User not found</Text>
      </View>
    )
  }

  const legendaryCount = spots.filter((c) => c.rarity === 'Legendary').length
  const locations = spots.map((c) => c.location).filter((s): s is string => Boolean(s))
  const uniqueCountries = new Set(locations).size

  const stats = [
    { label: 'Total Spots', value: spots.length.toString() },
    { label: 'Total XP', value: (user.totalXP ?? 0).toLocaleString() },
    { label: 'Day Streak', value: (user.streak ?? 0).toString() },
    { label: 'Legendaries', value: legendaryCount.toString() },
    { label: 'Locations', value: uniqueCountries.toString() },
  ]

  const displayName = user.fullName ?? user.username ?? 'Driver'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 48 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 28 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Profile</Text>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' }}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 100, height: 100 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 48, fontWeight: '700', color: colors.primary }}>{displayName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 20 }}>{displayName}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>@{user.username || '—'}</Text>
        {user.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{user.location}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 24 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ minWidth: 80, flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>{s.value}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {user.bio ? (
        <>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Bio</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, marginHorizontal: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{user.bio}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}
