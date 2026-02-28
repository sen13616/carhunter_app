import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import type { User } from '../types'

const EMPTY_USER: User = {
  id: '',
  username: '',
  email: '',
  totalXP: 0,
  streak: 0,
  lastSpotDate: '',
}

interface AuthContextType {
  session: Session | null
  isAuthInitialized: boolean
  authenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  isAuthInitialized: false,
  authenticated: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(() => {
    // Auth screen handles Supabase sign in; session updates via onAuthStateChange
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    await AsyncStorage.clear()
    useStore.getState().clearSpots()
    useStore.getState().setUser(EMPTY_USER)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthInitialized: !loading,
        authenticated: !!session,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
