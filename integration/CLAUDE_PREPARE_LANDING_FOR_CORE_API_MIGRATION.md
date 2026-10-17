# Claude Agent Prompt — Prepare the Landing Repository for Core API Migration

You are the senior frontend/platform integration engineer responsible for preparing the Engineering Society public landing repository for a new architecture.

## Target architecture

```text
engsoc.org
  → Landing Vercel project

api.engsoc.org
  → Core Vercel project API

admin.engsoc.org
  → Core Vercel project administration
```

This is NOT the previous single-repository migration.

The landing and Core are now intentionally independent applications and repositories. Their synchronization boundary is a stable, versioned HTTPS API.

You have full access to the LANDING repository only.

You must not modify:
- Core repository
- Core database
- Supabase Core project
- Core Auth
- Core authorization
- Core RLS
- Core private routines
- production DNS

Your job is to make the landing repository migration-ready, contract-driven, polished, testable, secure, independently deployable, and easy to connect to the Core API later.

Work autonomously:

INSPECT
→ INVENTORY
→ DESIGN BOUNDARY
→ IMPLEMENT CORE-API CLIENT LAYER
→ ISOLATE/REMOVE EVENT DATA COUPLING
→ ADD DEV/TEST FIXTURES
→ WIRE EVENT UI
→ PREPARE REGISTRATION CLIENT
→ HARDEN
→ TEST
→ ACCESSIBILITY/RTL REVIEW
→ PERFORMANCE REVIEW
→ DOCUMENT
→ COMMIT
→ PUSH FEATURE BRANCH
→ CI/PREVIEW
→ HANDOFF

Do not change production DNS or perform production cutover.

## 1. Read repository instructions

Before editing:

```text
git status
git branch --show-current
git remote -v
git log -n 15 --oneline
```

Read all available:

```text
AGENTS.md
CLAUDE.md
README.md
CONTRIBUTING.md
package.json
next.config.*
tsconfig.json
eslint/prettier config
Vercel config
docs/*
LANDING_CORE_API_INTEGRATION_GUIDELINES.md
```

Repository-specific conventions override assumptions in this prompt.

## 2. Confirm repository identity

Verify:
- remote
- framework
- package manager
- Node requirement
- default branch
- existing production domain
- Vercel linkage if present

If this is the Core repo rather than the landing repo, STOP and report:

`WRONG REPOSITORY — LANDING MIGRATION PREPARATION NOT STARTED`

## 3. Create a branch

Start from latest clean default branch.

Create:

```text
migration/core-api-readiness
```

Record:
- starting SHA
- branch name

Do not work directly on main/master.

## 4. Inventory the landing site

Inspect:
- routes
- homepage sections
- event components/pages
- registration UI
- event fixtures/static data
- content files
- media/assets
- animations
- i18n/RTL
- forms
- SEO
- analytics
- client/server components
- existing fetch/API usage
- environment variables
- tests
- CI
- Vercel behavior

Classify every event-related source:

```text
KEEP
ADAPT
REPLACE WITH CORE API
DEV/TEST FIXTURE ONLY
REMOVE
```

Do not delete before understanding.

## 5. Enforce ownership

Landing owns:
- presentation
- navigation
- copy
- media
- responsive UI
- SEO
- accessibility
- i18n
- Core API consumption

Core owns:
- event truth
- registration truth
- capacity
- waitlist
- duplicates
- rate limiting
- audit
- Auth
- authorization
- DB
- business invariants

Do not make the landing a second backend.

## 6. Remove production event source-of-truth responsibility

Search for:
- hardcoded event lists
- `content/events.*`
- event JSON
- local event databases
- direct Supabase event reads
- authoritative mock content

Final production architecture must use Core API as event truth.

Mocks may remain only as clearly isolated dev/test fixtures.

Production must never silently display fixtures as real events.

## 7. Create one Core API integration layer

Create a cohesive module following repository conventions, conceptually:

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

Do not scatter raw Core fetch calls through components.

## 8. Configuration

Support:

```text
CORE_API_BASE_URL
CORE_EVENTS_API_KEY
```

`CORE_EVENTS_API_KEY` is server-only if the Core later requires one.

Never create:

```text
NEXT_PUBLIC_CORE_EVENTS_API_KEY
```

Update `.env.example` with names/descriptions only.

No real secrets in source.

## 9. Safe config behavior

Centralize configuration validation.

Never:
- hardcode production fallback URLs
- silently fall back to production
- activate mock mode automatically in production
- show fake events when Core configuration is missing

