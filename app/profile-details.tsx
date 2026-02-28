import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/auth'
import { useTheme } from '../contexts/theme'
import { useStore } from '../store/useStore'
import { upsertProfile, checkUsernameAvailability } from '../services/supabase/profile'
import { deleteCurrentAuthUser } from '../services/supabase/deleteUser'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export default function ProfileDetailsScreen() {
  const { colors } = useTheme()
  const { session, setProfileComplete, refreshProfile, signOut } = useAuth()
  const user = useStore((s) => s.user)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [username, setUsername] = useState((user.username && user.username !== 'User' ? user.username : '').toLowerCase())
  const [location, setLocation] = useState(user.location ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

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

  const handleBack = () => {
    Alert.alert(
      'Cancel sign up?',
      'Your account will be permanently deleted and you will return to the sign in screen.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)
            const { error } = await deleteCurrentAuthUser()
            await signOut()
            setCancelling(false)
            if (error) {
              Alert.alert('Error', error.message)
              return
            }
            router.replace('/auth')
          },
        },
      ]
    )
  }

  const handleContinue = async () => {
    const trimmedFull = fullName.trim()
    const trimmedUsername = username.trim().toLowerCase()
    const trimmedLocation = location.trim()

    if (!trimmedFull) {
      Alert.alert('Required', 'Please enter your full name.')
      return
    }
    if (!validateUsername(username)) return
    if (!trimmedLocation) {
      Alert.alert('Required', 'Please enter your location.')
      return
    }

    const available = await checkUsernameAvailability(trimmedUsername, session?.user?.id)
    if (!available) {
      setUsernameError('Username is already taken')
      return
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Session expired. Please sign in again.')
      return
    }

    setSubmitting(true)
    const { profile, error } = await upsertProfile({
      id: session.user.id,
      full_name: trimmedFull,
      username: trimmedUsername,
      location: trimmedLocation || null,
      bio: bio.trim() || null,
    })
    setSubmitting(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    if (profile) {
      await refreshProfile()
      setProfileComplete(true)
      router.replace('/(tabs)')
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
        <TouchableOpacity onPress={handleBack} disabled={cancelling} style={{ marginRight: 16 }}>
          {cancelling ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontSize: 16 }}>Back</Text>}
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>Complete Profile</Text>
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20 }}>
        Add a few details so your profile is set up.
      </Text>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>Full Name *</Text>
      <TextInput
        placeholder="Your full name"
        placeholderTextColor={colors.textMuted}
        value={fullName}
        onChangeText={setFullName}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 18,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>Username *</Text>
      <TextInput
        placeholder="username (letters, numbers, _)"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={(t) => { setUsername(t.toLowerCase().replace(/\s/g, '')); validateUsername(t) }}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: usernameError ? colors.danger : colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: usernameError ? 4 : 18,
        }}
      />
      {usernameError && <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 18 }}>{usernameError}</Text>}

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>Location *</Text>
      <TextInput
        placeholder="e.g. Los Angeles, CA"
        placeholderTextColor={colors.textMuted}
        value={location}
        onChangeText={setLocation}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 18,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>Bio (optional)</Text>
      <TextInput
        placeholder="A short bio..."
        placeholderTextColor={colors.textMuted}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          minHeight: 88,
          textAlignVertical: 'top',
          marginBottom: 32,
        }}
      />

      <TouchableOpacity
        onPress={handleContinue}
        disabled={submitting}
        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' }}
      >
        {submitting ? <ActivityIndicator color={colors.primaryText} /> : <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 16 }}>Continue</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}
