import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import Purchases from 'react-native-purchases'
import { configureRevenueCat } from '../services/revenuecat'

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? ''

/**
 * Runs RevenueCat initialization once on app start.
 * No-op on web. Never throws; logs warnings on error.
 */
export default function RevenueCatInit() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    const run = async () => {
      try {
        if (__DEV__ && Purchases.LOG_LEVEL != null) {
          await Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN)
        }
        if (REVENUECAT_API_KEY) {
          await configureRevenueCat(REVENUECAT_API_KEY)
        }
      } catch (e) {
        console.warn('[RevenueCatInit] init failed', e)
      }
    }

    run()
  }, [])

  return null
}
