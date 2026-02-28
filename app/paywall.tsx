import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/theme'

export default function PaywallScreen() {
  const { colors } = useTheme()
  const router = useRouter()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 1 }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20, paddingTop: 100 }}>
        <View style={{ width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="trophy" size={40} color={colors.primaryText} />
        </View>

        <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 32 }}>Unlock CarSpotter Pro</Text>

        <View style={{ width: '100%', marginBottom: 16 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Unlimited</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 16 }}>One-time purchase • $4.99</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>• Unlimited spots</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>• Rarity-scaled XP</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>• Priority support</Text>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Season Pass</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 16 }}>$2.99/month or $19.99/year</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>• Everything in Unlimited</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>• Streak multipliers</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => Alert.alert('Coming soon!')} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 }}>
          <Text style={{ color: colors.primaryText, textAlign: 'center', fontWeight: 'bold' }}>Subscribe</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Coming soon!')} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, width: '100%', marginBottom: 32 }}>
          <Text style={{ color: colors.text, textAlign: 'center', fontWeight: 'bold' }}>One-time Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}