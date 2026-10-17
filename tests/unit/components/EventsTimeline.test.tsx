// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventsTimeline } from '@/components/pages/events/EventsTimeline'
import { toEventView } from '@/lib/core-api/adapter'
import type { CorePublicEventV1 } from '@/lib/core-api/types'
import { dto, FIXED_NOW } from '../support/events'

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ refresh: () => {} }) }))

afterEach(cleanup)

const view = (overrides: Record<string, unknown>) => toEventView(dto(overrides) as unknown as CorePublicEventV1, FIXED_NOW)
const now = FIXED_NOW.toISOString()

describe('EventsTimeline', () => {
  it('lists Core events either side of today, each linking to its page', () => {
    render(
      <EventsTimeline
        now={now}
        events={[view({ id: 'past-1', title: 'Past Talk', eventDate: '2030-02-10T10:00:00+04:00' }), view({ id: 'next-1', title: 'Next Workshop' }), view({ id: 'later', title: 'Later Visit', availability: 'full' })]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Already happened' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Coming up' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Next Workshop/ }).getAttribute('href')).toBe('/events/next-1')
    expect(screen.getByText('Next up')).toBeTruthy()
    expect(screen.getByText('Event completed')).toBeTruthy()
    expect(screen.getByText('Full')).toBeTruthy()
  })

  it('tells an empty calendar apart from an unreachable Core', () => {
    render(<EventsTimeline now={now} events={[]} />)
    expect(screen.getByRole('status').textContent).toContain('No events are scheduled right now')
    cleanup()
    render(<EventsTimeline now={now} events={[]} unavailable />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('Events can’t be shown right now')
    expect(screen.queryByRole('searchbox')).toBeNull()
  })
})
