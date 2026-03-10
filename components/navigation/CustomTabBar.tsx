import React, { useEffect } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../contexts/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface CustomTabBarProps {
  state: { routes: { key: string; name: string; params?: object }[]; index: number }
  navigation: { emit: (opts: unknown) => unknown; navigate: (name: string, params?: object) => void }
}

const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap; label: string }> = {
  stats:    { icon: 'bar-chart',  iconOutline: 'bar-chart-outline',  label: 'Dashboard' },
  index:    { icon: 'scan',       iconOutline: 'scan',               label: 'Spot' },
  'my-cars': { icon: 'car-sport', iconOutline: 'car-sport-outline',  label: 'Garage' },
}

// Render order: Dashboard (stats) | Spot (index) | Garage (my-cars)
const ROUTE_ORDER = ['stats', 'index', 'my-cars'] as const

// ── Regular tab item (Dashboard / Garage) with animated active indicator ──
interface TabBarItemProps {
  route: { key: string; name: string; params?: object }
  isFocused: boolean
  onPress: () => void
  colors: ReturnType<typeof useTheme>['colors']
}

function TabBarItem({ route, isFocused, onPress, colors }: TabBarItemProps) {
  const config = TAB_CONFIG[route.name] ?? { icon: 'ellipse', iconOutline: 'ellipse-outline', label: route.name }
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0)

  useEffect(() => {
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 })
  }, [isFocused])

  const indicatorStyle = useAnimatedStyle(() => ({ opacity: indicatorOpacity.value }))

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}
    >
      <Ionicons
        name={isFocused ? config.icon : config.iconOutline}
        size={24}
        color={isFocused ? colors.tabIconActive : colors.tabIcon}
        style={{ marginBottom: 4 }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: isFocused ? '700' : '400',
          color: isFocused ? colors.tabIconActive : colors.tabIcon,
        }}
      >
        {config.label}
      </Text>
      <Animated.View
        style={[{
          width: '70%',
          maxWidth: 48,
          height: 2.5,
          borderRadius: 1.25,
          backgroundColor: colors.tabIconActive,
          marginTop: 2,
        }, indicatorStyle]}
      />
    </Pressable>
  )
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const routesInOrder = ROUTE_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean) as typeof state.routes

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        backgroundColor: colors.tabBarBg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10) + 6,
        height: 88 + Math.max(insets.bottom, 10),
      }}
    >
      {routesInOrder.map((route) => {
        const isFocused = state.routes[state.index]?.key === route.key
        const isSpot = route.name === 'index'

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params)
          }
        }

        if (isSpot) {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Pressable
                onPress={onPress}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                  ...Platform.select({
                    ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
                    android: { elevation: 8 },
                  }),
                }}
              >
                <Ionicons name="scan" size={28} color={colors.primaryText} />
              </Pressable>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isFocused ? '700' : '400',
                  color: isFocused ? colors.tabIconActive : colors.tabIcon,
                }}
              >
                {TAB_CONFIG['index'].label}
              </Text>
              {isFocused && (
                <View
                  style={{
                    width: 28,
                    height: 2.5,
                    borderRadius: 1.25,
                    backgroundColor: colors.tabIconActive,
                    marginTop: 2,
                  }}
                />
              )}
            </View>
          )
        }

        return (
          <TabBarItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
          />
        )
      })}
    </View>
  )
}
