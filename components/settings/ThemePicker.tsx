import React from 'react'
import { View } from 'react-native'
import { useTheme } from '../../contexts/theme'
import { THEMES } from '../../contexts/theme'
import type { ThemeId } from '../../constants/theme'
import { ThemePreviewCard } from './ThemePreviewCard'

export function ThemePicker() {
  const { themeId, setThemeId, colors } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
      {(['defaultBlue', 'dark', 'light'] as ThemeId[]).map((id) => (
        <ThemePreviewCard
          key={id}
          tokens={THEMES[id]}
          label={THEMES[id].label}
          selected={themeId === id}
          onPress={() => setThemeId(id)}
          labelColor={colors.text}
        />
      ))}
    </View>
  )
}
