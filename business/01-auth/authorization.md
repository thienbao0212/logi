# Purpose
Kiểm soát quyền truy cập của người dùng vào các route, chức năng và trường dữ liệu (field-level).

# Actors
- System (enforce permissions)
- ADMIN (cấu hình permissions)

# Preconditions
- User đã đăng nhập thành công.

# Business Rules
- **403 Forbidden**: Trả về khi user không có quyền truy cập resource hoặc chức năng.
- Frontend phải ẩn các nút bấm/chức năng mà user không có quyền (VD: Nút Delete Shipment).
- Backend **bắt buộc** phải check lại quyền, không phó thác cho frontend.

# Permissions Structure
- Tối thiểu cần có các quyền: `shipment.view`, `shipment.create`, `shipment.edit`, `finance.view`, v.v.
- ADMIN có full access (`*`).

# Exceptions
- Truy cập vào shipment không thuộc company (Tenant ID) -> 404 (Không phải 403 để tránh oracle).
