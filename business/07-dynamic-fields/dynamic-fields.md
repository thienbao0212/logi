# Purpose
Cho phép Admin tự định nghĩa thêm các trường dữ liệu cho Shipment mà không cần sửa code hoặc thay đổi cấu trúc database. Khắc phục tính cố định của System/Business Fields.

# Business Rules
- Admin tạo Field: Field Name, Label, Type, Required, Options, Searchable, Filterable, Show in List, Show in Detail, Active.
- Hệ thống tự động render field này ở màn hình List (nếu cấu hình) và Detail.
- Lưu trữ qua JSONB hoặc EAV (phụ thuộc technical structure) đảm bảo query, search, filter tốt.
