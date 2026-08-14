# Greenfield Product Blueprint (AI Build Spec)

> Paste this entire file into a coding agent + your business idea.  
> The agent scaffolds a **TypeScript monorepo** matching the architecture and **default file contents** below.  
> Domain names come only from the business idea. Do not import any other product’s domain.

---

## How to use

1. Fill **§0 Operator input** (or keep the defaults and replace later).
2. Tell the agent: *“Read this blueprint. Scaffold the repo. Use §0. Obey all rules. Emit default file bodies from §12–§18.”*
3. Agent runs **Phase A → B → C** (§10). Stop for review after each phase unless told otherwise.

---

## 0 · Operator input

### Defaults (replace with your idea)

```yaml
PRODUCT_NAME: LogiFlow
PRODUCT_SLUG: logiflow
TAGLINE: Shipment and fleet management for logistics companies

BUSINESS_IDEA: |
  LogiFlow helps logistics companies manage shipments, fleets, drivers,
  and delivery routes. Dispatchers create shipments and assign them to drivers.
  Drivers update shipment status via mobile. Customers track their shipments online.
  Admins see revenue and performance. Success in 90 days: 50 companies live,
  each managing ≥100 shipments.

PRIMARY_ACTORS:
  - admin        # bills, settings, all branches
  - dispatcher   # manage shipments, assign drivers
  - driver       # update shipment status
  - customer     # public tracking (optional portal)

SURFACES:
  authenticated_app: app.logiflow.local
  public_surface: track.logiflow.local    # customer tracking
  staff_admin: null                       # admins use same app + RBAC

CONSTRAINTS:
  mobile_shell: yes
  realtime: yes
  multi_tenant: company                   # every row scoped by company_id
  i18n: en-only
  offline: yes
```

**Rule:** If the operator pastes a different idea, discard LogiFlow nouns (`company`, `shipment`, `driver`) and re-derive from their idea using §6.

---

## 1 · Locked stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Package manager | npm |
| Runtime | Node 24 (pin in `.nvmrc`) |
| Frontend | React 19 + Vite 8 SPA |
| CSS | Tailwind CSS v4 + `src/ui/tokens/globals.css` |
| UI primitives | Radix-style + shared `src/ui/` |
| API | Hono 4 on custom Node server |
| Validation | Zod |
| DB | PostgreSQL + Drizzle ORM |
| Cache / jobs | Redis + BullMQ (+ cron) |
| Realtime | Socket.io + Redis adapter (if `realtime: yes`) |
| Auth | Access JWT in memory + HttpOnly refresh cookie |
| Authz | Rights-based RBAC (`requireAccess`) |
| Email | Provider interface + React Email |
| Tests | Vitest + Testing Library |
| E2E | Playwright (optional phase D) |
| CLI | `tsx src/cli.ts` → npm bin |
| Docs | Committed `docs/` + CI `docs:check` |
| Native | Capacitor only if `mobile_shell: yes` |

Do **not** use Next.js App Router unless the operator explicitly overrides.

---

## 2 · Architecture rules (always)

### 2.1 Portals & origins

- Authenticated app and public/client surface use **different origins** when audiences differ (separate cookies / CSP).
- Staff and owners may share one origin; gate with RBAC.

### 2.2 Services are the only business layer

```ts
export default async function createBooking(
  ctx: AppContext,
  params: CreateBookingParams,
): Promise<BookingDto> { /* ... */ }

export const agentTool = null // or tool descriptor
```

- Hono routes / workers / cron only validate + call services.
- 2xx bodies: `{ data, pagination? }`.

### 2.3 Context envelope

`withContext` per request/job:

1. Auth + tenant  
2. Transaction  
3. Service work  
4. Commit  
5. Flush deferred side effects (jobs, email, sockets)

Rollback ⇒ no side effects.

### 2.4 Import boundaries (eslint `boundaries`)

```
portal A  ──X──> portal B
api       ──X──> ui
ui        ──X──> services | db | api
services  ──X──> api | ui | app
lib       <── shared only
```

### 2.5 Naming

