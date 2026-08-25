# Plan: Port Management (Quản lý Cảng & Cửa khẩu)

## Overview
Xây dựng tính năng Quản lý Cảng & Cửa khẩu (Ports, ICD, Border Gates, Airports) thuộc nhóm menu Master Data, cho phép cả tài khoản `admin` và `logistic` truy cập và quản lý dữ liệu.

## Milestones
1. **Schema**: Cập nhật `src/db/schema/master_data.ts` với `portTypeEnum` và `ports` table. Chạy `npm run db:migrate`.
2. **Backend**: Cập nhật `src/services/master_data.ts` (CRUD ports) và `src/api/app/master_data/index.ts` (Hono routes).
3. **Frontend UI**:
   - Tạo trang `src/ui/pages/master_data/port_list.tsx` (Tìm kiếm, lọc loại cảng, CRUD modal, table).
   - Thêm menu **Quản lý cảng** (`/master-data/ports`) vào `src/ui/components/app_shell.tsx`.
   - Đăng ký route trong `src/main.tsx`.
4. **i18n & Seeds**: Thêm bản dịch trong `vi.json` / `en.json`, nạp dữ liệu cảng trọng điểm vào `src/db/seeds/index.ts`.
5. **Verify**: Chạy `typecheck`, `db:migrate`, `db:seed`, `build` và kiểm tra giao diện.
