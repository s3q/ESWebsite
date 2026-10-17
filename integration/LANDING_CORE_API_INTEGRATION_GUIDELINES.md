# Landing Website ↔ Core Platform Integration Guidelines

## Purpose

Prepare the public landing website to integrate with the Engineering Society core platform through a stable HTTP API while keeping both applications independently deployable.

This is a new target architecture and intentionally replaces the previous single-deployable migration direction.

## Target architecture

```text
engsoc.org
  → Landing Vercel project

api.engsoc.org
  → Core Vercel project API

admin.engsoc.org
  → Core Vercel project administration
```

The landing and core remain separate repositories and separate Vercel projects. They synchronize through a versioned API contract, not shared implementation code.

## Ownership

### Landing owns
- public visual design
- navigation
- page composition
- copy and media
- responsive behavior
- accessibility
- EN/AR and RTL presentation
- SEO
- consuming the Core API
- graceful handling when Core is unavailable

### Core owns
- events as the source of truth
- registrations as the source of truth
- event lifecycle
- capacity and waitlist logic
- duplicate prevention
- rate limiting
- audit
- Auth
- authorization
- database schema
- RLS
- private routines
- API authentication and versioning

The landing site must never become a second backend.

## One source of truth

Correct:

```text
Admin publishes event
  ↓
Core database
  ↓
Core API
  ↓
Landing presentation
```

Incorrect:

```text
Core event
+ landing static event copy
+ manual synchronization
```

Mocks are allowed only for development and tests.

## API contract

Use a versioned namespace from the beginning:

```text
https://api.engsoc.org/v1/
```

Initial read surface:

```http
GET /v1/events
GET /v1/events/{eventId}
```

Future registration surface:

```http
POST /v1/events/{eventId}/registrations
```

The landing repo must not depend on PostgreSQL tables, Supabase schema names, private SQL routine names, admin DTOs, RLS implementation details, or Core internal file paths.

## Public event DTO

The current core architecture already uses a narrow public event contract. The new API should preserve that principle.

Conceptually:

```ts
type PublicEvent = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  committeeName: string;
  availability: string;
};
```

Do not assume internal fields such as capacity, revision, committee ID, review state, audit fields, or registration counts.

Use a landing adapter:

```text
Core API DTO
  ↓
landing adapter
  ↓
view model
  ↓
component
```

## Event reads

Recommended flow:

```text
Browser
  ↓
Landing Next.js server
  ↓
Core API
  ↓
Core event domain
  ↓
Database
```

Recommended server-only environment variables:

```text
CORE_API_BASE_URL=https://api.engsoc.org
CORE_EVENTS_API_KEY=<server-only secret if Core requires one>
```

Never expose secrets through `NEXT_PUBLIC_*`.

If a Core event-read API key exists, only server code may send:

```http
Authorization: Bearer <key>
```

## Event caching

Use framework-supported server caching. A reasonable initial target is 30–60 seconds for event lists.

Do not cache registration POSTs.

Do not create custom distributed caching before measuring traffic.

## Registration

The landing displays the form; the Core decides the outcome.

```text
Landing form
  ↓
Core public registration endpoint
  ↓
canonical registration domain
  ↓
private registration routine
  ↓
single DB transaction
```

The landing must not implement authoritative duplicate detection, capacity allocation, waitlist ordering, or audit.

## Registration must not use a browser secret

Recommended production flow:

```text
Browser at engsoc.org
  ↓
POST api.engsoc.org/v1/events/{id}/registrations
  ↓
Core validates Origin + input + rate limit
  ↓
canonical registration transaction
```

Do not put an API secret in browser JavaScript.

This direct browser-to-Core registration path also avoids hiding the visitor behind the landing server for IP-based rate limiting.

## CORS and Origin

`engsoc.org` and `api.engsoc.org` are different origins.

Core should explicitly allow approved production origins, for example:

```text
https://engsoc.org
https://www.engsoc.org
```

Do not request wildcard CORS for registration.

Preview/staging origins should use a separate explicit allowlist.

## Admin separation

The landing must not authenticate administrators, query admin APIs, store admin credentials, or reproduce admin authorization.

Admins use:

```text
https://admin.engsoc.org
```

## Landing integration module

Create one integration boundary rather than scattering `fetch()` calls.

Recommended structure:

```text
lib/core-api/
  config.server.ts
  client.server.ts
  events.server.ts
  registration.client.ts
  schemas.ts
  types.ts
  errors.ts
  README.md
```

Adapt names to the existing repository conventions.

Responsibilities:

- `config.server.ts`: validate server-only Core configuration
- `client.server.ts`: common timeout, headers, request ID, safe error conversion
- `events.server.ts`: event list/detail and cache policy
- `registration.client.ts`: browser-safe registration call, no secret
- `schemas.ts`: runtime validation where appropriate
- `types.ts`: API-facing types
- `errors.ts`: stable landing error vocabulary

## Failure handling

Core failure must not crash the entire public site.

Expected behavior:

```text
Core API unavailable
  ↓
landing shell still renders
hero/about/content still render
events section shows temporary-unavailable state
```

Do not show raw JSON, SQL, provider messages, stack traces, or secrets.

## Timeouts and retries

Every external Core request needs a finite timeout.

