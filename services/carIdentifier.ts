import { IdentifyResponse } from '../types'

let cycleIndex = 0

const mocks: IdentifyResponse[] = [
  {
    identification: { make: 'BMW', model: 'M3', trim: 'Competition', year: 2021, colour: 'Frozen Grey', uncertain: false },
    specs: { rarity_tier: 'Rare', horsepower: 503, engine: '3.0L I6 Twin-Turbo', zero_to_100_kmh: 3.9, base_price_usd: 75000 },
    xp: {
      base_xp: 400,
      multipliers: { location: 1.4, condition: 1.2, modifications: 1.0, photo_quality: 1.1 },
      total_xp: 739,
      breakdown: 'You spotted a Rare BMW M3 Competition in good condition with clean photo composition.',
    },
  },
  {
    identification: { make: 'Ferrari', model: '488 GTB', trim: 'Base', year: 2015, colour: 'Rosso Corsa', uncertain: false },
    specs: { rarity_tier: 'Very Rare', horsepower: 660, engine: '3.9L V8 Twin-Turbo', zero_to_100_kmh: 3.0, base_price_usd: 250000 },
    xp: {
      base_xp: 800,
      multipliers: { location: 1.6, condition: 1.3, modifications: 1.1, photo_quality: 1.2 },
      total_xp: 2183,
      breakdown: 'You spotted a Very Rare Ferrari 488 GTB in pristine condition at a premium location.',
    },
  },
  {
    identification: { make: 'Toyota', model: 'Supra', trim: 'MK4 RZ', year: 1997, colour: 'Super White', uncertain: true },
    specs: { rarity_tier: 'Uncommon', horsepower: 276, engine: '3.0L I6 Twin-Turbo', zero_to_100_kmh: 4.6, base_price_usd: 45000 },
    xp: {
      base_xp: 150,
      multipliers: { location: 1.0, condition: 1.0, modifications: 1.0, photo_quality: 1.0 },
      total_xp: 150,
      breakdown: 'You spotted an Uncommon Toyota Supra. AI confidence was low — please verify the identification.',
    },
  },
  {
    identification: { make: 'Porsche', model: '911 GT3', trim: 'RS', year: 2020, colour: 'Guards Red', uncertain: false },
    specs: { rarity_tier: 'Legendary', horsepower: 520, engine: '4.0L Flat-6', zero_to_100_kmh: 3.2, base_price_usd: 190000 },
    xp: {
      base_xp: 1200,
      multipliers: { location: 1.8, condition: 1.3, modifications: 1.25, photo_quality: 1.2 },
      total_xp: 3510,
      breakdown: 'You spotted a Legendary Porsche 911 GT3 RS at a premium location in perfect condition.',
    },
  },
  {
    identification: { make: 'Ford', model: 'GT', trim: 'Heritage Edition', year: 2017, colour: 'Gulf Blue', uncertain: false },
    specs: { rarity_tier: 'Very Rare', horsepower: 647, engine: '3.5L V6 EcoBoost', zero_to_100_kmh: 3.1, base_price_usd: 450000 },
    xp: {
      base_xp: 800,
      multipliers: { location: 1.5, condition: 1.4, modifications: 1.15, photo_quality: 1.3 },
      total_xp: 2506,
      breakdown: 'You spotted a Very Rare Ford GT Heritage Edition in exceptional condition with outstanding photo quality.',
    },
  },
]

export async function identifyCar(_photoUri: string): Promise<IdentifyResponse> {
  await new Promise(resolve => setTimeout(resolve, 1200))
  const result = mocks[cycleIndex]
  cycleIndex = (cycleIndex + 1) % mocks.length
  return result
}
