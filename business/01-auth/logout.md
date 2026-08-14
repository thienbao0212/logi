# Purpose
Hủy phiên làm việc hiện tại của user để đảm bảo bảo mật.

# Actors
- Mọi user đã đăng nhập.

# Preconditions
- User đang trong phiên đăng nhập hợp lệ.

# Main Flow
1. User click nút "Logout" (thường ở góc phải trên).
2. Hệ thống xóa session/token hiện tại ở client và vô hiệu hóa ở server.
3. Redirect user về `/login`.

# UI Behavior
- Xử lý mượt mà, không yêu cầu xác nhận trừ khi cần thiết.

# Activity / History
- Ghi nhận Audit Log: Logout.
