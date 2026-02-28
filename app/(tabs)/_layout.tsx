import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/theme'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: COLORS.backgroundCard, borderTopColor: COLORS.border, height: 85, paddingBottom: 10, paddingTop: 8 },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarLabelStyle: { fontSize: 13, marginBottom: 6 },
      headerShown: false
    }}>
      <Tabs.Screen name="index" options={{ title: 'Spot', tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} /> }} />
      <Tabs.Screen name="my-cars" options={{ title: 'Garage', tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" size={size} color={color} /> }} />
      <Tabs.Screen name="stats" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
    </Tabs>
  )
}