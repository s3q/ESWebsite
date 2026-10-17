# Landing ↔ Core API integration

Status: **prepared, not connected.** The landing is ready for a versioned Core API. The Core
API, its contract, its origins and its CORS policy don't exist yet, so everything Core-specific
below is marked as an assumption or a handoff item.

## Who owns what

```text
essqu.com          landing (this repository): public pages, design, EN/AR, event presentation
api.essqu.com      Core API (planned, not live): events, registrations, availability, rules
admin.essqu.com    Core admin (planned): where committees create and manage events
```

| Concern | Owner |
| --- | --- |
| Events: existence, content, dates, availability | Core |
| Registrations: acceptance, waitlists, duplicates, capacity, rate limits | Core |
| Member accounts and authentication | Core (the landing has none; `/profile` is Coming Soon) |
| Presentation, copy, EN/AR, accessibility, caching of public reads | Landing |

The landing never connects to Core's database or Supabase, never holds service-role
credentials, and has no API routes or server proxy of its own for Core.

## How it works

```text
Landing UI ── static content, design, i18n
     │
     └── event and registration surfaces
               │
               ▼
          lib/core-api ──┬── fixtures (development and test only)
                         └── Core HTTP v1 (staging / production)
```

- **Reads** (homepage `#events`, `/events`, `/events/[id]`) are server-side:
  `GET {CORE_API_BASE_URL}/v1/events` and `GET {CORE_API_BASE_URL}/v1/events/{id}`, validated,
  adapted to a view model, cached 45 s (configurable), tagged for on-demand revalidation.
- **Registration** is browser → Core directly:
  `POST {CORE_API_BASE_URL}/v1/events/{eventId}/registrations`. That keeps the visitor's own IP
  on the request for Core's rate limiting. No secret is involved, and no cookie is sent
  (`credentials: 'omit'`).
- **Failures:** if Core is slow, down, refuses the key, or answers with something malformed, the
  event surfaces say so ("can't be shown right now") and the rest of the site renders normally.
  The homepage list streams in behind a Suspense boundary, so a slow Core never holds up the hero
  or other sections. Unknown event ids are a 404.
- **No fake events in production.** Missing configuration in production gives the unavailable
  state; fixtures never run on Vercel production.

Module reference: [lib/core-api/README.md](../lib/core-api/README.md).

## Environment variables

All server-only. Names and meanings are in [.env.example](../.env.example).

| Variable | Purpose |
| --- | --- |
| `CORE_API_BASE_URL` | Core origin, no `/v1`, https (http only on localhost). No default. |
| `CORE_EVENTS_API_KEY` | Bearer key for event reads, **only if Core requires one**. Server-only; never `NEXT_PUBLIC_`. |
| `CORE_API_MODE` | `http` / `fixtures`; empty = http when a base URL is set. |
| `CORE_API_FIXTURE_SCENARIO` | `default` / `empty` / `unavailable` / `malformed`. |
| `CORE_API_ALLOW_FIXTURES` | Lets a local production build use fixtures (CI). Ignored on Vercel production. |
| `CORE_API_TIMEOUT_MS` | Read timeout, default 4000 (500–15000). |
| `CORE_EVENTS_REVALIDATE_SECONDS` | Read cache lifetime, default 45 (0–3600). |
| `CORE_REGISTRATION_ENABLED` | Turns on the browser registration form against Core. Off until the contract exists. |
| `CORE_API_DEBUG` | Logs successful requests too (failures are always logged). |

Suggested per environment (owner action in the existing Vercel project; do not create a new one):

| Environment | Setting |
| --- | --- |
| Local development | nothing (fixtures by default), or `CORE_API_BASE_URL` = staging Core |
| Vercel Preview | `CORE_API_MODE=fixtures`, or `CORE_API_BASE_URL` = staging Core. Never production Core. |
| Vercel Production | `CORE_API_BASE_URL` = production Core once it exists; `CORE_REGISTRATION_ENABLED=true` after the registration contract and CORS are confirmed |

## The DRAFT contract (assumptions)

Until Core publishes OpenAPI v1, the landing assumes only this event shape:

```ts
type CorePublicEventV1 = {
  id: string            // opaque; letters, digits, - and _ (≤ 128)
  title: string
  description: string   // plain text; blank lines separate paragraphs
  eventDate: string     // ISO 8601 date or date-time with offset; Oman time assumed for display
  location: string
  committeeName: string
  availability: string  // vocabulary pending
}
```

Further assumptions, each isolated in one place so it can be corrected:

| Assumption | Where |
| --- | --- |
| List envelope is a bare array, `{ events }` or `{ data }`; detail is bare, `{ event }` or `{ data }` | `schemas.ts` |
| Availability labels: `available`/`open`, `waitlist`/`waitlist_open`, `full`, `closed`/`registration_closed`; anything else shows "Registration not available online" | `adapter.ts` |
| No pagination: the list is one response (more than 500 items is treated as malformed) | `schemas.ts` |
| `Accept-Language` may be honoured by Core; the landing sends `en` or `ar` | `client.server.ts` |
| Event GETs are public; a bearer key is sent only if configured | `client.server.ts` |
| Registration request: `{ fullName, email }` | `registration.ts` |
| Registration success: 2xx with `status` (or `registration.status`) `registered`/`confirmed` or `waitlisted`; any other 2xx is "unconfirmed", never success | `registration.ts` |
| Registration errors: `{ error: { code, fields? } }` with `ALREADY_REGISTERED`, `ALREADY_WAITLISTED`, `EVENT_FULL`, `REGISTRATION_CLOSED`, `VALIDATION_FAILED`, `RATE_LIMITED`; 429 with `Retry-After`; 5xx = unavailable | `registration.ts` |

