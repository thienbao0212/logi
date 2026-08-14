# Frontend Guidelines

## Implementation Order (Strict)
KHÔNG ĐƯỢC TRIỂN KHAI PAGE ĐỘC LẬP TRƯỚC. Phải làm theo thứ tự:
1. Design Tokens & UI Primitives
2. Application Shell (Sidebar, Header)
3. Breadcrumb, Page Header, Global Search
4. Table, Form, Filter, Modal, Toast
5. Authentication & Routing
6. Shipment List -> Shipment Detail -> Shipment Edit
7. Activity/History, Dynamic Fields
8. Dashboard & Accountant

## Global Design Consistency
Bắt buộc dùng chung hệ thống Design System (Colors, Spacing, Typography, Button, v.v.) cho tất cả các tính năng. Tuyệt đối không tạo module riêng có style riêng biệt.
