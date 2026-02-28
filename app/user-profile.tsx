import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/theme'

const USERS: Record<string, {
  username: string; displayName: string; avatar: string; joinDate: string
  location: string; bio: string; xp: number; streak: number; totalSpots: number
}> = {
  speedster99: {
    username: 'speedster99', displayName: 'Jake Mercer', avatar: '🏎️',
    joinDate: 'March 2024', location: 'Los Angeles, CA',
    bio: 'Car enthusiast from LA. Always on the hunt for rare exotics. Supercar collector by day, spotter by night.',
    xp: 4820, streak: 12, totalSpots: 482,
  },
  rarecatcher: {
    username: 'rarecatcher', displayName: 'Yuki Tanaka', avatar: '🚗',
    joinDate: 'January 2024', location: 'Tokyo, Japan',
    bio: 'Hunting legendaries in Tokyo streets. Japan has the rarest finds — JDM for life.',
    xp: 3900, streak: 8, totalSpots: 390,
  },
  alexspots: {
    username: 'alexspots', displayName: 'Alex Morgan', avatar: '🚙',
    joinDate: 'February 2024', location: 'New York, NY',
    bio: 'Speed spotter and car nerd based in New York. Love finding rare European imports.',
    xp: 3200, streak: 15, totalSpots: 320,
  },
  carnerd42: {
    username: 'carnerd42', displayName: 'Chris Lane', avatar: '🏍️',
    joinDate: 'April 2024', location: 'Chicago, IL',
    bio: 'Weekend spotter, daily driver. Classic car advocate.',
    xp: 2750, streak: 5, totalSpots: 275,
  },
  turbotrack: {
    username: 'turbotrack', displayName: 'Marco Ricci', avatar: '🚕',
    joinDate: 'May 2024', location: 'Miami, FL',
    bio: 'Track day enthusiast. If it has a turbo, I will spot it.',
    xp: 2100, streak: 3, totalSpots: 210,
  },
  spotmaster: {
    username: 'spotmaster', displayName: 'Sam Taylor', avatar: '🚌',
    joinDate: 'June 2024', location: 'London, UK',
    bio: 'Longest active streak on the platform! Every day is a spot day.',
    xp: 1800, streak: 22, totalSpots: 180,
  },
  driftking: {
    username: 'driftking', displayName: 'Lena Park', avatar: '🚓',
    joinDate: 'July 2024', location: 'Seoul, South Korea',
    bio: 'Drift culture enthusiast and modified car hunter.',
    xp: 1500, streak: 9, totalSpots: 150,
  },
  classicspotter: {
    username: 'classicspotter', displayName: 'Robert Frost', avatar: '🚖',
    joinDate: 'August 2024', location: 'Paris, France',
    bio: 'Only interested in pre-1980 classics. The older the better.',
    xp: 980, streak: 4, totalSpots: 98,
  },
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const user = username ? USERS[username] : null

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textPrimary }}>User not found</Text>
      </View>
    )
  }

  const stats = [
    { label: 'Total Spots', value: user.totalSpots.toString() },
    { label: 'Total XP', value: user.xp.toLocaleString() },
    { label: 'Day Streak', value: user.streak.toString() },
  ]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 48 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 28 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Profile</Text>
      </View>

      {/* Avatar + name */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.accent, backgroundColor: COLORS.backgroundCard, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 48 }}>{user.avatar}</Text>
        </View>
        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 20 }}>{user.displayName}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 2 }}>@{user.username}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Joined {user.joinDate}</Text>
        </View>
        {user.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{user.location}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 }}>
        {stats.map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 18 }}>{s.value}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bio */}
      {user.bio ? (
        <>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Bio</Text>
          <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 14, marginHorizontal: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 14, lineHeight: 22 }}>{user.bio}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}
