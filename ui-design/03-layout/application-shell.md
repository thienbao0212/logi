# Application Shell

## Overview
Toàn bộ authenticated application sử dụng Application Shell. Không có route nào (trừ login) tự xây layout riêng.

## Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ☰  Breadcrumb       Search...       🔔   User ▼             │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Dashboard     │  [Page Header]                              │
│               │                                             │
│ Logistic      │  [Main Content Container]                   │
│               │                                             │
│ Accountant    │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

## Requirements
- **Left Sidebar**: Chứa navigation, role-aware.
- **Header / Topbar**: Compact (56px-64px), chứa toggle, search, notification, user menu.
- **Main Content**: Chứa nội dung chính, có width nhất quán tuỳ biến theo page.
- **Responsive**: Hỗ trợ Desktop (Persistent), Tablet (Collapsed), Mobile (Drawer).
- **State Handling**: Hiển thị Toast, Modal chung tại lớp Shell.
