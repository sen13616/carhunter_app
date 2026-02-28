import { supabase } from '../../lib/supabase'
import type { SpottedCar, RarityLevel, XpMultipliers } from '../../types'
import { createCarKey } from '../../utils/carKey'

export type SpottingRow = Record<string, any>

/** DB row shape for public.spottings (editable fields only for patch). */
export type Spotting = {
  id: string
  user_id: string
  make: string
  model: string
  rarity_tier: string | null
  condition: string | null
  is_modified: boolean | null
  location_name: string | null
  total_xp: number | null
  spotted_at: string | null
  trim: string | null
  year: number | null
  colour: string | null
  horsepower: number | null
  engine: string | null
  zero_to_100_kmh: number | null
  base_price_usd: number | null
  base_xp: number | null
  multiplier_location: number | null
  multiplier_condition: number | null
  multiplier_modifications: number | null
  multiplier_photo_quality: number | null
  xp_breakdown: string | null
  uncertain: boolean | null
  [key: string]: unknown
}

export type EditableSpottingPatch = Partial<Pick<Spotting, 'location_name' | 'condition' | 'is_modified' | 'colour' | 'year' | 'trim' | 'uncertain'>>

export function mapSpottingRowToSpottedCar(row: SpottingRow): SpottedCar {
  const make = String(row.make ?? row.prediction_make ?? row.car_make ?? '')
  const model = String(row.model ?? row.prediction_model ?? row.car_model ?? '')
  const trim = String(row.trim ?? '')
  const year = Number(row.year ?? row.car_year ?? 0)
  const colour = String(row.colour ?? row.color ?? '')
  const rarity = (row.rarity ?? row.rarity_tier ?? 'Common') as RarityLevel

  const createdAt = String(row.spotted_at ?? row.created_at ?? row.createdAt ?? new Date().toISOString())
  const photoUri = String(row.photo_uri ?? row.photoUri ?? '')

  const multipliers: XpMultipliers | undefined = row.multipliers ?? undefined

  const carKey = row.car_key ?? row.carKey ?? createCarKey({ make, model, trim, year, colour })

  return {
    id: String(row.id ?? ''),
    photoUri,
    photoUris: row.photo_uris ?? row.photoUris ?? undefined,
    prediction: { make, model, year, confidence: Number(row.confidence ?? 95) },
    allPredictions: [{ make, model, year, confidence: Number(row.confidence ?? 95) }],
    dateSpotted: row.date_spotted ?? (row.spotted_at ? new Date(row.spotted_at).toDateString() : null) ?? new Date(createdAt).toDateString(),
    rarity,
    carDetails: {
      make,
      model,
      year,
      horsepower: Number(row.horsepower ?? row.hp ?? 0),
      engineType: String(row.engine ?? row.engine_type ?? ''),
      yearsOfProduction: String(row.years_of_production ?? ''),
      rarity,
    },
    source: row.source ?? undefined,
    location: row.location_name ?? row.location ?? undefined,
    trim: trim || undefined,
    colour: colour || undefined,
    uncertain: row.uncertain ?? undefined,
    horsepower: row.horsepower ?? undefined,
    engine: row.engine ?? undefined,
    zeroToHundred: row.zero_to_hundred ?? row.zero_to_100_kmh ?? undefined,
    basePriceUsd: row.base_price_usd ?? undefined,
    baseXp: row.xp_base ?? row.base_xp ?? undefined,
    multipliers,
    xpBreakdown: row.xp_breakdown ?? row.breakdown ?? undefined,
    totalXp: row.xp_total ?? row.total_xp ?? undefined,
    carKey,
    createdAt,
  }
}

/** Garage list from public.spottings. Order by created_at (spotted_at if present). */
export async function fetchUserSpottings(userId: string): Promise<SpottedCar[]> {
  const { data, error } = await supabase
    .from('spottings')
    .select('*')
    .eq('user_id', userId)
    .order('spotted_at', { ascending: false })

  if (error || !data) return []
  return (data as SpottingRow[]).map(mapSpottingRowToSpottedCar)
}

export const fetchSpottingsForUser = fetchUserSpottings

export async function isDuplicateSpotting(params: {
  userId: string
  make: string
  model: string
  trim: string
  year: number
  colour: string
}): Promise<boolean> {
  const { userId, make, model, trim, year, colour } = params
  const { data, error } = await supabase
    .from('spottings')
    .select('id')
    .eq('user_id', userId)
    .eq('make', make)
    .eq('model', model)
    .eq('trim', trim)
    .eq('year', year)
    .eq('colour', colour)
    .limit(1)

  if (error) return false
  return Array.isArray(data) && data.length > 0
}

export type InsertSpottingInput = {
  user_id: string
  source: 'camera' | 'upload' | 'legacy'
  photo_uri: string
  photo_uris?: string[]
  make: string
  model: string
  trim: string
  year: number
  colour: string
  rarity: RarityLevel
  location?: string | null
  notes?: string | null
  uncertain?: boolean
  horsepower?: number | null
  engine?: string | null
  zero_to_100_kmh?: number | null
  base_price_usd?: number | null
  xp_base?: number | null
  multipliers?: XpMultipliers | null
  xp_total?: number | null
  xp_breakdown?: string | null
  car_key?: string
}

export async function insertSpotting(input: InsertSpottingInput): Promise<SpottingRow | null> {
  const { data, error } = await supabase
    .from('spottings')
    .insert(input)
    .select('*')
    .single()

  if (error || !data) return null
  return data as SpottingRow
}

/** Fetch a single spotting by id. Returns null if not found or error. */
export async function fetchSpottingById(spottingId: string): Promise<SpottingRow | null> {
  const { data, error } = await supabase
    .from('spottings')
    .select('*')
    .eq('id', spottingId)
    .single()
  if (error || !data) return null
  return data as SpottingRow
}

const EDITABLE_KEYS: (keyof EditableSpottingPatch)[] = [
  'location_name', 'condition', 'is_modified', 'colour', 'year', 'trim', 'uncertain',
]

/** Update only editable fields. patch may only contain allowed keys. */
export async function updateSpotting(
  spottingId: string,
  userId: string,
  patch: EditableSpottingPatch
): Promise<SpottingRow | null> {
  const allowed: Record<string, unknown> = {}
  for (const key of EDITABLE_KEYS) {
    if (patch[key] !== undefined) {
      if (key === 'year' && patch[key] !== null) {
        const n = Number(patch[key])
        allowed[key] = Number.isNaN(n) ? null : n
      } else {
        allowed[key] = patch[key]
      }
    }
  }
  if (Object.keys(allowed).length === 0) return fetchSpottingById(spottingId)
  const { data, error } = await supabase
    .from('spottings')
    .update(allowed)
    .eq('id', spottingId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error || !data) return null
  return data as SpottingRow
}
