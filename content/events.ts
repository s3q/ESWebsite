import type { DrawingId } from '@/components/ui/drawings'
import type { MediaImage } from './media'

/**
 * SAMPLE CONTENT. No events have been published through the platform yet (PRD UC-02 is
 * Phase 1). These entries carry over Draft 1's preview events so the layout can be
 * reviewed; every one is rendered with a visible "Sample" label and a preview-only
 * registration action. Replace with published events once the events module exists.
 */

export type EventType = 'Workshop' | 'Talk' | 'Site visit' | 'Competition'

/** `preview` = the platform cannot take registrations yet (the only honest state today). */
export type RegistrationStatus = 'open' | 'waitlist' | 'closed' | 'preview'

export interface SocietyEvent {
  id: string
  sample: boolean
  title: string
  type: EventType
  /** ISO 8601 with the Oman offset so <time> is unambiguous. */
  start: string
  end: string
  location: string
  description: string
  registration: RegistrationStatus
  drawing: DrawingId
  /** An authentic event photograph, when the society supplies one; replaces the drawing. */
  image?: MediaImage
}

export const EVENT_TIMEZONE_LABEL = 'Oman time (UTC+4)'

export const EVENTS: SocietyEvent[] = [
  {
    id: 'intro-robotics-workshop',
    sample: true,
    title: 'Intro to Robotics Workshop',
    type: 'Workshop',
    start: '2026-10-12T16:00:00+04:00',
    end: '2026-10-12T18:00:00+04:00',
    location: 'College of Engineering, on campus',
    description:
      'A hands-on build session for first-time robotics students: wire a sensor, program a microcontroller and leave with a prototype that moves.',
    registration: 'preview',
    drawing: 'robotics-workshop',
  },
  {
    id: 'engineering-careers-panel',
    sample: true,
    title: 'Engineering Careers Panel',
    type: 'Talk',
    start: '2026-11-03T18:30:00+04:00',
    end: '2026-11-03T20:00:00+04:00',
    location: 'On campus',
    description:
      'Graduates from across the disciplines on life after SQU: first roles, graduate study and what they wish they had started sooner.',
    registration: 'preview',
    drawing: 'careers-panel',
  },
  {
    id: 'sustainable-infrastructure-visit',
    sample: true,
    title: 'Sustainable Infrastructure Site Visit',
    type: 'Site visit',
    start: '2026-11-19T08:30:00+04:00',
    end: '2026-11-19T12:00:00+04:00',
    location: 'Off-campus site, Muscat',
    description: 'A guided look inside a civil project in Muscat, from foundations to finishing works.',
    registration: 'preview',
    drawing: 'site-visit',
  },
]

export const REGISTRATION_LABEL: Record<RegistrationStatus, string> = {
  open: 'Registration open',
  waitlist: 'Waitlist only',
  closed: 'Registration closed',
  preview: 'Registration opens with Phase 1',
}
