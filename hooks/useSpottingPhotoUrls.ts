import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSpottingPhotos, fetchSpottingPhotosForSpottingIds } from '../services/supabase/spottingPhotos'
import { getSignedSpottingPhotoUrl } from '../services/supabase/storage'

const SIGNED_URL_EXPIRY_SEC = 3600

export type SpottingPhotoWithUrl = { id: string; signedUrl: string | null; is_primary: boolean; sort_order: number }

export type UseSpottingPhotoUrlsResult = {
  photoUrlMap: Map<string, string | null>
  loading: boolean
  error: string | null
}

/**
 * Batch fetch primary storage paths, then generate signed URLs (with cache in storage.ts).
 * Returns map spottingId -> signedUrl, plus loading and error.
 */
export function useSpottingPhotoUrls(spottingIds: string[]): UseSpottingPhotoUrlsResult {
  const [photoUrlMap, setPhotoUrlMap] = useState<Map<string, string | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevIdsRef = useRef<string>('')

  useEffect(() => {
    if (spottingIds.length === 0) {
      setPhotoUrlMap(new Map())
      setLoading(false)
      setError(null)
      return
    }

    const idsKey = [...spottingIds].sort().join(',')
    if (prevIdsRef.current === idsKey) return
    prevIdsRef.current = idsKey

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const pathMap = await fetchSpottingPhotosForSpottingIds(spottingIds)
        const result = new Map<string, string | null>()
        await Promise.all(
          spottingIds.map(async (id) => {
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
  }, [spottingIds.length, spottingIds.join(',')])

  return { photoUrlMap, loading, error }
}

/**
 * Get a single spotting's primary photo signed URL (e.g. for car-detail).
 * Uses cache in storage.ts.
 */
export async function getPrimarySpottingPhotoUrl(spottingId: string): Promise<string | null> {
  const { fetchPrimarySpottingPhoto } = await import('../services/supabase/spottingPhotos')
  const path = await fetchPrimarySpottingPhoto(spottingId)
  if (!path) return null
  return getSignedSpottingPhotoUrl(path, SIGNED_URL_EXPIRY_SEC)
}

/** Single spotting: returns signed URL or null, and loading state. */
export function usePrimarySpottingPhotoUrl(spottingId: string | null): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!spottingId)

  useEffect(() => {
    if (!spottingId) {
      setUrl(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getPrimarySpottingPhotoUrl(spottingId).then((u) => {
      if (!cancelled) {
        setUrl(u)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [spottingId])

  return { url, loading }
}

/**
 * All photos for one spotting (for car detail gallery). Ordered by is_primary desc, sort_order asc.
 * Returns signed URLs for each; refetch after adding/deleting photos.
 */
export function useSpottingPhotoGallery(spottingId: string | null): {
  photos: SpottingPhotoWithUrl[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [photos, setPhotos] = useState<SpottingPhotoWithUrl[]>([])
  const [loading, setLoading] = useState(!!spottingId)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!spottingId) {
      setPhotos([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSpottingPhotos(spottingId)
      const withUrls: SpottingPhotoWithUrl[] = await Promise.all(
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
  }, [spottingId])

  useEffect(() => {
    load()
  }, [load])

  return { photos, loading, error, refetch: load }
}
