import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Image, useWindowDimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../store/useStore'
import { SpottedCar, RarityLevel } from '../../types'
import { useTheme } from '../../contexts/theme'
import { RARITY_ORDER } from '../../constants/theme'
import { SearchBar } from '../../components/mycars/SearchBar'
import { EmptyState } from '../../components/mycars/EmptyState'
import { useSpottingPhotoUrls } from '../../hooks/useSpottingPhotoUrls'
import { fetchUserSpottings } from '../../services/supabase/spottings'
import { fetchLegacyCars } from '../../services/supabase/legacyCars'
import { useAuth } from '../../contexts/auth'
import { useLegacyCarPhotoUrls } from '../../hooks/useLegacyCarPhotoUrls'
import type { LegacyCar } from '../../types'

const RARITY_OPTIONS = ['All', 'Legendary', 'Very Rare', 'Rare', 'Uncommon', 'Common'] as const
const TYPE_OPTIONS   = ['All', 'Supercar', 'Sedan', 'SUV', 'Classic', 'Sports'] as const

type RarityOption = typeof RARITY_OPTIONS[number]
type TypeOption   = typeof TYPE_OPTIONS[number]
type GarageTab    = 'garage' | 'legacy'
type ViewMode     = 'list' | 'card'

// ─── DropdownPicker ─────────────────────────────────────────────────────────

