import { supabase } from '../../lib/supabase'
import type { SpottedCar, RarityLevel, XpMultipliers } from '../../types'
import { createCarKey } from '../../utils/carKey'

export type SpottingRow = Record<string, any>

export function mapSpottingRowToSpottedCar(row: SpottingRow): SpottedCar {
  const make = String(row.make ?? row.prediction_make ?? row.car_make ?? '')
  const model = String(row.model ?? row.prediction_model ?? row.car_model ?? '')
  const trim = String(row.trim ?? '')
  const year = Number(row.year ?? row.car_year ?? 0)
  const colour = String(row.colour ?? row.color ?? '')
  const rarity = (row.rarity ?? row.rarity_tier ?? 'Common') as RarityLevel

  const createdAt = String(row.created_at ?? row.createdAt ?? new Date().toISOString())
  const photoUri = String(row.photo_uri ?? row.photoUri ?? '')

  const multipliers: XpMultipliers | undefined = row.multipliers ?? undefined

  const carKey = row.car_key ?? row.carKey ?? createCarKey({ make, model, trim, year, colour })

  return {
    id: String(row.id ?? ''),
    photoUri,
    photoUris: row.photo_uris ?? row.photoUris ?? undefined,
    prediction: { make, model, year, confidence: Number(row.confidence ?? 95) },
    allPredictions: [{ make, model, year, confidence: Number(row.confidence ?? 95) }],
    dateSpotted: row.date_spotted ?? new Date(createdAt).toDateString(),
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
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
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

export async function fetchSpottingsForUser(userId: string): Promise<SpottedCar[]> {
  const { data, error } = await supabase
    .from('spottings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as SpottingRow[]).map(mapSpottingRowToSpottedCar)
}

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
