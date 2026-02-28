import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/theme'
import { useAuth } from '../contexts/auth'
import { createLegacyCar } from '../services/supabase/legacyCars'
import { addLegacyCarPhotos } from '../services/supabase/legacyCarPhotos'
import type { LegacyCar } from '../types'

const RARITY_OPTIONS = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'] as const

export default function AddLegacyCarScreen() {
  const { colors } = useTheme()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [trim, setTrim] = useState('')
  const [colour, setColour] = useState('')
  const [rarityTier, setRarityTier] = useState<string>(RARITY_OPTIONS[0])
  const [pendingFiles, setPendingFiles] = useState<Array<{ uri: string; mimeType: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to add images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
    })
    if (result.canceled || !result.assets.length) return
    const newFiles = result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg' }))
    setPendingFiles((prev) => [...prev, ...newFiles])
  }

  const handleSubmit = async () => {
    const userId = session?.user?.id
    if (!userId) {
      router.replace('/auth')
      return
    }
    const makeTrim = make.trim()
    const modelTrim = model.trim()
    if (!makeTrim || !modelTrim) {
      setError('Make and model are required')
      return
    }
    if (pendingFiles.length === 0) {
      setError('Add at least one photo')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const yearNum = year.trim() ? parseInt(year.trim(), 10) : null
      const car = await createLegacyCar(userId, {
        make: makeTrim,
        model: modelTrim,
        year: Number.isNaN(yearNum as number) ? null : yearNum,
        trim: trim.trim() || null,
        colour: colour.trim() || null,
        rarity_tier: rarityTier || null,
      })
      if (!car) {
        setError('Failed to create car')
        return
      }
      await addLegacyCarPhotos(car.id, userId, pendingFiles)
      router.replace({ pathname: '/legacy-car-detail', params: { legacyCarJson: JSON.stringify(car as LegacyCar) } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!session?.user?.id) return null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginLeft: 16 }}>Add legacy car</Text>
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Make *</Text>
      <TextInput
        value={make}
        onChangeText={setMake}
        placeholder="Make"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Model *</Text>
      <TextInput
        value={model}
        onChangeText={setModel}
        placeholder="Model"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Year</Text>
      <TextInput
        value={year}
        onChangeText={setYear}
        placeholder="Year"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Trim</Text>
      <TextInput
        value={trim}
        onChangeText={setTrim}
        placeholder="Trim"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Colour</Text>
      <TextInput
        value={colour}
        onChangeText={setColour}
        placeholder="Colour"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Rarity (optional)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {RARITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setRarityTier(opt)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: rarityTier === opt ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: rarityTier === opt ? colors.primaryText : colors.text, fontSize: 13 }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Photos * (at least one)</Text>
      <TouchableOpacity
        onPress={pickPhotos}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 20,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 10 }}>Add photos</Text>
      </TouchableOpacity>
      {pendingFiles.length > 0 && (
        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{pendingFiles.length} photo(s) selected</Text>
      )}

      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={saving}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          opacity: saving ? 0.7 : 1,
          marginTop: 8,
        }}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>Create legacy car</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: 15 }}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
