import React from 'react'
import { View, Text } from 'react-native'
import { CarDetails } from '../../types'
import { useTheme } from '../../contexts/theme'

interface CarDetailsPanelProps {
  carDetails: CarDetails
}

export function CarDetailsPanel({ carDetails }: CarDetailsPanelProps) {
  const { colors } = useTheme()
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>Details</Text>
      <View style={{ marginTop: 8 }}>
        <Text style={{ color: colors.textMuted }}>Horsepower: {carDetails.horsepower} HP</Text>
        <Text style={{ color: colors.textMuted }}>Engine: {carDetails.engineType}</Text>
        <Text style={{ color: colors.textMuted }}>Years: {carDetails.yearsOfProduction}</Text>
        <Text style={{ color: colors.textMuted }}>Rarity: {carDetails.rarity}</Text>
      </View>
    </View>
  )
}