import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Switch, Pressable, Alert, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/auth'
import { useTheme } from '../../contexts/theme'
import { useStore } from '../../store/useStore'
import { ThemePicker } from '../../components/settings/ThemePicker'

function SectionHeader({ title, colors }: { title: string; colors: { textMuted: string } }) {
  return (
    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 24, marginBottom: 8, textTransform: 'uppercase' }}>
      {title}
    </Text>
  )
}

function SettingRow({
  icon, iconBg, title, subtitle, right, onPress, showDivider = false, colors,
}: {
  icon: string; iconBg?: string; title: string; subtitle?: string
  right?: React.ReactNode; onPress?: () => void; showDivider?: boolean
  colors: { border: string; text: string; textMuted: string; primary: string }
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
        android_ripple={{ color: colors.border }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: iconBg ?? colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
          <Ionicons name={icon as any} size={18} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{title}</Text>
          {subtitle && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
        </View>
        {right}
      </Pressable>
      {showDivider && <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />}
    </>
  )
}

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const { colors } = useTheme()
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 8) + 32 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>Settings</Text>
      </View>

      <Pressable
        onPress={() => router.push('/settings/edit-profile')}
        style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' }}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
              {(user.fullName ?? user.username ?? 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{user.fullName ?? user.username ?? 'Profile'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>@{user.username || '—'}</Text>
          {user.location ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{user.location}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <SectionHeader title="Theme" colors={colors} />
      <ThemePicker />

      <SectionHeader title="Preferences" colors={colors} />
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' }}>
        <SettingRow
          colors={colors}
          icon="notifications-outline"
          title="Notifications"
          subtitle="Get alerts for rare spots nearby"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          }
          showDivider
        />
        <SettingRow
          colors={colors}
          icon="grid-outline"
          iconBg={colors.primaryMuted}
          title="Camera Grid"
          subtitle="Show 3×3 grid overlay on camera"
          right={
            <Switch
              value={cameraGridEnabled}
              onValueChange={handleCameraGridToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          }
        />
      </View>

      <SectionHeader title="About" colors={colors} />
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' }}>
        <SettingRow
          colors={colors}
          icon="information-circle-outline"
          iconBg={colors.primaryMuted}
          title="About CarHunter"
          subtitle="Version 1.0.0"
          right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => {}}
          showDivider
        />
        <SettingRow
          colors={colors}
          icon="star-outline"
          iconBg={colors.primaryMuted}
          title="Rate the App"
          subtitle="Help us improve"
          right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => {}}
          showDivider
        />
        <SettingRow
          colors={colors}
          icon="trash-outline"
          iconBg={colors.danger}
          title="Reset Garage"
          subtitle="Delete all spotted cars"
          right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={handleResetGarage}
        />
      </View>

      <TouchableOpacity
        onPress={async () => { await signOut(); router.replace('/auth') }}
        style={{ marginTop: 32, borderWidth: 1.5, borderColor: colors.danger, borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: colors.surface2 }}
      >
        <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
        CarHunter v1.0.0
      </Text>
    </ScrollView>
  )
}
