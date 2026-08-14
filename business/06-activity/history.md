# Purpose
Theo dõi và hiển thị sự thay đổi giá trị của các trường dữ liệu (Field changes) theo thời gian. ĐẢM BẢO NO SILENT CHANGES.

# Business Rules
- Bắt buộc ghi nhận: WHO, WHEN, WHAT field, FROM (old value), TO (new value).
- Nếu User lưu form nhưng dữ liệu thực tế không thay đổi -> KHÔNG tạo History.
- Không bao giờ overwrite (ghi đè) lịch sử.
