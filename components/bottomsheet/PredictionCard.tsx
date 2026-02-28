import React from 'react'
import { View, Text, Image } from 'react-native'
import { CarDetails } from '../../types'
import { useTheme } from '../../contexts/theme'

interface PredictionCardProps {
  photoUri: string
  topResult: CarDetails
}

export function PredictionCard({ photoUri, topResult }: PredictionCardProps) {
  const { colors } = useTheme()
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
      <Image source={{ uri: photoUri }} style={{ width: '100%', height: 150, borderRadius: 8 }} resizeMode="cover" />
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>{topResult.make} {topResult.model}</Text>
      <Text style={{ color: colors.textMuted }}>{topResult.year}</Text>
    </View>
  )
}