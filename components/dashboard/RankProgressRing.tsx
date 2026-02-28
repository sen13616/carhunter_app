import React from 'react'
import { View, Text } from 'react-native'

const SIZE = 80
const STROKE = 7

interface RankProgressRingProps {
  percent: number
  colors: { border: string; primary: string; text: string }
}

export function RankProgressRing({ percent, colors }: RankProgressRingProps) {
  const pct = Math.min(100, Math.round(percent))
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: colors.border,
        }}
      />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{pct}%</Text>
      </View>
    </View>
  )
}
