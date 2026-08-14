# Purpose
Hiển thị danh sách các lô hàng (Shipment) một cách hiệu quả, tương tự giao diện Work Items của Jira. Đây là màn hình làm việc chính của nhân viên Logistics.

# Actors
- LOGISTICS (chính)
- ADMIN
- ACCOUNTANT

# Preconditions
- User có quyền `shipment.view`.

# Main Flow
1. User truy cập `/logistic`.
2. Hệ thống hiển thị danh sách Shipment theo cấu hình cột mặc định hoặc cấu hình cá nhân.
3. User có thể sử dụng các ô Search, Filter, Sort để thu hẹp kết quả.

# Business Rules
- Là trang mặc định sau khi Logistics user đăng nhập.
- Phải áp dụng phân trang (Pagination) để đảm bảo hiệu suất với lượng dữ liệu lớn.
- Hỗ trợ tuỳ chỉnh cột (Column management).

# Data
- Dữ liệu hiển thị bao gồm: Shipment No, Customer, Origin, Destination, Status, ETA, Container, Assignee, Created, Updated (hoặc theo dynamic fields có `show_in_list = true`).

# UI Behavior
- Table-first, tối ưu cho việc xử lý khối lượng lớn.
- Sticky header, scrollable body.
- Cho phép click vào dòng để mở `Shipment Detail`.
- Trạng thái Loading (skeleton) và Empty rõ ràng.

# Exceptions
- Không có dữ liệu phù hợp với filter -> Hiển thị Empty state hướng dẫn xóa filter.
