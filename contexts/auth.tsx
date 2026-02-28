import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { fetchSpottingsForUser } from '../services/supabase/spottings'
import { fetchProfile, profileHasRequiredFields } from '../services/supabase/profile'
import type { User } from '../types'

const EMPTY_USER: User = {
  id: '',
  username: '',
  email: '',
  fullName: undefined,
  location: undefined,
  bio: undefined,
  avatarUrl: undefined,
  totalXP: 0,
  streak: 0,
  lastSpotDate: '',
}

export type HydrateResult = { profileComplete: boolean }

async function hydrateUserAndSpots(userId: string): Promise<HydrateResult> {
  const profile = await fetchProfile(userId)
  const spots = await fetchSpottingsForUser(userId)
  useStore.getState().setSpots(spots)
  const profileComplete = profileHasRequiredFields(profile)
  if (profile) {
    const user: User = {
      id: profile.id,
      username: (profile.username ?? profile.full_name ?? '').toString() || 'User',
      email: (profile.email ?? '').toString(),
      fullName: (profile.full_name ?? '').toString() || undefined,
      location: (profile.location ?? '').toString() || undefined,
      bio: (profile.bio ?? '').toString() || undefined,
      avatarUrl: (profile.avatar_url ?? '').toString() || undefined,
      totalXP: typeof profile.xp === 'number' ? profile.xp : 0,
      streak: typeof profile.streak_count === 'number' ? profile.streak_count : 0,
      lastSpotDate: profile.last_spotted_at ? new Date(profile.last_spotted_at).toDateString() : '',
    }
    useStore.getState().setUser(user)
  } else {
    const { data: authUser } = await supabase.auth.getUser()
    const email = authUser?.user?.email ?? ''
    useStore.getState().setUser({
      ...EMPTY_USER,
      id: userId,
      email,
      username: '',
    })
  }
  return { profileComplete }
}

interface AuthContextType {
  session: Session | null
  isAuthInitialized: boolean
  authenticated: boolean
  profileComplete: boolean | null
  setProfileComplete: (v: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  isAuthInitialized: false,
  authenticated: false,
  profileComplete: null,
  setProfileComplete: () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileCompleteState] = useState<boolean | null>(null)

  const setProfileComplete = useCallback((v: boolean) => setProfileCompleteState(v), [])

  const hydrate = useCallback(async (s: Session | null) => {
    if (!s?.user?.id) {
      useStore.getState().setUser(EMPTY_USER)
      useStore.getState().setSpots([])
      setProfileCompleteState(null)
      return
    }
    try {
      const { profileComplete: complete } = await hydrateUserAndSpots(s.user.id)
      setProfileCompleteState(complete)
    } catch {
      setProfileCompleteState(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      hydrate(s).finally(() => setLoading(false))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      hydrate(s)
    })
    return () => subscription.unsubscribe()
  }, [hydrate])

  const refreshProfile = useCallback(async (): Promise<boolean> => {
    const s = session
    if (!s?.user?.id) return false
    const { profileComplete: complete } = await hydrateUserAndSpots(s.user.id)
    setProfileCompleteState(complete)
    return complete
  }, [session])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfileCompleteState(null)
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
        profileComplete,
        setProfileComplete,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
