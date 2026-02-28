import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Switch, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/auth'
import { COLORS } from '../../constants/theme'
import { useStore } from '../../store/useStore'

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 24, marginBottom: 8, textTransform: 'uppercase' }}>
      {title}
    </Text>
  )
}

function SettingRow({
  icon, iconBg = COLORS.accent, title, subtitle, right, onPress, showDivider = false,
}: {
  icon: string; iconBg?: string; title: string; subtitle?: string
  right?: React.ReactNode; onPress?: () => void; showDivider?: boolean
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
        android_ripple={{ color: COLORS.border }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
          <Ionicons name={icon as any} size={18} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 }}>{title}</Text>
          {subtitle && <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
        </View>
        {right}
      </Pressable>
      {showDivider && <View style={{ height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 }} />}
    </>
  )
}

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user               = useStore((s) => s.user)
  const cameraGridEnabled  = useStore((s) => s.settings.cameraGrid)
  const notificationsEnabled = useStore((s) => s.settings.notifications)
  const setSetting         = useStore((s) => s.setSetting)
  const clearSpots         = useStore((s) => s.clearSpots)

  const handleCameraGridToggle = (val: boolean) => setSetting('cameraGrid', val)

  const handleNotificationsToggle = (val: boolean) => setSetting('notifications', val)

  const handleResetGarage = () => {
    Alert.alert(
      'Reset Garage',
      'This will permanently delete all spotted cars. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearSpots()
            Alert.alert('Done', 'Garage has been cleared.')
          },
        },
      ]
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {/* Custom header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' }}>Settings</Text>
      </View>

      {/* Profile card */}
      <Pressable
        onPress={() => router.push('/settings/edit-profile')}
        style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.accent, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
          <Ionicons name="person" size={28} color={COLORS.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{user.username}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>{user.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </Pressable>

      {/* Preferences */}
      <SectionHeader title="Preferences" />
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
        <SettingRow
          icon="notifications-outline"
          title="Notifications"
          subtitle="Get alerts for rare spots nearby"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="white"
            />
          }
          showDivider
        />
        <SettingRow
          icon="grid-outline"
          iconBg="#0e7490"
          title="Camera Grid"
          subtitle="Show 3×3 grid overlay on camera"
          right={
            <Switch
              value={cameraGridEnabled}
              onValueChange={handleCameraGridToggle}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="white"
            />
          }
          showDivider
        />
        <SettingRow
          icon="moon-outline"
          iconBg="#374151"
          title="Dark Mode"
          subtitle="Always enabled for optimal viewing"
          right={
            <Switch
              value={true}
              disabled
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="white"
            />
          }
        />
      </View>

      {/* About */}
      <SectionHeader title="About" />
      <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
        <SettingRow
          icon="information-circle-outline"
          iconBg="#0e7490"
          title="About CarSpotter"
          subtitle="Version 1.0.0"
          right={<Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />}
          onPress={() => {}}
          showDivider
        />
        <SettingRow
          icon="star-outline"
          iconBg="#b45309"
          title="Rate the App"
          subtitle="Help us improve"
          right={<Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />}
          onPress={() => {}}
          showDivider
        />
        <SettingRow
          icon="trash-outline"
          iconBg="#7f1d1d"
          title="Reset Garage"
          subtitle="Delete all spotted cars"
          right={<Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />}
          onPress={handleResetGarage}
        />
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={async () => { await signOut(); router.replace('/auth') }}
        style={{ marginTop: 32, borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: '#ef444415' }}
      >
        <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
        CarSpotter v1.0.0
      </Text>
    </ScrollView>
  )
}
