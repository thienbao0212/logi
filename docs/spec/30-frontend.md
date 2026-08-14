---
status: active
---
# 30 - Frontend Architecture

The frontend is a single-page application (SPA) built with React 19, Vite, and Tailwind CSS.
Routing is managed by `react-router-dom`.

## Key Components

### AppShell
- The main wrapper for all authenticated pages.
- Checks `localStorage` for a valid JWT and user info. If absent, redirects to `/login`.
- Dynamically renders the Sidebar based on the user's role (Admin vs Logistic).
- Provides the top navigation bar and handles logout logic.

### Pages
- **`Login.tsx`**: Handles email/password submission and stores the JWT and user JSON in `localStorage`.
- **`AdminDashboard.tsx`**: A dashboard for Admin roles to view high-level metrics and system alerts.
- **`ShipmentList.tsx`**: Displays a table of all shipments for the current company. Includes a `CreateShipmentModal`.
- **`ShipmentDetail.tsx`**: A detailed view of a single shipment, utilizing a tabbed interface:
  - **Overview**: Route info, origin/destination, cargo weight/volume.
  - **Tracking**: A timeline of tracking events.
  - **Documents**: A grid of attached documents (Invoice, Customs, etc.) and a mock upload form.

## Data Fetching
- All HTTP requests are sent to `/api/*` and proxied by Vite in development to `localhost:3000`.
- The `Authorization: Bearer <token>` header is manually injected into `fetch` calls.
