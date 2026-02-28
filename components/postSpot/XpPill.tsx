import React, { useEffect, useRef } from 'react'
import { Text, Animated } from 'react-native'

interface XpPillProps {
  label: string
  xp: number
  visible: boolean
  colors: { surface: string; border: string; text: string; primary: string }
}

export function XpPill({ label, xp, visible, colors }: XpPillProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current
  const scale = useRef(new Animated.Value(0.96)).current

  useEffect(() => {
    if (!visible) return
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 120 }),
    ]).start()
  }, [visible])

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 18,
        marginVertical: 4,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>+{xp} XP</Text>
    </Animated.View>
  )
}
