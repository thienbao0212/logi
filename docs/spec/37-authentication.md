---
status: active
---
# 37 - Authentication

LogiFlow currently implements a simplified JWT-based authentication mechanism.

## Mechanism
1. Client sends `POST /api/auth/login` with email and password.
2. Server verifies the password (currently using plaintext match in seeds, but structured for hashing).
3. Server signs a JWT using `HS256` and the `JWT_PRIVATE_KEY` environment variable.
4. Client receives the token and stores it in `localStorage` under the key `token`, alongside user and membership metadata.
5. For every subsequent request, the client sets the `Authorization: Bearer <token>` header.
6. The `requireAuth` Hono middleware verifies the JWT signature and blocks invalid requests with `401 Unauthorized`.

## Future Enhancements
- As noted in `decisions/INDEX.md`, the current Bearer token approach was chosen for mobile shell compatibility. For high-security web environments, we may migrate to HttpOnly cookies for the refresh token and short-lived in-memory access tokens.
