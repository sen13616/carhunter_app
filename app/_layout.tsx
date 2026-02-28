import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../contexts/auth'
import { ThemeProvider, useTheme } from '../contexts/theme'
import { runSupabaseDiagnostics } from '../lib/supabase'

function StatusBarThemed() {
  const { themeId } = useTheme()
  return <StatusBar style={themeId === 'light' ? 'dark' : 'light'} />
}

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
    if (!session) return
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
          <StatusBarThemed />
          <AuthGate />
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ThemeProvider>
    </AuthProvider>
  )
}

function RootLayoutNav() {
  return (
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
  )
}