| Kind | Style |
|------|--------|
| Files | `snake_case.ts(x)` |
| Functions / vars | `camelCase` |
| Types / components | `PascalCase` |
| Env / error codes | `UPPER_SNAKE_CASE` |
| API paths | `kebab-case` |
| JSON | `camelCase` |

Comments explain **why**. No unused shims.

### 2.6 Async

Use Bluebird: `Promise.mapSeries`, `Promise.map` + `concurrency`, `Promise.reduce`. No `for…of` + `await` loops.

### 2.7 Client HTTP

Only via `src/lib/fetch.ts` (`apiFetch`). Never raw `fetch()` in `src/` (service worker exception only).

---

## 3 · Repository tree (create all of this)

```text
logiflow/   # or PRODUCT_SLUG
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── drizzle.config.ts
├── eslint.config.mjs
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .nvmrc
├── index.app.html
├── index.public.html          # if public surface
├── public/
├── docs/
│   ├── README.md
│   ├── setup.md
│   ├── spec/
│   │   ├── 00-architecture.md
│   │   ├── 01-overview.md
│   │   ├── 04-coding-conventions.md
│   │   ├── 05-testing.md
│   │   ├── 08-security.md
│   │   ├── 12-database.md
│   │   ├── 13-context.md
│   │   ├── 14-services.md
│   │   ├── 17-api.md
│   │   ├── 18-async-jobs.md
│   │   ├── 30-frontend.md
│   │   ├── 37-authentication.md
│   │   └── 38-rbac.md
│   ├── rules/
│   │   ├── workflow.md
│   │   ├── backend.md
│   │   ├── ui.md
│   │   ├── database.md
│   │   └── testing.md
│   ├── plans/
│   ├── research/
│   ├── decisions/
│   │   ├── TEMPLATE.md
│   │   └── INDEX.md
│   ├── lessons/
│   │   ├── TEMPLATE.md
│   │   └── INDEX.md
│   └── operations/
│       └── security-exceptions.md
└── src/
    ├── main.tsx
    ├── server.ts
    ├── worker.ts
    ├── cli.ts
    ├── api/
    ├── app/
    │   ├── auth/
    │   ├── app/
    │   ├── company/           # rename to tenant noun
    │   └── public/            # optional
    ├── ui/
    ├── services/
    ├── db/
    │   ├── schema/
    │   ├── migrations/
    │   ├── seeds/
    │   └── fixtures/
    ├── lib/
    ├── serializers/
    ├── channels/
    ├── workers/
    ├── cron/
    ├── providers/
    ├── emails/
    └── cli/
```

---

## 4 · Domain derivation (run before schema)

From `BUSINESS_IDEA`:

1. Nouns → tables  
2. Verbs → services  
3. Tenant FK on every business row  
4. Roles + rights  
5. Activity/audit events  
6. Fixture personas (5–12)  
7. Portal screen map  
8. Background jobs  

### Worked example (StudioBook defaults)

| Noun | Table | Notes |
|------|-------|--------|
| User | `users` | auth identity |
| Company | `companies` | tenant |
| Membership | `company_memberships` | user↔company + role |
| Driver | `drivers` | delivery personnel |
| Vehicle | `vehicles` | fleet resource |
| Shipment | `shipments` | core product noun |
| Activity | `activities` | append-only trail |

| Role | Rights (examples) |
|------|-------------------|
| admin | `company:*` |
| dispatcher | `company:shipments:*`, `company:drivers:read` |
| customer | public tracking only (no app membership) |

---

## 5 · CLI commands

| Command | Purpose |
|---------|---------|
| `dev` / `dev:start` / `dev:stop` | Dev stack |
| `lint` / `lint --fix` | ESLint |
| `typecheck` | `tsc` |
| `test` | Vitest |
| `build` | Production build |
| `audit` | Fail on high/critical |
| `docs:check` | Docs allowlist / indexes |
| `db:migrate` / `db:seed` / `db:fixtures` / `db:reset` | Data |

**Merge gates:** lint, typecheck, test, build, audit, docs:check (+ translate if i18n).

---

