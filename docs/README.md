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
