export type CongratsXpItemKey =
  | 'base'
  | 'location'
  | 'first_encounter'
  | 'condition'
  | 'mods'
  | 'hq_photos'

import { create } from 'zustand'

export type CongratsPayload = {
  spottingId: string
  car: {
    displayTitle: string
    displaySubtitle: string
  }
  xpItems: Array<{
    key: CongratsXpItemKey
    label: string
    xp: number
  }>
  totalXpEarned: number
  level?: {
    level: number
    currentXp: number
    nextLevelXp: number
  }
  trophy?: {
    title: string
    subtitle: string
    icon?: string
  }
}

interface CongratsState {
  payload: CongratsPayload | null
  setPayload: (payload: CongratsPayload) => void
  clearPayload: () => void
}

export const useCongratsStore = create<CongratsState>((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  clearPayload: () => set({ payload: null }),
}))
