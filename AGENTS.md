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
