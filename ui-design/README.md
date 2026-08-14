# UI/UX Design Specification - Logistics Shipment Management System

## Core Product Structure
Hệ thống sử dụng mô hình **Application Shell** bao bọc toàn bộ các authenticated routes. Sau khi người dùng login thành công, hệ thống không render các module độc lập mà đặt tất cả vào trong bộ khung chung (Sidebar + Header + Content).

### UX Hierarchy:
```
AUTHENTICATION
       ↓
APPLICATION SHELL
       ↓
┌─────────────────────────────────────────────┐
│ HEADER (Global Actions & Context)           │
├──────────────┬──────────────────────────────┤
│ LEFT         │ PAGE                         │
│ SIDEBAR      │                              │
│ (Navigation) │ Breadcrumb                   │
│              │ Page Header                  │
│ Dashboard    │ Toolbar                      │
│              │                              │
│ Logistic     │ Main Content                 │
│  Shipments   │ (Business Workflow)          │
│              │                              │
│ Accountant   │                              │
└──────────────┴──────────────────────────────┘
```

## Authentication & Role-Based Flow
```
Login
 ↓
Authentication
 ↓
Role Detection
 ↓
Application Shell
 ├── Header
 ├── Left Sidebar
 └── Main Content
       ├── Dashboard (ADMIN)
       ├── Logistic (LOGISTICS, ADMIN)
       │     ├── Shipment List
       │     ├── Shipment Create
       │     ├── Shipment Detail
       │     └── Shipment Edit
       │
       └── Accountant (ACCOUNTANT, ADMIN)
```

## Specification Modules

### 1. Design Principles
- [Design Principles](./01-design-principles/design-principles.md)
- [Visual Language](./01-design-principles/visual-language.md)
- [Information Density](./01-design-principles/information-density.md)
- [Accessibility](./01-design-principles/accessibility.md)

### 2. Design System
- [Colors](./02-design-system/colors.md)
- [Typography](./02-design-system/typography.md)
- [Spacing](./02-design-system/spacing.md)
- [Radius](./02-design-system/radius.md)
- [Shadows](./02-design-system/shadows.md)
- [Icons](./02-design-system/icons.md)

### 3. Layout
- [Application Shell](./03-layout/application-shell.md)
- [Left Sidebar](./03-layout/left-sidebar.md)
- [Header](./03-layout/header.md)
- [Breadcrumbs](./03-layout/breadcrumbs.md)
- [Page Header](./03-layout/page-header.md)
- [Content Layout](./03-layout/content-layout.md)
- [Responsive Layout](./03-layout/responsive-layout.md)

### 4. Components
- [Buttons](./04-components/buttons.md)
- [Inputs](./04-components/inputs.md)
- [Select](./04-components/select.md)
- [Date Picker](./04-components/date-picker.md)
- [Modal](./04-components/modal.md)
- [Drawer](./04-components/drawer.md)
- [Dropdown](./04-components/dropdown.md)
- [Tooltip](./04-components/tooltip.md)
- [Toast](./04-components/toast.md)
- [Tabs](./04-components/tabs.md)
- [Badge](./04-components/badge.md)
- [Table](./04-components/table.md)
- [Pagination](./04-components/pagination.md)
- [Filter](./04-components/filter.md)
- [Search](./04-components/search.md)
- [Command Menu](./04-components/command-menu.md)
- [Timeline](./04-components/timeline.md)
- [Attachment](./04-components/attachment.md)

### 5. Authentication
- [Login](./05-auth/login.md)
- [Authentication States](./05-auth/authentication-states.md)
- [Role Routing](./05-auth/role-routing.md)
- [Session Expired](./05-auth/session-expired.md)

### 6. Pages
- [Dashboard](./06-pages/dashboard.md)
- [Shipment List](./06-pages/shipment-list.md)
- [Shipment Create](./06-pages/shipment-create.md)
- [Shipment Detail](./06-pages/shipment-detail.md)
- [Shipment Edit](./06-pages/shipment-edit.md)
- [Accountant](./06-pages/accountant.md)

### 7. Shipment UX
- [Shipment Table](./07-shipment-ux/shipment-table.md)
- [Shipment Filters](./07-shipment-ux/shipment-filters.md)
- [Shipment Status](./07-shipment-ux/shipment-status.md)
- [Bulk Actions](./07-shipment-ux/shipment-bulk-actions.md)
- [Shipment History](./07-shipment-ux/shipment-history.md)
- [Shipment Activity](./07-shipment-ux/shipment-activity.md)
- [Dynamic Fields](./07-shipment-ux/shipment-dynamic-fields.md)
- [Shipment Documents](./07-shipment-ux/shipment-documents.md)

### 8. Interactions
- [Inline Edit](./08-interactions/inline-edit.md)
- [Hover Focus](./08-interactions/hover-focus.md)
- [Keyboard](./08-interactions/keyboard.md)
- [Shortcuts](./08-interactions/shortcuts.md)
- [Confirmation](./08-interactions/confirmation.md)
- [Animations](./08-interactions/animations.md)

### 9. States
- [Loading](./09-states/loading.md)
- [Empty](./09-states/empty.md)
- [Error](./09-states/error.md)
- [Permission Denied](./09-states/permission-denied.md)
- [Not Found](./09-states/not-found.md)
- [Session Expired State](./09-states/session-expired.md)

### 10. Implementation
- [UI Library](./10-implementation/ui-library.md)
- [CSS Strategy](./10-implementation/css-strategy.md)
- [Component Architecture](./10-implementation/component-architecture.md)
- [Frontend Guidelines](./10-implementation/frontend-guidelines.md)
