import React from 'react'
import { View, Text } from 'react-native'
import { CarDetails } from '../../types'
import { COLORS } from '../../constants/theme'

interface CarDetailsPanelProps {
  carDetails: CarDetails
}

export function CarDetailsPanel({ carDetails }: CarDetailsPanelProps) {
  return (
    <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, marginTop: 16 }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Details</Text>
      <View style={{ marginTop: 8 }}>
        <Text style={{ color: COLORS.textSecondary }}>Horsepower: {carDetails.horsepower} HP</Text>
        <Text style={{ color: COLORS.textSecondary }}>Engine: {carDetails.engineType}</Text>
        <Text style={{ color: COLORS.textSecondary }}>Years: {carDetails.yearsOfProduction}</Text>
        <Text style={{ color: COLORS.textSecondary }}>Rarity: {carDetails.rarity}</Text>
      </View>
    </View>
  )
}