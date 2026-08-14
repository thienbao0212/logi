---
status: active
---
# 17 - API Specification

The backend uses `Hono` mounted on a Node server. All responses follow a standard envelope:
`{ "data": { ... } }` for 2xx responses.
`{ "error": "CODE", "message": "..." }` for 4xx/5xx responses.

## Core Endpoints

### Authentication
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ data: { user: {...}, memberships: [...], token: "JWT" } }`

### Shipments
All shipment endpoints require a valid Bearer JWT.

- `GET /api/shipments?companyId=...`
  - Returns a list of all shipments for the specified company.

- `POST /api/shipments`
  - Body: `{ companyId, customerId, originId, destinationId, mode, weightTotal?, volumeTotal? }`
  - Creates a new shipment in `DRAFT` status and automatically creates the first Tracking Event.

- `POST /api/shipments/:id/events`
  - Body: `{ status, description, locationId? }`
  - Adds a new tracking event and updates the parent shipment's status.

- `GET /api/shipments/:id/documents`
  - Returns all documents attached to a specific shipment.

- `POST /api/shipments/:id/documents`
  - Body: `{ name, documentType, fileUrl }`
  - Attaches a new document to the shipment.

## Middleware
- `requireAuth`: Verifies the JWT in the `Authorization: Bearer <token>` header. Extracts user ID, fetches user profile and company memberships, and populates `c.get('ctx')`.
