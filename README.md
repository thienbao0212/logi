# LogiFlow — Logistics & Shipment Management System

LogiFlow is a modern B2B Logistics & Shipment Management Platform built with React, Vite, Hono API, Drizzle ORM, PostgreSQL, and Redis.

---

## 📋 Yêu cầu hệ thống (Prerequisites)

- **Node.js**: Phiên bản 20 trở lên (khuyến nghị 22 hoặc 24)
- **npm**: 10+
- **Docker & Docker Desktop**: Để chạy PostgreSQL và Redis
- **Git**

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Quick Start)

### Bước 1: Cài đặt Dependencies

Mở terminal trong thư mục dự án và chạy:

```bash
npm install
```

> **Lưu ý trên Windows (PowerShell):** Nếu gặp lỗi `ps1 cannot be loaded because running scripts is disabled`, bạn có thể dùng `npm.cmd` thay vì `npm` hoặc mở PowerShell và chạy:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

### Bước 2: Cấu hình biến môi trường (`.env`)

Sao chép file `.env.example` thành `.env`:

```bash
# Windows PowerShell
copy .env.example .env

# Hoặc Bash / CMD
cp .env.example .env
```

Kiểm tra nội dung file `.env` (mặc định cho môi trường dev):

```env
APP_ENV=development
PORT=3000
APP_HOST=app.logiflow.local:3000
PUBLIC_HOST=track.logiflow.local:3000

DATABASE_URL=postgres://app:app@127.0.0.1:5437/logiflow_development
REDIS_URL=redis://127.0.0.1:6379/0

JWT_PRIVATE_KEY=logiflow_secret_development_key_123456
JWT_PUBLIC_KEY=logiflow_secret_development_key_123456

EMAIL_PROVIDER=console
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./.data/storage

RATE_LIMIT=false
```

---

### Bước 3: Khởi động Database & Redis qua Docker

Khởi động PostgreSQL (port `5437`) và Redis (port `6379`):

```bash
docker compose up -d
```

Để kiểm tra các container đang chạy:
```bash
docker compose ps
```

---

### Bước 4: Đồng bộ Database Schema (Migration)

Đẩy schema Drizzle vào database:

```bash
npm run db:migrate
```

---

### Bước 5: Nạp dữ liệu mẫu (Seed Data)

Nạp các tài khoản người dùng và dữ liệu khởi tạo:

```bash
npm run db:seed
```

---

### Bước 6: Khởi chạy ứng dụng (Development)

Chạy đồng thời cả **Hono Backend API** và **Vite Frontend SPA**:

```bash
npm run dev
```

Sau khi khởi chạy thành công:
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Health Check Endpoint**: [http://localhost:3000/api/system/health](http://localhost:3000/api/system/health)

---

## 🔑 Tài khoản mặc định (Default Seed Accounts)

| Email | Mật khẩu | Quyền (Role) | Chức năng chính |
|---|---|---|---|
| `admin@logiflow.com` | `password123` | **ADMIN** | Quản lý toàn bộ hệ thống, xem dashboard, thống kê doanh thu, quản lý người dùng |
| `logistic@logiflow.com` | `password123` | **LOGISTICS** | Tạo và cập nhật lô hàng (Shipments), quản lý container, lộ trình, chứng từ |

---

## 🛠️ Danh sách lệnh có sẵn (Available Scripts)

| Lệnh (Command) | Chức năng (Purpose) |
|---|---|
| `npm run dev` | Khởi chạy fullstack Dev server (Vite + Hono Backend) |
| `npm run build` | Build ứng dụng cho môi trường production |
| `npm run db:migrate` | Đẩy schema mới nhất vào Database qua Drizzle Kit |
| `npm run db:seed` | Nạp dữ liệu mẫu ban đầu (Admin, Logistic user, Sample data) |
| `npm run typecheck` | Kiểm tra lỗi kiểu TypeScript (`tsc --noEmit`) |
| `npm run lint` | Kiểm tra định dạng và quy tắc code bằng ESLint |
| `npm run test` | Chạy unit/integration tests với Vitest |

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts, i18next
- **Backend API**: Hono 4 (chạy trên Node.js server)
- **Database & ORM**: PostgreSQL 17 + Drizzle ORM
- **Cache / Message Queue**: Redis + BullMQ
- **Authentication**: JWT Auth (Token-based) + RBAC (`admin`, `logistic`, `accountant`)
- **CLI**: `tsx src/cli.ts`
