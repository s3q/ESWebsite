import type { PlatformEvent } from '@/content/platform/events'
import { DEMO_NOW } from '@/lib/data/clock'

/**
 * Prototype helper for the gated profile's attendance log (sample events only). Registration
 * itself (availability, places, waitlists, duplicates) is decided by the Core Platform; the
 * public event pages use lib/core-api and nothing here.
 */

const NOW = new Date(DEMO_NOW).getTime()

export function isPast(e: Pick<PlatformEvent, 'end'>) {
  return new Date(e.end).getTime() < NOW
}
