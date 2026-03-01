import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { identifyCar } from '../services/carIdentifier'
import { useStore } from '../store/useStore'
import { useAuth } from '../contexts/auth'
import { IdentifyResponse, SpottedCar } from '../types'
import { useTheme } from '../contexts/theme'

export default function ManualUploadScreen() {
  const { colors, rarityColors } = useTheme()
  const { session } = useAuth()
  const userId = session?.user?.id ?? 'demo_user_001'
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const addSpot = useStore((s) => s.addSpot)
  // updateXP is deliberately NOT called here — manual uploads are XP-inert

  const [imageUri, setImageUri]             = useState<string | null>(null)
  const [isLoading, setIsLoading]           = useState(false)
  const [identifyResult, setIdentifyResult] = useState<IdentifyResponse | null>(null)
  const [error, setError]                   = useState<string | null>(null)

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    const uri = asset.uri
    setImageUri(uri)
    setIsLoading(true)
    setIdentifyResult(null)
    setError(null)
    try {
      const res = await identifyCar(uri, { userId, mimeType: asset.mimeType ?? 'image/jpeg' })
      setIdentifyResult(res)
    } catch {
      setError('Could not identify the car. Please try a different photo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!identifyResult || !imageUri) return
    const { identification, specs } = identifyResult
    const car: SpottedCar = {
      id: Date.now().toString(),
      photoUri: imageUri,
      // Legacy fields (required for car-detail.tsx backwards compat)
      prediction: { make: identification.make, model: identification.model, year: identification.year, confidence: identification.uncertain ? 50 : 95 },
      allPredictions: [{ make: identification.make, model: identification.model, year: identification.year, confidence: identification.uncertain ? 50 : 95 }],
      carDetails: {
        make: identification.make,
        model: identification.model,
        year: identification.year,
        horsepower: specs.horsepower,
        engineType: specs.engine,
        yearsOfProduction: '',
        rarity: specs.rarity_tier,
      },
      dateSpotted: new Date().toDateString(),
      rarity: specs.rarity_tier,
      source: 'upload',
      // New fields
      trim: identification.trim,
      colour: identification.colour,
      uncertain: identification.uncertain,
      horsepower: specs.horsepower,
      engine: specs.engine,
      zeroToHundred: specs.zero_to_100_kmh,
      basePriceUsd: specs.base_price_usd,
    }
    addSpot(car)
    router.back()
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>Manual Upload</Text>
      </View>

      {/* Dashed picker — shown before an image is selected */}
      {!imageUri && (
        <TouchableOpacity
          onPress={handlePick}
          activeOpacity={0.7}
          style={{
            borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
            borderRadius: 16, height: 200,
            justifyContent: 'center', alignItems: 'center', marginBottom: 24,
          }}
        >
          <Ionicons name="cloud-upload-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 16, marginTop: 12 }}>
            Select a photo from your gallery
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>Tap to browse</Text>
        </TouchableOpacity>
      )}

      {/* Image preview */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: 240, borderRadius: 16, marginBottom: 16 }}
          resizeMode="cover"
        />
      )}

      {/* Loading */}
      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 12 }}>Identifying car...</Text>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={{ color: colors.danger, fontSize: 15, marginTop: 12, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity
            onPress={handlePick}
            style={{ marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Try a different photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {identifyResult && !isLoading && (
        <>
          {/* XP warning banner */}
          <View style={{
            backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary,
            borderRadius: 12, padding: 14, marginBottom: 20,
          }}>
            <Text style={{ color: colors.primary, fontSize: 13 }}>
              ⚠️  Manual uploads do not contribute to XP, challenges, and rarity scores.
            </Text>
          </View>

          {/* Uncertain warning */}
          {identifyResult.identification.uncertain && (
            <View style={{
              backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary,
              borderRadius: 12, padding: 14, marginBottom: 16,
            }}>
              <Text style={{ color: colors.primary, fontSize: 13 }}>
                ⚠️ AI wasn't confident about this result. Please verify before saving.
              </Text>
            </View>
          )}

          {/* Rarity badge + identity */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: rarityColors[identifyResult.specs.rarity_tier], borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 }}>
            <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 12 }}>{identifyResult.specs.rarity_tier}</Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 22, marginBottom: 2 }}>
            {identifyResult.identification.year} {identifyResult.identification.make}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 16, marginBottom: 16 }}>
            {identifyResult.identification.model}{identifyResult.identification.trim ? ` ${identifyResult.identification.trim}` : ''}
          </Text>

          {/* Specs card */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 24 }}>
            {[
              { label: 'Horsepower', value: `${identifyResult.specs.horsepower} HP` },
              { label: 'Engine',     value: identifyResult.specs.engine },
              { label: '0–100 km/h', value: `${identifyResult.specs.zero_to_100_kmh}s` },
              { label: 'Colour',     value: identifyResult.identification.colour },
            ].map((spec, i, arr) => (
              <View key={spec.label}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>{spec.label}</Text>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{spec.value}</Text>
                </View>
                {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.border }} />}
              </View>
            ))}
          </View>

          {/* Save — muted outlined style */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: 'transparent', borderWidth: 1,
              borderColor: colors.border, borderRadius: 14, padding: 16,
            }}
          >
            <Text style={{ color: colors.text, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
              Save to Garage
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}
