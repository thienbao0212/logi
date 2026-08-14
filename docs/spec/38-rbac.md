---
status: active
---
# 38 - Role Based Access Control (RBAC)

RBAC in LogiFlow revolves around the `company_memberships` table. A single user can theoretically belong to multiple companies, but operations are strictly scoped to one company at a time.

## Membership Structure
- `user_id`
- `company_id`
- `role`: Can be `admin`, `logistic`, etc.

## `requireAccess` Middleware
Every business logic service MUST call the `requireAccess(ctx, claim)` helper located in `src/lib/access.ts`.

Example:
```ts
requireAccess(ctx, { company: { id: shipment.companyId } });
```

This helper ensures:
1. The user exists in the context.
2. The user has an active membership record linking them to `companyId`.
3. (Future) Validates if the user's role has the specific granular permission (e.g., `shipments:create`).

If the check fails, an `AppError` is thrown with code `UNAUTHORIZED` or `FORBIDDEN`, halting the operation immediately.
