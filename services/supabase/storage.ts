import { supabase } from '../../lib/supabase'
import { generateUuid } from '../../utils/uuid'

const BUCKET = 'spotting-photos'
const DEFAULT_EXPIRES_SEC = 3600
const CACHE_BUFFER_MS = 5 * 60 * 1000

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

function isCacheExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - CACHE_BUFFER_MS
}

export async function getSignedSpottingPhotoUrl(
  storagePath: string,
  expiresInSec = DEFAULT_EXPIRES_SEC
): Promise<string | null> {
  const cached = signedUrlCache.get(storagePath)
  if (cached && !isCacheExpired(cached.expiresAt)) return cached.url

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresInSec)
    if (error) {
      console.warn('[storage] createSignedUrl error', storagePath, error.message)
      return null
    }
    const url = data?.signedUrl ?? null
    if (url) {
      signedUrlCache.set(storagePath, {
        url,
        expiresAt: Date.now() + expiresInSec * 1000,
      })
    }
    return url
  } catch (e) {
    console.warn('[storage] createSignedUrl threw', storagePath, e)
    return null
  }
}

/** Invalidate cache for a path (e.g. after delete). */
export function invalidateSignedUrlCache(storagePath: string): void {
  signedUrlCache.delete(storagePath)
}

export function createSpottingPhotoPath(
  userId: string,
  spottingId: string,
  ext: string
): { photoId: string; path: string } {
  const photoId = generateUuid()
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
  const path = `${userId}/${spottingId}/${photoId}.${safeExt}`
  return { photoId, path }
}

/** Legacy car photo path: ${userId}/legacy/${legacyCarId}/${photoId}.${ext} */
export function createLegacyPhotoPath(
  userId: string,
  legacyCarId: string,
  ext: string
): { photoId: string; path: string } {
  const photoId = generateUuid()
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
  const path = `${userId}/legacy/${legacyCarId}/${photoId}.${safeExt}`
  return { photoId, path }
}

export type UploadSpottingPhotoFile = { uri: string; mimeType: string }

export async function uploadSpottingPhoto(
  userId: string,
  spottingId: string,
  file: UploadSpottingPhotoFile,
  extGuess?: string
): Promise<{ storagePath: string } | null> {
  const ext = extGuess ?? (file.uri.split('.').pop()?.toLowerCase() || 'jpg')
  const { path } = createSpottingPhotoPath(userId, spottingId, ext)

  let body: Blob | ArrayBuffer
  try {
    const response = await fetch(file.uri)
    if (!response.ok) {
      console.warn('[storage] fetch file failed', file.uri, response.status)
      return null
    }
    body = await response.blob()
  } catch (e) {
    console.warn('[storage] fetch file threw', file.uri, e)
    return null
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: file.mimeType || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    console.warn('[storage] upload error', path, error.message)
    return null
  }

  return { storagePath: path }
}

export type UploadLegacyCarPhotoFile = { uri: string; mimeType: string }

export async function uploadLegacyCarPhoto(
  userId: string,
  legacyCarId: string,
  file: UploadLegacyCarPhotoFile,
  extGuess?: string
): Promise<{ storagePath: string } | null> {
  const ext = extGuess ?? (file.uri.split('.').pop()?.toLowerCase() || 'jpg')
  const { path } = createLegacyPhotoPath(userId, legacyCarId, ext)

  let body: Blob
  try {
    const response = await fetch(file.uri)
    if (!response.ok) {
      console.warn('[storage] fetch file failed', file.uri, response.status)
      return null
    }
    body = await response.blob()
  } catch (e) {
    console.warn('[storage] fetch file threw', file.uri, e)
    return null
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: file.mimeType || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    console.warn('[storage] upload error', path, error.message)
    return null
  }

  return { storagePath: path }
}
