# Purpose
Chỉnh sửa dữ liệu của một lô hàng hiện có.

# Actors
- ADMIN, LOGISTICS (cần quyền `shipment.edit`)

# Business Rules
- KHÔNG cho phép ghi đè ngầm (Silent Changes). Bất cứ thay đổi nào cũng phải ghi lại History (From -> To).
- Chỉ ghi lại History nếu giá trị THỰC SỰ thay đổi.
- Cập nhật field `updated_at` và `updated_by`.
- Xử lý **Concurrent Edit**: Nếu User B lưu thay đổi đè lên User A, cần cảnh báo (dùng `version` hoặc optimistic locking).

# Validation
- Kiểm tra tính hợp lệ của dữ liệu trước khi save (Frontend + Backend).

# Transaction
- Cập nhật Shipment và ghi History/Activity phải nằm trong cùng một Database Transaction.

# Activity / History
- History: "[User] changed [Field Name] from [Old Value] to [New Value] at [Time]".
- Audit Log: `UPDATE` với đầy đủ old_value, new_value.
