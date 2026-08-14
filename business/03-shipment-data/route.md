# Purpose
Quản lý lộ trình di chuyển của lô hàng.

# Business Rules
- Child entity của Shipment.
- Có thể lưu: Origin, Destination, Transit Point, Border Gate, ETD, ETA, Actual Departure, Actual Arrival.
- Mọi cập nhật thông tin thời gian/địa điểm đều phải sinh History.
