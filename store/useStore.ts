import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SpottedCar, User, Settings } from '../types'

// ─── Dummy initial data ───────────────────────────────────────────────────────

const DUMMY_SPOTS: SpottedCar[] = [
  {
    id: 'dummy-1',
    photoUri: '',
    prediction: { make: 'Ferrari', model: '488', year: 2019, confidence: 0.94 },
    allPredictions: [
      { make: 'Ferrari',     model: '488',     year: 2019, confidence: 0.94 },
      { make: 'Lamborghini', model: 'Huracán', year: 2020, confidence: 0.04 },
      { make: 'McLaren',     model: '570S',    year: 2019, confidence: 0.02 },
    ],
    dateSpotted: 'Mon Jan 13 2025',
    rarity: 'Legendary',
    carDetails: { make: 'Ferrari', model: '488', year: 2019, horsepower: 660, engineType: 'V8 Twin-Turbo', yearsOfProduction: '2015–2021', rarity: 'Legendary' },
    source: 'camera',
  },
  {
    id: 'dummy-2',
    photoUri: '',
    prediction: { make: 'Porsche', model: '911 GT3', year: 2022, confidence: 0.91 },
    allPredictions: [
      { make: 'Porsche', model: '911 GT3',     year: 2022, confidence: 0.91 },
      { make: 'Porsche', model: '718 Cayman',  year: 2021, confidence: 0.06 },
      { make: 'BMW',     model: 'M4',          year: 2022, confidence: 0.03 },
    ],
    dateSpotted: 'Wed Jan 15 2025',
    rarity: 'Very Rare',
    carDetails: { make: 'Porsche', model: '911 GT3', year: 2022, horsepower: 502, engineType: 'Flat-6', yearsOfProduction: '2021–present', rarity: 'Very Rare' },
    source: 'camera',
  },
  {
    id: 'dummy-3',
    photoUri: '',
    prediction: { make: 'BMW', model: 'M3', year: 2021, confidence: 0.88 },
    allPredictions: [
      { make: 'BMW',  model: 'M3',  year: 2021, confidence: 0.88 },
      { make: 'BMW',  model: 'M4',  year: 2021, confidence: 0.08 },
      { make: 'Audi', model: 'RS4', year: 2021, confidence: 0.04 },
    ],
    dateSpotted: 'Fri Jan 17 2025',
    rarity: 'Rare',
    carDetails: { make: 'BMW', model: 'M3', year: 2021, horsepower: 473, engineType: 'I6 Twin-Turbo', yearsOfProduction: '2021–present', rarity: 'Rare' },
    source: 'camera',
  },
  {
    id: 'dummy-4',
    photoUri: '',
    prediction: { make: 'Toyota', model: 'GR Supra', year: 2020, confidence: 0.85 },
    allPredictions: [
      { make: 'Toyota', model: 'GR Supra', year: 2020, confidence: 0.85 },
      { make: 'BMW',    model: 'Z4',       year: 2020, confidence: 0.10 },
      { make: 'Nissan', model: 'Z',        year: 2023, confidence: 0.05 },
    ],
    dateSpotted: 'Sun Jan 19 2025',
    rarity: 'Uncommon',
    carDetails: { make: 'Toyota', model: 'GR Supra', year: 2020, horsepower: 335, engineType: 'I6 Twin-Turbo', yearsOfProduction: '2019–present', rarity: 'Uncommon' },
    source: 'camera',
  },
  {
    id: 'dummy-5',
    photoUri: '',
    prediction: { make: 'Honda', model: 'Civic Type R', year: 2023, confidence: 0.82 },
    allPredictions: [
      { make: 'Honda',      model: 'Civic Type R', year: 2023, confidence: 0.82 },
      { make: 'Volkswagen', model: 'Golf R',       year: 2023, confidence: 0.12 },
      { make: 'Hyundai',    model: 'i30 N',        year: 2023, confidence: 0.06 },
    ],
    dateSpotted: 'Tue Jan 21 2025',
    rarity: 'Common',
    carDetails: { make: 'Honda', model: 'Civic Type R', year: 2023, horsepower: 315, engineType: 'I4 Turbo', yearsOfProduction: '2022–present', rarity: 'Common' },
    source: 'camera',
  },
]

const DUMMY_USER: User = {
  id: 'user-1',
  username: 'Alex Morgan',
  email: 'alex@carspotter.app',
  totalXP: 1250,
  streak: 7,
  lastSpotDate: new Date().toDateString(),
}

const DEFAULT_SETTINGS: Settings = {
  cameraGrid: true,
  notifications: true,
  darkMode: true,
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface StoreState {
  // Spots slice
  spots: SpottedCar[]
  addSpot: (spot: SpottedCar) => void
  removeSpot: (id: string) => void
  clearSpots: () => void

  // User slice
  user: User
  setUser: (user: User) => void
  updateXP: (amount: number) => void

  // Settings slice
  settings: Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Spots slice
      spots: DUMMY_SPOTS,
      addSpot: (spot) => set((state) => ({ spots: [spot, ...state.spots] })),
      removeSpot: (id) => set((state) => ({ spots: state.spots.filter((s) => s.id !== id) })),
      clearSpots: () => set({ spots: [] }),

      // User slice
      user: DUMMY_USER,
      setUser: (user) => set({ user }),
      updateXP: (amount) =>
        set((state) => {
          const today     = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86_400_000).toDateString()
          const { user }  = state
          let streak = user.streak
          if (user.lastSpotDate === yesterday) streak += 1
          else if (user.lastSpotDate !== today) streak = 1
          return { user: { ...user, totalXP: user.totalXP + amount, streak, lastSpotDate: today } }
        }),

      // Settings slice
      settings: DEFAULT_SETTINGS,
      setSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),
    }),
    {
      name: 'carspotter-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
