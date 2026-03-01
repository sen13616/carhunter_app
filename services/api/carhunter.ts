import type { IdentifyResponse, RarityLevel, XpMultipliers } from '../../types'

const BASE_URL = 'https://carhunter-backend.onrender.com'

export type IdentifyOptions = {
  userId?: string
  mimeType?: string
  condition?: 'pristine' | 'good' | 'fair' | 'beater'
  is_modified?: boolean
  location_name?: string
}

/**
 * POST /identify with multipart/form-data. Returns identification + specs + xp.
 */
export async function identifyCar(
  imageUri: string,
  options: IdentifyOptions = {}
): Promise<IdentifyResponse> {
  const {
    userId = 'demo_user_001',
    mimeType = 'image/jpeg',
    condition = 'good',
    is_modified = false,
    location_name,
  } = options

  const form = new FormData()
  form.append('user_id', userId)
  form.append('condition', condition)
  form.append('is_modified', String(!!is_modified))
  if (location_name) form.append('location_name', location_name)
  form.append('image', {
    uri: imageUri,
    name: 'photo.jpg',
    type: mimeType,
  } as unknown as Blob)

  const res = await fetch(`${BASE_URL}/identify`, {
    method: 'POST',
    body: form,
    headers: {
      Accept: 'application/json',
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${text}`)

  const raw = JSON.parse(text) as {
    identification?: {
      make?: string
      model?: string
      trim?: string
      year?: number
      colour?: string
      uncertain?: boolean
    }
    specs?: {
      rarity_tier?: string
      horsepower?: number
      engine?: string
      zero_to_100_kmh?: number
      base_price_usd?: number
    }
    xp?: {
      base_xp?: number
      multipliers?: XpMultipliers
      total_xp?: number
      breakdown?: string
    }
  }

  const identification = raw.identification ?? {}
  const specs = raw.specs ?? {}
  const xp = raw.xp ?? {}

  const result: IdentifyResponse = {
    identification: {
      make: String(identification.make ?? ''),
      model: String(identification.model ?? ''),
      trim: String(identification.trim ?? ''),
      year: Number(identification.year ?? 0),
      colour: String(identification.colour ?? ''),
      uncertain: Boolean(identification.uncertain),
    },
    specs: {
      rarity_tier: (specs.rarity_tier as RarityLevel) ?? 'Common',
      horsepower: Number(specs.horsepower ?? 0),
      engine: String(specs.engine ?? ''),
      zero_to_100_kmh: Number(specs.zero_to_100_kmh ?? 0),
      base_price_usd: Number(specs.base_price_usd ?? 0),
    },
    xp: {
      base_xp: Number(xp.base_xp ?? 0),
      multipliers: xp.multipliers ?? {
        location: 1,
        condition: 1,
        modifications: 1,
        photo_quality: 1,
      },
      total_xp: Number(xp.total_xp ?? 0),
      breakdown: String(xp.breakdown ?? ''),
    },
  }

  return result
}
