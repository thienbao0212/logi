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
