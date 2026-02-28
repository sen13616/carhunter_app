import React, { useEffect, useRef } from 'react'
import { Tabs, useRouter, useSegments } from 'expo-router'
import { CustomTabBar, type CustomTabBarProps } from '../../components/navigation/CustomTabBar'

export default function TabsLayout() {
  const router = useRouter()
  const segments = useSegments() as string[]
  const hasForcedSpot = useRef(false)

  // Default tab = Spot: on app boot / reopen, force navigation to Spot once (no infinite loop)
  useEffect(() => {
    if (hasForcedSpot.current) return
    hasForcedSpot.current = true
    const inTabs = segments[0] === '(tabs)'
    const currentTab = segments[1]
    if (inTabs && currentTab !== undefined && currentTab !== 'index') {
      router.replace('/(tabs)/index' as never)
    }
  }, [segments, router])

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...(props as CustomTabBarProps)} />}
    >
      <Tabs.Screen name="stats" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="index" options={{ title: 'Spot' }} />
      <Tabs.Screen name="my-cars" options={{ title: 'Garage' }} />
    </Tabs>
  )
}
