import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Image, useWindowDimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../store/useStore'
import { SpottedCar, RarityLevel } from '../../types'
import { COLORS, RARITY_ORDER, RARITY_COLORS } from '../../constants/theme'
import { SearchBar } from '../../components/mycars/SearchBar'
import { EmptyState } from '../../components/mycars/EmptyState'

const RARITY_OPTIONS = ['All', 'Legendary', 'Very Rare', 'Rare', 'Uncommon', 'Common'] as const
const TYPE_OPTIONS   = ['All', 'Supercar', 'Sedan', 'SUV', 'Classic', 'Sports'] as const

type RarityOption = typeof RARITY_OPTIONS[number]
type TypeOption   = typeof TYPE_OPTIONS[number]
type GarageTab    = 'garage' | 'legacy'
type ViewMode     = 'list' | 'card'

// ─── DropdownPicker ─────────────────────────────────────────────────────────

function DropdownPicker({
  label, options, selected, onSelect,
}: {
  label: string
  options: readonly string[]
  selected: string
  onSelect: (val: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: COLORS.backgroundCard, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10,
          borderWidth: 1, borderColor: COLORS.border,
        }}
      >
        <Text style={{ color: selected === 'All' ? COLORS.textSecondary : COLORS.textPrimary, fontSize: 13 }}>
          {selected === 'All' ? label : selected}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setOpen(false)}
        >
          <View style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 14, width: 220, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
            {options.map((opt, i) => (
              <Pressable
                key={opt}
                onPress={() => { onSelect(opt); setOpen(false) }}
                style={{
                  paddingVertical: 14, paddingHorizontal: 20,
                  borderBottomWidth: i < options.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                  backgroundColor: selected === opt ? COLORS.accent + '22' : 'transparent',
                }}
              >
                <Text style={{ color: selected === opt ? COLORS.accent : COLORS.textPrimary, fontWeight: selected === opt ? 'bold' : 'normal' }}>
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

// ─── GarageCard (list view) ──────────────────────────────────────────────────

function GarageCard({ car, onPress }: { car: SpottedCar; onPress: () => void }) {
  const { photoUri, prediction, dateSpotted, rarity } = car
  const hasPhoto = photoUri && photoUri.length > 0

  const scale     = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 8, stiffness: 300 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 8, stiffness: 300 }) }}
        style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
      >
        {hasPhoto ? (
          <Image source={{ uri: photoUri }} style={{ width: 80, height: 80, borderRadius: 12, marginRight: 14 }} resizeMode="cover" />
        ) : (
          <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <Ionicons name="car-outline" size={36} color={COLORS.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{prediction.make} {prediction.model}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>{prediction.year}</Text>
          <View style={{ alignSelf: 'flex-start', backgroundColor: RARITY_COLORS[rarity], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 }}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{rarity}</Text>
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 6 }}>{dateSpotted}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </Pressable>
    </Animated.View>
  )
}

// ─── CardSwipeView ───────────────────────────────────────────────────────────

