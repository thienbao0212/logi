---
status: active
---
# 01 - Product Overview

## LogiFlow
**Tagline:** Shipment and fleet management for logistics companies.

LogiFlow is a multi-tenant B2B platform that helps logistics companies manage their shipments, tracking events, and delivery documents. The system provides a centralized dashboard for dispatchers and admins to oversee the entire logistics lifecycle.

## Primary Actors
- **Admin**: Has full access to manage the company's users, settings, and view all branches and high-level revenue metrics.
- **Logistic/Dispatcher**: Manages shipments, creates tracking events, and uploads necessary customs/shipping documents.

## Surfaces
- **Authenticated App** (`/`): A Vite + React Single Page Application (SPA) where Admins and Dispatchers log in to manage data.

## Key Constraints & Architecture
- **Multi-Tenant**: Every business row (Shipments, Customers, Locations) is strictly scoped by a `company_id`.
- **API First**: The backend is a pure REST JSON API built with Hono on a Node server.
- **Database**: PostgreSQL with Drizzle ORM.
- **Auth**: JWT based authentication (stored in localStorage for this demo/prototype phase).
