import React, { useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, useWindowDimensions, Alert } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/theme'
import { useAuth } from '../contexts/auth'
import { LegacyCar } from '../types'
import { useLegacyCarPhotoGallery } from '../hooks/useLegacyCarPhotoUrls'
import { addLegacyCarPhotos } from '../services/supabase/legacyCarPhotos'
import { deleteLegacyCar } from '../services/supabase/legacyCars'

const GALLERY_HEIGHT = 280

export default function LegacyCarDetailScreen() {
  const { colors, rarityColors } = useTheme()
  const { session } = useAuth()
  const { legacyCarJson } = useLocalSearchParams<{ legacyCarJson: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [galleryIndex, setGalleryIndex] = useState(0)

  const car: LegacyCar | null = legacyCarJson ? (JSON.parse(legacyCarJson) as LegacyCar) : null
  const { photos: galleryPhotos, loading: photoLoading, refetch: refetchGallery } = useLegacyCarPhotoGallery(car?.id ?? null)
  const displayPhotoUris = galleryPhotos.map((p) => p.signedUrl).filter((u): u is string => !!u)
  const primaryUrl = galleryPhotos.find((p) => p.is_primary)?.signedUrl ?? galleryPhotos[0]?.signedUrl ?? null

  useFocusEffect(
    React.useCallback(() => {
      if (car?.id) refetchGallery()
    }, [car?.id, refetchGallery])
  )

  if (!car) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Car not found</Text>
      </View>
    )
  }

  const userId = session?.user?.id ?? ''
  const title = `${car.year ?? ''} ${car.make} ${car.model} ${car.trim ?? ''}`.trim() || `${car.make} ${car.model}`
  const rarity = car.rarity_tier ?? 'Common'

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
    const files = result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg' }))
    try {
      await addLegacyCarPhotos(car.id, userId, files)
      await refetchGallery()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add photos')
    }
  }

  const handleRemove = () => {
    Alert.alert(
      'Remove legacy car',
      'Remove this car from your legacy list? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteLegacyCar(car.id, userId)
            if (ok) router.back()
            else Alert.alert('Error', 'Failed to remove')
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>Legacy car</Text>
      </View>

      {photoLoading && displayPhotoUris.length === 0 ? (
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
      ) : primaryUrl ? (
        <Image source={{ uri: primaryUrl }} style={{ width: '100%', height: GALLERY_HEIGHT }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: GALLERY_HEIGHT, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="car-outline" size={80} color={colors.textMuted} />
        </View>
      )}

      <View style={{ padding: 20 }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: rarityColors[rarity] ?? colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 }}>
          <Text style={{ color: colors.primaryText ?? 'white', fontWeight: 'bold', fontSize: 12 }}>{rarity}</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: 'bold' }}>{car.make} {car.model}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 18, marginTop: 4 }}>{car.year ?? '—'}{car.trim ? ` · ${car.trim}` : ''}</Text>
        {car.colour ? <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>{car.colour}</Text> : null}

        <View style={{ marginTop: 20, gap: 10 }}>
          <TouchableOpacity
            onPress={handleAddMorePhotos}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 12 }}>Add more photos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/edit-legacy-car-photos', params: { legacyCarId: car.id, carTitle: title } })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="images-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 12 }}>Edit photos (set primary, delete)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleRemove}
          style={{ marginTop: 32, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 15 }}>Remove from legacy list</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
