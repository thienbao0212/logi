# Purpose
Quản lý nguồn thu (Revenue) sinh ra từ Shipment. (Ví dụ: Freight, Service Fee).

# Business Rules
- Fields: Description, Category, Amount, Currency, Date, Status.
- Chỉ user có quyền `finance.view` / `finance.edit` mới được thao tác.

# Activity / History
- Revenue added, changed, removed đều phải ghi History.
