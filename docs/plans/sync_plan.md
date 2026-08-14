# Document Sync Plan

Upon reviewing our recent work against the `AGENTS.md` contract, I discovered several violations that were introduced during the UI and Translation phases. 

This plan outlines the steps to strictly align our recent code with the project's standards.

## Violations Identified

1. **File Naming (`snake_case`):** 
   - *Rule:* "Files: snake_case."
   - *Violation:* We created all React components using `PascalCase` (e.g., `AppShell.tsx`, `ShipmentDetail.tsx`, `OverviewTab.tsx`).
2. **Client HTTP (`@/lib/fetch`):** 
   - *Rule:* "Client HTTP only via `@/lib/fetch`."
   - *Violation:* We used raw native `fetch()` calls directly inside our components (e.g., `await fetch('/api/shipments')`) and `src/lib/fetch.ts` does not currently exist.
3. **Plan Location (`docs/plans/`):**
   - *Rule:* "Plan lives in `docs/plans/`."
   - *Violation:* Our recent implementation plans were stored as internal AI artifacts rather than persistent Markdown files in `docs/plans/`.

## Proposed Fixes

### 1. Refactor HTTP Calls
- Create `src/lib/fetch.ts` to act as a centralized HTTP wrapper that automatically attaches the `Authorization` token and handles JSON parsing.
- Refactor all instances of raw `fetch()` in the `src/ui/` directory to use this wrapper.

### 2. Enforce `snake_case` File Naming
- Rename all React component files in `src/ui/` from `PascalCase.tsx` to `snake_case.tsx`.
- Update all corresponding `import` statements across the application to reflect the new file names.
- *(Note: The React components themselves will still use PascalCase for their function names, as required by React, but the file names will follow `AGENTS.md`)*.

### 3. Move Plans
- I will move our implementation plans (including this one) into the `docs/plans/` directory to satisfy the documentation requirement.

> [!CAUTION]
> Renaming all UI files to `snake_case` will touch dozens of files and imports. Please confirm if you want to strictly enforce `snake_case` for React components or if that rule was only intended for backend files.
> 
> **Are you ready to proceed with this sync?** Click **Proceed** to authorize the refactoring.