## 6 · Security defaults

- Host-only refresh cookie; short-lived access JWT  
- `requireAccess` on every mutating/read service that touches tenant data  
- Cross-tenant id miss → **404** (not 403 existence oracle)  
- Drizzle only (no string SQL)  
- Secrets only in env; ship `.env.example` with empty values  
- Rate-limit `/auth/signin`  
- Soft-delete columns (`deleted_at`) on user-facing entities  
- Serializers omit `password_hash`, internal FKs unless needed  

---

## 7 · Testing defaults

- Services: real Postgres + transactional rollback helper  
- Components: Testing Library  
- Unit suite: unmocked `fetch` throws  
- Boundary plugin: planted violation test so rules cannot silently no-op  

---

## 8 · UI defaults

- Shared `src/ui/` for all portals  
- Forms: field config → derived Zod schema  
- Logical spacing (`ms-`/`me-`) if RTL ever enabled  
- Reuse before invent; every new component ships a story file  

---

## 9 · Anti-patterns

- Business logic in routes or React trees  
- Shared cookies across public + app origins  
- Mock-only service tests  
- Giant “god” service files  
- Committing `.env` / credentials / `.scratch/`  
- Copying domain nouns from another product  

---

## 10 · Build phases

### Phase A — Skeleton
Package tooling, docker (Postgres+Redis), Vite shells, Hono health, docs stubs, AGENTS.md, empty CLI.

**Exit:** SPA loads; `GET /api/system/health` → 200.

### Phase B — Auth + tenancy
Users, sessions, refresh cookie, tenant + membership, sign-in UI, `RequireAuth`.

**Exit:** Sign-in lands in authenticated shell.

### Phase C — First vertical slice
Smallest valuable noun (e.g. Booking): schema → services → API → list/detail UI → fixtures → tests.

**Exit:** Create/list works end-to-end.

### Phase D — Platform
List filters, uploads, realtime, email worker, i18n, Capacitor — only if constraints say so.

### Phase E — Hygiene
Decisions/lessons logs; feature plans on branches; CI green.

---

## 11 · Agent kickoff prompt

```text
Read greenfield-ai-blueprint.md completely. Obey it.

Use §0 defaults OR this override:
BUSINESS_IDEA: """ ... """
PRODUCT_NAME: ...

Session goals:
1. Create full tree from §3.
2. Write default file bodies from §12–§18 (adapt names to PRODUCT_SLUG).
3. Complete Phase A.
4. Write docs/spec/01-overview.md for THIS product.
5. Stop with a checklist of Phase B open questions.
```

---

# Default file contents

Agent must create these files with bodies below (rename `LogiFlow` / `logiflow` / `company` to the operator’s product).

---

## 12 · Default `AGENTS.md`

```markdown
# AGENTS.md — Shared Agent Contract

## Project
LogiFlow is a TypeScript monorepo: Vite + React SPA, Hono API, Drizzle/Postgres,
Redis, BullMQ. CLI: `tsx src/cli.ts`.

## Commands
- `npm run dev` — full stack
- `npm run lint` / `typecheck` / `test` / `build` / `audit` / `docs:check`
- `npm run db:migrate` / `db:seed` / `db:fixtures`

Seven gates must be green before merge.

## Contracts
- Files: snake_case. Services: `(ctx, params)` default export + `agentTool`.
- Client HTTP only via `@/lib/fetch`.
- Import boundaries lint-enforced.
- Comments explain WHY. User-facing strings are complete thoughts.
- Async: Bluebird map/mapSeries/reduce.
- No unused shims.

## Workflow
Feature branch carries research → design → build → verify.
Plan lives in `docs/plans/`. Humans authorize merges; squash-merge only.
```

---

## 13 · Default `docs/README.md`

```markdown
# docs/ — Filing-System Manifest

Everything in docs/ is committed. Scratch goes to `.scratch/` (gitignored).

## Allowlist
- README.md — this file
- setup.md — zero to running
- spec/ — durable design (`status:` frontmatter)
- rules/ — binding path-scoped conventions
- plans/ — per-feature task lists
- research/ — dated briefs
- decisions/ — one file per decision + INDEX.md
- lessons/ — gotchas inbox + INDEX.md
- operations/ — runbooks (incl. security-exceptions.md)

`docs:check` fails CI if a top-level entry is missing from this allowlist.
```