Not assumed, and not shown: capacity, places left, registration counts, revision, committee id,
internal status, approval state, audit fields, images, end times, schedules, disciplines.

## CORS requirements for Core

Registration POSTs come from the visitor's browser, so Core must allow, for
`/v1/events/{id}/registrations` only:

- **Production origins:** `https://essqu.com`, `https://www.essqu.com`. Never `*`.
- **Preview/development:** decide separately. Preview deployments should talk to **staging**
  Core, which may allow the Vercel preview origin(s) of this project and `http://localhost:3000`.
  Production Core should not allow preview origins.
- Methods `POST` (and the `OPTIONS` preflight); request headers `Content-Type`, `Accept`,
  `Accept-Language`; no credentials (`Access-Control-Allow-Credentials` not needed).
- `Access-Control-Expose-Headers: Retry-After` on 429 responses, or the browser can't read the
  wait time (the landing then shows a generic "wait a moment").

Event GETs are server-to-server and need no CORS.

## UI behaviour

- **Homepage `#events`:** the soonest upcoming event featured, the next three listed, "See all
  events" when there are more; loading, empty and unavailable states. The sample note appears
  only with fixtures.
- **`/events`:** the timeline (past, today, upcoming) with search and a when-filter; availability
  badges from Core; loading, empty, filtered and unavailable states. Type and discipline filters,
  capacity bars and card photographs were removed: Core's public contract carries none of them.
- **`/events/[id]`:** date, time (or "To be announced" for a date-only event), location, the
  committee, the description, and the registration panel. The neutral calendar drawing stands in
  for imagery Core doesn't provide.
- **Registration panel:** labelled fields with autocomplete, client checks for a better form
  (Core validates again), one submission at a time, focus moved to Core's answer (status for
  success, alert for problems), and every outcome in EN and AR: registered, waitlisted, already
  registered, already waitlisted, full, closed, invalid, rate limited, unavailable, unconfirmed,
  rejected. Full, closed, past and unrecognised availability explain themselves instead of
  showing a form.
- **Gated (Coming Soon):** `/profile` and `/profile/events` (member accounts are Core's), plus
  `/members/[id]` and `/certificates/[id]` (their listings were already Coming Soon, and their
  sample records linked to sample events that no longer exist).

## Testing

```bash
npm test                 # unit + component (Vitest): config, parsing, adapter, errors, client, registration, boundaries
npm run build && npm run test:e2e   # Playwright: mock Core over HTTP, unconfigured, fixtures
npm run test:contract    # staging Core, read-only; skipped unless configured (below)
```

- E2E runs three `next start` deployments of one build: against `tests/e2e/mock-core-server.mjs`
  (a synthetic Core with CORS, a server key and every registration answer), with no Core
  settings, and with fixtures. It checks the server key never reaches the browser and that
  browser registration requests carry no credentials.
- Contract tests: `CORE_CONTRACT_BASE_URL=<staging origin> CORE_CONTRACT_ENV=staging npm run test:contract`
  (add `CORE_CONTRACT_API_KEY` if staging requires a key). Read-only; registration contract
  tests are marked BLOCKED until Core publishes the contract. **Never run automated
  registrations against production.**
- CI (`.github/workflows/ci.yml`): lint, typecheck, unit, build, E2E. No Core credentials.

## Core handoff checklist

```text
[ ] staging API origin
[ ] production API origin (api.essqu.com is planned, not live)
[ ] OpenAPI v1 contract
[ ] event-list contract (envelope, ordering, which events are public)
[ ] event-detail contract (404 vs 410 for removed events)
[ ] pagination contract (or confirmation there is none)
[ ] availability vocabulary
[ ] registration request fields
[ ] registration result/error vocabulary
[ ] event GET authentication decision (public, or server key)
[ ] server API key if required (provisioned by Core into Vercel; never committed)
[ ] CORS allowlist (essqu.com, www.essqu.com; preview → staging only; Retry-After exposed)
[ ] rate-limit semantics (limits, 429 body, Retry-After)
[ ] cache/freshness guidance (is 45 s acceptable? on-demand revalidation webhook?)
[ ] staging test event (for contract tests and Preview)
[ ] production cutover window
```

When an item arrives: update the DRAFT spots listed above, adjust fixtures and tests, run the
contract suite against staging, set the Vercel environment variables, then switch on
`CORE_REGISTRATION_ENABLED`.

## Not done here, on purpose

No DNS changes, no Core or Supabase changes, no production keys, no production data, no
finalised registration fields, no cutover.
