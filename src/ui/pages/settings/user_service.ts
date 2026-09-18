import { apiFetch } from '@/lib/fetch.js';

export type UserRole = 'admin' | 'logistic' | 'accountant' | 'viewer';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarColor?: string;
}

export const ROLE_LABELS: Record<UserRole, { label: string; desc: string; badgeCls: string; color: string }> = {
  admin: {
    label: 'Quản trị viên (Admin)',
    desc: 'Toàn quyền cấu hình, phê duyệt chi, quản trị tài khoản & ma trận phân quyền',
    badgeCls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    color: 'text-blue-600 dark:text-blue-400',
  },
  logistic: {
    label: 'Vận hành (Logistics)',
    desc: 'Quản lý toàn trình 5 mốc vận chuyển, tạo lô hàng và tra cứu Master Data cảng/hãng tàu',
    badgeCls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  accountant: {
    label: 'Kế toán (Accountant)',
    desc: 'Quản trị công nợ AR/AP, hóa đơn VAT, sổ quỹ tiền mặt/ngân hàng, chi phí và P&L lô hàng',
    badgeCls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    color: 'text-purple-600 dark:text-purple-400',
  },
  viewer: {
    label: 'Khách hàng / Tra cứu (Viewer)',
    desc: 'Chỉ có quyền tra cứu tiến độ vận chuyển và tải chứng từ, không thể sửa hay xóa',
    badgeCls: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    color: 'text-slate-600 dark:text-slate-400',
  },
};

const STORAGE_KEY = 'logiflow_users_db_v1';

const DEFAULT_USERS: UserItem[] = [
  {
    id: 'u-admin-01',
    email: 'admin@logiflow.com',
    firstName: 'Quản Trị',
    lastName: 'Nguyễn Văn',
    phone: '0908 112 233',
    role: 'admin',
    status: 'ACTIVE',
    department: 'Ban Giám Đốc',
    createdAt: '2026-01-15T08:30:00Z',
    lastLoginAt: '2026-09-07T21:15:00Z',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'u-ops-02',
    email: 'logistic@logiflow.com',
    firstName: 'Vận Hành',
    lastName: 'Trần Thị',
    phone: '0912 334 455',
    role: 'logistic',
    status: 'ACTIVE',
    department: 'Phòng Vận Hành (Ops)',
    createdAt: '2026-02-10T09:00:00Z',
    lastLoginAt: '2026-09-07T18:40:00Z',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'u-acc-03',
    email: 'accountant@logiflow.com',
    firstName: 'Kế Toán',
    lastName: 'Lê Minh',
    phone: '0938 556 677',
    role: 'accountant',
    status: 'ACTIVE',
    department: 'Phòng Tài Chính Kế Toán',
    createdAt: '2026-03-01T10:20:00Z',
    lastLoginAt: '2026-09-07T17:05:00Z',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'u-view-04',
    email: 'viewer@logiflow.com',
    firstName: 'Khách Hàng',
    lastName: 'Phạm Đức',
    phone: '0977 889 900',
    role: 'viewer',
    status: 'ACTIVE',
    department: 'Đối Tác / Tra Cứu',
    createdAt: '2026-05-18T14:15:00Z',
    lastLoginAt: '2026-09-06T11:20:00Z',
    avatarColor: 'bg-amber-600',
  },
];

export const UserService = {
  getUsers(): UserItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  },

  async fetchUsersRemote(companyId?: string, search?: string): Promise<UserItem[]> {
    try {
      const token = localStorage.getItem('token');
      if (token && companyId) {
        const url = `/api/users?companyId=${companyId}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        const res = await apiFetch<{ data: any[] }>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res?.data && res.data.length > 0) {
          const mapped: UserItem[] = res.data.map((item) => ({
            id: item.userId || item.user.id,
            email: item.user.email,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            role: item.role as UserRole,
            status: 'ACTIVE',
            createdAt: item.joinedAt || item.user.createdAt,
            avatarColor: 'bg-blue-600',
          }));
          return mapped;
        }
      }
    } catch (e) {
      console.warn('API fetch users failed, falling back to local database:', e);
    }
    return this.getUsers();
  },

  saveUsers(users: UserItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: UserRole;
    department?: string;
    password?: string;
  }): UserItem {
    const users = this.getUsers();
    const cleanEmail = input.email.toLowerCase().trim();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`Email "${input.email}" đã tồn tại trong hệ thống.`);
    }

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: UserItem = {
      id: `u-${Date.now()}`,
      email: cleanEmail,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || '',
      role: input.role,
      status: 'ACTIVE',
      department: input.department?.trim() || 'Vận hành',
      createdAt: new Date().toISOString(),
      avatarColor,
    };

    users.unshift(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(
    id: string,
    updates: Partial<Omit<UserItem, 'id' | 'createdAt'>>
  ): UserItem {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy người dùng.');
    }

    users[index] = {
      ...users[index],
      ...updates,
    };

    this.saveUsers(users);
    return users[index];
  },

  toggleStatus(id: string): UserItem {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy người dùng.');

    if (users[index].role === 'admin' && users[index].status === 'ACTIVE') {
      const activeAdminCount = users.filter((u) => u.role === 'admin' && u.status === 'ACTIVE').length;
      if (activeAdminCount <= 1) {
        throw new Error('Không thể khóa Quản trị viên duy nhất đang hoạt động.');
      }
    }

    const newStatus: UserStatus = users[index].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    users[index].status = newStatus;
    this.saveUsers(users);
    return users[index];
  },

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target?.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Không thể xóa Quản trị viên duy nhất trong hệ thống.');
      }
    }
    const filtered = users.filter((u) => u.id !== id);
    this.saveUsers(filtered);
    return true;
  },

  resetPassword(id: string, newPass: string): boolean {
    if (!newPass || newPass.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    // Record audit timestamp
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index].lastLoginAt = new Date().toISOString();
      this.saveUsers(users);
    }
    return true;
  },
};

// ─── RBAC Permissions Matrix Configuration ──────────────────────────────────
export const ROLE_PERMISSIONS_MATRIX = [
  {
    moduleKey: 'shipments',
    moduleName: 'Quản lý Lô hàng & 5 Mốc',
    permissions: [
      { name: 'Xem danh sách & Chi tiết lô hàng', admin: true, logistic: true, accountant: true, viewer: true },
      { name: 'Tạo lô hàng mới', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Cập nhật 5 mốc vận chuyển', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Xóa / Hủy lô hàng', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Xuất file báo cáo lô hàng (CSV/Excel)', admin: true, logistic: true, accountant: true, viewer: true },
    ],
  },
  {
    moduleKey: 'financial',
    moduleName: 'Tài chính Lô hàng & Đối chiếu Kế toán',
    permissions: [
      { name: 'Xem chi phí & Doanh thu lô hàng', admin: true, logistic: true, accountant: true, viewer: false },
      { name: 'Nhập chi phí trực tiếp & Tải lên UNC', admin: true, logistic: true, accountant: true, viewer: false },
      { name: 'Phê duyệt chi phí lô hàng', admin: true, logistic: false, accountant: true, viewer: false },
      { name: 'Xem phân tích tỷ suất P&L', admin: true, logistic: false, accountant: true, viewer: false },
    ],
  },
  {
    moduleKey: 'accounting',
    moduleName: 'Phân hệ Kế toán Doanh nghiệp (AR/AP/Sổ quỹ)',
    permissions: [
      { name: 'Quản lý Công nợ Phải thu (AR)', admin: true, logistic: false, accountant: true, viewer: false },
      { name: 'Quản lý Công nợ Phải trả (AP)', admin: true, logistic: false, accountant: true, viewer: false },
      { name: 'Quản lý Sổ quỹ Tiền mặt & Ngân hàng', admin: true, logistic: false, accountant: true, viewer: false },
      { name: 'Phát hành & Hủy Hóa đơn VAT', admin: true, logistic: false, accountant: true, viewer: false },
      { name: 'Quản lý Chi phí Hoạt động Doanh nghiệp', admin: true, logistic: false, accountant: true, viewer: false },
    ],
  },
  {
    moduleKey: 'master_data',
    moduleName: 'Dữ liệu gốc (Master Data)',
    permissions: [
      { name: 'Xem danh mục (Khách hàng, NCC, Hãng tàu, Cảng, Phí)', admin: true, logistic: true, accountant: true, viewer: true },
      { name: 'Thêm & Chỉnh sửa Dữ liệu gốc', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Xóa danh mục Master Data', admin: true, logistic: false, accountant: false, viewer: false },
      { name: 'Xuất CSV dữ liệu gốc', admin: true, logistic: true, accountant: true, viewer: true },
    ],
  },
  {
    moduleKey: 'system_settings',
    moduleName: 'Cài đặt & Quản trị Hệ thống',
    permissions: [
      { name: 'Xem cấu hình hệ thống', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Cấu hình hạn DEM/DET & Tham số vận hành', admin: true, logistic: true, accountant: false, viewer: false },
      { name: 'Cấu hình Thông tin Doanh nghiệp & Tỷ giá', admin: true, logistic: false, accountant: false, viewer: false },
      { name: 'Quản lý Tài khoản & Phân quyền (RBAC)', admin: true, logistic: false, accountant: false, viewer: false },
    ],
  },
];

