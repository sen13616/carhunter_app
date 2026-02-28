import { supabase } from '../../lib/supabase'

export type ProfileForLimit = {
  id: string
  is_subscribed?: boolean | null
  plan?: string | null
  extra_spots?: number | null
  daily_spots_used?: number | null
  last_spotted_at?: string | null
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function getDailyLimit(profile: ProfileForLimit): number {
  const subscribed = profile.is_subscribed === true || profile.plan === 'subscriber'
  if (subscribed) return Number.POSITIVE_INFINITY
  const extra = typeof profile.extra_spots === 'number' ? profile.extra_spots : 0
  return 3 + Math.max(0, extra)
}

export async function ensureDailySpotReset(profile: ProfileForLimit): Promise<ProfileForLimit> {
  if (!profile.last_spotted_at) return profile

  const last = new Date(profile.last_spotted_at)
  const now = new Date()
  if (Number.isNaN(last.getTime())) return profile

  if (isSameLocalDay(last, now)) return profile

  const { data, error } = await supabase
    .from('profiles')
    .update({ daily_spots_used: 0 })
    .eq('id', profile.id)
    .select('*')
    .single()

  if (error || !data) {
    // If we can't reset on backend, fall back to a local reset for the current session.
    return { ...profile, daily_spots_used: 0 }
  }

  return data as ProfileForLimit
}

export type CanUserSpotResult = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  profile: ProfileForLimit
}

export async function canUserSpot(profile: ProfileForLimit): Promise<CanUserSpotResult> {
  const p = await ensureDailySpotReset(profile)
  const limit = getDailyLimit(p)
  const used = typeof p.daily_spots_used === 'number' ? p.daily_spots_used : 0

  if (!Number.isFinite(limit)) {
    return { allowed: true, used, limit, remaining: Number.POSITIVE_INFINITY, profile: p }
  }

  const remaining = Math.max(0, limit - used)
  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    profile: p,
  }
}
