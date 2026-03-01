import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SpottedCar, User, Settings } from '../types'

const DEFAULT_SETTINGS: Settings = {
  cameraGrid: true,
  notifications: true,
  darkMode: true,
  garageViewMode: 'list',
}

const EMPTY_USER: User = {
  id: '',
  username: '',
  email: '',
  fullName: undefined,
  location: undefined,
  bio: undefined,
  avatarUrl: undefined,
  totalXP: 0,
  streak: 0,
  lastSpotDate: '',
}

interface StoreState {
  spots: SpottedCar[]
  addSpot: (spot: SpottedCar) => void
  setSpots: (spots: SpottedCar[]) => void
  removeSpot: (id: string) => void
  clearSpots: () => void

  user: User
  setUser: (user: User) => void
  updateXP: (amount: number) => void

  settings: Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void

  showPaywall: boolean
  setShowPaywall: (v: boolean) => void
  paywallLimitInfo: { used: number; limit: number } | null
  setPaywallLimitInfo: (info: { used: number; limit: number } | null) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      spots: [],
      addSpot: (spot) => set((state) => ({ spots: [spot, ...state.spots] })),
      setSpots: (spots) => set({ spots }),
      removeSpot: (id) => set((state) => ({ spots: state.spots.filter((s) => s.id !== id) })),
      clearSpots: () => set({ spots: [] }),

      user: EMPTY_USER,
      setUser: (user) => set({ user }),
      updateXP: (amount) =>
        set((state) => {
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86_400_000).toDateString()
          const { user } = state
          let streak = user.streak
          if (user.lastSpotDate === yesterday) streak += 1
          else if (user.lastSpotDate !== today) streak = 1
          return { user: { ...user, totalXP: user.totalXP + amount, streak, lastSpotDate: today } }
        }),

      settings: DEFAULT_SETTINGS,
      setSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      showPaywall: false,
      setShowPaywall: (v) => set({ showPaywall: v, ...(v ? {} : { paywallLimitInfo: null as { used: number; limit: number } | null }) }),
      paywallLimitInfo: null,
      setPaywallLimitInfo: (info) => set({ paywallLimitInfo: info }),
    }),
    {
      name: 'carspotter-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<StoreState> | undefined
        const mergedSettings = { ...currentState.settings, ...(p?.settings ?? {}) }
        return { ...currentState, ...p, settings: mergedSettings, spots: currentState.spots, user: currentState.user }
      },
    }
  )
)
