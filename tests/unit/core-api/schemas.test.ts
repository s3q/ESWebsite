import { describe, expect, it } from 'vitest'
import { isEventId, isIsoDate, parsePublicEvent, parsePublicEventDetail, parsePublicEventList } from '@/lib/core-api/schemas'
import { dto } from '../support/events'

describe('parsePublicEvent', () => {
  it('accepts the draft contract and trims text', () => {
    const result = parsePublicEvent(dto({ title: '  Test Workshop  ' }))
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'evt-1',
        title: 'Test Workshop',
        description: 'First paragraph.\n\nSecond paragraph.',
        eventDate: '2030-03-10T16:00:00+04:00',
        location: 'Test Hall',
        committeeName: 'Test Committee',
        availability: 'available',
      },
    })
  })

  it('ignores fields it does not know, so Core can add fields safely', () => {
    const result = parsePublicEvent(dto({ capacity: 40, internalNotes: 'x' }))
    expect(result.ok && Object.keys(result.value)).toEqual(['id', 'title', 'description', 'eventDate', 'location', 'committeeName', 'availability'])
  })

  it('allows an empty description, location and committee name', () => {
    expect(parsePublicEvent(dto({ description: '', location: '', committeeName: '' })).ok).toBe(true)
  })

  it.each([
    ['not an object', 'x', 'event is not an object'],
    ['an array', [], 'event is not an object'],
    ['a numeric id', dto({ id: 42 }), 'id'],
    ['an id with a slash', dto({ id: '../admin' }), 'id'],
    ['an id with spaces', dto({ id: 'a b' }), 'id'],
    ['an over-long id', dto({ id: 'a'.repeat(129) }), 'id'],
    ['a free-text date', dto({ eventDate: 'next tuesday' }), 'eventDate'],
    ['an impossible date', dto({ eventDate: '2030-13-45' }), 'eventDate'],
    ['a missing title', dto({ title: undefined }), 'title'],
    ['a blank title', dto({ title: '   ' }), 'title'],
    ['an over-long title', dto({ title: 'x'.repeat(301) }), 'title'],
    ['a non-string description', dto({ description: null }), 'description'],
    ['a missing availability', dto({ availability: '' }), 'availability'],
  ])('rejects %s', (_, value, issue) => {
    expect(parsePublicEvent(value)).toEqual({ ok: false, issue })
  })
})

describe('parsePublicEventList', () => {
  it.each([
    ['a bare array', [dto()]],
    ['{ events }', { events: [dto()] }],
    ['{ data }', { data: [dto()] }],
  ])('accepts %s (draft envelope tolerance)', (_, body) => {
    expect(parsePublicEventList(body)).toMatchObject({ ok: true, value: { dropped: 0, events: [{ id: 'evt-1' }] } })
  })

  it('accepts an empty list: an honest "nothing scheduled"', () => {
    expect(parsePublicEventList({ events: [] })).toEqual({ ok: true, value: { events: [], dropped: 0 } })
  })

  it('leaves out invalid and duplicate events, and counts them', () => {
    const body = { events: [dto(), dto({ id: 'evt-2', title: null }), dto(), dto({ id: 'evt-3' })] }
    const result = parsePublicEventList(body)
    expect(result).toMatchObject({ ok: true, value: { dropped: 2 } })
    expect(result.ok && result.value.events.map((e) => e.id)).toEqual(['evt-1', 'evt-3'])
  })

  it('rejects a wrong envelope, a list with no valid event, and an oversized list', () => {
    expect(parsePublicEventList({ items: [dto()] })).toEqual({ ok: false, issue: 'list envelope' })
    expect(parsePublicEventList(null)).toEqual({ ok: false, issue: 'list envelope' })
    expect(parsePublicEventList({ events: [{ id: 1 }, 'x'] })).toEqual({ ok: false, issue: 'no valid events' })
    expect(parsePublicEventList(Array.from({ length: 501 }, (_, i) => dto({ id: `e${i}` })))).toEqual({ ok: false, issue: 'list too long' })
  })
})

describe('parsePublicEventDetail', () => {
  it.each([
    ['bare', dto()],
    ['{ event }', { event: dto() }],
    ['{ data }', { data: dto() }],
  ])('accepts %s', (_, body) => {
    expect(parsePublicEventDetail(body)).toMatchObject({ ok: true, value: { id: 'evt-1' } })
  })

  it('rejects anything else', () => {
    expect(parsePublicEventDetail({ event: { id: 'x' } }).ok).toBe(false)
    expect(parsePublicEventDetail('evt-1').ok).toBe(false)
  })
})

describe('isEventId / isIsoDate', () => {
  it('accepts UUIDs, slugs and prefixed ids', () => {
    for (const id of ['8f2c6a1e-0b5d-4c7e-9a3f-1d2e3c4b5a60', 'smart-campus-hackathon', 'evt_01HZX', 'A1']) expect(isEventId(id)).toBe(true)
    for (const id of ['', '-lead', 'a/b', 'a.b', 'é', 'a%20b']) expect(isEventId(id)).toBe(false)
  })

  it('accepts ISO dates and date-times with zones', () => {
    for (const d of ['2030-03-10', '2030-03-10T16:00', '2030-03-10T16:00:00Z', '2030-03-10T16:00:00.123+04:00', '2030-03-10T16:00:00+0400']) {
      expect(isIsoDate(d)).toBe(true)
    }
    for (const d of ['10/03/2030', '2030-3-10', 'tomorrow', 20300310]) expect(isIsoDate(d)).toBe(false)
  })
})