function DropdownPicker({
  label, options, selected, onSelect, colors,
}: {
  label: string
  options: readonly string[]
  selected: string
  onSelect: (val: string) => void
  colors: { surface: string; border: string; text: string; textMuted: string; primary: string }
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.surface, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10,
          borderWidth: 1, borderColor: colors.border,
        }}
      >
        <Text style={{ color: selected === 'All' ? colors.textMuted : colors.text, fontSize: 13 }}>
          {selected === 'All' ? label : selected}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setOpen(false)}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, width: 220, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            {options.map((opt, i) => (
              <Pressable
                key={opt}
                onPress={() => { onSelect(opt); setOpen(false) }}
                style={{
                  paddingVertical: 14, paddingHorizontal: 20,
                  borderBottomWidth: i < options.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: selected === opt ? colors.primary + '22' : 'transparent',
                }}
              >
                <Text style={{ color: selected === opt ? colors.primary : colors.text, fontWeight: selected === opt ? 'bold' : 'normal' }}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

function getDisplayPhotoUri(car: SpottedCar, signedUrl: string | null | undefined): string | null {
  if (signedUrl) return signedUrl
  const uri = car.photoUri
  if (uri && (uri.startsWith('http') || uri.startsWith('file'))) return uri
  return null
}

// ─── GarageCard (list view) ──────────────────────────────────────────────────

function GarageCard({ car, photoUrl, onPress, onEditPhotos, onEditSpot, colors, rarityColors }: { car: SpottedCar; photoUrl?: string | null; onPress: () => void; onEditPhotos?: () => void; onEditSpot?: () => void; colors: { surface: string; border: string; text: string; textMuted: string; primary: string }; rarityColors: Record<string, string> }) {
  const { prediction, dateSpotted, rarity } = car
  const displayUri = getDisplayPhotoUri(car, photoUrl)
  const hasPhoto = !!displayUri

  const scale     = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 8, stiffness: 300 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 8, stiffness: 300 }) }}
        style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
      >
        {hasPhoto ? (
          <Image source={{ uri: displayUri! }} style={{ width: 80, height: 80, borderRadius: 12, marginRight: 14 }} resizeMode="cover" />
        ) : (
          <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <Ionicons name="car-outline" size={36} color={colors.textMuted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{prediction.make} {prediction.model}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>{prediction.year}</Text>
          <View style={{ alignSelf: 'flex-start', backgroundColor: rarityColors[rarity] ?? colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 }}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{rarity}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>{dateSpotted}</Text>
        </View>
        {onEditSpot ? (
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEditSpot() }} style={{ padding: 8, marginRight: 4 }}>
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        {onEditPhotos ? (
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEditPhotos() }} style={{ padding: 8, marginRight: 4 }}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

// ─── CardSwipeView ───────────────────────────────────────────────────────────

function CardSwipeView({
  cars, photoUrlMap, cardIndex, onChangeIndex, onCardPress, colors,
}: {
  cars: SpottedCar[]
  photoUrlMap: Map<string, string | null>
  cardIndex: number
  onChangeIndex: (index: number) => void
  onCardPress: (car: SpottedCar) => void
  colors: { surface: string; border: string; text: string; textMuted: string; primary: string }
}) {
  // All hooks must be called before any early returns
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const translateX  = useSharedValue(0)
  const cardAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  if (cars.length === 0) return <EmptyState />

  const cardWidth = width - 32

  // Available height for the card:
  //   Subtract non-scrollable header above (insets.top + 12 + title~66 + tab-switcher~54 + toggle-row~44 = insets.top + 176)
  //   Subtract footer below (dots+counter~46 + bottom-padding~16 + tab-bar~49 + insets.bottom = 111 + insets.bottom)
  //   Total fixed: insets.top + insets.bottom + 287
  const cardHeight  = Math.max(200, height - insets.top - insets.bottom - 287)
  const imageHeight = Math.round(cardHeight * 0.55)

  const car        = cars[cardIndex]
  const displayUri = getDisplayPhotoUri(car, photoUrlMap.get(car.id))
  const hasPhoto   = !!displayUri
  const extraSlots = car.photoUris?.slice(1, 3) ?? []

  const onSwipeLeft = () => {
    const next = (cardIndex + 1) % cars.length
    translateX.value = withTiming(-cardWidth, { duration: 200 }, (fin) => {
      'worklet'
      if (fin) {
        runOnJS(onChangeIndex)(next)
        translateX.value = cardWidth
        // Short delay so React re-renders with new card data before sliding in
        translateX.value = withDelay(16, withSpring(0, { damping: 20, stiffness: 200 }))
      }
    })
  }

  const onSwipeRight = () => {
    const prev = (cardIndex - 1 + cars.length) % cars.length
    translateX.value = withTiming(cardWidth, { duration: 200 }, (fin) => {
      'worklet'
      if (fin) {
        runOnJS(onChangeIndex)(prev)
        translateX.value = -cardWidth
        translateX.value = withDelay(16, withSpring(0, { damping: 20, stiffness: 200 }))
      }
    })
  }

  // Tap: navigate to car detail
  const tapGesture = Gesture.Tap()
    .onEnd(() => runOnJS(onCardPress)(car))

  // Pan: horizontal swipe to change card; fail on vertical movement (don't steal vertical scroll)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      if (e.translationX < -80) runOnJS(onSwipeLeft)()
      else if (e.translationX > 80) runOnJS(onSwipeRight)()
    })

  // Race: whichever recognises first wins. Pan needs 30px horizontal; Tap needs finger-up.
  const composedGesture = Gesture.Race(panGesture, tapGesture)

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 }}>

      {/* ── Card ───────────────────────────────────────────────────── */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{
          width: cardWidth,
          height: cardHeight,
          borderRadius: 16,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }, cardAnimStyle]}>

          {/* Hero image */}
          <View style={{ height: imageHeight }}>
            {hasPhoto ? (
              <Image
                source={{ uri: displayUri! }}
                style={{ width: '100%', height: imageHeight }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: imageHeight, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="car-outline" size={56} color={colors.textMuted} />
              </View>
            )}

            {/* Legacy label overlay */}
            {car.source === 'legacy' && (
              <View style={{
                position: 'absolute', bottom: 10, left: 10,
                backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 4,
              }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>Legacy</Text>
              </View>
            )}
          </View>

          {/* Info section */}
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{car.prediction.year}</Text>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 22, marginTop: 2 }}>{car.prediction.make}</Text>
            <Text style={{ color: colors.primary, fontSize: 16, marginTop: 2 }}>{car.prediction.model}</Text>
            {car.location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 4 }} numberOfLines={1}>{car.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Additional photo slots (legacy local URIs only; Storage flow has single primary for now) */}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
            {[0, 1].map(i => {
              const uri = extraSlots[i] && (extraSlots[i].startsWith('http') || extraSlots[i].startsWith('file')) ? extraSlots[i] : null
              return (
                <View
                  key={i}
                  style={{
                    flex: 1, height: 80, borderRadius: 10,
                    overflow: 'hidden', backgroundColor: colors.border,
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  {uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
                  )}
                </View>
              )
            })}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* ── Dot indicators ──────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 16 }}>
        {cars.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === cardIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === cardIndex ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>

      {/* ── Counter ─────────────────────────────────────────────────── */}
      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
        {cardIndex + 1} of {cars.length}
      </Text>

    </View>
  )
}

