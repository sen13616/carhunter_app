import React from 'react'
import { View, Text, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function DevResetScreen() {
  const router = useRouter()

  const hardReset = async () => {
    try {
      await supabase.auth.signOut()
      await AsyncStorage.clear()
      router.replace('/auth')
    } catch (e) {
      console.warn('[DevReset] Hard reset failed:', e)
    }
  }

  if (!__DEV__) return null

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Dev Reset</Text>
      <Text style={{ color: '#666' }}>Sign out, clear AsyncStorage, go to /auth.</Text>
      <Pressable
        onPress={hardReset}
        style={({ pressed }) => ({
          padding: 14,
          backgroundColor: pressed ? '#bbb' : '#ddd',
          borderRadius: 12,
        })}
      >
        <Text>Hard Reset App State</Text>
      </Pressable>
    </View>
  )
}