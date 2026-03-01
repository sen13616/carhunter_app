import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Animated, Image, Alert } from 'react-native'
import { CameraView, Camera } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { IdentificationSheet } from '../../components/bottomsheet/IdentificationSheet'
import { CameraControls } from '../../components/camera/CameraControls'
import { identifyCar } from '../../services/carIdentifier'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../contexts/auth'
import { IdentifyResponse } from '../../types'
import { useTheme } from '../../contexts/theme'

const SHUTTER_SIZE = 80
const MAX_ADDITIONAL_PHOTOS = 5  // caps additional photos only; primary shot is unaffected

export default function SpotScreen() {
  const { colors } = useTheme()
  const { session } = useAuth()
  const userId = session?.user?.id ?? 'demo_user_001'
  const [hasPermission, setHasPermission]     = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing]       = useState(false)
  const [sheetVisible, setSheetVisible]       = useState(false)
  const [isLoading, setIsLoading]             = useState(false)
  const [identifyResult, setIdentifyResult]   = useState<IdentifyResponse | null>(null)
  const [capturedPhotoUri, setCapturedPhotoUri] = useState('')
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([])
  const [addAnglesMode, setAddAnglesMode]       = useState(false)
  const showGrid  = useStore((s) => s.settings.cameraGrid)
  const cameraRef = useRef<CameraView>(null)
  const flashOpacity = useRef(new Animated.Value(0)).current
  const insets       = useSafeAreaInsets()
  const { width: screenWidth } = Dimensions.get('window')

  const triggerFlash = () => {
    flashOpacity.setValue(0.85)
    Animated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start()
  }

  const shutterLeft = screenWidth * 0.5 - SHUTTER_SIZE / 2

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return
    if (addAnglesMode && additionalPhotos.length >= MAX_ADDITIONAL_PHOTOS) return
    triggerFlash()
    setIsProcessing(true)
    const photo = await cameraRef.current.takePictureAsync()
    if (!photo) { setIsProcessing(false); return }

    if (addAnglesMode) {
      // Add angles mode — append only, no identification
      setAdditionalPhotos(prev => [...prev, photo.uri])
      setIsProcessing(false)
    } else {
      setCapturedPhotoUri(photo.uri)
      setSheetVisible(true)
      setIsLoading(true)
      try {
        const result = await identifyCar(photo.uri, { userId, mimeType: 'image/jpeg' })
        setIdentifyResult(result)
      } catch (e) {
        Alert.alert('Identification failed', e instanceof Error ? e.message : 'Could not identify the car.')
      }
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const handleProceed = () => {
    setAddAnglesMode(false)
    setSheetVisible(true)
  }

  const handleAddMorePhotos = () => {
    setSheetVisible(false)
    setAddAnglesMode(true)
  }

  const handleClose = () => {
    setSheetVisible(false)
    setAddAnglesMode(false)
    setAdditionalPhotos([])
    setCapturedPhotoUri('')
  }

  const handleUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to choose an image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const uri = asset.uri
    const mimeType = asset.mimeType ?? 'image/jpeg'
    setCapturedPhotoUri(uri)
    setSheetVisible(true)
    setIsLoading(true)
    setIdentifyResult(null)
    try {
      const identifyResult = await identifyCar(uri, { userId, mimeType })
      setIdentifyResult(identifyResult)
    } catch (e) {
      Alert.alert('Identification failed', e instanceof Error ? e.message : 'Could not identify the car.')
    }
    setIsLoading(false)
  }

  if (hasPermission === null) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />
  }

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.text, marginBottom: 16 }}>No access to camera</Text>
        <TouchableOpacity onPress={handleUpload} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}>
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Upload from gallery</Text>
        </TouchableOpacity>
        <IdentificationSheet
          visible={sheetVisible}
          onClose={handleClose}
          photoUri={capturedPhotoUri}
          identifyResult={identifyResult}
          isLoading={isLoading}
          additionalPhotos={additionalPhotos}
          onAddMorePhotos={handleAddMorePhotos}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>CARSPOTTER</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Pill: "AI Ready" in normal mode, "Add Angles" in add angles mode */}
          <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: colors.primary, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 }} />
            <Text style={{ color: colors.primary }}>{addAnglesMode ? 'Add Angles' : 'AI Ready'}</Text>
          </View>
        </View>
      </View>

      <CameraView style={{ flex: 1 }} ref={cameraRef}>
        {/* Shutter flash overlay */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', opacity: flashOpacity, zIndex: 10 }}
        />
        {/* Grid overlay — conditionally rendered */}
        {showGrid && (
          <>
            <View style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <View style={{ position: 'absolute', top: '66.67%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <View style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <View style={{ position: 'absolute', left: '66.67%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </>
        )}
      </CameraView>

      {/* Bottom controls row */}
      <View style={{ position: 'absolute', bottom: 20 + insets.bottom, left: 0, right: 0, height: SHUTTER_SIZE }}>

        {/* Thumbnail strip — add angles mode only, bottom-left */}
        {addAnglesMode && additionalPhotos.length > 0 && (
          <View style={{ position: 'absolute', left: 24, top: 0, height: SHUTTER_SIZE, flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
              {additionalPhotos.length} added
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {additionalPhotos.slice(-2).map((uri, i, arr) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: 56, height: 56, borderRadius: 8, marginRight: i < arr.length - 1 ? -12 : 0 }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Shutter button — centered */}
        <View style={{ position: 'absolute', left: shutterLeft, top: 0 }}>
          <CameraControls
            onPress={handleCapture}
            disabled={isProcessing || (addAnglesMode && additionalPhotos.length >= MAX_ADDITIONAL_PHOTOS)}
          />
        </View>

        {/* Upload — gallery fallback (e.g. simulator); hide in add-angles mode */}
        {!addAnglesMode && (
          <TouchableOpacity
            onPress={handleUpload}
            style={{ position: 'absolute', left: 24, top: (SHUTTER_SIZE - 44) / 2, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="images-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: 8 }}>Upload</Text>
          </TouchableOpacity>
        )}

        {/* Add angles mode: Proceed button bottom-right */}
        {addAnglesMode && (
          <TouchableOpacity
            onPress={handleProceed}
            style={{ position: 'absolute', right: 16, top: (SHUTTER_SIZE - 44) / 2, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: 'bold' }}>Proceed</Text>
          </TouchableOpacity>
        )}
      </View>

      <IdentificationSheet
        visible={sheetVisible}
        onClose={handleClose}
        photoUri={capturedPhotoUri}
        identifyResult={identifyResult}
        isLoading={isLoading}
        additionalPhotos={additionalPhotos}
        onAddMorePhotos={handleAddMorePhotos}
      />
    </View>
  )
}