// ─── MyCarsScreen ────────────────────────────────────────────────────────────

export default function MyCarsScreen() {
  const { colors, rarityColors } = useTheme()
  const { session } = useAuth()
  const cars     = useStore((s) => s.spots)
  const setSpots = useStore((s) => s.setSpots)
  const settings = useStore((s) => s.settings)
  const setSetting = useStore((s) => s.setSetting)
  const viewMode = (settings.garageViewMode ?? 'list') as ViewMode
  const setViewMode = (mode: ViewMode) => setSetting('garageViewMode', mode)
  const [activeTab, setActiveTab]       = useState<GarageTab>('garage')
  const [searchQuery, setSearchQuery]   = useState('')
  const [rarityFilter, setRarityFilter] = useState<RarityOption>('All')
  const [typeFilter, setTypeFilter]     = useState<TypeOption>('All')
  const [cardIndex, setCardIndex]       = useState(0)
  const [legacyCars, setLegacyCars]     = useState<LegacyCar[]>([])
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Garage = public.spottings; Legacy = public.legacy_cars: refetch on focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('garage')
      setCardIndex(0)
      const uid = session?.user?.id
      if (uid) {
        fetchUserSpottings(uid).then((list) => setSpots(list))
        fetchLegacyCars(uid).then((list) => setLegacyCars(list))
      }
    }, [session?.user?.id, setSpots])
  )

  // Garage: camera + upload + backwards-compat (undefined source)
  // Legacy: only source === 'legacy'
  const tabFiltered = useMemo(() => {
    if (activeTab === 'garage')
      return cars.filter(c => !c.source || c.source === 'camera' || c.source === 'upload')
    return cars.filter(c => c.source === 'legacy')
  }, [cars, activeTab])

  const filtered = useMemo(() => {
    return tabFiltered
      .filter(c => rarityFilter === 'All' || c.rarity === rarityFilter)
      .filter(c => `${c.prediction.make} ${c.prediction.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [tabFiltered, searchQuery, rarityFilter])

  const [displayedFiltered, setDisplayedFiltered] = useState<SpottedCar[]>([])
  const listOpacity = useSharedValue(1)
  const listStyle   = useAnimatedStyle(() => ({ opacity: listOpacity.value }))
  const isMounted   = useRef(false)

  // Sync when cars store changes
  useEffect(() => {
    setDisplayedFiltered(filtered)
  }, [filtered])

  // Crossfade on filter/search change
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    listOpacity.value = withTiming(0, { duration: 100 }, (finished) => {
      if (finished) {
        runOnJS(setDisplayedFiltered)(filtered)
        listOpacity.value = withTiming(1, { duration: 150 })
      }
    })
  }, [searchQuery, rarityFilter, typeFilter, activeTab])

  // Reset card index when filters change
  useEffect(() => {
    setCardIndex(0)
  }, [searchQuery, rarityFilter, activeTab])

  const spottingIds = useMemo(() => displayedFiltered.map(c => c.id), [displayedFiltered])
  const { photoUrlMap, loading: photosLoading, error: photosError } = useSpottingPhotoUrls(spottingIds)

  const legacyCarIds = useMemo(() => legacyCars.map(c => c.id), [legacyCars])
  const { photoUrlMap: legacyPhotoUrlMap } = useLegacyCarPhotoUrls(legacyCarIds)

  return (
    // Root is a non-scrollable View so that card view can fill the screen exactly
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Non-scrollable header ────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>

        {/* Title row: left = title, right = [View Toggle] [Upload] */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>My Garage</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
              {cars.length} spotted vehicle{cars.length !== 1 ? 's' : ''} in your garage
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* View toggle — pill with list + grid icons */}
            {activeTab === 'garage' && (
              <View style={{ flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: colors.border }}>
                <Pressable
                  onPress={() => { setViewMode('list'); setCardIndex(0) }}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
                  }}
                >
                  <Ionicons name="list" size={18} color={viewMode === 'list' ? colors.primaryText : colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => { setViewMode('card'); setCardIndex(0) }}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: viewMode === 'card' ? colors.primary : 'transparent',
                  }}
                >
                  <Ionicons name="albums-outline" size={18} color={viewMode === 'card' ? colors.primaryText : colors.textMuted} />
                </Pressable>
              </View>
            )}
            {/* Upload — circular button */}
            <TouchableOpacity
              onPress={() => router.push('/manual-upload')}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="images-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Garage / Legacy tab switcher */}
        <View style={{
          flexDirection: 'row', backgroundColor: colors.border,
          borderRadius: 12, padding: 3, marginBottom: 14,
        }}>
          {(['garage', 'legacy'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
              }}
            >
              <Text style={{
                fontWeight: 'bold', fontSize: 13,
                color: activeTab === tab ? colors.primaryText : colors.textMuted,
              }}>
                {tab === 'garage' ? 'Garage' : 'Legacy'}
              </Text>
            </Pressable>
          ))}
        </View>

      </View>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {activeTab === 'garage' ? (
        <Animated.View style={[listStyle, { flex: 1 }]}>
          {viewMode === 'list' ? (
            // List mode: search + filters inside a scrollable area
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            >
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 }}>
                <DropdownPicker
                  label="All Rarity"
                  options={RARITY_OPTIONS}
                  selected={rarityFilter}
                  onSelect={(v) => setRarityFilter(v as RarityOption)}
                  colors={colors}
                />
                <DropdownPicker
                  label="All Types"
                  options={TYPE_OPTIONS}
                  selected={typeFilter}
                  onSelect={(v) => setTypeFilter(v as TypeOption)}
                  colors={colors}
                />
              </View>

              {displayedFiltered.length === 0 ? (
                <EmptyState />
              ) : (
                displayedFiltered.map(item => (
                  <GarageCard
                    key={item.id}
                    car={item}
                    photoUrl={photoUrlMap.get(item.id)}
                    onPress={() => router.push({ pathname: '/car-detail', params: { carJson: JSON.stringify(item) } })}
                    onEditSpot={() => router.push(`/edit-spot?spottingId=${item.id}`)}
                    onEditPhotos={() => router.push({ pathname: '/edit-spot-photos', params: { spottingId: item.id, carTitle: `${item.prediction.year} ${item.prediction.make} ${item.prediction.model}` } })}
                    colors={colors}
                    rarityColors={rarityColors}
                  />
                ))
              )}
            </ScrollView>
          ) : (
            // Card mode: fills remaining space, no scrolling
            <CardSwipeView
              cars={displayedFiltered}
              photoUrlMap={photoUrlMap}
              cardIndex={cardIndex}
              onChangeIndex={setCardIndex}
              onCardPress={(car) => router.push({ pathname: '/car-detail', params: { carJson: JSON.stringify(car) } })}
              colors={colors}
            />
          )}
        </Animated.View>
      ) : (
        /* Legacy tab: list from public.legacy_cars */
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => router.push('/add-legacy-car')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                marginBottom: 20,
                backgroundColor: colors.primary,
                borderRadius: 14,
              }}
            >
              <Ionicons name="add-circle" size={22} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16, marginLeft: 10 }}>Add legacy car</Text>
            </TouchableOpacity>
            {legacyCars.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Ionicons name="car-outline" size={56} color={colors.textMuted} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 16 }}>No legacy cars yet</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                  Add cars manually with make, model, year and photos
                </Text>
              </View>
            ) : (
              legacyCars.map((item) => {
                const photoUrl = legacyPhotoUrlMap.get(item.id) ?? null
                const title = `${item.year ?? ''} ${item.make} ${item.model} ${item.trim ?? ''}`.trim() || `${item.make} ${item.model}`
                const rarity = item.rarity_tier ?? 'Common'
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push({ pathname: '/legacy-car-detail', params: { legacyCarJson: JSON.stringify(item) } })}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={{ width: 80, height: 80, borderRadius: 12, marginRight: 14 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                        <Ionicons name="car-outline" size={36} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{item.make} {item.model}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>{item.year ?? '—'}{item.trim ? ` · ${item.trim}` : ''}</Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: rarityColors[rarity] ?? colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 }}>
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{rarity}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                )
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
