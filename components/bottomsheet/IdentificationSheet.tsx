import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native'
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { IdentifyResponse } from '../../types'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/theme'
import { useSaveSpot } from '../../hooks/useSaveSpot'

interface IdentificationSheetProps {
  visible: boolean
  onClose: () => void
  photoUri: string
  identifyResult: IdentifyResponse | null
  isLoading: boolean
  additionalPhotos: string[]
  onAddMorePhotos: () => void
}

export function IdentificationSheet({ visible, onClose, photoUri, identifyResult, isLoading, additionalPhotos, onAddMorePhotos }: IdentificationSheetProps) {
  const { colors, rarityColors } = useTheme()
  const { saveSpot } = useSaveSpot()
  const translateY = useSharedValue(600)

  // User-entered fields
  const [location, setLocation] = useState('')
  const [notes, setNotes]       = useState('')

  // Edit identification state
  const [editMode, setEditMode]         = useState(false)
  const [editedMake, setEditedMake]     = useState('')
  const [editedModel, setEditedModel]   = useState('')
  const [editedTrim, setEditedTrim]     = useState('')
  const [editedYear, setEditedYear]     = useState('')

  // Toast
  const [toastVisible, setToastVisible] = useState(false)
  const [toastLabel, setToastLabel]     = useState('')
  const toastOpacity    = useRef(new Animated.Value(0)).current
  const toastTranslateY = useRef(new Animated.Value(20)).current
  const toastTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }))

  // Open/close animation + field reset
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 })
      setLocation('')
      setNotes('')
      setEditMode(false)
      setToastVisible(false)
    } else {
      translateY.value = withSpring(600, { damping: 20, stiffness: 150 })
      setEditedMake('')
      setEditedModel('')
      setEditedTrim('')
      setEditedYear('')
      setEditMode(false)
    }
  }, [visible])

  // Pre-fill edit fields when identification result arrives
  useEffect(() => {
    if (!identifyResult) return
    setEditedMake(identifyResult.identification.make)
    setEditedModel(identifyResult.identification.model)
    setEditedTrim(identifyResult.identification.trim)
    setEditedYear(identifyResult.identification.year.toString())
  }, [identifyResult])

  // Cleanup toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const showToast = (label: string) => {
    setToastLabel(label)
    setToastVisible(true)
    toastOpacity.setValue(0)
    toastTranslateY.setValue(20)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start()
    toastTimer.current = setTimeout(() => {
      setToastVisible(false)
      onClose()
    }, 2000)
  }

  const handleSave = async () => {
    if (!identifyResult) return
    const parsedYear = parseInt(editedYear, 10) || identifyResult.identification.year
    await saveSpot({
      identifyResult,
      photoUri,
      additionalPhotos,
      edits: { make: editedMake, model: editedModel, trim: editedTrim, year: parsedYear },
      location,
      notes,
      onSuccess: onClose,
      onDuplicate: () => showToast('Already spotted this car'),
      onPaywall: (info) => {
        useStore.getState().setPaywallLimitInfo(info)
        useStore.getState().setShowPaywall(true)
      },
      onError: (msg) => showToast(msg || 'Failed to save'),
    })
  }

  const specCards = identifyResult ? [
    { label: '0–100 km/h', value: `${identifyResult.specs.zero_to_100_kmh}s` },
    { label: 'Engine',     value: identifyResult.specs.engine },
    { label: 'Horsepower', value: `${identifyResult.specs.horsepower} HP` },
    { label: 'Colour',     value: identifyResult.identification.colour },
  ] : []

  const multiplierPills = identifyResult ? [
    { emoji: '📍', label: 'Location',  value: identifyResult.xp.multipliers.location },
    { emoji: '🔧', label: 'Condition', value: identifyResult.xp.multipliers.condition },
    { emoji: '✨', label: 'Mods',      value: identifyResult.xp.multipliers.modifications },
    { emoji: '📷', label: 'Photo',     value: identifyResult.xp.multipliers.photo_quality },
  ] : []

  return (
    <Modal visible={visible} transparent animationType="none">
      {/*
        Layout: KAV (flex:1, justifyContent:flex-end, dark background)
          → Pressable (flex:1)  ← fills space ABOVE the sheet; tap = close
          → AnimatedView        ← sheet sits at the bottom as a sibling
        Tapping the sheet never reaches the Pressable because they are siblings,
        not parent/child. This lets the ScrollView inside capture scroll events freely.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        {/* Backdrop — only covers the area above the sheet */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <AnimatedReanimated.View
          style={[{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '92%',
          }, animatedStyle]}
        >
              {/* ── Drag handle ─────────────────────────────────────────── */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              {/* ── Save toast (absolute overlay) ───────────────────────── */}
              {toastVisible && (
                <Animated.View style={{
                  position: 'absolute', top: 16, left: 16, right: 16,
                  backgroundColor: colors.success, borderRadius: 14,
                  paddingHorizontal: 16, paddingVertical: 13,
                  flexDirection: 'row', alignItems: 'center',
                  zIndex: 100, opacity: toastOpacity,
                  transform: [{ translateY: toastTranslateY }],
                  shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
                }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 14 }}>Car Spot Saved</Text>
                    <Text style={{ color: colors.primaryText, opacity: 0.8, fontSize: 12 }}>{toastLabel}</Text>
                  </View>
                </Animated.View>
              )}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* ── Loading state ──────────────────────────────────────── */}
                {isLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 16 }}>Identifying car...</Text>
                  </View>

                ) : identifyResult ? (
                  <>
                    {/* ── 1. Hero image ──────────────────────────────────── */}
                    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: 220, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="car-outline" size={56} color={colors.textMuted} />
                        </View>
                      )}

                      {/* Additional photo thumbnails overlaid bottom-right */}
                      {additionalPhotos.length > 0 && (
                        <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center' }}>
                          {additionalPhotos.slice(0, 3).map((uri, i) => (
                            <Image
                              key={uri}
                              source={{ uri }}
                              style={{
                                width: 44, height: 44, borderRadius: 8,
                                borderWidth: 1.5, borderColor: colors.bg,
                                marginLeft: i > 0 ? -8 : 0,
                              }}
                            />
                          ))}
                          {additionalPhotos.length > 3 && (
                            <View style={{
                              width: 28, height: 28, borderRadius: 14,
                              backgroundColor: 'rgba(0,0,0,0.75)',
                              justifyContent: 'center', alignItems: 'center', marginLeft: 4,
                            }}>
                              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                +{additionalPhotos.length - 3}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* ── 2. Uncertain warning ───────────────────────────── */}
                    {identifyResult.identification.uncertain && (
                      <View style={{
                        backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary,
                        borderRadius: 12, padding: 14, marginTop: 12,
                      }}>
                        <Text style={{ color: colors.primary, fontSize: 13 }}>
                          ⚠️ AI wasn't confident about this result. Please verify or edit.
                        </Text>
                      </View>
                    )}

                    {/* ── 3. Rarity badge ────────────────────────────────── */}
                    <View style={{
                      alignSelf: 'flex-start',
                      backgroundColor: rarityColors[identifyResult.specs.rarity_tier],
                      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 14,
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                        {identifyResult.specs.rarity_tier}
                      </Text>
                    </View>

                    {/* ── 4. Car identity ────────────────────────────────── */}
                    <Text style={{ color: colors.text, fontSize: 26, fontWeight: 'bold', marginTop: 8 }}>
                      {editedYear} {editedMake}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 18, marginTop: 2, marginBottom: 16 }}>
                      {editedModel}{editedTrim ? ` ${editedTrim}` : ''}
                    </Text>

                    {/* ── 5. Specs grid (2×2) ────────────────────────────── */}
                    <View style={{ gap: 10, marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {specCards.slice(0, 2).map(card => (
                          <View key={card.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>{card.label}</Text>
                            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{card.value}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {specCards.slice(2, 4).map(card => (
                          <View key={card.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>{card.label}</Text>
                            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{card.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* ── 6. XP card ─────────────────────────────────────── */}
                    <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                      <Text style={{ color: colors.primary, fontSize: 30, fontWeight: 'bold' }}>
                        {identifyResult.xp.total_xp} XP
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 12 }}>
                        {identifyResult.xp.breakdown}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {multiplierPills.map(pill => (
                          <View
                            key={pill.label}
                            style={{
                              flexDirection: 'row', alignItems: 'center',
                              backgroundColor: colors.bg, borderRadius: 8,
                              paddingHorizontal: 10, paddingVertical: 6,
                            }}
                          >
                            <Text style={{ fontSize: 13 }}>{pill.emoji}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>{pill.label}</Text>
                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>×{pill.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* ── 7. Edit identification ─────────────────────────── */}
                    <TouchableOpacity
                      onPress={() => setEditMode(v => !v)}
                      style={{
                        borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                        padding: 14, alignItems: 'center', marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '600' }}>✏️  Edit Identification</Text>
                    </TouchableOpacity>

                    {editMode && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 12, gap: 10 }}>
                        {[
                          { placeholder: 'Make',  value: editedMake,  set: setEditedMake,  type: 'default' as const },
                          { placeholder: 'Model', value: editedModel, set: setEditedModel, type: 'default' as const },
                          { placeholder: 'Trim',  value: editedTrim,  set: setEditedTrim,  type: 'default' as const },
                          { placeholder: 'Year',  value: editedYear,  set: setEditedYear,  type: 'numeric'  as const },
                        ].map(field => (
                          <TextInput
                            key={field.placeholder}
                            placeholder={field.placeholder}
                            placeholderTextColor={colors.textMuted}
                            style={{
                              backgroundColor: colors.bg, borderRadius: 8,
                              padding: 12, color: colors.text,
                              borderWidth: 1, borderColor: colors.border,
                            }}
                            value={field.value}
                            onChangeText={field.set}
                            keyboardType={field.type}
                          />
                        ))}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => setEditMode(false)}
                            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' }}
                          >
                            <Text style={{ color: colors.primaryText, fontWeight: 'bold' }}>Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setEditedMake(identifyResult.identification.make)
                              setEditedModel(identifyResult.identification.model)
                              setEditedTrim(identifyResult.identification.trim)
                              setEditedYear(identifyResult.identification.year.toString())
                              setEditMode(false)
                            }}
                            style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, alignItems: 'center' }}
                          >
                            <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* ── 8. Location ────────────────────────────────────── */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: colors.surface, borderRadius: 10,
                      paddingHorizontal: 14, marginBottom: 12,
                      borderWidth: 1, borderColor: colors.border,
                    }}>
                      <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                      <TextInput
                        placeholder="e.g. Nürburgring, Germany"
                        placeholderTextColor={colors.textMuted}
                        style={{ flex: 1, paddingVertical: 14, color: colors.text }}
                        value={location}
                        onChangeText={setLocation}
                      />
                    </View>

                    {/* ── 9. Notes ───────────────────────────────────────── */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'flex-start',
                      backgroundColor: colors.surface, borderRadius: 10,
                      paddingHorizontal: 14, marginBottom: 16,
                      borderWidth: 1, borderColor: colors.border,
                    }}>
                      <Ionicons name="document-text-outline" size={18} color={colors.textMuted} style={{ marginRight: 8, marginTop: 14 }} />
                      <TextInput
                        placeholder="Any details worth remembering..."
                        placeholderTextColor={colors.textMuted}
                        style={{ flex: 1, paddingVertical: 14, color: colors.text, height: 80, textAlignVertical: 'top' }}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                      />
                    </View>

                    {/* ── 10. Additional photos strip ────────────────────── */}
                    {additionalPhotos.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {additionalPhotos.map((uri) => (
                          <Image key={uri} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10, marginRight: 8 }} />
                        ))}
                      </ScrollView>
                    )}

                    {/* ── 11. Add More Photos ────────────────────────────── */}
                    <Pressable
                      onPress={onAddMorePhotos}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
                        borderRadius: 12, padding: 14, marginBottom: 12, gap: 10,
                      }}
                    >
                      <Ionicons name="camera-outline" size={20} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Add More Photos</Text>
                    </Pressable>

                    {/* ── 12. Save Spot ──────────────────────────────────── */}
                    <TouchableOpacity onPress={handleSave} style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 14 }}>
                      <Text style={{ color: colors.primaryText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Save Spot</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </ScrollView>
        </AnimatedReanimated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
