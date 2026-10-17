import type { CoreErrorKind } from './errors'

/*
 * API-facing types for the Core Platform's public API, version 1.
 *
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ DRAFT CONTRACT — pending confirmation against Core's published OpenAPI v1.           │
 * │ Only the fields Core's public event contract is known to carry are modelled here.    │
 * │ Nothing internal (capacity, revision, committee id, review state, audit fields,      │
 * │ registration counts) is assumed. Update this file, schemas.ts and the fixtures       │
 * │ together when the contract is published.                                             │
 * └──────────────────────────────────────────────────────────────────────────────────────┘
 */

/** GET /v1/events and GET /v1/events/{eventId}: one public event. DRAFT. */
export interface CorePublicEventV1 {
  /** Opaque identifier, used as-is in the event's URL. */
  id: string
  title: string
  description: string
  /** ISO 8601: a date (`2026-11-03`) or a date-time with offset (`2026-11-03T18:30:00+04:00`). */
  eventDate: string
  location: string
  committeeName: string
  /** Core's availability label. Vocabulary pending; see AVAILABILITY_VOCABULARY in adapter.ts. */
  availability: string
}

// ---------------------------------------------------------------- landing view models

/** The availability states the landing presents. Anything Core says that isn't recognised is `unknown`. */
export type EventAvailability = 'open' | 'waitlist' | 'full' | 'closed' | 'unknown'

/** One event as the landing's components see it: no knowledge of where it came from. */
export interface EventView {
  id: string
  /** The landing's own page for the event. */
  href: string
  title: string
  description: string
  /** The description split into paragraphs, for presentation. */
  paragraphs: string[]
  /** The event's date, as Core gave it (ISO 8601). */
  startsAt: string
  /** Whether `startsAt` carries a time of day (a date-only event shows no time). */
  hasTime: boolean
  location: string
  committeeName: string
  availability: EventAvailability
  /** Relative to the time of the request: presentation only, never a booking rule. */
  phase: 'upcoming' | 'past'
  /** Whether the landing offers its registration form. Core still decides every outcome. */
  offersRegistration: boolean
}

export type EventListResult =
  | {
      status: 'ok'
      events: EventView[]
      /** True for development/test fixtures, so pages can say the listings are samples. */
      sample: boolean
      /** The moment the result was assembled (ISO), so every component agrees on "today". */
      now: string
    }
  | { status: 'unavailable'; reason: CoreErrorKind; now: string }

export type EventDetailResult =
  | { status: 'ok'; event: EventView; sample: boolean; now: string }
  | { status: 'not-found' }
  | { status: 'unavailable'; reason: CoreErrorKind }
