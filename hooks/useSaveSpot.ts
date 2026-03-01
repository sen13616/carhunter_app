import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { processSpot } from '../services/supabase/processSpot'
import { useStore } from '../store/useStore'
import { useCongratsStore } from '../store/useCongratsStore'
import { buildCongratsPayload } from '../utils/buildCongratsPayload'
import type { IdentifyResponse, ProfileRow } from '../types'

export type SaveSpotParams = {
  identifyResult: IdentifyResponse
  photoUri: string
  additionalPhotos: string[]
  edits: { make: string; model: string; trim: string; year: number }
  location: string
  notes: string
  onSuccess: () => void
  onDuplicate: () => void
  onPaywall: (info: { used: number; limit: number }) => void
  onError: (message: string) => void
}

export function useSaveSpot() {
  const router = useRouter()
  const addSpot = useStore((s) => s.addSpot)

  const saveSpot = async (params: SaveSpotParams): Promise<void> => {
    const { identifyResult, photoUri, additionalPhotos, edits, location, notes, onSuccess, onDuplicate, onPaywall, onError } = params

    const uid = useStore.getState().user.id
    if (!uid) {
      onError('Not signed in')
      return
    }

    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (!profileRow) {
      onError('Could not load profile')
      return
    }

    const result = await processSpot({
      profile: profileRow as ProfileRow,
      source: 'camera',
      photoUri,
      additionalPhotoUris: additionalPhotos.length > 0 ? additionalPhotos : undefined,
      identifyResult,
      edits,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    if (result.status === 'success') {
      addSpot(result.spot)
      const currentUser = useStore.getState().user
      useStore.getState().setUser({
        id: result.updatedProfile.id,
        username: result.updatedProfile.username ?? result.updatedProfile.email ?? 'User',
        email: (result.updatedProfile.email ?? '').toString(),
        totalXP: typeof result.updatedProfile.xp === 'number' ? result.updatedProfile.xp : currentUser.totalXP,
        streak: typeof result.updatedProfile.streak_count === 'number' ? result.updatedProfile.streak_count : currentUser.streak,
        lastSpotDate: result.updatedProfile.last_spotted_at
          ? new Date(result.updatedProfile.last_spotted_at).toDateString()
          : currentUser.lastSpotDate,
      })
      const newTotalXp = typeof result.updatedProfile.xp === 'number' ? result.updatedProfile.xp : useStore.getState().user.totalXP
      const payload = buildCongratsPayload({
        spottingId: result.spot.id,
        identifyResult,
        edits,
        gainedXp: result.gainedXp,
        updatedProfileXp: newTotalXp,
      })
      useCongratsStore.getState().setPayload(payload)
      onSuccess()
      router.push('/post-spot')
      return
    }

    if (result.status === 'limit') {
      onPaywall({ used: result.used, limit: result.limit })
      return
    }

    if (result.status === 'duplicate') {
      onDuplicate()
      return
    }

    if (result.status === 'error') {
      onError(result.message || 'Failed to save')
    }
  }

  return { saveSpot }
}
