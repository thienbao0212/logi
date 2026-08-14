# Purpose
Bảo vệ tính toàn vẹn hệ thống và hỗ trợ điều tra kỹ thuật/bảo mật. Dành cho System Admin / Security Audit.

# Business Rules
- Tách biệt với Activity của business user.
- Append-only (Tuyệt đối không sửa/xóa).
- Lưu trữ: `entity_type`, `entity_id`, `action`, `field_name`, `old_value`, `new_value`, `user_id`, `timestamp`, `ip_address`, `user_agent`, `session_id`.
