# Plan: Master Data Menu Group (Customer & Shipping Line Management)

## Overview
Tạo nhóm menu Master Data (Quản lý danh mục) trên thanh điều hướng (Sidebar) với 2 menu con: Quản lý khách hàng (Customers) và Quản lý hãng tàu (Shipping Lines), cho phép cả tài khoản `admin` và `logistic` truy cập và quản lý dữ liệu.

## Scope & Access
- Roles: `admin` and `logistic` (accessible to both).
- Multi-tenancy: Scoped strictly by `company_id`.

## Milestones
1. **Schema**: Create `src/db/schema/master_data.ts` (`shipping_lines` table) and export in `src/db/schema/index.ts`.
2. **Backend**: Create `src/services/master_data.ts` and `src/api/app/master_data/index.ts`, register in `src/server.ts`.
3. **Frontend UI**:
   - Update `src/ui/components/app_shell.tsx` with collapsible Master Data menu group and sub-items.
   - Create `src/ui/pages/master_data/customer_list.tsx` and `src/ui/pages/master_data/shipping_line_list.tsx`.
   - Register routes in `src/main.tsx`.
4. **i18n & Seeds**: Add translations to `en.json` & `vi.json`, seed initial data for shipping lines and customers.
5. **Verify**: Run `typecheck`, `db:migrate`, verify navigation and CRUD operations in browser.
