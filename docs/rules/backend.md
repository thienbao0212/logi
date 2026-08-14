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
