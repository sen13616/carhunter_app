import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLegacyCarPhotosForLegacyCarIds } from '../services/supabase/legacyCarPhotos'
import { getSignedSpottingPhotoUrl } from '../services/supabase/storage'

const SIGNED_URL_EXPIRY_SEC = 3600

export type UseLegacyCarPhotoUrlsResult = {
  photoUrlMap: Map<string, string | null>
  loading: boolean
  error: string | null
}

/**
 * Batch fetch primary storage paths for legacy cars, then signed URLs.
 * Returns map legacyCarId -> signedUrl (primary thumbnail).
 */
export function useLegacyCarPhotoUrls(legacyCarIds: string[]): UseLegacyCarPhotoUrlsResult {
  const [photoUrlMap, setPhotoUrlMap] = useState<Map<string, string | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevIdsRef = useRef<string>('')

  useEffect(() => {
    if (legacyCarIds.length === 0) {
      setPhotoUrlMap(new Map())
      setLoading(false)
      setError(null)
      return
    }

    const idsKey = [...legacyCarIds].sort().join(',')
    if (prevIdsRef.current === idsKey) return
    prevIdsRef.current = idsKey

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const pathMap = await fetchLegacyCarPhotosForLegacyCarIds(legacyCarIds)
        const result = new Map<string, string | null>()
        await Promise.all(
          legacyCarIds.map(async (id) => {
            if (cancelled) return
            const path = pathMap.get(id)
            if (!path) {
              result.set(id, null)
              return
            }
            const url = await getSignedSpottingPhotoUrl(path, SIGNED_URL_EXPIRY_SEC)
            if (!cancelled) result.set(id, url)
          })
        )
        if (!cancelled) {
          setPhotoUrlMap(result)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load photos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [legacyCarIds.length, legacyCarIds.join(',')])

  return { photoUrlMap, loading, error }
}

export type LegacyCarPhotoWithUrl = {
  id: string
  signedUrl: string | null
  is_primary: boolean
  sort_order: number
}

/**
 * All photos for one legacy car (gallery / editor). Ordered by is_primary desc, sort_order asc.
 */
export function useLegacyCarPhotoGallery(legacyCarId: string | null): {
  photos: LegacyCarPhotoWithUrl[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [photos, setPhotos] = useState<LegacyCarPhotoWithUrl[]>([])
  const [loading, setLoading] = useState(!!legacyCarId)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!legacyCarId) {
      setPhotos([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { fetchLegacyCarPhotos } = await import('../services/supabase/legacyCarPhotos')
      const rows = await fetchLegacyCarPhotos(legacyCarId)
      const withUrls: LegacyCarPhotoWithUrl[] = await Promise.all(
        rows.map(async (r) => {
          const signedUrl = await getSignedSpottingPhotoUrl(r.storage_path, SIGNED_URL_EXPIRY_SEC)
          return {
            id: r.id,
            signedUrl,
            is_primary: r.is_primary ?? false,
            sort_order: r.sort_order ?? 0,
          }
        })
      )
      setPhotos(withUrls)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load photos')
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }, [legacyCarId])

  useEffect(() => {
    load()
  }, [load])

  return { photos, loading, error, refetch: load }
}
