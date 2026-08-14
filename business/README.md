# Business Specification - Logistics Shipment Management System

## Business Overview
Đây là hệ thống quản lý lô hàng Logistics chuyên dụng. Hệ thống tập trung tối đa vào việc quản lý **SHIPMENT** (lô hàng), với triết lý thiết kế tối giản, dễ sử dụng (tương tự Jira) và mạnh mẽ về mặt CRUD, tìm kiếm, lọc, audit và quản lý thông tin.

## Business Scope
- **Core Scope**: Shipment Management, Cargo, Route, Container, Customs, Transport, Activity, History, Audit, Dynamic Fields.
- **Out of Scope**: ERP tổng thể, CRM, HRM, Fleet Management, Warehouse Management, Procurement, Sales, Full Accounting.

## Roles
Hệ thống có 3 role chính:
- **ADMIN**: Full access, quản lý tất cả Shipment, User, Role/Permission, Cấu hình Dynamic Fields, Master Data. Truy cập `/dashboard`.
- **LOGISTICS**: Role sử dụng chính. Tạo, xem, sửa, xử lý Shipment. Không được sửa các field ngoài permission. Truy cập `/logistic`.
- **ACCOUNTANT**: Xử lý dữ liệu tài chính (Revenue, Cost, Payment, Profit) của Shipment. Truy cập `/accountant`.

## Core Entity: SHIPMENT
Shipment là trung tâm của mọi nghiệp vụ. Các thông tin vệ tinh như Cargo, Route, Container, Customs, Transport, Attachments, Revenue, Cost đều gắn liền với một Shipment cụ thể.

## Business Architecture & Shipment Lifecycle
Shipment đi qua các trạng thái: `DRAFT` → `NEW` → `PROCESSING` → `CUSTOMS` → `IN_TRANSIT` → `ARRIVED` → `DELIVERED` → `COMPLETED` (Exception: `ON_HOLD`, `CANCELLED`). Mọi thay đổi đều được ghi nhận (Activity/History/Audit).

## File Structure & Links

### 1. Authentication
- [Login](./01-auth/login.md)
- [Logout](./01-auth/logout.md)
- [Authorization](./01-auth/authorization.md)

### 2. Shipment
- [Shipment List](./02-shipment/shipment-list.md)
- [Create Shipment](./02-shipment/shipment-create.md)
- [Shipment Detail](./02-shipment/shipment-detail.md)
- [Edit Shipment](./02-shipment/shipment-edit.md)
- [Shipment Status](./02-shipment/shipment-status.md)
- [Search & Filter](./02-shipment/shipment-search-filter.md)
- [Import/Export](./02-shipment/shipment-import-export.md)
- [Delete & Archive](./02-shipment/shipment-delete.md)
- [Bulk Actions](./02-shipment/shipment-bulk-actions.md)

### 3. Shipment Data
- [Cargo](./03-shipment-data/cargo.md)
- [Route](./03-shipment-data/route.md)
- [Container](./03-shipment-data/container.md)
- [Customs](./03-shipment-data/customs.md)
- [Transport](./03-shipment-data/transport.md)

### 4. Documents
- [Shipment Attachments](./04-documents/shipment-attachments.md)

### 5. Finance
- [Revenue](./05-finance/shipment-revenue.md)
- [Cost](./05-finance/shipment-cost.md)
- [Payment](./05-finance/shipment-payment.md)
- [Profit](./05-finance/shipment-profit.md)

### 6. Activity & Audit
- [Activity](./06-activity/activity.md)
- [History](./06-activity/history.md)
- [Comments](./06-activity/comments.md)
- [Audit Log](./06-activity/audit-log.md)

### 7. Dynamic Fields
- [Dynamic Fields Overview](./07-dynamic-fields/dynamic-fields.md)
- [Field Types](./07-dynamic-fields/field-types.md)
- [Field Permissions](./07-dynamic-fields/field-permissions.md)

### 8. Dashboard
- [Dashboard](./08-dashboard/dashboard.md)

### 9. Master Data
- [Master Data](./09-master-data/master-data.md)
