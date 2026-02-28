import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RARITY_COLORS } from '../../constants/theme'

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('Alex Morgan')
  const [username, setUsername] = useState('alexspots')
  const [email, setEmail] = useState('alex@carspotter.app')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  const badges = [
    { emoji: '🎯', label: 'First Spot' },
    { emoji: '🔥', label: 'Week Streak' },
    { emoji: '👑', label: 'Legendary' },
    { emoji: '⚡', label: 'Speed Spotter' },
  ]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Custom header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 28 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Edit Profile</Text>
        <TouchableOpacity onPress={() => Alert.alert('Saved!')} style={{ backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ position: 'relative' }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.accent, backgroundColor: COLORS.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="person" size={60} color={COLORS.textSecondary} />
          </View>
          {/* Camera badge */}
          <View style={{ position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background }}>
            <Ionicons name="camera" size={14} color="white" />
          </View>
        </View>
        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 18, marginTop: 12 }}>Alex Morgan</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 2 }}>@alexspots</Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Total Spots', value: '34' },
          { label: 'Legendaries', value: '3' },
          { label: 'Day Streak', value: '7' },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 20 }}>{s.value}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Personal info */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Personal Info</Text>
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, marginHorizontal: 16, marginBottom: 24, overflow: 'hidden' }}>
        {/* Full Name */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Full Name</Text>
          <TextInput
            style={{ color: COLORS.textPrimary, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
            value={name}
            onChangeText={setName}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        {/* Username */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Username</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 14 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginRight: 2 }}>@</Text>
            <TextInput
              style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15 }}
              value={username}
              onChangeText={setUsername}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>
        {/* Email */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Email</Text>
          <TextInput
            style={{ color: COLORS.textPrimary, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {/* Location */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Location</Text>
          <TextInput
            placeholder="e.g. Los Angeles, CA"
            style={{ color: COLORS.textPrimary, fontSize: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        {/* Bio */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Bio</Text>
          <View>
            <TextInput
              placeholder="Tell us about yourself..."
              style={{ color: COLORS.textPrimary, fontSize: 15, paddingBottom: 14, minHeight: 80, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 120))}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={120}
            />
            <Text style={{ color: COLORS.textSecondary, fontSize: 11, textAlign: 'right', marginBottom: 10 }}>{bio.length}/120</Text>
          </View>
        </View>
      </View>

      {/* Earned Badges */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Earned Badges</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 24 }}>
        {badges.map((badge) => (
          <View key={badge.label} style={{ width: '50%', padding: 4 }}>
            <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontSize: 26 }}>{badge.emoji}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 13 }}>{badge.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Most Spotted Rarity */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' }}>Most Spotted Rarity</Text>
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, marginHorizontal: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Your rarest consistent find</Text>
        <View style={{ backgroundColor: RARITY_COLORS['Very Rare'], borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Very Rare</Text>
        </View>
      </View>

      {/* Save Changes button */}
      <TouchableOpacity
        onPress={() => Alert.alert('Saved!')}
        style={{ backgroundColor: COLORS.accent, borderRadius: 14, marginHorizontal: 16, paddingVertical: 16 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
