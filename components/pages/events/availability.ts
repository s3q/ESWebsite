import type { StatusTone } from '@/components/platform/Platform'
import type { EventView } from '@/lib/core-api/types'

/**
 * How an event's availability is presented: one badge per event, from Core's availability
 * and the event's date. Presentation only: whether a registration succeeds is Core's answer.
 */
export type AvailabilityBadge = EventView['availability'] | 'past'

export const badgeFor = (e: Pick<EventView, 'availability' | 'phase'>): AvailabilityBadge => (e.phase === 'past' ? 'past' : e.availability)

export const BADGE_TONE: Record<AvailabilityBadge, StatusTone> = {
  open: 'open',
  waitlist: 'waiting',
  full: 'negative',
  closed: 'neutral',
  unknown: 'neutral',
  past: 'done',
}
