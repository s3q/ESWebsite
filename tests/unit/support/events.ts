/** Builders for test data in the DRAFT Core v1 shape. Synthetic values only. */

export function dto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'evt-1',
    title: 'Test Workshop',
    description: 'First paragraph.\n\nSecond paragraph.',
    eventDate: '2030-03-10T16:00:00+04:00',
    location: 'Test Hall',
    committeeName: 'Test Committee',
    availability: 'available',
    ...overrides,
  }
}

/** A Response stand-in good enough for the client code under test. */
export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

export const FIXED_NOW = new Date('2030-03-01T08:00:00+04:00')
