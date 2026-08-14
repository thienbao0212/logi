# Purpose
Tạo mới một lô hàng (Shipment) trong hệ thống.

# Actors
- ADMIN, LOGISTICS (cần quyền `shipment.create`)

# Main Flow
1. User click "+ Create Shipment" tại Shipment List.
2. Form Create Shipment hiện ra.
3. User điền thông tin (General, Route ban đầu).
4. Validate dữ liệu.
5. Lưu và generate Shipment Number tự động.
6. Hệ thống tự động redirect tới màn hình Shipment Detail của lô hàng vừa tạo.

# Business Rules
- Sinh số lô hàng (Shipment Number) tự động, đảm bảo Unique (ví dụ: `SHP-2026-000001`). Xử lý race condition.
- Trạng thái mặc định thường là `DRAFT` hoặc `NEW`.

# UI Behavior
- Form rõ ràng, có phân nhóm (Overview, Route).
- Hỗ trợ auto-complete cho các master data (Customer, Origin, Destination).

# Activity / History
- Tạo `Activity` dạng: "[User] created shipment [Shipment Number]".
- Ghi Audit Log hành động CREATE.
