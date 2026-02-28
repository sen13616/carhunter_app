import { supabase } from '../../lib/supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!

export async function deleteCurrentAuthUser(): Promise<{ error: Error | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { error: new Error('Not signed in') }
  }
  const url = `${SUPABASE_URL}/functions/v1/delete-user`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: new Error(body?.error ?? res.statusText ?? 'Failed to delete account') }
  }
  return { error: null }
}
