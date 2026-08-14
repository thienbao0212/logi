# Purpose
Import Shipment từ file (Excel/CSV) và Export dữ liệu Shipment ra file.

# Import Business Rules
- Upload -> Detect columns -> Map columns -> Preview -> Validate -> Import -> Result.
- Import KHÔNG được mù quáng. Báo lỗi cụ thể (dòng X lỗi Y).
- Cần quyền `shipment.import`.

# Export Business Rules
- Export theo dòng đang chọn (Bulk selection) hoặc theo kết quả Filter hiện tại.
- Chỉ export các cột (kể cả System và Dynamic) mà user có quyền xem.
- Cần quyền `shipment.export`.
