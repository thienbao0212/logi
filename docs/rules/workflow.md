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
