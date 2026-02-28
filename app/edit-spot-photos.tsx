import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/theme'
import { useAuth } from '../contexts/auth'
import {
  fetchSpottingPhotos,
  addSpottingPhotos,
  setPrimarySpottingPhoto,
  deleteSpottingPhoto,
  type SpottingPhotoRow,
} from '../services/supabase/spottingPhotos'
import { getSignedSpottingPhotoUrl } from '../services/supabase/storage'

export default function EditSpotPhotosScreen() {
  const { spottingId, carTitle } = useLocalSearchParams<{ spottingId: string; carTitle?: string }>()
  const { colors } = useTheme()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const userId = session?.user?.id ?? ''

  const [photos, setPhotos] = useState<SpottingPhotoRow[]>([])
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPhotos = useCallback(async () => {
    if (!spottingId) return
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSpottingPhotos(spottingId)
      setPhotos(rows)
      const urlMap = new Map<string, string>()
      await Promise.all(
        rows.map(async (r) => {
          const url = await getSignedSpottingPhotoUrl(r.storage_path)
          if (url) urlMap.set(r.id, url)
        })
      )
      setSignedUrls(urlMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [spottingId])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const handleAddPhotos = async () => {
    if (!userId || !spottingId) return
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
    setActionLoading(true)
    try {
      await addSpottingPhotos(spottingId, userId, files)
      await loadPhotos()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add photos')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    if (!spottingId) return
    setActionLoading(true)
    try {
      await setPrimarySpottingPhoto(spottingId, photoId)
      await loadPhotos()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to set primary')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = (photoId: string) => {
    Alert.alert(
      'Delete photo',
      'Remove this photo from the spotting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true)
            try {
              await deleteSpottingPhoto(photoId)
              await loadPhotos()
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ]
    )
  }

  if (!spottingId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Invalid spotting</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
          {carTitle ?? 'Edit photos'}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.danger, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={loadPhotos} style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 }}>
            <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {photos.map((p) => {
            const url = signedUrls.get(p.id)
            return (
              <View key={p.id} style={{ marginBottom: 16, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <View style={{ height: 200, backgroundColor: colors.border }}>
                  {url ? (
                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                  {p.is_primary ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="star" size={18} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 6, fontWeight: '600' }}>Primary</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(p.id)}
                      disabled={actionLoading}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Ionicons name="star-outline" size={18} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 6 }}>Set as primary</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(p.id)} disabled={actionLoading} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}

          <TouchableOpacity
            onPress={handleAddPhotos}
            disabled={actionLoading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 20,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              borderRadius: 12,
              marginTop: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 10 }}>Add photos</Text>
          </TouchableOpacity>

          {actionLoading && (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}