function CardSwipeView({
  cars, cardIndex, onChangeIndex, onCardPress,
}: {
  cars: SpottedCar[]
  cardIndex: number
  onChangeIndex: (index: number) => void
  onCardPress: (car: SpottedCar) => void
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
  const hasPhoto   = car.photoUri && car.photoUri.length > 0
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
          backgroundColor: COLORS.backgroundCard,
          overflow: 'hidden',
        }, cardAnimStyle]}>

          {/* Hero image */}
          <View style={{ height: imageHeight }}>
            {hasPhoto ? (
              <Image
                source={{ uri: car.photoUri }}
                style={{ width: '100%', height: imageHeight }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: imageHeight, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="car-outline" size={56} color={COLORS.textSecondary} />
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
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{car.prediction.year}</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 22, marginTop: 2 }}>{car.prediction.make}</Text>
            <Text style={{ color: COLORS.accent, fontSize: 16, marginTop: 2 }}>{car.prediction.model}</Text>
            {car.location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 }} numberOfLines={1}>{car.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Additional photo slots */}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
            {[0, 1].map(i => {
              const uri = extraSlots[i]
              return (
                <View
                  key={i}
                  style={{
                    flex: 1, height: 80, borderRadius: 10,
                    overflow: 'hidden', backgroundColor: COLORS.border,
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  {uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="camera-outline" size={24} color={COLORS.textSecondary} />
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
              backgroundColor: i === cardIndex ? COLORS.accent : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </View>

      {/* ── Counter ─────────────────────────────────────────────────── */}
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
        {cardIndex + 1} of {cars.length}
      </Text>

    </View>
  )
}

// ─── MyCarsScreen ────────────────────────────────────────────────────────────

export default function MyCarsScreen() {
  const cars   = useStore((s) => s.spots)
  const [activeTab, setActiveTab]       = useState<GarageTab>('garage')
  const [searchQuery, setSearchQuery]   = useState('')
  const [rarityFilter, setRarityFilter] = useState<RarityOption>('All')
  const [typeFilter, setTypeFilter]     = useState<TypeOption>('All')
  const [viewMode, setViewMode]         = useState<ViewMode>('list')
  const [cardIndex, setCardIndex]       = useState(0)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Reset to Garage tab and card index on screen focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('garage')
      setCardIndex(0)
    }, [])
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
  }, [cars])

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

  return (
    // Root is a non-scrollable View so that card view can fill the screen exactly
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>

      {/* ── Non-scrollable header ────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>

        {/* Title row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' }}>My Garage</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
              Your personal collection of {cars.length} spotted vehicles
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/manual-upload')}
            style={{ backgroundColor: COLORS.backgroundCard, borderRadius: 20, padding: 10 }}
          >
            <Ionicons name="images-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Garage / Legacy tab switcher */}
        <View style={{
          flexDirection: 'row', backgroundColor: COLORS.border,
          borderRadius: 12, padding: 3, marginBottom: 14,
        }}>
          {(['garage', 'legacy'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
              }}
            >
              <Text style={{
                fontWeight: 'bold', fontSize: 13,
                color: activeTab === tab ? COLORS.background : COLORS.textSecondary,
              }}>
                {tab === 'garage' ? 'Garage' : 'Legacy'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* View toggle buttons — garage tab only, always visible to allow switching back */}
        {activeTab === 'garage' && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
            <Pressable
              onPress={() => { setViewMode('list'); setCardIndex(0) }}
              style={{
                width: 36, height: 36, borderRadius: 8,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: viewMode === 'list' ? COLORS.accent : COLORS.backgroundCard,
                borderWidth: 1, borderColor: viewMode === 'list' ? COLORS.accent : COLORS.border,
              }}
            >
              <Ionicons name="list" size={16} color={viewMode === 'list' ? 'white' : COLORS.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => { setViewMode('card'); setCardIndex(0) }}
              style={{
                width: 36, height: 36, borderRadius: 8,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: viewMode === 'card' ? COLORS.accent : COLORS.backgroundCard,
                borderWidth: 1, borderColor: viewMode === 'card' ? COLORS.accent : COLORS.border,
              }}
            >
              <Ionicons name="albums-outline" size={16} color={viewMode === 'card' ? 'white' : COLORS.textSecondary} />
            </Pressable>
          </View>
        )}

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
                />
                <DropdownPicker
                  label="All Types"
                  options={TYPE_OPTIONS}
                  selected={typeFilter}
                  onSelect={(v) => setTypeFilter(v as TypeOption)}
                />
              </View>

              {displayedFiltered.length === 0 ? (
                <EmptyState />
              ) : (
                displayedFiltered.map(item => (
                  <GarageCard
                    key={item.id}
                    car={item}
                    onPress={() => router.push({ pathname: '/car-detail', params: { carJson: JSON.stringify(item) } })}
                  />
                ))
              )}
            </ScrollView>
          ) : (
            // Card mode: fills remaining space, no scrolling
            <CardSwipeView
              cars={displayedFiltered}
              cardIndex={cardIndex}
              onChangeIndex={setCardIndex}
              onCardPress={(car) => router.push({ pathname: '/car-detail', params: { carJson: JSON.stringify(car) } })}
            />
          )}
        </Animated.View>
      ) : (
        /* Legacy tab */
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 80 }}>
          <Ionicons name="car-outline" size={56} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 16 }}>
            No legacy spots yet
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            Legacy spots can be added during onboarding
          </Text>
        </View>
      )}
    </View>
  )
}
