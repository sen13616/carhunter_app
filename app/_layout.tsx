import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../contexts/auth'
import { ThemeProvider, useTheme } from '../contexts/theme'
import { runSupabaseDiagnostics } from '../lib/supabase'
import RevenueCatInit from '../components/RevenueCatInit'
import { PaywallModal } from '../components/paywall/PaywallModal'
import { useStore } from '../store/useStore'

function StatusBarThemed() {
  const { themeId } = useTheme()
  return <StatusBar style={themeId === 'light' ? 'dark' : 'light'} />
}

/** Redirects to auth / loading / profile-details / (tabs) based on session and profile state. */
function AuthGate() {
  const router = useRouter()
  const segments = useSegments() as string[]
  const { isAuthInitialized, session, profileComplete } = useAuth()

  useEffect(() => {
    if (!isAuthInitialized) return
    const top = segments[0]
    if (session === null) {
      if (top !== 'auth') router.replace('/auth')
      return
    }
    if (profileComplete === null) {
      if (top !== 'loading') router.replace('/loading')
      return
    }
    if (profileComplete === false) {
      if (top !== 'profile-details') router.replace('/profile-details')
      return
    }
    if (top === 'auth' || top === 'profile-details' || top === 'loading') router.replace('/(tabs)')
  }, [isAuthInitialized, session, profileComplete, segments, router])

  return null
}

function SupabaseDiagnostics() {
  useEffect(() => {
    runSupabaseDiagnostics()
  }, [])
  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SupabaseDiagnostics />
          <RevenueCatInit />
          <StatusBarThemed />
          <AuthGate />
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ThemeProvider>
    </AuthProvider>
  )
}

function GlobalPaywall() {
  const showPaywall = useStore((s) => s.showPaywall)
  const paywallLimitInfo = useStore((s) => s.paywallLimitInfo)
  const setShowPaywall = useStore((s) => s.setShowPaywall)
  return (
    <PaywallModal
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      limitInfo={paywallLimitInfo ?? undefined}
    />
  )
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="profile-details" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="car-detail" />
      <Stack.Screen name="rank-progression" />
      <Stack.Screen name="post-spot" />
      <Stack.Screen name="edit-spot-photos" />
      <Stack.Screen name="edit-spot" />
      <Stack.Screen name="add-legacy-car" />
      <Stack.Screen name="legacy-car-detail" />
      <Stack.Screen name="edit-legacy-car-photos" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="manual-upload" />
    </Stack>
    <GlobalPaywall />
    </View>
  )
}
