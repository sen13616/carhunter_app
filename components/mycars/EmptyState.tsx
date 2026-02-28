import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/theme'

export function EmptyState() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
      <Text style={{ color: COLORS.textPrimary, fontSize: 18, marginTop: 16 }}>No cars spotted yet</Text>
      <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }}>Start spotting cars to build your collection!</Text>
    </View>
  )
}