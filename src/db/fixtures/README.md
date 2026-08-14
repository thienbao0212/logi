# Fixtures — cast sheet

## Companies
| Company | Story |
|---------|--------|
| Fast Freight | Flagship — 50 vehicles, hundreds of shipments |
| Quiet Logistics | Empty states — 0 shipments |
| Suspended Trans | status=suspended — gate testing |

## Users
| User | Role | Notes |
|------|------|-------|
| ava@example.com | admin @ Fast Freight | password: `Test1234!` (dev only) |
| ben@example.com | dispatcher @ Fast Freight | |
| cam@example.com | admin @ Quiet Logistics | |
| dana@example.com | admin @ Suspended Trans | cannot operate |

Shared local password policy must satisfy the sign-in form (min 8 + complexity).
Document the plaintext only in this fixtures README for local dev.
