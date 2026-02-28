import type { IdentifyResponse } from '../types'
import type { CongratsPayload, CongratsXpItemKey } from '../store/useCongratsStore'
import { getCurrentRank, getNextRank } from '../services/gamification'

const XP_LABELS: Record<CongratsXpItemKey, string> = {
  base: 'Base XP',
  location: 'Location',
  first_encounter: 'First encounter',
  condition: 'Condition',
  mods: 'Mods',
  hq_photos: 'HQ photos',
}

/** Build XP items from real identify result. Base always; bonus lines only if multiplier > 1 and xp > 0. */
function buildXpItems(identifyResult: IdentifyResponse): Array<{ key: CongratsXpItemKey; label: string; xp: number }> {
  const { base_xp, multipliers, total_xp } = identifyResult.xp
  const items: Array<{ key: CongratsXpItemKey; label: string; xp: number }> = []

  items.push({ key: 'base', label: XP_LABELS.base, xp: base_xp })

  const { location: loc, condition: cond, modifications: mods, photo_quality: photo } = multipliers
  const totalFromMultipliers = loc * cond * mods * photo
  if (totalFromMultipliers <= 1) {
    return items
  }

  const base = base_xp
  let locationXp = 0
  let conditionXp = 0
  let modsXp = 0
  let hqXp = 0
  if (loc > 1) locationXp = base * (loc - 1) * cond * mods * photo
  if (cond > 1) conditionXp = base * loc * (cond - 1) * mods * photo
  if (mods > 1) modsXp = base * loc * cond * (mods - 1) * photo
  if (photo > 1) hqXp = base * loc * cond * mods * (photo - 1)

  if (locationXp > 0) items.push({ key: 'location', label: XP_LABELS.location, xp: Math.round(locationXp) })
  if (conditionXp > 0) items.push({ key: 'condition', label: XP_LABELS.condition, xp: Math.round(conditionXp) })
  if (modsXp > 0) items.push({ key: 'mods', label: XP_LABELS.mods, xp: Math.round(modsXp) })
  if (hqXp > 0) items.push({ key: 'hq_photos', label: XP_LABELS.hq_photos, xp: Math.round(hqXp) })

  return items
}

export type BuildCongratsPayloadParams = {
  spottingId: string
  identifyResult: IdentifyResponse
  edits: { make: string; model: string; trim: string; year: number }
  gainedXp: number
  updatedProfileXp: number
}

export function buildCongratsPayload(params: BuildCongratsPayloadParams): CongratsPayload {
  const { spottingId, identifyResult, edits, gainedXp, updatedProfileXp } = params
  const { make, model, trim, year } = edits

  const displayTitle = `${year} ${make}`
  const displaySubtitle = [model, trim].filter(Boolean).join(' ').trim() || ''

  const xpItems = buildXpItems(identifyResult)
  const totalXpEarned = gainedXp

  const payload: CongratsPayload = {
    spottingId,
    car: { displayTitle, displaySubtitle },
    xpItems,
    totalXpEarned,
  }

  const currentRank = getCurrentRank(updatedProfileXp)
  const nextRank = getNextRank(updatedProfileXp)
  if (nextRank) {
    payload.level = {
      level: currentRank.rank,
      currentXp: updatedProfileXp,
      nextLevelXp: nextRank.xpRequired,
    }
  }

  return payload
}
