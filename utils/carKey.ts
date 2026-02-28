/**
 * Normalize a string for use in a deterministic car key:
 * lowercase, trim, collapse whitespace, replace non-alphanumerics with underscores.
 */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || '_'
}

export interface CreateCarKeyInput {
  make: string
  model: string
  trim?: string
  year?: number | string
  colour?: string
}

/**
 * Deterministic string key for a car based on make, model, optional trim/year/colour.
 */
export function createCarKey(input: CreateCarKeyInput): string {
  const make = normalize(String(input.make ?? ''))
  const model = normalize(String(input.model ?? ''))
  const trim = input.trim != null && String(input.trim).trim() !== '' ? normalize(String(input.trim)) : ''
  const year = input.year != null && input.year !== '' ? String(input.year).trim() : ''
  const colour = input.colour != null && String(input.colour).trim() !== '' ? normalize(String(input.colour)) : ''

  const parts = [make, model]
  if (trim) parts.push(trim)
  if (year) parts.push(year)
  if (colour) parts.push(colour)

  return parts.join('_') || 'unknown'
}