Missing production Core config should produce an honest event-unavailable state while static public pages remain usable.

## 10. Draft consumer contract

Until Core publishes OpenAPI v1, use a clearly marked DRAFT minimum event DTO:

```ts
type CorePublicEventV1 = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  committeeName: string;
  availability: string;
};
```

Do not invent:
- capacity
- revision
- committeeId
- internal status
- approval state
- audit fields
- registration count

Mark the draft clearly as pending confirmation against the real Core contract.

## 11. Validate remote responses

At the HTTP boundary validate remote JSON using existing project tooling or a lightweight architecture-consistent solution.

Malformed Core responses must become a controlled internal error, not crash the site.

## 12. Server-side event client

Prepare server-only functions conceptually equivalent to:

```text
listPublicEvents()
getPublicEvent(id)
```

Target:

```text
GET {CORE_API_BASE_URL}/v1/events
GET {CORE_API_BASE_URL}/v1/events/{id}
```

Do not invent final pagination/query syntax.

Add:
- timeout
- safe status handling
- response parsing
- request ID support where practical
- no secret logging

If a server key exists, attach it only here.

## 13. Event caching

Prepare framework-supported cache/revalidation.

Target 30–60 seconds initially, centralized/configurable.

Do not cache registration POSTs.

Do not add Redis/custom infrastructure unless already justified by the repo.

## 14. View-model adapter

Create:

```text
Core API DTO
  ↓
landing adapter
  ↓
view model
  ↓
component
```

Adapter may format dates/localized labels.

It must not make authorization decisions or invent domain facts.

## 15. Route all event UI through the integration layer

Refactor:
- homepage events
- event catalogue if present
- event detail if present
- availability display
- event links

Preserve existing design unless the task requires a fix.

Components should not know whether data came from fixtures or HTTP.

## 16. Graceful Core failure

Required:

```text
Core unavailable
  ↓
landing shell still renders
hero/about/content still render
events show temporary-unavailable state
```

Add:
- loading
- empty
- unavailable
- invalid-response states

Never use fake production fallback events.

## 17. Prepare registration seam

Create a browser-safe abstraction conceptually:

```text
registerForEvent(eventId, payload)
```

Prepare for:

```text
POST /v1/events/{eventId}/registrations
```

Do NOT finalize payload fields until Core contract is supplied.

No:
- API secret
- Supabase
- DB access
- local capacity logic
- duplicate logic
- waitlist ordering
- blind retries

Use fixtures for UI-state development.

## 18. Registration production assumption

Prepare for:

```text
browser at engsoc.org
  ↓
POST api.engsoc.org/v1/events/{id}/registrations
```

This preserves the direct public request path for Core rate limiting.

Do not create a landing-server proxy solely to hide a nonexistent secret.

If current architecture forces a proxy, document its client-IP/rate-limit impact and leave that as a Core/owner decision.

## 19. Registration UX states

Prepare:

```text
idle
validating
submitting
success
waitlisted
already registered
already waitlisted
event full
registration closed
rate limited
temporarily unavailable
```

Use final Core vocabulary later.

Disable duplicate submission while pending.

Never optimistically claim success.

## 20. CORS requirements

Document production origins Core must allow:

```text
https://engsoc.org
https://www.engsoc.org
```

Document Preview/dev needs separately.

Do not modify Core from this repository.

Do not recommend wildcard CORS.

## 21. Fixtures

Create clearly synthetic contract fixtures covering:
- available event
- full event
- no events
- Core unavailable
- malformed response
- registration success
- waitlist
- domain rejection

No real attendee PII.

Production may never default to fixture mode.

## 22. Accessibility

Audit modified event/registration areas for:
- semantic headings
- labels
- keyboard use
- visible focus
- status/error announcements
- pending states
- contrast
- touch targets
- reduced motion

## 23. English / Arabic / RTL

If supported, preserve both languages.

Translate:
- loading
- no events
- unavailable
- registration statuses/errors

Verify RTL visually, including form layout and directional icons.

## 24. Performance

Avoid:
- N+1 Core requests
- per-card detail fetching
- duplicate calls
- unnecessary client components
- oversized payloads
- heavy dependencies

Prefer one homepage list request.

Check:
- LCP
- CLS
- client bundle
- image behavior

## 25. SEO

Preserve crawlable event presentation if required.

Do not expose private data in metadata or structured data.

A Core outage must not block the entire landing site.

## 26. Security review

