import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/auth'
import { COLORS } from '../constants/theme'

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = mode === 'signin'
        ? await signIn(trimmedEmail, password)
        : await signUp(trimmedEmail, password)
      if (error) {
        Alert.alert(mode === 'signin' ? 'Sign in failed' : 'Sign up failed', error.message ?? 'Something went wrong.')
        return
      }
      router.replace('/(tabs)')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: COLORS.background, padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{ width: 80, height: 80, backgroundColor: COLORS.backgroundCard, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="car" size={40} color={COLORS.accent} />
        </View>
        <Text style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: 'bold' }}>CarSpotter</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 16, marginTop: 4 }}>SPOT. IDENTIFY. COLLECT.</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: COLORS.backgroundCard, borderRadius: 20, padding: 4, marginBottom: 32 }}>
        <Pressable onPress={() => setMode('signin')} style={{ flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: mode === 'signin' ? COLORS.accent : 'transparent' }}>
          <Text style={{ textAlign: 'center', color: mode === 'signin' ? 'white' : COLORS.textSecondary }}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => setMode('signup')} style={{ flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: mode === 'signup' ? COLORS.accent : 'transparent' }}>
          <Text style={{ textAlign: 'center', color: mode === 'signup' ? 'white' : COLORS.textSecondary }}>Sign Up</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor={COLORS.textSecondary}
        style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 12, padding: 16, color: COLORS.textPrimary, marginBottom: 16 }}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.textSecondary}
          style={{ flex: 1, color: COLORS.textPrimary, paddingVertical: 16 }}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={{ backgroundColor: COLORS.accent, borderRadius: 12, padding: 16, marginBottom: 32 }}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>

      {mode === 'signup' && (
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center', fontSize: 12 }}>
          By signing up you agree to our Terms & Privacy Policy
        </Text>
      )}
    </ScrollView>
  )
}
