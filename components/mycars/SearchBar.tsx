import React from 'react'
import { View, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/theme'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: 12, paddingHorizontal: 12, margin: 16 }}>
      <Ionicons name="search" size={20} color={COLORS.textSecondary} />
      <TextInput
        placeholder="Search cars..."
        placeholderTextColor={COLORS.textSecondary}
        style={{ flex: 1, color: COLORS.textPrimary, paddingVertical: 12, paddingLeft: 8 }}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  )
}