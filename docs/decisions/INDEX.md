# Architectural Decisions

- **Phase A/B - JWT Location**: Decided to use standard Bearer tokens in headers for easier API consumption from mobile shells in the future, rather than HttpOnly cookies (which are strictly browser-only).
- **Phase C - UUID**: Enforced valid UUID v4 generation in seed files to prevent Postgres foreign key constraint errors.
- **Phase D - Mock Uploads**: Postponed full S3 blob storage integration. Decided to mock file uploads by accepting a `fileUrl` dummy string directly on the backend to keep the prototype fast and focused on business logic.
