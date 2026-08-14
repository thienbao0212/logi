# Purpose
Quản lý hồ sơ, chứng từ (Documents/Attachments) của Shipment.

# Business Rules
- File hỗ trợ: PDF, Image, Excel, Word, ZIP.
- Metadata: id, shipment_id, filename, original_filename, mime_type, size, uploaded_by, uploaded_at.
- Thao tác: Upload, Preview, Download, Delete (nếu có quyền).

# UI Behavior
- Hiển thị danh sách file trong tab Attachments.
- Có nút Upload hoặc kéo-thả (Drag & Drop).

# Activity / History
- Việc Upload/Delete file phải được log vào Activity: "Hoa Nguyen uploaded Invoice.pdf".
