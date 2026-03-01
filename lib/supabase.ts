import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Run once on app start to verify Supabase client and network. Logs to local console only (no remote logging). */
let diagnosticsRun = false
export async function runSupabaseDiagnostics(): Promise<void> {
  if (diagnosticsRun) return
  diagnosticsRun = true
  const tag = '[SupabaseDiagnostics]'
  const urlMasked = supabaseUrl ? `${supabaseUrl.slice(0, 20)}...${supabaseUrl.slice(-8)}` : '(missing)'
  const hasAnonKey = Boolean(supabaseAnonKey && supabaseAnonKey.length > 0)
  const hasFetch = typeof globalThis.fetch === 'function'
  console.log(`${tag} init: supabaseUrl=${urlMasked} anonKeyPresent=${hasAnonKey} fetchAvailable=${hasFetch}`)

  try {
    const res = await fetch('https://example.com', { method: 'HEAD' })
    console.log(`${tag} internet check example.com status=${res.status}`)
  } catch (e) {
    console.log(`${tag} internet check failed`, e)
  }
}