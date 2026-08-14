# Left Sidebar

## Overview
Navigation chính của ứng dụng. Bắt buộc hiển thị trên Desktop. ROLE-AWARE (chỉ hiển thị những gì user có quyền xem).

## States
- **Expanded**: ~240-280px (Icon + Label)
- **Collapsed**: ~64-72px (Icon only + Hover Tooltip)
- User có thể persist state (lưu vào localStorage).

## Role-Based Structure
- **ADMIN**: Dashboard, Operations (Shipments), Accounting, Administration (Dynamic Fields, Activity/Audit).
- **LOGISTIC**: Operations (Shipments). (Có thể có Dashboard overview).
- **ACCOUNTANT**: Accounting (Transactions, Receivables, Payables).

## UI Requirements
- Active state rõ ràng.
- Hover, Focus states.
- Mobile -> Drawer (không ép sidebar chiếm diện tích trên mobile).
