import Purchases, { type CustomerInfo } from 'react-native-purchases'
import { supabase } from '../lib/supabase'

/** RevenueCat entitlement ID for premium (unlimited + streak). Configure in RevenueCat dashboard. */
export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium'

/** Product identifiers. Configure in App Store Connect / Play Console and RevenueCat. */
export const PRODUCT_ID_MONTHLY = 'monthly_499'
export const PRODUCT_ID_ONE_TIME = 'lifetime_899'

let configured = false

/**
 * Configure RevenueCat on app start. Call once after app loads.
 * Pass apiKey from env or config (e.g. process.env.EXPO_PUBLIC_REVENUECAT_API_KEY).
 */
export async function configureRevenueCat(apiKey: string): Promise<void> {
  if (configured) return
  try {
    await Purchases.configure({ apiKey })
    configured = true
  } catch (e) {
    console.warn('[RevenueCat] configure failed', e)
  }
}

/**
 * Set the RevenueCat user id (e.g. Supabase auth uid). Call after login.
 */
export async function setRevenueCatUserId(userId: string): Promise<void> {
  if (!configured) return
  try {
    await Purchases.logIn(userId)
  } catch (e) {
    console.warn('[RevenueCat] logIn failed', e)
  }
}

/**
 * Map CustomerInfo to profile subscription fields and persist to Supabase.
 * - Monthly active => is_subscribed=true, subscription='monthly'
 * - One-time owned => extra_spots=7, subscription='lifetime'
 * - Neither => is_subscribed=false, extra_spots=0, subscription=null
 */
function customerInfoToProfilePatch(info: CustomerInfo | null): {
  is_subscribed: boolean
  extra_spots: number
  subscription: string | null
} {
  if (!info) {
    return { is_subscribed: false, extra_spots: 0, subscription: null }
  }

  const premium = info.entitlements.active[REVENUECAT_ENTITLEMENT_PREMIUM]
  if (premium) {
    const productId = premium.productIdentifier ?? ''
    if (productId.toLowerCase().includes('monthly') || productId === PRODUCT_ID_MONTHLY) {
      return { is_subscribed: true, extra_spots: 0, subscription: 'monthly' }
    }
    return { is_subscribed: false, extra_spots: 7, subscription: 'lifetime' }
  }

  const allPurchased = info.allPurchasedProductIdentifiers ?? []
  const hasOneTime = allPurchased.some(
    (id) => id === PRODUCT_ID_ONE_TIME || id.toLowerCase().includes('lifetime') || id.toLowerCase().includes('onetime')
  )
  if (hasOneTime) {
    return { is_subscribed: false, extra_spots: 7, subscription: 'lifetime' }
  }

  return { is_subscribed: false, extra_spots: 0, subscription: null }
}

/**
 * Sync RevenueCat customerInfo to Supabase profiles and local state.
 * Call after customerInfo updates (listener) or after restore.
 */
export async function syncRevenueCatToProfile(userId: string, customerInfo: CustomerInfo | null): Promise<void> {
  const patch = customerInfoToProfilePatch(customerInfo)

  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: patch.is_subscribed,
      extra_spots: patch.extra_spots,
      subscription: patch.subscription,
    })
    .eq('id', userId)

  if (error) {
    console.warn('[RevenueCat] profile update failed', error.message)
    return
  }
}

/**
 * Add listener for customerInfo updates (e.g. after purchase or restore).
 * When info updates, sync to Supabase and refresh profile.
 */
export function addRevenueCatListener(
  userId: string | null,
  onSynced?: () => void
): () => void {
  const handler = async (info: CustomerInfo) => {
    if (userId) {
      await syncRevenueCatToProfile(userId, info)
      onSynced?.()
    }
  }

  Purchases.addCustomerInfoUpdateListener(handler)

  return () => {
    Purchases.removeCustomerInfoUpdateListener(handler)
  }
}

/**
 * Get current customer info (e.g. on app open) and sync to profile.
 */
export async function getCustomerInfoAndSync(userId: string): Promise<CustomerInfo | null> {
  try {
    const info = await Purchases.getCustomerInfo()
    await syncRevenueCatToProfile(userId, info)
    return info
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed', e)
    return null
  }
}

/**
 * Restore purchases and sync to profile.
 */
export async function restorePurchases(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const info = await Purchases.restorePurchases()
    await syncRevenueCatToProfile(userId, info)
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Restore failed'
    return { success: false, error: message }
  }
}

/**
 * Purchase monthly subscription. Returns success and optional error.
 */
export async function purchaseMonthly(): Promise<{ success: boolean; error?: string }> {
  try {
    const offerings = await Purchases.getOfferings()
    const packageToBuy = offerings.current?.availablePackages.find(
      (p) => p.identifier === 'monthly' || p.packageType === 'MONTHLY' || p.product.identifier === PRODUCT_ID_MONTHLY
    ) ?? offerings.current?.availablePackages[0]
    if (!packageToBuy) {
      return { success: false, error: 'No monthly package found' }
    }
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy)
    return { success: !!customerInfo }
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean }
    if (err.userCancelled) return { success: false, error: 'Cancelled' }
    const message = e instanceof Error ? e.message : 'Purchase failed'
    return { success: false, error: message }
  }
}

/**
 * Purchase one-time (lifetime 10 spots/day).
 */
export async function purchaseOneTime(): Promise<{ success: boolean; error?: string }> {
  try {
    const offerings = await Purchases.getOfferings()
    const packageToBuy = offerings.current?.availablePackages.find(
      (p) => p.identifier === 'lifetime' || p.product.identifier === PRODUCT_ID_ONE_TIME
    ) ?? offerings.current?.availablePackages.find((p) => p.packageType === 'LIFETIME')
    if (!packageToBuy) {
      return { success: false, error: 'No one-time package found' }
    }
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy)
    return { success: !!customerInfo }
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean }
    if (err.userCancelled) return { success: false, error: 'Cancelled' }
    const message = e instanceof Error ? e.message : 'Purchase failed'
    return { success: false, error: message }
  }
}
