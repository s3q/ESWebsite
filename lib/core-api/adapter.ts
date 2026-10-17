import { routes } from '@/lib/routes'
import type { CorePublicEventV1, EventAvailability, EventView } from './types'

/*
 * Core DTO → landing view model. The adapter formats and classifies for presentation; it makes
 * no authorization or booking decisions and invents no facts. Whether a registration succeeds
 * is always Core's answer.
 */

/**
 * DRAFT: the availability labels the landing recognises, matched case-insensitively. Core's
 * final vocabulary replaces this; any label not listed is shown as `unknown` (no form offered,
 * a neutral note instead) rather than guessed.
 */
export const AVAILABILITY_VOCABULARY: Readonly<Record<string, EventAvailability>> = {
  available: 'open',
  open: 'open',
  waitlist: 'waitlist',
  waitlist_open: 'waitlist',
  full: 'full',
  closed: 'closed',
  registration_closed: 'closed',
}

export function toAvailability(label: string): EventAvailability {
  return AVAILABILITY_VOCABULARY[label.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? 'unknown'
}

/** Event days are Oman days, whatever the server's or visitor's time zone. */
const omanDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' })

export function omanDateKey(isoOrDate: string | Date) {
  if (typeof isoOrDate === 'string' && isoOrDate.length === 10) return isoOrDate
  return omanDay.format(typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate)
}

/** An event stays "upcoming" until its day (in Oman) is over: presentation, not a booking rule. */
export function eventPhase(startsAt: string, now: Date): EventView['phase'] {
  return omanDateKey(startsAt) < omanDateKey(now) ? 'past' : 'upcoming'
}

export function toParagraphs(description: string) {
  return description
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

export function toEventView(dto: CorePublicEventV1, now: Date): EventView {
  const availability = toAvailability(dto.availability)
  const phase = eventPhase(dto.eventDate, now)
  return {
    id: dto.id,
    href: routes.event(encodeURIComponent(dto.id)),
    title: dto.title,
    description: dto.description,
    paragraphs: toParagraphs(dto.description),
    startsAt: dto.eventDate,
    hasTime: dto.eventDate.length > 10,
    location: dto.location,
    committeeName: dto.committeeName,
    availability,
    phase,
    offersRegistration: phase === 'upcoming' && (availability === 'open' || availability === 'waitlist'),
  }
}

/** Upcoming events, soonest first; past events, most recent last. */
export function byDate(a: EventView, b: EventView) {
  return Date.parse(normalise(a.startsAt)) - Date.parse(normalise(b.startsAt))
}

const normalise = (iso: string) => (iso.length === 10 ? `${iso}T00:00:00+04:00` : iso)
