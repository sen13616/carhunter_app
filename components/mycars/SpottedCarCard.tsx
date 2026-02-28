import React from 'react'
import { View, Text, Image } from 'react-native'
import { SpottedCar } from '../../types'
import { useTheme } from '../../contexts/theme'

interface SpottedCarCardProps {
  car: SpottedCar
  cardWidth?: number
}

export function SpottedCarCard({ car, cardWidth }: SpottedCarCardProps) {
  const { colors, rarityColors } = useTheme()
  const { photoUri, prediction, dateSpotted, rarity } = car
  return (
    <View style={{ borderRadius: 16, backgroundColor: colors.surface, margin: 6, width: cardWidth }}>
      <View style={{ height: 120, position: 'relative' }}>
        <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16 }} resizeMode="cover" />
        <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: rarityColors[rarity], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: 'bold' }}>{rarity}</Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>{prediction.make} {prediction.model}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{prediction.year}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>{dateSpotted}</Text>
      </View>
    </View>
  )
}