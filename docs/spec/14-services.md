---
status: active
---
# 14 - Services Architecture

The business logic is strictly encapsulated in the `src/services/` directory. Hono route handlers only parse inputs (using Zod) and pass them to the service layer.

## Core Rules
1. **No direct DB calls in Routes**: Routes must call a function exported from `src/services/`.
2. **Context Passing**: Every service function receives an `AppContext` (`ctx`) as its first argument, containing the authenticated user, their memberships, and the database instance.
3. **Authorization Check**: Every service function that modifies or reads tenant data MUST call `requireAccess(ctx, claim)` as its very first action.

## Implemented Services

### `src/services/auth.ts`
- `loginService(email, password)`: Verifies credentials and generates a JWT payload. Does not issue cookies/headers directly (that is handled by the route).

### `src/services/shipment.ts`
- `createShipment(ctx, data)`: Inserts a shipment and an initial `DRAFT` event.
- `listShipments(ctx, companyId)`: Fetches all shipments for a company.
- `addTrackingEvent(ctx, shipmentId, data)`: Inserts a new event and updates the parent shipment's status.

### `src/services/documents.ts`
- `addDocumentToShipment(ctx, shipmentId, data)`: Links a new document (with mock `fileUrl`) to a shipment.
- `listShipmentDocuments(ctx, shipmentId)`: Retrieves documents for a shipment.
