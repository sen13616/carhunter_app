import { supabase } from '../../lib/supabase'

export type TryConsumeSpotResult = { allowed: boolean; used: number }

/**
 * Atomically consume one daily spot. Resets count when date changes.
 * Only use when user is not subscribed (subscribed = unlimited).
 */
export async function tryConsumeSpot(userId: string, allowedLimit: number): Promise<TryConsumeSpotResult> {
  if (!Number.isFinite(allowedLimit) || allowedLimit < 1) {
    return { allowed: false, used: 0 }
  }
  const { data, error } = await supabase.rpc('try_consume_spot', {
    p_user_id: userId,
    p_allowed: Math.floor(allowedLimit),
  })
  if (error) {
    console.warn('[quota] try_consume_spot error', error.message)
    return { allowed: false, used: 0 }
  }
  const allowed = !!data?.allowed
  const used = typeof data?.used === 'number' ? data.used : 0
  return { allowed, used }
}
