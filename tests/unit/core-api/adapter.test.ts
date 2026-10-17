import { describe, expect, it } from 'vitest'
import { byDate, eventPhase, omanDateKey, toAvailability, toEventView, toParagraphs } from '@/lib/core-api/adapter'
import type { CorePublicEventV1 } from '@/lib/core-api/types'
import { dto, FIXED_NOW } from '../support/events'

const event = (overrides: Partial<CorePublicEventV1> = {}) => ({ ...(dto() as unknown as CorePublicEventV1), ...overrides })

describe('toAvailability', () => {
  it.each([
    ['available', 'open'],
    ['OPEN', 'open'],
    ['waitlist', 'waitlist'],
    ['Waitlist Open', 'waitlist'],
    ['waitlist-open', 'waitlist'],
    ['full', 'full'],
    ['closed', 'closed'],
    ['registration_closed', 'closed'],
    ['invitation_only', 'unknown'],
    ['', 'unknown'],
  ])('%s → %s', (label, expected) => {
    expect(toAvailability(label)).toBe(expected)
  })
})

describe('eventPhase', () => {
  it('keeps an event upcoming for the whole of its day in Oman', () => {
    const now = new Date('2030-03-10T23:30:00+04:00')
    expect(eventPhase('2030-03-10T08:00:00+04:00', now)).toBe('upcoming')
    expect(eventPhase('2030-03-10', now)).toBe('upcoming')
    expect(eventPhase('2030-03-09T22:00:00+04:00', now)).toBe('past')
  })

  it('uses Oman days, not UTC days', () => {
    // 21:00 UTC on the 9th is already 01:00 on the 10th in Muscat.
    expect(omanDateKey('2030-03-09T21:00:00Z')).toBe('2030-03-10')
    expect(eventPhase('2030-03-09T21:00:00Z', new Date('2030-03-10T12:00:00+04:00'))).toBe('upcoming')
  })
})

describe('toEventView', () => {
  it('builds the view model the components read', () => {
    expect(toEventView(event(), FIXED_NOW)).toEqual({
      id: 'evt-1',
      href: '/events/evt-1',
      title: 'Test Workshop',
      description: 'First paragraph.\n\nSecond paragraph.',
      paragraphs: ['First paragraph.', 'Second paragraph.'],
      startsAt: '2030-03-10T16:00:00+04:00',
      hasTime: true,
      location: 'Test Hall',
      committeeName: 'Test Committee',
      availability: 'open',
      phase: 'upcoming',
      offersRegistration: true,
    })
  })

  it('offers the form only for upcoming events that are open or have a waitlist', () => {
    expect(toEventView(event({ availability: 'waitlist' }), FIXED_NOW).offersRegistration).toBe(true)
    for (const availability of ['full', 'closed', 'invitation_only']) {
      expect(toEventView(event({ availability }), FIXED_NOW).offersRegistration).toBe(false)
    }
    expect(toEventView(event({ eventDate: '2030-02-01T10:00:00+04:00' }), FIXED_NOW)).toMatchObject({ phase: 'past', offersRegistration: false })
  })

  it('marks date-only events as having no time', () => {
    expect(toEventView(event({ eventDate: '2030-03-10' }), FIXED_NOW).hasTime).toBe(false)
  })
})

describe('helpers', () => {
  it('splits descriptions into paragraphs and folds whitespace', () => {
    expect(toParagraphs('  One\nline.\n\n\n  Two  \n \n')).toEqual(['One line.', 'Two'])
    expect(toParagraphs('')).toEqual([])
  })

  it('sorts by date, date-only events at the start of their day', () => {
    const a = toEventView(event({ id: 'a', eventDate: '2030-03-11' }), FIXED_NOW)
    const b = toEventView(event({ id: 'b', eventDate: '2030-03-10T23:00:00+04:00' }), FIXED_NOW)
    const c = toEventView(event({ id: 'c', eventDate: '2030-03-11T09:00:00+04:00' }), FIXED_NOW)
    expect([c, a, b].sort(byDate).map((e) => e.id)).toEqual(['b', 'a', 'c'])
  })
})
