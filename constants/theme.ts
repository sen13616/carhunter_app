export type ThemeId = 'defaultBlue' | 'dark' | 'light'

export interface ThemeTokens {
  name: ThemeId
  label: string
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  textMuted: string
  icon: string
  primary: string
  primaryText: string
  primaryMuted: string
  danger: string
  success: string
  shadow: string
  tabBarBg: string
  tabIcon: string
  tabIconActive: string
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  defaultBlue: {
    name: 'defaultBlue',
    label: 'Default Blue',
    bg: '#060B14',
    surface: '#0B1628',
    surface2: '#10213A',
    border: '#1B2B45',
    text: '#EAF1FF',
    textMuted: '#8FA3C6',
    icon: '#B7C6E6',
    primary: '#1F6BFF',
    primaryText: '#FFFFFF',
    primaryMuted: '#0E2C66',
    danger: '#FF4D4D',
    success: '#2ED573',
    shadow: '#000000',
    tabBarBg: '#07101F',
    tabIcon: '#6D83A8',
    tabIconActive: '#1F6BFF',
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    bg: '#0B0B0C',
    surface: '#141416',
    surface2: '#1B1B1F',
    border: '#2A2A30',
    text: '#F5F5F7',
    textMuted: '#A0A0AA',
    icon: '#D1D1D6',
    primary: '#FF7A18',
    primaryText: '#0B0B0C',
    primaryMuted: '#2A1A0B',
    danger: '#FF4D4D',
    success: '#2ED573',
    shadow: '#000000',
    tabBarBg: '#101012',
    tabIcon: '#7A7A86',
    tabIconActive: '#FF7A18',
  },
  light: {
    name: 'light',
    label: 'Light',
    bg: '#F7F8FA',
    surface: '#FFFFFF',
    surface2: '#F0F2F5',
    border: '#E3E6EB',
    text: '#121826',
    textMuted: '#6B7280',
    icon: '#374151',
    primary: '#12B981',
    primaryText: '#FFFFFF',
    primaryMuted: '#D7F5EA',
    danger: '#E11D48',
    success: '#12B981',
    shadow: '#000000',
    tabBarBg: '#FFFFFF',
    tabIcon: '#9CA3AF',
    tabIconActive: '#12B981',
  },
}

export const RARITY_COLORS: Record<string, string> = {
  Legendary: '#b45309',
  'Very Rare': '#7c3aed',
  Rare: '#1e3a8a',
  Uncommon: '#15803d',
  Common: '#374151',
}

export const RARITY_ORDER = ['Legendary', 'Very Rare', 'Rare', 'Uncommon', 'Common'] as const

export const THEME_STORAGE_KEY = 'app_theme'
export const DEFAULT_THEME_ID: ThemeId = 'dark'
