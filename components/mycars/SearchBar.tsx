import React from 'react'
import { View, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, margin: 16 }}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        placeholder="Search cars..."
        placeholderTextColor={colors.textMuted}
        style={{ flex: 1, color: colors.text, paddingVertical: 12, paddingLeft: 8 }}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  )
}