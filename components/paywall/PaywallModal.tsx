import React, { useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'
import { useAuth } from '../../contexts/auth'
import { restorePurchases } from '../../services/revenuecat'
import { useStore } from '../../store/useStore'

const COMING_SOON_ALERT = () =>
  Alert.alert('Coming soon', 'This feature is not available yet.', [{ text: 'OK' }])

export type PaywallModalProps = {
  visible: boolean
  onClose: () => void
  /** When shown due to daily limit */
  limitInfo?: { used: number; limit: number }
}

export function PaywallModal({ visible, onClose, limitInfo }: PaywallModalProps) {
  const { colors } = useTheme()
  const { session, refreshProfile } = useAuth()
  const userId = session?.user?.id ?? ''
  const setShowPaywall = useStore((s) => s.setShowPaywall)

  const [loading, setLoading] = useState<'monthly' | 'onetime' | 'restore' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBuyMonthly = () => COMING_SOON_ALERT()
  const handleBuyOneTime = () => COMING_SOON_ALERT()

  const handleRestore = async () => {
    if (!userId) return
    setLoading('restore')
    setError(null)
    const result = await restorePurchases(userId)
    setLoading(null)
    if (result.success) {
      await refreshProfile()
      setShowPaywall(false)
      onClose()
    } else {
      setError(result.error ?? 'Restore failed')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, maxHeight: '90%' }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>Unlock more</Text>
              <TouchableOpacity onPress={() => { setShowPaywall(false); onClose() }} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {limitInfo && (
              <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginBottom: 20 }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  Daily limit reached ({limitInfo.used}/{limitInfo.limit} spots). Upgrade for more.
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Free</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>3 spots per day</Text>
              </View>
              <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: colors.primary, fontSize: 12, marginBottom: 4 }}>One-time</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>$8.99 → 10 spots/day</Text>
              </View>
              <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16 }}>
                <Text style={{ color: colors.primary, fontSize: 12, marginBottom: 4 }}>Monthly</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>$4.99/month → Unlimited + Streak XP (2×)</Text>
              </View>
            </View>

            {error ? <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleBuyMonthly}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>Buy Monthly ($4.99)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBuyOneTime}
              style={{ backgroundColor: colors.surface2 ?? colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Buy One-time ($8.99)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore} disabled={!!loading} style={{ alignItems: 'center', paddingVertical: 12 }}>
              {loading === 'restore' ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontSize: 15 }}>Restore Purchases</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowPaywall(false); onClose() }} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
