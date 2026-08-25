# Plan: Settings Page with Card Grid Layout (/settings)

## Overview
Xây dựng trang Cài đặt Hệ thống tại `/settings` với bố cục Card Grid theo các nhóm chức năng (Users & Roles, Alert Config, Shipment Config, Company Profile, Finance & Security) và tích hợp chuyển hướng khi click nút Cài đặt ở Sidebar.

## Milestones
1. **Frontend Page**: Tạo `src/ui/pages/settings.tsx` với bố cục Card Grid hiện đại, filter tìm kiếm, modal chi tiết cấu hình.
2. **Sidebar Navigation**: Cập nhật `src/ui/components/app_shell.tsx` gắn `onClick` điều hướng đến `/settings` và active state.
3. **Routing**: Đăng ký `/settings` trong `src/main.tsx`.
4. **i18n**: Cập nhật bản dịch trong `src/locales/vi.json` và `src/locales/en.json`.
5. **Verify**: Chạy `typecheck` và `build` để đảm bảo hệ thống xanh và hoạt động trơn tru.
