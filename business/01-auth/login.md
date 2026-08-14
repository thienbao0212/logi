# Purpose
Cung cấp luồng đăng nhập vào hệ thống và điều hướng user đến màn hình làm việc phù hợp dựa trên Role.

# Actors
- ADMIN
- LOGISTICS
- ACCOUNTANT

# Preconditions
- User phải có tài khoản hợp lệ trong hệ thống.
- User có ít nhất 1 role.

# Main Flow
1. User truy cập `/login`.
2. Hệ thống hiển thị form đăng nhập.
3. User nhập thông tin (email, password).
4. Hệ thống kiểm tra thông tin.
5. Đăng nhập thành công, hệ thống cấp JWT (theo kiến trúc auth).
6. Hệ thống kiểm tra role của user và redirect:
   - ADMIN → `/dashboard`
   - LOGISTICS → `/logistic`
   - ACCOUNTANT → `/accountant`

# Business Rules
- Nếu thông tin sai, hiển thị lỗi rõ ràng "Invalid credentials".
- Nếu chưa đăng nhập mà truy cập protected route, redirect về `/login`.

# Validation
- Email/Username bắt buộc.
- Password bắt buộc.

# Permissions
- Public route (`/login`).

# UI Behavior
- Giao diện đơn giản, tập trung vào form login.
- Nút login có trạng thái loading.
- Báo lỗi rõ ràng bằng toast hoặc inline message.

# Activity / History
- Ghi nhận Audit Log về hành động Login (thành công/thất bại) với IP và UserAgent.
