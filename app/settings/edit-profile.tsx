import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'
import { useAuth } from '../../contexts/auth'
import { useStore } from '../../store/useStore'
import { fetchProfile, upsertProfile, checkUsernameAvailability } from '../../services/supabase/profile'
import type { RarityLevel } from '../../types'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/
const BIO_MAX = 120

function mapProfileToForm(profile: { full_name?: string | null; username?: string | null; location?: string | null; bio?: string | null }) {
  return {
    fullName: (profile.full_name ?? '').trim(),
    username: (profile.username ?? '').trim().toLowerCase(),
    location: (profile.location ?? '').trim(),
    bio: (profile.bio ?? '').trim().slice(0, BIO_MAX),
  }
}

export default function EditProfileScreen() {
  const { colors, rarityColors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session, refreshProfile } = useAuth()
  const user = useStore((s) => s.user)
  const spots = useStore((s) => s.spots)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  const userId = session?.user?.id
  const email = session?.user?.email ?? user.email ?? ''

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchProfile(userId).then((profile) => {
      if (cancelled) return
      if (profile) {
        const form = mapProfileToForm(profile)
        setFullName(form.fullName)
        setUsername(form.username)
        setLocation(form.location)
        setBio(form.bio)
      } else {
        setFullName(user.fullName ?? '')
        setUsername(user.username ?? '')
        setLocation(user.location ?? '')
        setBio(user.bio ?? '')
      }
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])

  const validateUsername = (val: string): boolean => {
    const lower = val.trim().toLowerCase()
    if (lower.length < 3) {
      setUsernameError('At least 3 characters')
      return false
    }
    if (lower.length > 20) {
      setUsernameError('Max 20 characters')
      return false
    }
    if (!USERNAME_REGEX.test(lower)) {
      setUsernameError('Only letters, numbers, underscore')
      return false
    }
    setUsernameError(null)
    return true
  }

  const handleSave = async () => {
    const trimmedFull = fullName.trim()
    const trimmedUsername = username.trim().toLowerCase()
    if (!trimmedFull) {
      Alert.alert('Required', 'Please enter your full name.')
      return
    }
    if (!validateUsername(username)) return
    if (!userId) {
      Alert.alert('Error', 'Session expired. Please sign in again.')
      return
    }

    const available = await checkUsernameAvailability(trimmedUsername, userId)
    if (!available) {
      setUsernameError('Username is already taken')
      return
    }

    setSaving(true)
    const { profile, error } = await upsertProfile({
      id: userId,
      full_name: trimmedFull,
      username: trimmedUsername,
      location: location.trim() || null,
      bio: bio.trim().slice(0, BIO_MAX) || null,
      avatar_url: user.avatarUrl ?? null,
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    await refreshProfile()
    router.back()
  }

  const totalSpots = spots.length
  const legendaryCount = spots.filter((c) => c.rarity === 'Legendary').length
  const streak = user.streak ?? 0

  const rarityCounts: Record<string, number> = {}
  spots.forEach((s) => {
    const r = s.rarity as string
    rarityCounts[r] = (rarityCounts[r] ?? 0) + 1
  })
  const mostSpottedRarity: RarityLevel | null =
    Object.keys(rarityCounts).length === 0
      ? null
      : (Object.entries(rarityCounts).sort((a, b) => b[1] - a[1])[0][0] as RarityLevel)

  const displayName = (fullName.trim() || user.fullName || user.username || 'Profile')
  const displayUsername = (username.trim() || user.username || '')

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading profile…</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 28 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {saving ? <ActivityIndicator size="small" color={colors.primaryText} /> : <Text style={{ color: colors.primaryText, fontWeight: 'bold' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ position: 'relative' }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 120, height: 120 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 48, fontWeight: '700', color: colors.primary }}>{(displayName || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bg }}>
            <Ionicons name="camera" size={14} color={colors.primaryText} />
          </View>
        </View>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginTop: 12 }}>{displayName || '—'}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>@{displayUsername || '—'}</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Total Spots', value: String(totalSpots) },
          { label: 'Legendaries', value: String(legendaryCount) },
          { label: 'Day Streak', value: String(streak) },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 20 }}>{s.value}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Personal Info</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, marginBottom: 24, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Full Name</Text>
          <TextInput
            style={{ color: colors.text, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Username</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: usernameError ? colors.danger : colors.border, paddingBottom: 14 }}>
            <Text style={{ color: colors.textMuted, fontSize: 15, marginRight: 2 }}>@</Text>
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: 15 }}
              value={username}
              onChangeText={(t) => { setUsername(t.toLowerCase().replace(/\s/g, '')); validateUsername(t) }}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>
          {usernameError ? <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>{usernameError}</Text> : null}
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Email</Text>
          <Text style={{ color: colors.textMuted, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>{email || '—'}</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Location</Text>
          <TextInput
            placeholder="e.g. Los Angeles, CA"
            style={{ color: colors.text, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Bio</Text>
          <View>
            <TextInput
              placeholder="Tell us about yourself..."
              style={{ color: colors.text, fontSize: 15, paddingBottom: 14, minHeight: 80, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={BIO_MAX}
            />
            <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'right', marginBottom: 10 }}>{bio.length}/{BIO_MAX}</Text>
          </View>
        </View>
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Most Spotted Rarity</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Your rarest consistent find</Text>
        {mostSpottedRarity ? (
          <View style={{ backgroundColor: rarityColors[mostSpottedRarity] ?? colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 12 }}>{mostSpottedRarity}</Text>
          </View>
        ) : (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>No spots yet</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: colors.primary, borderRadius: 14, marginHorizontal: 16, paddingVertical: 16 }}
      >
        {saving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={{ color: colors.primaryText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}