---

## 14 · Default rules (create under `docs/rules/`)

### 14.1 `docs/rules/workflow.md`

```markdown
---
paths:
  - "**/*"
---
# Workflow

- One feature = one branch = one PR.
- Plan at `docs/plans/<feature>.md` with Delivers/Tests per milestone.
- Do not commit secrets. Do not force-push main.
- Squash-merge only.
- Fix patterns repo-wide, not one call site.
- Verify with tests/curl before asking the operator to retest.
```

### 14.2 `docs/rules/backend.md`

```markdown
---
paths:
  - "src/services/**"
  - "src/api/**"
  - "src/workers/**"
  - "src/lib/context/**"
---
# Backend

- Business logic only in `src/services/**` as `(ctx, params)`.
- Call `requireAccess(ctx, claim)` first in every tenant-scoped service.
- Use `withContext`; never open ad-hoc transactions in routes.
- Defer email/jobs/sockets until after commit.
- Return DTOs from serializers; never raw rows with secrets.
- Errors: throw `AppError` with greppable `CODE`.
- Envelope: `{ data, pagination? }` on 2xx.
```

### 14.3 `docs/rules/ui.md`

```markdown
---
paths:
  - "src/ui/**"
  - "src/app/**"
---
# UI

- Reuse `src/ui` before inventing. New component ships with a story.
- All HTTP via `apiFetch` (`@/lib/fetch`).
- User-facing copy: full sentences.
- Forms: field configs; derive Zod — do not duplicate schemas by hand.
- Do not import from `src/services` or `src/db`.
```

### 14.4 `docs/rules/database.md`

```markdown
---
paths:
  - "src/db/**"
---
# Database

- One create-table concern per migration file.
- Soft-delete with `deleted_at` where users can remove records.
- Tenant FK NOT NULL on business tables.
- Seeds = reference data; fixtures = story personas (dev/test).
- Fixtures are upsert-only and idempotent.
```

### 14.5 `docs/rules/testing.md`

```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---
# Testing

- Prefer `withTestContext` + real DB rollback for services.
- No network in unit tests (fetch must throw if unmocked).
- Assert error codes, not only messages.
- Component tests query by role/label, not class names.
```

---

## 15 · Default templates

### 15.1 `docs/decisions/TEMPLATE.md`

```markdown
---
date: YYYY-MM-DD
status: accepted
---
# <Title>

## Context
What forced a choice?

## Decision
What we chose.

## Consequences
What becomes easier / harder.
```

### 15.2 Example decision

```markdown
---
date: 2026-08-05
status: accepted
---
# Access token in memory; refresh in HttpOnly cookie

## Context
XSS can read JS memory; cookies are easier to steal via CSRF if mis-scoped.

## Decision
15-minute access JWT in memory; rotating refresh secret in host-only Secure cookie.

## Consequences
Must bootstrap via refresh on load. SPA cannot be fully static-auth without JS.
```

### 15.3 `docs/lessons/TEMPLATE.md`

```markdown
---
date: YYYY-MM-DD
---
# <Short gotcha>

## Symptom
## Cause
## Fix
## Promote?
rules | spec | lint | none
```

---

## 16 · Default `.env.example`

```bash
APP_ENV=development
PORT=3000
APP_HOST=app.logiflow.local:3000
PUBLIC_HOST=track.logiflow.local:3000

DATABASE_URL=postgres://app:app@127.0.0.1:5435/logiflow_development
REDIS_URL=redis://127.0.0.1:6379/0

JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=

EMAIL_PROVIDER=console
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./.data/storage

RATE_LIMIT=true
```

---

## 17 · Default code stubs (illustrative)

### 17.1 Service shape — `src/services/shipments/create_shipment.ts`

```ts
import type { AppContext } from '@/lib/context/types'
import { requireAccess } from '@/lib/access'
import { AppError } from '@/lib/errors'

export type CreateShipmentParams = {
  companyId: string
  trackingCode: string
  origin: string
  destination: string
  weight: number
}

/**
 * Creates a shipment in the caller's company.
 * @throws DRIVER_NOT_AVAILABLE
 * @throws INVALID_ADDRESS
 */
