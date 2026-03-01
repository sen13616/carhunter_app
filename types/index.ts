export type RarityLevel = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary'

export interface Prediction { make: string, model: string, year: number, confidence: number }

export interface CarDetails { make: string, model: string, year: number, horsepower: number, engineType: string, yearsOfProduction: string, rarity: RarityLevel }

export interface XpMultipliers { location: number; condition: number; modifications: number; photo_quality: number }

export interface IdentifyResponse {
  identification: {
    make: string
    model: string
    trim: string
    year: number
    colour: string
    uncertain: boolean
  }
  specs: {
    rarity_tier: RarityLevel
    horsepower: number
    engine: string
    zero_to_100_kmh: number
    base_price_usd: number
  }
  xp: {
    base_xp: number
    multipliers: XpMultipliers
    total_xp: number
    breakdown: string
  }
}

export interface SpottedCar {
  id: string
  photoUri: string
  photoUris?: string[]
  prediction: Prediction
  allPredictions: Prediction[]
  dateSpotted: string
  rarity: RarityLevel
  carDetails: CarDetails
  source?: 'camera' | 'upload' | 'legacy'
  // User-entered fields
  location?: string
  notes?: string
  // New identification fields (optional for backwards compatibility)
  trim?: string
  colour?: string
  uncertain?: boolean
  horsepower?: number
  engine?: string
  zeroToHundred?: number
  basePriceUsd?: number
  baseXp?: number
  multipliers?: XpMultipliers
  xpBreakdown?: string
  totalXp?: number
}

export interface UserStats { totalXP: number; streak: number; lastSpotDate: string }

export interface User {
  id: string
  username: string
  email: string
  fullName?: string
  location?: string
  bio?: string
  avatarUrl?: string
  totalXP: number
  streak: number
  lastSpotDate: string
}

export interface ProfileRow {
  id: string
  full_name: string | null
  username: string | null
  email?: string | null
  location?: string | null
  bio?: string | null
  avatar_url?: string | null
  xp?: number | null
  streak_count?: number | null
  last_spotted_at?: string | null
  rank_title?: string | null
  daily_spots_used?: number | null
  daily_spots_date?: string | null
  extra_spots?: number | null
  plan?: string | null
  is_subscribed?: boolean | null
  subscription?: string | null
}

export interface Settings { cameraGrid: boolean; notifications: boolean; darkMode: boolean; garageViewMode: 'list' | 'card' }

/** Legacy car from public.legacy_cars (display + list). */
export interface LegacyCar {
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
