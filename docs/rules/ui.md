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
