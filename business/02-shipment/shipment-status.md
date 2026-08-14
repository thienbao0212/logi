# Purpose
Quản lý trạng thái vòng đời của một Shipment.

# Business Rules
- Lifecycle chuẩn: `DRAFT` → `NEW` → `PROCESSING` → `CUSTOMS` → `IN_TRANSIT` → `ARRIVED` → `DELIVERED` → `COMPLETED`.
- Ngoại lệ: `ON_HOLD`, `CANCELLED`.
- Thay đổi trạng thái là một hành động quan trọng, có thể kích hoạt các cảnh báo hoặc tính toán.

# UI Behavior
- Ở Shipment Detail, Status hiển thị to, rõ, có màu sắc đặc trưng (Badge).
- Click vào Status để sổ xuống dropdown chuyển trạng thái.

# Activity / History
- Ghi nhận vào History: "[User] changed status: [OLD] → [NEW]".
