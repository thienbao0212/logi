# Purpose
Quản lý trạng thái thanh toán (Thanh toán cho nhà cung cấp - Payable, và Khách hàng thanh toán - Receivable).

# Business Rules
- Không xây dựng Accounting ERP. Chỉ cập nhật trạng thái: `UNPAID`, `PARTIAL`, `PAID`, `OVERDUE`.
- Liên kết với Revenue (để biết Receivable) và Cost (để biết Payable).
