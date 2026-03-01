import type { IdentifyResponse } from '../types'
import { identifyCar as identifyCarApi, type IdentifyOptions } from './api/carhunter'

export type IdentifyCarOptions = IdentifyOptions

/**
 * Identify car from photo URI. Calls POST /identify and returns parsed result.
 */
export async function identifyCar(
  photoUri: string,
  options: IdentifyCarOptions = {}
): Promise<IdentifyResponse> {
  return identifyCarApi(photoUri, options)
}
