# Purpose
Cho phép tìm kiếm và lọc Shipment nhanh chóng.

# Business Rules
- **Search**: Hỗ trợ tìm theo Shipment No, Ref No, Customer, Container No, Custom Declaration, Invoice No, và các Dynamic fields cấu hình `searchable = true`. (Partial match, case insensitive).
- **Filter**: Hỗ trợ lọc theo Status, Customer, Assignee, Created Date, ETA, ETD, Origin, Destination, và Dynamic fields có `filterable = true`.

# UI Behavior
- Nằm phía trên Shipment List.
- Ô Global Search cho phép type-to-search.
- Nút "More Filters" cho các filter nâng cao.
