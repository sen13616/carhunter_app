export const RANKS = [
  { rank: 1, title: 'Beginner', xpRequired: 0 },
  { rank: 2, title: 'Novice', xpRequired: 100 },
  { rank: 3, title: 'Cruiser', xpRequired: 250 },
  { rank: 4, title: 'Scout', xpRequired: 500 },
  { rank: 5, title: 'Hunter', xpRequired: 850 },
  { rank: 6, title: 'Tracker', xpRequired: 1300 },
  { rank: 7, title: 'Spotter', xpRequired: 1900 },
  { rank: 8, title: 'Specialist', xpRequired: 2700 },
  { rank: 9, title: 'Elite', xpRequired: 3700 },
  { rank: 10, title: 'Veteran', xpRequired: 5000 },
  { rank: 11, title: 'Master', xpRequired: 6500 },
  { rank: 12, title: 'Grand Master', xpRequired: 8500 },
  { rank: 13, title: 'Legend', xpRequired: 11000 },
  { rank: 14, title: 'Icon', xpRequired: 15000 },
]

export const XP_FREE = 10

export const XP_PAID: Record<string, number> = { Common: 10, Uncommon: 20, Rare: 40, 'Very Rare': 75, Legendary: 150 }

export function getCurrentRank(xp: number) {
  return RANKS.slice().reverse().find(rank => xp >= rank.xpRequired) || RANKS[0]
}

export function getNextRank(xp: number) {
  const current = getCurrentRank(xp)
  const nextIndex = RANKS.indexOf(current) + 1
  return nextIndex < RANKS.length ? RANKS[nextIndex] : null
}

export function getProgressPercent(xp: number): number {
  const current = getCurrentRank(xp)
  const next = getNextRank(xp)
  if (!next) return 100
  const currentXP = xp - current.xpRequired
  const totalToNext = next.xpRequired - current.xpRequired
  return (currentXP / totalToNext) * 100
}

export function getXPToNextRank(xp: number): number {
  const next = getNextRank(xp)
  return next ? next.xpRequired - xp : 0
}