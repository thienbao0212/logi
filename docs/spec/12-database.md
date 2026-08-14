---
status: active
---
# Database Architecture (ERD)

This document maps out the core data models and relationships for the LogiFlow database.

## Entity Relationship Diagram

```mermaid
erDiagram
    COMPANIES {
        uuid id PK
        text name
        text slug
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    USERS {
        uuid id PK
        text email
        text password_hash
        text first_name
        text last_name
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    COMPANY_MEMBERSHIPS {
        uuid id PK
        uuid company_id FK
        uuid user_id FK
        text role
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS {
        uuid id PK
        uuid company_id FK
        text name
        text email
        text phone
        text address
        timestamp created_at
        timestamp updated_at
    }

    LOCATIONS {
        uuid id PK
        uuid company_id FK
        text name
        text address
        text city
        text country
        text type
        timestamp created_at
    }

    SHIPMENTS {
        uuid id PK
        uuid company_id FK
        text tracking_number
        uuid customer_id FK
        uuid origin_id FK
        uuid destination_id FK
        enum status
        enum mode
        text weight_total
        text volume_total
        timestamp estimated_departure_date
        timestamp estimated_arrival_date
        timestamp actual_departure_date
        timestamp actual_arrival_date
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    SHIPMENT_EVENTS {
        uuid id PK
        uuid shipment_id FK
        uuid location_id FK "nullable"
        enum status
        text description
        timestamp event_date
        jsonb metadata
        uuid created_by FK
        timestamp created_at
    }

    DOCUMENTS {
        uuid id PK
        uuid shipment_id FK
        text name
        text document_type
        text file_url
        uuid created_by FK
        timestamp created_at
    }

    %% Relationships
    COMPANIES ||--o{ COMPANY_MEMBERSHIPS : "has"
    USERS ||--o{ COMPANY_MEMBERSHIPS : "belongs to"
    
    COMPANIES ||--o{ CUSTOMERS : "owns"
    COMPANIES ||--o{ LOCATIONS : "owns"
    COMPANIES ||--o{ SHIPMENTS : "manages"

    CUSTOMERS ||--o{ SHIPMENTS : "orders"
    LOCATIONS ||--o{ SHIPMENTS : "origin / destination"
    
    SHIPMENTS ||--o{ SHIPMENT_EVENTS : "tracks"
    SHIPMENTS ||--o{ DOCUMENTS : "attaches"
    
    LOCATIONS |o--o{ SHIPMENT_EVENTS : "happens at"
    
    USERS ||--o{ SHIPMENTS : "creates"
    USERS ||--o{ SHIPMENT_EVENTS : "creates"
    USERS ||--o{ DOCUMENTS : "uploads"
```

## Description
- **Multi-tenant Architecture:** Mọi dữ liệu lõi (`customers`, `locations`, `shipments`) đều bắt buộc phải gắn với một `company_id`.
- **Role-Based Access:** Quyền hạn (Admin, Logistic, v.v.) được gắn qua bảng `company_memberships`.
- **Shipments Lifecycle:** Một Lô hàng (`shipments`) sẽ có nhiều sự kiện (`shipment_events`) và tài liệu đính kèm (`documents`).
