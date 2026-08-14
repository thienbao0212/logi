# Role-based Routing & Guards

## Overview
Sau khi authentication thành công, hệ thống điều hướng dựa trên Role:

- ADMIN -> `/dashboard` hoặc `/`
- LOGISTIC -> `/logistic` (Mặc định vào Shipment List)
- ACCOUNTANT -> `/accountant`

## Route Guards
- Route UI bị chặn dựa theo quyền.
- Nếu cố tình truy cập link không có quyền -> Chuyển hướng tới trang 403 (Nằm trong Application Shell).
