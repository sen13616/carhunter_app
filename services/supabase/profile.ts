import { supabase } from '../../lib/supabase'
import type { ProfileRow } from '../../types'

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) return null
  return data as ProfileRow
}

export function profileHasRequiredFields(profile: ProfileRow | null): boolean {
  if (!profile) return false
  const fullName = (profile.full_name ?? '').trim()
  const username = (profile.username ?? '').trim()
  return fullName.length > 0 && username.length >= 3
}

export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase()
  if (normalized.length < 3) return false
  let query = supabase.from('profiles').select('id').eq('username', normalized).limit(1)
  if (excludeUserId) query = query.neq('id', excludeUserId)
  const { data } = await query
  return !data || data.length === 0
}

export type UpsertProfileInput = {
  id: string
  full_name: string
  username: string
  location?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export async function upsertProfile(input: UpsertProfileInput): Promise<{ profile: ProfileRow | null; error: Error | null }> {
  const username = input.username.trim().toLowerCase()
  const fullName = input.full_name.trim()
  const available = await checkUsernameAvailability(username, input.id)
  if (!available) {
    return { profile: null, error: new Error('Username is already taken') }
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: input.id,
        full_name: fullName,
        username,
        location: input.location?.trim() || null,
        bio: input.bio?.trim() || null,
        avatar_url: input.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) return { profile: null, error }
  return { profile: data as ProfileRow, error: null }
}
