import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemeId, ThemeTokens } from '../constants/theme'
import { THEMES, THEME_STORAGE_KEY, DEFAULT_THEME_ID, RARITY_COLORS, RARITY_ORDER } from '../constants/theme'

type ThemeContextValue = {
  themeId: ThemeId
  colors: ThemeTokens
  setThemeId: (id: ThemeId) => Promise<void>
  rarityColors: typeof RARITY_COLORS
  rarityOrder: readonly string[]
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  colors: THEMES[DEFAULT_THEME_ID],
  setThemeId: async () => {},
  rarityColors: RARITY_COLORS,
  rarityOrder: RARITY_ORDER,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID)
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && (stored === 'defaultBlue' || stored === 'dark' || stored === 'light')) {
        setThemeIdState(stored as ThemeId)
      }
    })
  }, [])

  const setThemeId = useCallback(async (id: ThemeId) => {
    setThemeIdState(id)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, id)
  }, [])

  const colors = THEMES[themeId]
  const value: ThemeContextValue = {
    themeId,
    colors,
    setThemeId,
    rarityColors: RARITY_COLORS,
    rarityOrder: RARITY_ORDER,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { THEMES }
