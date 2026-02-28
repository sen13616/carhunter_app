import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/theme'
import { useAuth } from '../contexts/auth'
import { fetchSpottingById, updateSpotting } from '../services/supabase/spottings'
import type { EditableSpottingPatch } from '../services/supabase/spottings'

const CONDITION_OPTIONS = ['Pristine', 'Good', 'Fair', 'Beater'] as const

export default function EditSpotScreen() {
  const { spottingId } = useLocalSearchParams<{ spottingId: string }>()
  const { colors } = useTheme()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [row, setRow] = useState<Record<string, unknown> | null>(null)

  const [locationName, setLocationName] = useState('')
  const [condition, setCondition] = useState<string>('Good')
  const [isModified, setIsModified] = useState(false)
  const [colour, setColour] = useState('')
  const [year, setYear] = useState('')
  const [trim, setTrim] = useState('')
  const [uncertain, setUncertain] = useState(false)

  const load = useCallback(async () => {
    if (!spottingId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSpottingById(spottingId)
      if (!data) {
        setError('Spotting not found')
        setRow(null)
        return
      }
      const r = data as Record<string, unknown>
      if (session?.user?.id && r.user_id !== session.user.id) {
        setError('Not authorized')
        setRow(null)
        return
      }
      setRow(r)
      setLocationName((r.location_name as string) ?? '')
      setCondition((r.condition as string) ?? 'Good')
      setIsModified(Boolean(r.is_modified))
      setColour((r.colour as string) ?? '')
      setYear(r.year != null ? String(r.year) : '')
      setTrim((r.trim as string) ?? '')
      setUncertain(Boolean(r.uncertain))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setRow(null)
    } finally {
      setLoading(false)
    }
  }, [spottingId, session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) {
      router.replace('/auth')
      return
    }
    load()
  }, [session?.user?.id, load])

  const handleSave = async () => {
    if (!spottingId || !session?.user?.id) return
    setSaving(true)
    setError(null)
    try {
      const patch: EditableSpottingPatch = {
        location_name: locationName.trim() || null,
        condition: condition || null,
        is_modified: isModified,
        colour: colour.trim() || null,
        trim: trim.trim() || null,
        uncertain,
      }
      if (year.trim() !== '') {
        const y = parseInt(year.trim(), 10)
        patch.year = Number.isNaN(y) ? null : y
      } else {
        patch.year = null
      }
      const updated = await updateSpotting(spottingId, session.user.id, patch)
      if (!updated) {
        setError('Failed to save changes')
        return
      }
      router.back()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!spottingId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Invalid spotting</Text>
      </View>
    )
  }

  if (!session?.user?.id) return null

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error && !row) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    )
  }

  const make = String(row?.make ?? '')
  const model = String(row?.model ?? '')
  const yearVal = row?.year != null ? String(row.year) : ''
  const trimVal = String(row?.trim ?? '')
  const carTitle = `${yearVal} ${make} ${model} ${trimVal ? ` ${trimVal}` : ''}`.trim()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 }}>Edit spot</Text>
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20 }} numberOfLines={2}>{carTitle}</Text>

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Location</Text>
      <TextInput
        value={locationName}
        onChangeText={setLocationName}
        placeholder="Location name"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Condition</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {CONDITION_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setCondition(opt)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: condition === opt ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: condition === opt ? colors.primaryText : colors.text, fontWeight: condition === opt ? '600' : 'normal' }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Modified</Text>
        <Switch
          value={isModified}
          onValueChange={setIsModified}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="white"
        />
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Colour</Text>
      <TextInput
        value={colour}
        onChangeText={setColour}
        placeholder="Colour"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Year</Text>
      <TextInput
        value={year}
        onChangeText={setYear}
        placeholder="Year"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Trim</Text>
      <TextInput
        value={trim}
        onChangeText={setTrim}
        placeholder="Trim"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Uncertain</Text>
        <Switch
          value={uncertain}
          onValueChange={setUncertain}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="white"
        />
      </View>

      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>Save changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}
