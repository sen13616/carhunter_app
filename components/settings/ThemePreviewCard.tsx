import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ThemeTokens } from '../../constants/theme'

interface ThemePreviewCardProps {
  tokens: ThemeTokens
  label: string
  selected: boolean
  onPress: () => void
  /** Label text color (use current theme so label is readable on current bg) */
  labelColor: string
}

/** Mini "phone" preview built from rectangles using the given theme tokens. */
export function ThemePreviewCard({ tokens, label, selected, onPress, labelColor }: ThemePreviewCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flex: 1,
        minWidth: 100,
        maxWidth: 120,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          borderRadius: 16,
          borderWidth: selected ? 4 : 1,
          borderColor: selected ? tokens.primary : tokens.border,
          overflow: 'hidden',
          backgroundColor: tokens.surface2,
        }}
      >
        {selected && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: tokens.primary,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <Ionicons name="checkmark" size={14} color={tokens.primaryText} />
          </View>
        )}
        {/* Fake phone preview: status bar, header, content blocks */}
        <View style={{ backgroundColor: tokens.bg, paddingTop: 12, paddingBottom: 14, paddingHorizontal: 10 }}>
          <View style={{ height: 8, backgroundColor: tokens.surface2, borderRadius: 4, marginBottom: 10 }} />
          <View style={{ height: 10, backgroundColor: tokens.surface, borderRadius: 4, marginBottom: 6, width: '60%' }} />
          <View style={{ height: 8, backgroundColor: tokens.textMuted, borderRadius: 2, opacity: 0.6, marginBottom: 12, width: '40%' }} />
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <View style={{ flex: 1, height: 28, backgroundColor: tokens.surface, borderRadius: 6 }} />
            <View style={{ flex: 1, height: 28, backgroundColor: tokens.surface, borderRadius: 6 }} />
          </View>
          <View style={{ height: 24, backgroundColor: tokens.primary, borderRadius: 6, marginTop: 4 }} />
        </View>
      </View>
      <Text
        style={{
          marginTop: 10,
          fontSize: 13,
          fontWeight: selected ? '600' : '500',
          color: labelColor,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
