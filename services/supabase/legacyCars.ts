import { supabase } from '../../lib/supabase'

export type LegacyCarRow = {
  id: string
  user_id: string
  make: string
  model: string
  year: number | null
  trim: string | null
  colour: string | null
  rarity_tier: string | null
  created_at: string | null
}

export type LegacyCar = LegacyCarRow

export type CreateLegacyCarFields = {
  make: string
  model: string
  year?: number | null
  trim?: string | null
  colour?: string | null
  rarity_tier?: string | null
}

export type UpdateLegacyCarPatch = Partial<Pick<LegacyCar, 'make' | 'model' | 'year' | 'trim' | 'colour' | 'rarity_tier'>>

export async function fetchLegacyCars(userId: string): Promise<LegacyCarRow[]> {
  const { data, error } = await supabase
    .from('legacy_cars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as LegacyCarRow[]
}

export async function createLegacyCar(
  userId: string,
  fields: CreateLegacyCarFields
): Promise<LegacyCarRow | null> {
  const { data, error } = await supabase
    .from('legacy_cars')
    .insert({
      user_id: userId,
      make: fields.make.trim(),
      model: fields.model.trim(),
      year: fields.year ?? null,
      trim: fields.trim?.trim() ?? null,
      colour: fields.colour?.trim() ?? null,
      rarity_tier: fields.rarity_tier?.trim() ?? null,
    })
    .select('*')
    .single()

  if (error || !data) return null
  return data as LegacyCarRow
}

export async function updateLegacyCar(
  legacyCarId: string,
  userId: string,
  patch: UpdateLegacyCarPatch
): Promise<LegacyCarRow | null> {
  const allowed: Record<string, unknown> = {}
  if (patch.make !== undefined) allowed.make = patch.make.trim()
  if (patch.model !== undefined) allowed.model = patch.model.trim()
  if (patch.year !== undefined) allowed.year = patch.year
  if (patch.trim !== undefined) allowed.trim = patch.trim?.trim() ?? null
  if (patch.colour !== undefined) allowed.colour = patch.colour?.trim() ?? null
  if (patch.rarity_tier !== undefined) allowed.rarity_tier = patch.rarity_tier?.trim() ?? null
  if (Object.keys(allowed).length === 0) {
    const { data } = await supabase.from('legacy_cars').select('*').eq('id', legacyCarId).eq('user_id', userId).single()
    return data as LegacyCarRow | null
  }

  const { data, error } = await supabase
    .from('legacy_cars')
    .update(allowed)
    .eq('id', legacyCarId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) return null
  return data as LegacyCarRow
}

export async function deleteLegacyCar(legacyCarId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_cars')
    .delete()
    .eq('id', legacyCarId)
    .eq('user_id', userId)
  return !error
}
