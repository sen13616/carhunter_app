import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/theme'

export default function PaywallScreen() {
  const router = useRouter()

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 1 }}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20, paddingTop: 100 }}>
        <View style={{ width: 80, height: 80, backgroundColor: '#f59e0b', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="trophy" size={40} color="white" />
        </View>

        <Text style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 32 }}>Unlock CarSpotter Pro</Text>

        <View style={{ width: '100%', marginBottom: 16 }}>
          <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Unlimited</Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>One-time purchase • $4.99</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Unlimited spots</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Rarity-scaled XP</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Leaderboard access</Text>
          </View>

          <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 20 }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Season Pass</Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>$2.99/month or $19.99/year</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Everything in Unlimited</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Daily & weekly challenges</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Exclusive collectibles</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>• Streak multipliers</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => Alert.alert('Coming soon!')} style={{ backgroundColor: COLORS.accent, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Subscribe</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Coming soon!')} style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, width: '100%', marginBottom: 32 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>One-time Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}