import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/auth'
import { useTheme } from '../contexts/theme'

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()
  const { colors } = useTheme()
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
      if (mode === 'signin') router.replace('/(tabs)')
      else router.replace('/profile-details')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: colors.bg, padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{ width: 80, height: 80, backgroundColor: colors.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="car" size={40} color={colors.primary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: 'bold' }}>CarHunter</Text>
        <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 4 }}>SPOT. IDENTIFY. COLLECT.</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 20, padding: 4, marginBottom: 32 }}>
        <Pressable onPress={() => setMode('signin')} style={{ flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: mode === 'signin' ? colors.primary : 'transparent' }}>
          <Text style={{ textAlign: 'center', color: mode === 'signin' ? colors.primaryText : colors.textMuted }}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => setMode('signup')} style={{ flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: mode === 'signup' ? colors.primary : 'transparent' }}>
          <Text style={{ textAlign: 'center', color: mode === 'signup' ? colors.primaryText : colors.textMuted }}>Sign Up</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, color: colors.text, marginBottom: 16 }}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, color: colors.text, paddingVertical: 16 }}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginBottom: 32 }}
      >
        {submitting ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={{ color: colors.primaryText, textAlign: 'center', fontWeight: 'bold' }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>

      {mode === 'signup' && (
        <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12 }}>
          By signing up you agree to our Terms & Privacy Policy
        </Text>
      )}
    </ScrollView>
  )
}
