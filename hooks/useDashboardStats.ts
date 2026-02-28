import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getCurrentRank, getNextRank, getProgressPercent, getXPToNextRank } from '../services/gamification'

export function useDashboardStats() {
  const user = useStore((s) => s.user)
  const spots = useStore((s) => s.spots)

  return useMemo(() => {
    const currentRank = getCurrentRank(user.totalXP)
    const nextRank = getNextRank(user.totalXP)
    const progressPercent = getProgressPercent(user.totalXP)
    const xpToNext = getXPToNextRank(user.totalXP)

    const legendaryCount = spots.filter((c) => c.rarity === 'Legendary').length
    const locations = spots.map((c) => c.location).filter((s): s is string => Boolean(s))
    const uniqueLocations = new Set(locations).size

    return {
      user: {
        name: user.fullName ?? user.username ?? 'Driver',
        profileImage: user.avatarUrl ?? null,
        xp: user.totalXP,
        nextRankXp: nextRank?.xpRequired ?? currentRank.xpRequired,
        rankTitle: currentRank.title,
        nextRankTitle: nextRank?.title ?? currentRank.title,
      },
      progressPercent,
      xpToNext,
      stats: {
        totalSpots: spots.length,
        legendaryCount,
        countriesCount: uniqueLocations,
      },
    }
  }, [user.totalXP, user.username, user.fullName, user.avatarUrl, spots])
}
