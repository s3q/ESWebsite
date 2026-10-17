// A stand-in Core API for end-to-end tests: the DRAFT v1 contract, synthetic data, nothing
// real. It never runs in production and holds no production URL, key or record.
//
//   GET  /v1/events                          list (requires the test server key)
//   GET  /v1/events/{id}                     one event, 404 for unknown ids, `slow-event` hangs
//   POST /v1/events/{id}/registrations       outcome chosen by the email address (see below)
//   OPTIONS (CORS preflight)                 only for origins in MOCK_CORE_ALLOWED_ORIGINS
//   GET  /__log  ·  POST /__reset            what the mock saw (headers present, never values)
//
// Usage: MOCK_CORE_PORT=4010 MOCK_CORE_KEY=... MOCK_CORE_ALLOWED_ORIGINS=http://localhost:3200 node tests/e2e/mock-core-server.mjs

import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_CORE_PORT ?? 4010)
const KEY = process.env.MOCK_CORE_KEY ?? ''
const ALLOWED = new Set((process.env.MOCK_CORE_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean))

const day = 86_400_000
const omanDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' })
const at = (inDays, time) => {
  const d = omanDay.format(new Date(Date.now() + inDays * day))
  return time ? `${d}T${time}:00+04:00` : d
}

const EVENTS = () => [
  { id: 'e2e-open', title: 'E2E Open Workshop', description: 'An open event.\n\nSecond paragraph.', eventDate: at(5, '16:00'), location: 'E2E Hall', committeeName: 'E2E Committee', availability: 'available' },
  { id: 'e2e-waitlist', title: 'E2E Waitlist Talk', description: 'A waitlisted event.', eventDate: at(12, '18:30'), location: 'E2E Hall', committeeName: 'E2E Committee', availability: 'waitlist' },
  { id: 'e2e-full', title: 'E2E Full Visit', description: 'A full event.', eventDate: at(20, '09:00'), location: 'E2E Site', committeeName: 'E2E Committee', availability: 'full' },
  { id: 'e2e-closed', title: 'E2E Closed Hackathon', description: 'A closed event.', eventDate: at(30), location: '', committeeName: '', availability: 'closed' },
  { id: 'e2e-past', title: 'E2E Past Seminar', description: 'A past event.', eventDate: at(-10, '14:00'), location: 'E2E Hall', committeeName: 'E2E Committee', availability: 'closed' },
]

const log = { reads: [], posts: [] }

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'x-request-id': `mock-${Date.now()}`, ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function cors(req) {
  const origin = req.headers.origin
  return origin && ALLOWED.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : null
}

const OUTCOMES = {
  'already@example.test': [409, { error: { code: 'ALREADY_REGISTERED' } }],
  'full@example.test': [409, { error: { code: 'EVENT_FULL' } }],
  'closed@example.test': [409, { error: { code: 'REGISTRATION_CLOSED' } }],
  'invalid@example.test': [422, { error: { code: 'VALIDATION_FAILED', fields: { email: 'invalid' } } }],
  'down@example.test': [503, { error: { code: 'UNAVAILABLE' } }],
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const match = url.pathname.match(/^\/v1\/events(?:\/([^/]+))?(\/registrations)?$/)

  if (url.pathname === '/__log') return send(res, 200, log)
  if (url.pathname === '/__reset' && req.method === 'POST') {
    log.reads.length = 0
    log.posts.length = 0
    return send(res, 204)
  }

  if (req.method === 'OPTIONS') {
    const allow = cors(req)
    if (!allow || !match?.[2]) return send(res, 403, { error: { code: 'CORS_REJECTED' } })
    res.writeHead(204, {
      ...allow,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Accept-Language',
      'Access-Control-Max-Age': '600',
    })
    return res.end()
  }

  if (!match) return send(res, 404, { error: { code: 'NOT_FOUND' } })
  const [, rawId, registrations] = match
  const id = rawId ? decodeURIComponent(rawId) : null

  if (req.method === 'GET' && !registrations) {
    log.reads.push({ path: url.pathname, hasAuthorization: Boolean(req.headers.authorization), language: req.headers['accept-language'] ?? null })
    if (KEY && req.headers.authorization !== `Bearer ${KEY}`) return send(res, 401, { error: { code: 'UNAUTHORIZED' } })
    if (!id) return send(res, 200, { events: EVENTS() })
    if (id === 'slow-event') return // never answers: the landing's timeout must fire
    const event = EVENTS().find((e) => e.id === id)
    return event ? send(res, 200, { event }) : send(res, 404, { error: { code: 'NOT_FOUND' } })
  }

  if (req.method === 'POST' && registrations && id) {
    const allow = cors(req)
    let raw = ''
    for await (const chunk of req) raw += chunk
    let body = null
    try {
      body = JSON.parse(raw)
    } catch {}
    log.posts.push({
      path: url.pathname,
      origin: req.headers.origin ?? null,
      hasAuthorization: Boolean(req.headers.authorization),
      hasCookie: Boolean(req.headers.cookie),
      fields: body && typeof body === 'object' ? Object.keys(body).sort() : null,
    })
    if (!allow) return send(res, 403, { error: { code: 'CORS_REJECTED' } })
    const event = EVENTS().find((e) => e.id === id)
    if (!event) return send(res, 404, { error: { code: 'NOT_FOUND' } }, allow)
    const email = typeof body?.email === 'string' ? body.email.toLowerCase() : ''
    if (email === 'ratelimited@example.test') return send(res, 429, { error: { code: 'RATE_LIMITED' } }, { ...allow, 'Retry-After': '30', 'Access-Control-Expose-Headers': 'Retry-After' })
    const outcome = OUTCOMES[email]
    if (outcome) return send(res, outcome[0], outcome[1], allow)
    return send(res, 201, { status: event.availability === 'waitlist' ? 'waitlisted' : 'registered' }, allow)
  }

  return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED' } })
})

server.listen(PORT, '127.0.0.1', () => console.log(`mock Core API on http://127.0.0.1:${PORT}`))
