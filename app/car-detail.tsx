import React, { useState, useCallback } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, useWindowDimensions, Alert } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/theme'
import { useAuth } from '../contexts/auth'
import { SpottedCar } from '../types'
import { useSpottingPhotoGallery } from '../hooks/useSpottingPhotoUrls'
import { addSpottingPhotos } from '../services/supabase/spottingPhotos'
import { fetchSpottingById, mapSpottingRowToSpottedCar } from '../services/supabase/spottings'

function getDisplayPhotoUri(car: SpottedCar, signedUrl: string | null): string | null {
  if (signedUrl) return signedUrl
  const uri = car.photoUri
  if (uri && (uri.startsWith('http') || uri.startsWith('file'))) return uri
  return null
}

const GALLERY_HEIGHT = 280

export default function CarDetailScreen() {
  const { colors, rarityColors } = useTheme()
  const { session } = useAuth()
  const { carJson } = useLocalSearchParams<{ carJson: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [galleryIndex, setGalleryIndex] = useState(0)

  const removeSpot = useStore((s) => s.removeSpot)
  const initialCar: SpottedCar | null = carJson ? (JSON.parse(carJson) as SpottedCar) : null
  const [car, setCar] = useState<SpottedCar | null>(initialCar)
  const { photos: galleryPhotos, loading: photoLoading, refetch: refetchGallery } = useSpottingPhotoGallery(car?.id ?? null)
  const displayPhotoUris = galleryPhotos.map((p) => p.signedUrl).filter((u): u is string => !!u)
  const primaryUrl = galleryPhotos.find((p) => p.is_primary)?.signedUrl ?? galleryPhotos[0]?.signedUrl ?? null
  const displayPhotoUri = getDisplayPhotoUri(car!, primaryUrl)

  const refetchSpotting = useCallback(async () => {
    if (!car?.id) return
    const row = await fetchSpottingById(car.id)
    if (row) setCar(mapSpottingRowToSpottedCar(row))
  }, [car?.id])

  useFocusEffect(
    useCallback(() => {
      if (car?.id) {
        refetchGallery()
        refetchSpotting()
      }
    }, [car?.id, refetchGallery, refetchSpotting])
  )

  if (!car) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Car not found</Text>
      </View>
    )
  }

  const { prediction, rarity, dateSpotted, carDetails } = car
  const userId = session?.user?.id ?? ''

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

  const handleAddMorePhotos = async () => {
    if (!userId || !car.id) return
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
    const files = result.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType ?? 'image/jpeg',
    }))
    try {
      await addSpottingPhotos(car.id, userId, files)
      await refetchGallery()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add photos')
    }
  }

  const specs = [
    { label: 'Horsepower', value: `${carDetails.horsepower} HP` },
    { label: 'Engine', value: carDetails.engineType },
    { label: 'Production Years', value: carDetails.yearsOfProduction },
    { label: 'Confidence', value: `${confidencePct}%` },
  ]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 }}>Car Details</Text>
      </View>

      {/* Photo gallery (all photos) or single primary / placeholder */}
      {photoLoading && displayPhotoUris.length === 0 && !displayPhotoUri ? (
        <View style={{ width: '100%', height: GALLERY_HEIGHT, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayPhotoUris.length > 1 ? (
        <View style={{ width: '100%', height: GALLERY_HEIGHT }}>
          <FlatList
            data={displayPhotoUris}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width)
              setGalleryIndex(i)
            }}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: GALLERY_HEIGHT }} resizeMode="cover" />
            )}
          />
          <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {displayPhotoUris.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === galleryIndex ? 10 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === galleryIndex ? colors.primary : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </View>
        </View>
      ) : displayPhotoUris.length === 1 ? (
        <Image source={{ uri: displayPhotoUris[0] }} style={{ width: '100%', height: GALLERY_HEIGHT }} resizeMode="cover" />
      ) : displayPhotoUri ? (
        <Image source={{ uri: displayPhotoUri }} style={{ width: '100%', height: GALLERY_HEIGHT }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: GALLERY_HEIGHT, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="car-outline" size={80} color={colors.textMuted} />
        </View>
      )}

      <View style={{ padding: 20 }}>
        {/* Rarity badge */}
        <View style={{ alignSelf: 'flex-start', backgroundColor: rarityColors[rarity], borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 }}>
          <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 12 }}>{rarity}</Text>
        </View>

        {/* Name + year */}
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: 'bold' }}>
          {prediction.make} {prediction.model}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 18, marginTop: 4 }}>{prediction.year}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>Spotted on {dateSpotted}</Text>

        {/* Edit spot + Add more photos + Edit photos */}
        <View style={{ marginTop: 20, gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push(`/edit-spot?spottingId=${car.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="pencil-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 12 }}>Edit spot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddMorePhotos}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 12 }}>Add more photos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/edit-spot-photos', params: { spottingId: car.id, carTitle: `${prediction.year} ${prediction.make} ${prediction.model}` } })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="images-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 12 }}>Edit photos (set primary, delete)</Text>
          </TouchableOpacity>
        </View>

        {/* Specs card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 24 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Specifications</Text>
          {specs.map((spec, i) => (
            <View key={spec.label}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{spec.label}</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{spec.value}</Text>
              </View>
              {i < specs.length - 1 && <View style={{ height: 1, backgroundColor: colors.border }} />}
            </View>
          ))}
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          style={{ marginTop: 32, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 15 }}>Remove from Garage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
