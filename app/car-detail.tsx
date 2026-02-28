import React from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { COLORS, RARITY_COLORS } from '../constants/theme'
import { SpottedCar } from '../types'

export default function CarDetailScreen() {
  const { carJson } = useLocalSearchParams<{ carJson: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const removeSpot = useStore((s) => s.removeSpot)
  const car: SpottedCar | null = carJson ? (JSON.parse(carJson) as SpottedCar) : null

  if (!car) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textPrimary }}>Car not found</Text>
      </View>
    )
  }

  const { prediction, rarity, dateSpotted, photoUri, carDetails } = car

  const confidencePct = Math.min(
    prediction.confidence > 1
      ? Math.round(prediction.confidence)
      : Math.round(prediction.confidence * 100),
    100
  )

  const handleDelete = () => {
    removeSpot(car.id)
    router.back()
  }

  const specs = [
    { label: 'Horsepower', value: `${carDetails.horsepower} HP` },
    { label: 'Engine', value: carDetails.engineType },
    { label: 'Production Years', value: carDetails.yearsOfProduction },
    { label: 'Confidence', value: `${confidencePct}%` },
  ]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', flex: 1 }}>Car Details</Text>
      </View>

      {/* Photo */}
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 260, backgroundColor: COLORS.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="car-outline" size={80} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={{ padding: 20 }}>
        {/* Rarity badge */}
        <View style={{ alignSelf: 'flex-start', backgroundColor: RARITY_COLORS[rarity], borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{rarity}</Text>
        </View>

        {/* Name + year */}
        <Text style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: 'bold' }}>
          {prediction.make} {prediction.model}
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 18, marginTop: 4 }}>{prediction.year}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8 }}>Spotted on {dateSpotted}</Text>

        {/* Specs card */}
        <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, padding: 16, marginTop: 24 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Specifications</Text>
          {specs.map((spec, i) => (
            <View key={spec.label}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{spec.label}</Text>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 }}>{spec.value}</Text>
              </View>
              {i < specs.length - 1 && <View style={{ height: 1, backgroundColor: COLORS.border }} />}
            </View>
          ))}
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          style={{ marginTop: 32, borderWidth: 1, borderColor: '#ef4444', borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 15 }}>Remove from Garage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
