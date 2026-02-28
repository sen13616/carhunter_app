import { supabase } from '../../lib/supabase'
import { uploadLegacyCarPhoto, type UploadLegacyCarPhotoFile } from './storage'
import { invalidateSignedUrlCache } from './storage'

const BUCKET = 'spotting-photos'

export type LegacyCarPhotoRow = {
  id: string
  legacy_car_id: string
  storage_path: string
  is_primary?: boolean
  sort_order?: number
}

export async function fetchLegacyCarPhotos(legacyCarId: string): Promise<LegacyCarPhotoRow[]> {
  const { data, error } = await supabase
    .from('legacy_car_photos')
    .select('id, legacy_car_id, storage_path, is_primary, sort_order')
    .eq('legacy_car_id', legacyCarId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []) as LegacyCarPhotoRow[]
}

/** Batch fetch primary storage_path for many legacy cars. Returns map legacyCarId -> storage_path. */
export async function fetchLegacyCarPhotosForLegacyCarIds(
  legacyCarIds: string[]
): Promise<Map<string, string>> {
  if (legacyCarIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('legacy_car_photos')
    .select('legacy_car_id, storage_path, is_primary, sort_order')
    .in('legacy_car_id', legacyCarIds)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return new Map()

  const byCar = new Map<string, { storage_path: string; is_primary: boolean; sort_order: number }[]>()
  for (const row of data ?? []) {
    const cid = row.legacy_car_id as string
    if (!byCar.has(cid)) byCar.set(cid, [])
    byCar.get(cid)!.push({
      storage_path: row.storage_path as string,
      is_primary: (row.is_primary as boolean) ?? false,
      sort_order: (row.sort_order as number) ?? 0,
    })
  }

  const result = new Map<string, string>()
  for (const cid of legacyCarIds) {
    const list = byCar.get(cid)
    const primary = list?.find((r) => r.is_primary) ?? list?.[0]
    if (primary) result.set(cid, primary.storage_path)
  }
  return result
}

/**
 * Add photos to a legacy car. Uploads to ${userId}/legacy/${legacyCarId}/${photoId}.jpg.
 * If no photos existed before, first inserted is is_primary=true.
 */
export async function addLegacyCarPhotos(
  legacyCarId: string,
  userId: string,
  files: UploadLegacyCarPhotoFile[]
): Promise<Array<{ photoId: string; storagePath: string }>> {
  if (files.length === 0) return []
  const existing = await fetchLegacyCarPhotos(legacyCarId)
  const maxSortOrder = existing.length === 0 ? -1 : Math.max(...existing.map((r) => r.sort_order ?? 0))
  const results: Array<{ photoId: string; storagePath: string }> = []
  const setFirstPrimary = existing.length === 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadLegacyCarPhoto(userId, legacyCarId, file)
    if (!result) continue
    const sortOrder = maxSortOrder + 1 + i
    const isPrimary = setFirstPrimary && i === 0
    const { data: inserted, error } = await supabase
      .from('legacy_car_photos')
      .insert({
        legacy_car_id: legacyCarId,
        user_id: userId,
        storage_path: result.storagePath,
        is_primary: isPrimary,
        sort_order: sortOrder,
      })
      .select('id')
      .single()
    if (error || !inserted?.id) continue
    results.push({ photoId: inserted.id as string, storagePath: result.storagePath })
  }
  return results
}

export async function setPrimaryLegacyCarPhoto(legacyCarId: string, photoId: string): Promise<void> {
  const { error: clearErr } = await supabase
    .from('legacy_car_photos')
    .update({ is_primary: false })
    .eq('legacy_car_id', legacyCarId)
  if (clearErr) throw new Error(clearErr.message)
  const { error: setErr } = await supabase
    .from('legacy_car_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('legacy_car_id', legacyCarId)
  if (setErr) throw new Error(setErr.message)
}

/** Delete photo: remove from storage then delete row; invalidate signed URL cache. */
export async function deleteLegacyCarPhoto(photoId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from('legacy_car_photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()
  if (fetchErr || !row?.storage_path) throw new Error('Photo not found')
  const path = row.storage_path as string
  await supabase.storage.from(BUCKET).remove([path])
  invalidateSignedUrlCache(path)
  const { error: delErr } = await supabase.from('legacy_car_photos').delete().eq('id', photoId)
  if (delErr) throw new Error(delErr.message)
}
