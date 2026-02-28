import { supabase } from '../../lib/supabase'
import { uploadSpottingPhoto, type UploadSpottingPhotoFile } from './storage'
import { invalidateSignedUrlCache } from './storage'

export type SpottingPhotoRow = {
  id: string
  storage_path: string
  is_primary?: boolean
  sort_order?: number
}

export async function insertSpottingPhotoRow(params: {
  spottingId: string
  userId: string
  storagePath: string
  isPrimary?: boolean
  sortOrder?: number
}): Promise<void> {
  const { spottingId, userId, storagePath, isPrimary = false, sortOrder = 0 } = params
  const { error } = await supabase.from('spotting_photos').insert({
    spotting_id: spottingId,
    user_id: userId,
    storage_path: storagePath,
    is_primary: isPrimary,
    sort_order: sortOrder,
  })
  if (error) throw new Error(error.message)
}

export async function fetchSpottingPhotos(spottingId: string): Promise<SpottingPhotoRow[]> {
  const { data, error } = await supabase
    .from('spotting_photos')
    .select('id, storage_path, is_primary, sort_order')
    .eq('spotting_id', spottingId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []) as SpottingPhotoRow[]
}

export async function fetchPrimarySpottingPhoto(spottingId: string): Promise<string | null> {
  const rows = await fetchSpottingPhotos(spottingId)
  const primary = rows.find((r) => r.is_primary) ?? rows[0]
  return primary?.storage_path ?? null
}

/** Batch fetch primary storage_path for many spottings. Returns map spottingId -> storage_path (or missing if none). */
export async function fetchSpottingPhotosForSpottingIds(
  spottingIds: string[]
): Promise<Map<string, string>> {
  if (spottingIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('spotting_photos')
    .select('spotting_id, storage_path, is_primary, sort_order')
    .in('spotting_id', spottingIds)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return new Map()

  const bySpotting = new Map<string, { storage_path: string; is_primary: boolean; sort_order: number }[]>()
  for (const row of data ?? []) {
    const sid = row.spotting_id as string
    if (!bySpotting.has(sid)) bySpotting.set(sid, [])
    bySpotting.get(sid)!.push({
      storage_path: row.storage_path as string,
      is_primary: (row.is_primary as boolean) ?? false,
      sort_order: (row.sort_order as number) ?? 0,
    })
  }

  const result = new Map<string, string>()
  for (const sid of spottingIds) {
    const list = bySpotting.get(sid)
    const primary = list?.find((r) => r.is_primary) ?? list?.[0]
    if (primary) result.set(sid, primary.storage_path)
  }
  return result
}

/** Upload a new photo for a spotting and insert row. Returns new photo id or null. */
export async function addSpottingPhoto(
  spottingId: string,
  userId: string,
  file: UploadSpottingPhotoFile
): Promise<{ photoId: string; storagePath: string } | null> {
  const results = await addSpottingPhotos(spottingId, userId, [file])
  return results[0] ?? null
}

/**
 * Add multiple photos to an existing spotting. Fetches current max(sort_order), uploads each file,
 * inserts rows with sort_order = max+1, max+2, ... and is_primary = false.
 * Returns array of { photoId, storagePath } for each successful upload (same order as files).
 */
export async function addSpottingPhotos(
  spottingId: string,
  userId: string,
  files: UploadSpottingPhotoFile[]
): Promise<Array<{ photoId: string; storagePath: string }>> {
  if (files.length === 0) return []
  const existing = await fetchSpottingPhotos(spottingId)
  const maxSortOrder = existing.length === 0
    ? -1
    : Math.max(...existing.map((r) => r.sort_order ?? 0))
  const results: Array<{ photoId: string; storagePath: string }> = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadSpottingPhoto(userId, spottingId, file)
    if (!result) continue
    const sortOrder = maxSortOrder + 1 + i
    const { data: inserted, error } = await supabase
      .from('spotting_photos')
      .insert({
        spotting_id: spottingId,
        user_id: userId,
        storage_path: result.storagePath,
        is_primary: false,
        sort_order: sortOrder,
      })
      .select('id')
      .single()
    if (error || !inserted?.id) continue
    results.push({ photoId: inserted.id as string, storagePath: result.storagePath })
  }
  return results
}

/** Set one photo as primary; clear is_primary on others for this spotting. */
export async function setPrimarySpottingPhoto(spottingId: string, photoId: string): Promise<void> {
  const { error: clearErr } = await supabase
    .from('spotting_photos')
    .update({ is_primary: false })
    .eq('spotting_id', spottingId)
  if (clearErr) throw new Error(clearErr.message)
  const { error: setErr } = await supabase
    .from('spotting_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('spotting_id', spottingId)
  if (setErr) throw new Error(setErr.message)
}

/** Set one photo as primary (alias). */
export const setPrimary = setPrimarySpottingPhoto

/** Delete photo: remove from storage then delete row. */
export async function deleteSpottingPhoto(photoId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from('spotting_photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()
  if (fetchErr || !row?.storage_path) throw new Error('Photo not found')
  const path = row.storage_path as string
  await supabase.storage.from('spotting-photos').remove([path])
  invalidateSignedUrlCache(path)
  const { error: delErr } = await supabase.from('spotting_photos').delete().eq('id', photoId)
  if (delErr) throw new Error(delErr.message)
}

/** Delete photo (alias). */
export const deletePhoto = deleteSpottingPhoto