export default async function createShipment(
  ctx: AppContext,
  params: CreateShipmentParams,
) {
  requireAccess(ctx, { company: { id: params.companyId, rights: ['shipments:create'] } })

  // validate company, insert shipment, enqueue notification email
  throw new AppError('NOT_IMPLEMENTED', 'createShipment body is Phase C work', 501)
}

export const agentTool = null
```

### 17.2 Thin route — `src/api/app/companies/shipments/create.ts`

```ts
import { z } from 'zod'
import createShipment from '@/services/shipments/create_shipment'

export const bodySchema = z.object({
  trackingCode: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  weight: z.number().positive(),
})

// Inside Hono handler (sketch):
// const body = bodySchema.parse(await c.req.json())
// const data = await createShipment(c.get('ctx'), { companyId: c.req.param('companyId'), ...body })
// return c.json({ data }, 201)
```

### 17.3 Fetch wrapper — `src/lib/fetch.ts` (sketch)

```ts
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.accessToken) headers.set('Authorization', `Bearer ${init.accessToken}`)
  headers.set('Accept', 'application/json')
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error('API_ERROR'), { status: res.status, body: err })
  }
  return res.json() as Promise<T>
}
```

---

## 18 · Default fixtures cast sheet — `src/db/fixtures/README.md`

```markdown
# Fixtures — cast sheet

## Companies
| Company | Story |
|---------|--------|
| Fast Freight | Flagship — 50 vehicles, hundreds of shipments |
| Quiet Logistics | Empty states — 0 shipments |
| Suspended Trans | status=suspended — gate testing |

## Users
| User | Role | Notes |
|------|------|-------|
| ava@example.com | admin @ Fast Freight | password: `Test1234!` (dev only) |
| ben@example.com | dispatcher @ Fast Freight | |
| cam@example.com | admin @ Quiet Logistics | |
| dana@example.com | admin @ Suspended Trans | cannot operate |

Shared local password policy must satisfy the sign-in form (min 8 + complexity).
Document the plaintext only in this fixtures README for local dev.
```

---

## 19 · Default `docs/setup.md` outline

```markdown
# Setup

1. Install Node from `.nvmrc` (nvm recommended)
2. Docker Desktop running
3. `cp .env.example .env`
4. `npm ci`
5. `docker compose up -d`
6. `npm run db:migrate && npm run db:fixtures`
7. `npm run dev`
8. Open the app host from `.env` (APP_HOST)

Smoke: health endpoint 200; sign-in with a fixtures user.
```

---

## 20 · Default `package.json` scripts

```json
{
  "name": "logiflow",
  "private": true,
  "type": "module",
  "bin": { "logiflow": "./src/cli.ts" },
  "scripts": {
    "dev": "tsx src/cli.ts dev",
    "lint": "tsx src/cli.ts lint",
    "typecheck": "tsx src/cli.ts typecheck",
    "test": "tsx src/cli.ts test",
    "build": "tsx src/cli.ts build",
    "audit": "tsx src/cli.ts audit",
    "docs:check": "tsx src/cli.ts docs:check",
    "db:migrate": "tsx src/cli.ts db:migrate",
    "db:seed": "tsx src/cli.ts db:seed",
    "db:fixtures": "tsx src/cli.ts db:fixtures"
  }
}
```

---

## 21 · Done checklist (architecture v1)

- [ ] Tree from §3 exists  
- [ ] AGENTS + rules + docs README from §12–§14  
- [ ] Phase A health + SPA  
- [ ] Phase B auth + tenant  
- [ ] Phase C one vertical slice + fixtures README  
- [ ] Gates runnable  
- [ ] No foreign product domain nouns  

---

*Architecture is invariant. Domain comes only from §0.*
