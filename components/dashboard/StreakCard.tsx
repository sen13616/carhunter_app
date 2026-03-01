import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/theme'
import { useAuth } from '../../contexts/auth'
import { fetchProfile } from '../../services/supabase/profile'
import { deriveEntitlements } from '../../services/entitlements'
import { useStore } from '../../store/useStore'
import type { ProfileRow } from '../../types'

export function StreakCard() {
  const { colors } = useTheme()
  const { session } = useAuth()
  const setShowPaywall = useStore((s) => s.setShowPaywall)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) {
      setProfile(null)
      return
    }
    fetchProfile(uid).then(setProfile)
  }, [session?.user?.id])

  const entitlements = deriveEntitlements(profile)
  const streakDays = entitlements.streakDays
  const has2x = entitlements.streakMultiplierEnabled && entitlements.streakMultiplier >= 2
  const locked = !entitlements.streakMultiplierEnabled

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (locked) setShowPaywall(true)
      }}
      style={{
        padding: 18,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2 ?? colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name="flame" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{streakDays} day streak</Text>
            {has2x ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: '700' }}>2× active</Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>2× locked</Text>
                </View>
                {locked && (
                  <Text style={{ color: colors.primary, fontSize: 12, marginLeft: 8 }}>Subscribe to unlock</Text>
                )}
              </View>
            )}
          </View>
        </View>
        {locked && (
          <Ionicons name="lock-open-outline" size={20} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  )
}
