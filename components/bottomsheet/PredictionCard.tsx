import React from 'react'
import { View, Text, Image } from 'react-native'
import { CarDetails } from '../../types'
import { COLORS } from '../../constants/theme'

interface PredictionCardProps {
  photoUri: string
  topResult: CarDetails
}

export function PredictionCard({ photoUri, topResult }: PredictionCardProps) {
  return (
    <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16 }}>
      <Image source={{ uri: photoUri }} style={{ width: '100%', height: 150, borderRadius: 8 }} resizeMode="cover" />
      <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>{topResult.make} {topResult.model}</Text>
      <Text style={{ color: COLORS.textSecondary }}>{topResult.year}</Text>
    </View>
  )
}