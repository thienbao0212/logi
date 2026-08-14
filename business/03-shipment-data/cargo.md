# Purpose
Quản lý thông tin hàng hóa (Cargo) thuộc về một lô hàng.

# Business Rules
- Là child entity của Shipment. Không xây dựng module Cargo độc lập.
- Một Shipment có thể có 1 hoặc nhiều Cargo Items.
- Fields: Description, Type, HS Code, Quantity, Unit, Package, Gross Weight, Net Weight, Volume, Value, Currency.

# UI Behavior
- Table nội tuyến trong Shipment Detail.
- Inline edit hoặc popup modal khi thêm/sửa Cargo.

# Activity / History
- Thay đổi phải được ghi History (VD: Thêm Cargo, sửa Weight, xóa Cargo).