Search final diff for:
- API keys
- tokens
- Supabase credentials
- DATABASE_URL
- service-role keys
- console logs of API data
- registration PII
- hardcoded secret endpoints

Landing should never need Core DB or service-role credentials.

## 27. Tests

Add unit tests for:
- config
- parsing
- malformed responses
- timeouts
- adapters
- error mapping

Add component/integration tests for:
- list
- empty
- unavailable
- detail
- registration result states

Add E2E for:
- homepage
- event rendering through mock/staging contract
- navigation
- registration validation
- simulated/staging registration
- Core unavailable
- mobile
- RTL if supported
- no browser secret exposure

Never register automated users against production.

## 28. Contract-test readiness

Prepare a suite that can later point to staging Core and verify only published HTTP behavior.

Do not depend on Core DB internals.

If OpenAPI is not yet available, mark live contract tests as blocked rather than inventing final behavior.

## 29. Documentation

Document:

```text
engsoc.org = landing
api.engsoc.org = Core API
admin.engsoc.org = Core admin
```

Document:
- source-of-truth ownership
- integration module
- env vars
- server-only key rule
- public registration rule
- mock mode
- failure behavior
- testing
- Core handoff requirements

## 30. Core handoff checklist

Create a concise checklist:

```text
[ ] staging API origin
[ ] production API origin
[ ] OpenAPI v1 contract
[ ] event-list contract
[ ] event-detail contract
[ ] pagination contract
[ ] registration request fields
[ ] registration result/error vocabulary
[ ] event GET authentication decision
[ ] server API key if required
[ ] CORS allowlist
[ ] rate-limit semantics
[ ] cache/freshness guidance
[ ] staging test event
[ ] production cutover window
```

## 31. Quality gate

Use actual package scripts.

Run all applicable:
- format
- lint
- typecheck
- tests
- browser tests
- production build
- `git diff --check`

Do not disable failures to finish.

Inspect browser console/network.

## 32. Commits

Use coherent conventional commits if the repo supports them, e.g.:

```text
refactor(api): isolate core platform integration
feat(events): prepare event views for core api
feat(registration): add browser-safe core registration client
test(api): cover core failure and contract states
docs(api): document landing-core integration
```

Do not mix unrelated redesign work into this preparation.

## 33. Push + PR

Push the feature branch.

Open a PR.

Include:
- target architecture
- what changed
- what did not change
- assumptions
- test evidence
- Preview
- Core handoff checklist

Do not merge automatically on the first migration-preparation pass unless explicitly authorized.

## 34. Vercel Preview

Use the existing landing Vercel project.

Do not create a duplicate project.

Preview should use fixtures or staging Core.

Do not point Preview at production merely to make it work.

Verify:
- desktop/mobile
- EN/AR
- event states
- unavailable state
- no secret leakage
- clean console/network

## 35. Do not do yet

Do NOT:
- change production DNS
- claim `api.engsoc.org` already exists
- create production Core API keys
- modify Core
- alter Supabase
- alter production DB
- finalize registration fields without Core contract
- migrate real production data
- perform irreversible cutover

This run prepares the landing side only.

## 36. Expected end state

Conceptually:

```text
Landing UI
   │
   ├── static public content
   ├── visual system
   ├── i18n
   └── event/registration surfaces
            │
            ▼
        lib/core-api
            │
      ┌─────┴─────┐
      │           │
 fixtures      Core HTTP v1
 dev/test      staging/prod
```

The landing no longer owns production event truth.

## 37. Stop conditions

Request Core/owner input only when the remaining step requires:
- final API schema
- registration fields
- error vocabulary
- API authentication decision
- staging/production API origin
- CORS policy
- secret provisioning
- DNS/cutover approval

Do not stop for ordinary implementation issues.

## 38. Final response

Return:

`LANDING CORE-API MIGRATION PREPARATION — READY FOR CORE HANDOFF`

Include:

```text
Repository:
Branch:
Starting SHA:
Final SHA:
Architecture:
Event source of truth:
Core API integration module:
Production mock fallback:
Server secret exposure:
Registration architecture:
CORS requirements:
Caching:
Timeouts:
Error handling:
Accessibility:
EN/AR/RTL:
Tests:
Build:
CI:
Preview:
Files changed:

CORE HANDOFF REQUIRED:
1.
2.
3.
...

Known issues:
Owner decisions required:
```

Finish with:

`Landing-side architecture is prepared for a versioned Core API integration. No Core database, Auth, authorization, production API, DNS, or production data was modified in this preparation.`
