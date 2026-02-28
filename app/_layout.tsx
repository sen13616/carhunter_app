import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../contexts/auth'

function AuthGate() {
  const router = useRouter()
  const segments = useSegments() as string[]
  const { isAuthInitialized, session } = useAuth()

  useEffect(() => {
    if (!isAuthInitialized) return
    const top = segments[0]
    if (session === null) {
      if (top !== 'auth') router.replace('/auth')
      return
    }
    if (session && top === 'auth') router.replace('/(tabs)')
  }, [isAuthInitialized, session, segments, router])

  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthGate />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AuthProvider>
  )
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="car-detail" />
      <Stack.Screen name="rank-progression" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="manual-upload" />
    </Stack>
  )
}
