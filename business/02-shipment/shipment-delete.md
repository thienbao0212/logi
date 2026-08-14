# Purpose
Lưu trữ hoặc xóa mềm (Soft Delete) lô hàng khi không còn cần thiết hoặc do thao tác sai.

# Business Rules
- **Không Hard Delete** lô hàng ngay lập tức.
- Sử dụng cơ chế Soft Delete (lưu `deleted_at`, `deleted_by`, `delete_reason`).
- Không xóa History, Activity, Audit của lô hàng bị xóa.
- Admin có thể thực hiện chức năng Restore.

# Permissions
- Quyền `shipment.delete`, `shipment.archive`, `shipment.restore`.

# UI Behavior
- Yêu cầu xác nhận (Confirmation Dialog) và lý do trước khi xóa.
