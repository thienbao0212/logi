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