Limited retry may be acceptable for idempotent GET requests.

Do not blindly retry registration POSTs.

## Development and mocks

The landing repo should be developable without production Core credentials.

Use synthetic fixtures for:
- available event
- full event
- empty list
- API unavailable
- malformed response
- registration success
- waitlist
- domain rejection

Rules:
- fixtures are dev/test only
- production must never silently fall back to fake event data
- missing production Core configuration should fail safely

## Environment separation

Conceptually:

```text
LOCAL:
CORE_API_BASE_URL=http://localhost:<core-port>

PREVIEW:
CORE_API_BASE_URL=<staging/rehearsal Core API>

PRODUCTION:
CORE_API_BASE_URL=https://api.engsoc.org
```

Do not point Preview at production merely for convenience.

## Contract governance

For every API change:

1. Core updates/proposes the versioned contract.
2. Landing reviews consumer impact.
3. Contract fixtures/tests are updated.
4. Core ships backward-compatible behavior first where possible.
5. Landing migrates.
6. Old behavior is deprecated only after landing production is verified.

Avoid big-bang releases where both projects must deploy at the same minute.

## Preferred contract artifact

The preferred long-term contract artifact is an OpenAPI specification owned by the Core repository, e.g.:

```text
docs/api/openapi.v1.yaml
```

The landing can use it for documentation, validation, optional type generation, mocks, and compatibility tests.

Do not create a shared runtime package unless there is a clear need.

## Synchronization metadata

Each landing release depending on Core should record:

```text
Core API version: v1
Contract revision: <identifier>
```

Use PR/release documentation, not runtime Git-SHA coupling.

## Observability

Record safe integration telemetry such as:

```text
request_id
route
status
latency_ms
```

Never log API secrets or attendee PII unnecessarily.

## Security rules

Never:
- put Core keys in `NEXT_PUBLIC_*`
- commit `.env.local`
- use Core service-role credentials
- connect directly to Core Postgres
- query Supabase directly for Core events/registrations
- duplicate registration business rules
- log registration PII
- use wildcard CORS as a shortcut

## Performance

Landing should:
- server-render where appropriate
- cache event GETs reasonably
- avoid N+1 API calls
- avoid one detail request per event card
- optimize images
- keep client bundles lean
- prevent layout shift
- respect reduced motion

## Accessibility and i18n

Modified event/registration flows must support:
- keyboard navigation
- labels
- visible focus
- screen reader status/error messaging
- mobile layouts
- English
- Arabic/RTL where supported
- localized Core error messages

## Testing

### Unit
Test:
- config validation
- response parsing
- DTO adapters
- error mapping
- malformed Core response

### Component/integration
Test:
- event list
- empty state
- Core unavailable
- event detail
- registration success/waitlist/error states

### Browser/E2E
Test:
- events render from mock/staging Core
- navigation works
- registration validates
- successful disposable/staging registration
- full/closed/rate-limited states
- mobile
- RTL if supported

Never run automated registration tests against production attendee data.

## CI

Run the repository's real equivalents of:

```text
format
lint
typecheck
unit tests
browser tests
production build
```

Do not disable tests to complete migration preparation.

## Deployment

Landing:

```text
GitHub → Vercel Project A → engsoc.org
```

Core:

```text
GitHub → Vercel Project B → api.engsoc.org / admin.engsoc.org
```

DNS cutover is a separate owner-controlled operation.

## Migration phases

### Phase A — repository readiness
- audit current UI
- identify event data coupling
- add `lib/core-api`
- add configuration validation
- add fixtures
- preserve current UI

### Phase B — event-read readiness
- route event UI through the integration layer
- use fixtures until real `/v1/events` exists
- add empty/error/loading states
- add caching

### Phase C — registration readiness
- prepare browser-safe registration client
- no secret
- wire final form only after Core contract is published
- map Core errors

### Phase D — staging integration
- connect Preview to staging Core
- verify CORS, latency, errors, contract, E2E

### Phase E — production cutover
- Core API deploys first
- Core verified independently
- Landing switches to production Core API
- smoke test
- monitor
- rollback remains available

## Definition of landing-side readiness

The landing is ready when:
- it owns no production event source of truth
- dynamic event reads go through one Core API module
- no Core secret reaches browser code
- registration client contains no secret
- API base URL is environment-configurable
- mocks are dev/test only
- graceful failure states exist
- timeouts exist
- no blind write retries exist
- accessibility and RTL are verified
- tests/build/CI pass
- docs explain the boundary
- no Core DB/Auth/admin logic was copied into the landing repo

## What the landing still needs from Core

Before final integration the Core team must supply:

1. staging API origin
2. production API origin
3. OpenAPI v1 contract
4. final event-list contract
5. final event-detail contract
6. pagination contract
7. registration request fields
8. registration result/error vocabulary
9. event GET authentication decision
10. server API key through secret management if required
11. CORS allowlist confirmation
12. rate-limit semantics
13. cache/freshness guidance
14. staging test event/fixture strategy
15. production cutover window

Until then, use contract fixtures and keep all integration points replaceable.

## Guiding principle

The landing should be able to say:

> I know how to speak to Core v1. I do not know or care how Core stores or authorizes its data.

The Core should be able to say:

> I expose a stable public contract. I do not know or care how the landing renders it.
