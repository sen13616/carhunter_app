import React, { useState } from 'react'
import { View, Text, Pressable, Image, TextInput, ScrollView } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/theme'
import { fetchPrimarySpottingPhoto } from '../services/supabase/spottingPhotos'
import { getSignedSpottingPhotoUrl } from '../services/supabase/storage'

export default function DevResetScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const [spottingId, setSpottingId] = useState('')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const hardReset = async () => {
    try {
      await supabase.auth.signOut()
      await AsyncStorage.clear()
      router.replace('/auth')
    } catch (e) {
      console.warn('[DevReset] Hard reset failed:', e)
    }
  }

  const testSpottingPhoto = async () => {
    const id = spottingId.trim()
    setPhotoError(null)
    setSignedUrl(null)
    if (!id) {
      setPhotoError('Enter a spotting ID')
      return
    }
    try {
      const path = await fetchPrimarySpottingPhoto(id)
      if (!path) {
        setPhotoError('No photo found for this spotting')
        return
      }
      const url = await getSignedSpottingPhotoUrl(path)
      if (!url) {
        setPhotoError('Failed to create signed URL')
        return
      }
      setSignedUrl(url)
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Error')
    }
  }

  if (!__DEV__) return null

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text }}>Dev Reset</Text>
      <Text style={{ color: colors.textMuted }}>Sign out, clear AsyncStorage, go to /auth.</Text>
      <Pressable
        onPress={hardReset}
        style={({ pressed }) => ({
          padding: 14,
          backgroundColor: pressed ? colors.surface2 : colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        })}
      >
        <Text style={{ color: colors.text }}>Hard Reset App State</Text>
      </Pressable>

      <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Test Spotting Photo (signed URL)</Text>
        <TextInput
          value={spottingId}
          onChangeText={setSpottingId}
          placeholder="Spotting UUID"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            color: colors.text,
            marginBottom: 8,
          }}
        />
        <Pressable
          onPress={testSpottingPhoto}
          style={({ pressed }) => ({
            padding: 12,
            backgroundColor: pressed ? colors.surface2 : colors.primary,
            borderRadius: 10,
            marginBottom: 8,
          })}
        >
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Load image</Text>
        </Pressable>
        {photoError ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{photoError}</Text> : null}
        {signedUrl ? (
          <Image source={{ uri: signedUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
        ) : null}
      </View>
    </ScrollView>
  )
}