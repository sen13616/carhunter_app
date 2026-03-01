import type { ProfileRow } from '../types'

export type Entitlements = {
  isSubscribed: boolean
  dailyLimit: number
  streakMultiplierEnabled: boolean
  streakMultiplier: number
  /** Current streak days from profile */
  streakDays: number
  /** Subscription type: 'monthly' | 'lifetime' | 'one_time' | null */
  subscription: string | null
}

/**
 * Single source of truth for monetization + streak multiplier.
 * - Free: 3 spots/day
 * - One-time (extra_spots=7): 10 spots/day
 * - Monthly: unlimited + streak multiplier (2x when streak >= 7)
 */
export function deriveEntitlements(profile: ProfileRow | null): Entitlements {
  if (!profile) {
    return {
      isSubscribed: false,
      dailyLimit: 3,
      streakMultiplierEnabled: false,
      streakMultiplier: 1,
      streakDays: 0,
      subscription: null,
    }
  }

  const isSubscribed = profile.is_subscribed === true
  const streakDays = typeof profile.streak_count === 'number' ? profile.streak_count : 0

  let dailyLimit: number
  if (isSubscribed) {
    dailyLimit = Number.POSITIVE_INFINITY
  } else {
    const extra = typeof profile.extra_spots === 'number' ? profile.extra_spots : 0
    dailyLimit = 3 + Math.max(0, extra)
  }

  const streakMultiplierEnabled = isSubscribed
  const streakMultiplier = streakMultiplierEnabled && streakDays >= 7 ? 2 : 1

  return {
    isSubscribed,
    dailyLimit,
    streakMultiplierEnabled,
    streakMultiplier,
    streakDays,
    subscription: profile.subscription ?? null,
  }
}
