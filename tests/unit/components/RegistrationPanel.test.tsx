// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { RegistrationPanel } from '@/components/pages/events/RegistrationPanel'
import type { RegistrationTransport } from '@/lib/core-api/registration'
import type { EventView } from '@/lib/core-api/types'
import { jsonResponse } from '../support/events'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: () => {} }) }))

type PanelEvent = Pick<EventView, 'id' | 'title' | 'availability' | 'phase' | 'offersRegistration'>
const open: PanelEvent = { id: 'evt-1', title: 'Test Workshop', availability: 'open', phase: 'upcoming', offersRegistration: true }
const http: RegistrationTransport = { kind: 'http', baseUrl: 'https://core.example.test' }

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(cleanup)

function renderPanel(event: PanelEvent = open, transport: RegistrationTransport = http, locale: 'en' | 'ar' = 'en') {
  return render(
    <I18nProvider locale={locale}>
      <RegistrationPanel event={event} transport={transport} />
    </I18nProvider>,
  )
}

function fill(name = 'Test Visitor', email = 'visitor@example.test') {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } })
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: /Register|Join the waitlist/ }))

describe('RegistrationPanel', () => {
  it('shows labelled, autocompleting fields and the privacy note', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'Register for this event' })).toBeTruthy()
    expect(screen.getByLabelText('Full name').getAttribute('autocomplete')).toBe('name')
    const email = screen.getByLabelText('Email address')
    expect(email.getAttribute('type')).toBe('email')
    expect(email.getAttribute('autocomplete')).toBe('email')
    expect(screen.getByText(/sent to the Engineering Society’s events platform/)).toBeTruthy()
  })

  it('checks the fields before sending anything', () => {
    renderPanel()
    submit()
    expect(screen.getByText('Enter your full name.')).toBeTruthy()
    expect(screen.getByText('Enter your email address.')).toBeTruthy()
    expect(screen.getByLabelText('Full name').getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(screen.getByLabelText('Full name'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('disables the form while sending, and sends once however often it is clicked', async () => {
    let answer!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (answer = resolve)))
    renderPanel()
    fill()
    submit()
    const button = screen.getByRole('button', { name: 'Sending…' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    fireEvent.submit(button.closest('form')!)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => answer(jsonResponse(201, { status: 'registered' })))
    expect(await screen.findByText('You’re registered')).toBeTruthy()
  })

  it('shows Core’s success, focuses it, and removes the form', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { status: 'waitlisted' }))
    renderPanel({ ...open, availability: 'waitlist' })
    expect(screen.getByRole('heading', { name: 'Join the waitlist' })).toBeTruthy()
    fill()
    submit()
    const status = await screen.findByRole('status')
    expect(status.textContent).toContain('You’re on the waitlist')
    expect(document.activeElement).toBe(status)
    expect(screen.queryByLabelText('Full name')).toBeNull()
  })

  it.each([
    [409, { error: { code: 'ALREADY_REGISTERED' } }, 'You’re already registered for this event.'],
    [409, { error: { code: 'EVENT_FULL' } }, 'This event filled up before your registration went through.'],
  ])('settles on a definite answer (%i %j)', async (status, body, text) => {
    fetchMock.mockResolvedValue(jsonResponse(status, body))
    renderPanel()
    fill()
    submit()
    expect((await screen.findByRole('status')).textContent).toBe(text)
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull()
  })

  it('keeps the form, with an alert, when the visitor can act on the answer', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(422, { error: { code: 'VALIDATION_FAILED', fields: { email: 'invalid' } } }))
    renderPanel()
    fill()
    submit()
    expect((await screen.findByRole('alert')).textContent).toBe('Check the highlighted details and try again.')
    expect(screen.getByText('Enter a valid email address, like name@example.com.')).toBeTruthy()

    fetchMock.mockResolvedValueOnce(jsonResponse(429, null, { 'retry-after': '30' }))
    fill('Test Visitor', 'other@example.test')
    expect(screen.queryByText('Enter a valid email address, like name@example.com.')).toBeNull()
    submit()
    expect((await screen.findByText('Too many attempts. Try again in 30 seconds.')).closest('[role="alert"]')).toBeTruthy()

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    submit()
    expect(await screen.findByText(/couldn’t be completed right now, and nothing was confirmed/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy()
  })

  it.each([
    [{ ...open, phase: 'past' as const, offersRegistration: false }, http, 'This event has finished.', 'Event completed'],
    [{ ...open, availability: 'full' as const, offersRegistration: false }, http, 'This event is full.', 'Full'],
    [{ ...open, availability: 'closed' as const, offersRegistration: false }, http, 'Registration has closed for this event.', 'Registration closed'],
    [{ ...open, availability: 'unknown' as const, offersRegistration: false }, http, /isn’t available on this site/, 'Registration not available online'],
    [open, { kind: 'disabled', reason: 'not-enabled' } as const, 'Online registration for this event isn’t open on this site yet.', 'Registration open'],
    [open, { kind: 'disabled', reason: 'not-configured' } as const, 'Registration is temporarily unavailable. Please try again later.', 'Registration open'],
  ])('explains instead of offering a form: %#', (event, transport, note, badge) => {
    renderPanel(event, transport)
    expect(screen.getByText(note)).toBeTruthy()
    expect(screen.getByText(badge)).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('labels the development fixture transport', () => {
    renderPanel(open, { kind: 'fixtures' })
    expect(screen.getByText(/Development fixture: nothing is sent/)).toBeTruthy()
  })

  it('speaks Arabic', () => {
    renderPanel(open, http, 'ar')
    expect(screen.getByLabelText('الاسم الكامل')).toBeTruthy()
    expect(screen.getByLabelText('البريد الإلكتروني').getAttribute('dir')).toBe('ltr')
    expect(screen.getByRole('button', { name: 'سجّل' })).toBeTruthy()
  })
})
