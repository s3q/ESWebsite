# lib/core-api: the landing's only door to the Core Platform

Events and registrations belong to the **Core Platform**. This module is the single place
the landing reads them from and sends registrations to. Pages and components never call
`fetch` for Core data and never import a `.server.ts` file from a client component.

Architecture, ownership, CORS and the Core handoff checklist: [docs/core-api-integration.md](../../docs/core-api-integration.md).

```text
Core API v1 (JSON)  ──►  schemas.ts (validate)  ──►  adapter.ts (view model)  ──►  components
       ▲                                                    ▲
 client.server.ts (GET, timeout, retry-once, cache)   fixtures/ (dev/test only, same path)
```

## Files

| File | Runs on | What it does |
| --- | --- | --- |
| `config.server.ts` | server | Reads and validates the environment once; resolves `http`, `fixtures` or `unconfigured`. |
| `client.server.ts` | server | The only HTTP GET to Core: timeout, safe status mapping, JSON parsing, one retry on 502/503/504 or a connection error, Next.js caching with tags. The optional key is attached here and nowhere else. |
| `events.server.ts` | server | `listPublicEvents(locale)`, `getPublicEvent(id, locale)`, `getRegistrationTransport()`. They never throw: failures become `status: 'unavailable'`. Memoised per request. |
| `telemetry.server.ts` | server | One structured log line per Core request (route template, status, latency, request id). Never the key, a body or a visitor's details. |
| `schemas.ts` | both | Hand-written runtime validation of Core's JSON (the DRAFT contract is seven strings; no schema library needed). |
| `adapter.ts` | both | DTO → `EventView`: availability vocabulary, Oman-time phase, paragraphs, the event's link. Presentation only. |
| `types.ts` | both | The DRAFT `CorePublicEventV1` DTO and the view-model/result types. |
| `errors.ts` | both | `CoreApiError` and the stable error vocabulary. |
| `registration.ts` | both | DRAFT registration fields, client-side form checks, payload, Core-response → outcome mapping. |
| `registration.client.ts` | browser | `registerForEvent()`: one POST from the browser straight to Core, no credentials, 15 s timeout, never retried. |
| `fixtures/` | dev/test | Synthetic events and simulated registration outcomes. Never on Vercel production. |

## Modes

| Mode | When | Events | Registration |
| --- | --- | --- | --- |
| `http` | `CORE_API_BASE_URL` set (valid https, or http on localhost) | `GET {base}/v1/events`, `GET {base}/v1/events/{id}` | Off unless `CORE_REGISTRATION_ENABLED=true`; then the browser POSTs to `{base}/v1/events/{id}/registrations` |
| `fixtures` | `CORE_API_MODE=fixtures` (dev, test, Vercel Preview, or a local production build with `CORE_API_ALLOW_FIXTURES=true`), or `next dev` with no base URL | `fixtures/events.ts`, labelled as samples on the page | Simulated in the browser; nothing is sent |
| `unconfigured` | anything else, including a missing base URL in production | "Events can't be shown right now" | Explained, no form |

Fixtures are **refused on Vercel production** (`VERCEL_ENV=production`) whatever the variables
say. There is no hard-coded Core URL and no fallback to one.

Fixture scenarios (`CORE_API_FIXTURE_SCENARIO`): `default` (every availability, a past event, a
date-only event, an unrecognised label), `empty`, `unavailable`, `malformed`.

Fixture registration outcomes are chosen by the email address: `already@`, `already-waitlisted@`,
`full@`, `closed@`, `ratelimited@`, `unavailable@`, `invalid@`, `unconfirmed@` and `rejected@`, all
at `example.test`. Any other address registers, or joins the waitlist on a waitlist event.

## Environment

See [.env.example](../../.env.example). Every variable is server-only; **there is no
`NEXT_PUBLIC_` Core variable, by design**. The browser learns only the public base URL, and only
when registration is switched on (`getRegistrationTransport()`).

## Rules this module keeps

- Core is authoritative. The landing invents no event, capacity, count or outcome, and decides
  nothing about places, waitlists or duplicates.
- Reads: finite timeout (`CORE_API_TIMEOUT_MS`, default 4 s); a GET is retried at most once and
  only when safe; Next.js caches successful reads for `CORE_EVENTS_REVALIDATE_SECONDS` (default
  45 s) under the tags `core-events` and `core-event:{id}`.
- Writes: a registration is never retried automatically, never cached, never proxied through
  the landing server, and never reported as a success unless Core says so.
- Malformed responses become `invalid-response`; a list keeps its valid events and counts the rest.
- Nothing logged contains a key, a response body or a visitor's details.

## When the Core contract is published

Everything marked **DRAFT** lives in three places: `types.ts` (DTO), `schemas.ts` (envelopes) and
`registration.ts` plus `adapter.ts` (`AVAILABILITY_VOCABULARY`, request fields, result and error
codes). Update those, then the fixtures and `tests/`, and the components follow.
