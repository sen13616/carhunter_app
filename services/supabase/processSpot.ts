import { supabase } from '../../lib/supabase'
import type { IdentifyResponse, SpottedCar, ProfileRow } from '../../types'
import { createCarKey } from '../../utils/carKey'
import { deriveEntitlements } from '../entitlements'
import { tryConsumeSpot } from './quota'
import { insertSpotting, isDuplicateSpotting, mapSpottingRowToSpottedCar } from './spottings'
import { uploadSpottingPhoto } from './storage'
import { insertSpottingPhotoRow } from './spottingPhotos'

export type { ProfileRow } from '../../types'

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isYesterdayLocal(a: Date, b: Date): boolean {
  const y = new Date(b)
  y.setDate(y.getDate() - 1)
  return isSameLocalDay(a, y)
}

export type ProcessSpotParams = {
  profile: ProfileRow
  source: 'camera' | 'upload'
  photoUri: string
  additionalPhotoUris?: string[]
  identifyResult: IdentifyResponse
  edits?: {
    make: string
    model: string
    trim: string
    year: number
  }
  location?: string
  notes?: string
}

export type ProcessSpotResult =
  | { status: 'limit'; limit: number; used: number; remaining: number }
  | { status: 'duplicate' }
  | { status: 'error'; message: string }
  | { status: 'success'; spot: SpottedCar; updatedProfile: ProfileRow; gainedXp: number }

export async function processSpot(params: ProcessSpotParams): Promise<ProcessSpotResult> {
  const { profile, source, photoUri, additionalPhotoUris, identifyResult, edits, location, notes } = params

  const entitlements = deriveEntitlements(profile)
  let usedAfterConsume = typeof profile.daily_spots_used === 'number' ? profile.daily_spots_used : 0
  if (!entitlements.isSubscribed) {
    const consume = await tryConsumeSpot(profile.id, entitlements.dailyLimit)
    if (!consume.allowed) {
      return {
        status: 'limit',
        limit: entitlements.dailyLimit,
        used: consume.used,
        remaining: Math.max(0, entitlements.dailyLimit - consume.used),
      }
    }
    usedAfterConsume = consume.used
  }

  const make = edits?.make ?? identifyResult.identification.make
  const model = edits?.model ?? identifyResult.identification.model
  const trim = edits?.trim ?? identifyResult.identification.trim ?? ''
  const year = edits?.year ?? identifyResult.identification.year
  const colour = identifyResult.identification.colour ?? ''

  const carKey = createCarKey({ make, model, trim, year, colour })

  const dup = await isDuplicateSpotting({ userId: profile.id, make, model, trim, year, colour })
  if (dup) return { status: 'duplicate' }

  const baseXp = source === 'camera' ? identifyResult.xp.total_xp : 0
  const streakMultiplier = entitlements.streakMultiplierEnabled ? entitlements.streakMultiplier : 1
  const xpAmount = Math.round(baseXp * streakMultiplier)
  const xpBreakdown = entitlements.streakMultiplierEnabled && streakMultiplier > 1
    ? `${identifyResult.xp.breakdown ?? ''} × streak ${streakMultiplier}x`.trim()
    : (identifyResult.xp.breakdown ?? null)

  const allPhotoUris = additionalPhotoUris && additionalPhotoUris.length > 0 ? [photoUri, ...additionalPhotoUris] : [photoUri]

  const inserted = await insertSpotting({
    user_id: profile.id,
    source,
    photo_uri: '',
    photo_uris: [],
    make,
    model,
    trim,
    year,
    colour,
    rarity: identifyResult.specs.rarity_tier,
    location: location?.trim() ? location.trim() : null,
    notes: notes?.trim() ? notes.trim() : null,
    uncertain: identifyResult.identification.uncertain,
    horsepower: identifyResult.specs.horsepower,
    engine: identifyResult.specs.engine,
    zero_to_100_kmh: identifyResult.specs.zero_to_100_kmh,
    base_price_usd: identifyResult.specs.base_price_usd,
    xp_base: identifyResult.xp.base_xp,
    multipliers: identifyResult.xp.multipliers,
    xp_total: xpAmount,
    xp_breakdown: xpBreakdown,
    car_key: carKey,
  })

  if (!inserted) return { status: 'error', message: 'Failed to save spot.' }

  const spottingId = inserted.id as string
  const userId = profile.id
  let firstStoragePath: string | null = null

  for (let i = 0; i < allPhotoUris.length; i++) {
    const uri = allPhotoUris[i]
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
    const uploadResult = await uploadSpottingPhoto(userId, spottingId, { uri, mimeType }, ext)
    if (uploadResult) {
      if (i === 0) firstStoragePath = uploadResult.storagePath
      await insertSpottingPhotoRow({
        spottingId,
        userId,
        storagePath: uploadResult.storagePath,
        isPrimary: i === 0,
        sortOrder: i,
      })
    }
  }

  if (firstStoragePath) {
    await supabase.from('spottings').update({ photo_uri: firstStoragePath }).eq('id', spottingId)
  }

  const nowIso = new Date().toISOString()
  const prevLast = profile.last_spotted_at ? new Date(profile.last_spotted_at) : null
  const now = new Date(nowIso)

  const prevStreak = typeof profile.streak_count === 'number' ? profile.streak_count : 0
  let nextStreak = prevStreak
  if (!prevLast) nextStreak = 1
  else if (isSameLocalDay(prevLast, now)) nextStreak = prevStreak
  else if (isYesterdayLocal(prevLast, now)) nextStreak = prevStreak + 1
  else nextStreak = 1

  const prevXp = typeof profile.xp === 'number' ? profile.xp : 0

  const { data: updated, error: updateErr } = await supabase
    .from('profiles')
    .update({
      xp: prevXp + xpAmount,
      streak_count: nextStreak,
      last_spotted_at: nowIso,
    })
    .eq('id', profile.id)
    .select('*')
    .single()

  const updatedProfile = (updateErr || !updated) ? ({
    ...profile,
    xp: prevXp + xpAmount,
    daily_spots_used: usedAfterConsume,
    streak_count: nextStreak,
    last_spotted_at: nowIso,
  } as ProfileRow) : (updated as ProfileRow)

  const spot = mapSpottingRowToSpottedCar(inserted)
  return { status: 'success', spot, updatedProfile, gainedXp: xpAmount }
}
