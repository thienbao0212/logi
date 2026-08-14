# Lessons Learned

- **Missing UUID v4**: Found out that `crypto.randomUUID()` or a proper library is necessary when seeding Postgres `uuid` columns. Plain random strings caused Foreign Key constraint failures during DB Seeding.
- **Vite Client Types**: Adding `/// <reference types="vite/client" />` in a `src/vite-env.d.ts` is required to allow importing `.css` files without TypeScript throwing `TS2882`.
- **Hono Generic Types**: Hono requires explicit generic typing for context variables (`new Hono<{ Variables: { ctx: AppContext } }>()`) otherwise `c.get('ctx')` will fail TypeScript's strict type checks.
