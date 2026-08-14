# Purpose
Hiển thị toàn bộ thông tin của một lô hàng tại một nơi duy nhất. Giống như trang Work Item Detail của Jira.

# Actors
- ADMIN, LOGISTICS, ACCOUNTANT (theo quyền)

# Main Flow
1. User mở Shipment từ list.
2. Hiển thị Header (Shipment No, Status, Customer, Assignee).
3. Hiển thị khu vực Overview (thông tin chính, Dynamic Fields).
4. Hiển thị các block child data: Cargo, Route, Container, Customs, Transport, Financial.
5. Cạnh bên hoặc dưới cùng là khu vực Activity (All / Comments / History / Attachments).

# Business Rules
- User chỉ thấy các sections mà họ có quyền (VD: Logistics có thể không thấy Financial nếu không có quyền).
- Hỗ trợ cập nhật nhanh các thông tin nếu có quyền `shipment.edit`.

# UI Behavior
- Chia 2 hoặc 3 cột. Cột chính chứa thông tin nghiệp vụ, cột phụ chứa Activity/Comments.
- Dễ dàng thao tác chuyển trạng thái (Status) ở Header.
