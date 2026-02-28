import { IdentifyResponse } from '../types'

/** Stub: replace with real identification API. Returns a single generic result for development. */
const STUB_RESPONSE: IdentifyResponse = {
  identification: { make: 'Car', model: 'Unknown', trim: '', year: new Date().getFullYear(), colour: '', uncertain: true },
  specs: { rarity_tier: 'Common', horsepower: 0, engine: '', zero_to_100_kmh: 0, base_price_usd: 0 },
  xp: { base_xp: 50, multipliers: { location: 1, condition: 1, modifications: 1, photo_quality: 1 }, total_xp: 50, breakdown: '' },
}

export async function identifyCar(_photoUri: string): Promise<IdentifyResponse> {
  await new Promise((r) => setTimeout(r, 800))
  return STUB_RESPONSE
}
