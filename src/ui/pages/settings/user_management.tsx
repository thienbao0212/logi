import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Key,
  Shield,
  ShieldCheck,
  XCircle,
  Download,
  ChevronLeft,
  X,
  Phone,
  Building,
  Check,
  Sparkles,
  UserCheck,
  Copy,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/common/index.js';
import {
  UserService,
  UserItem,
  UserRole,
  ROLE_LABELS,
  ROLE_PERMISSIONS_MATRIX,
} from './user_service.js';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>(() => UserService.getUsers());
  const [activeView, setActiveView] = useState<'users' | 'matrix'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Phòng Vận Hành',
    role: 'logistic' as UserRole,
    password: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      logistic: users.filter((u) => u.role === 'logistic').length,
      accountant: users.filter((u) => u.role === 'accountant').length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.department || '').toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const refreshList = () => {
    setUsers(UserService.getUsers());
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Phòng Vận Hành',
      role: 'logistic',
      password: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Họ và Tên thành viên.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Email không đúng định dạng.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      UserService.createUser(formData);
      refreshList();
      setIsAddModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Lỗi khi tạo người dùng.');
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      role: user.role,
      password: '',
    });
    setFormError('');
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Họ và Tên.');
      return;
    }

    try {
      UserService.updateUser(editingUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
      });
      refreshList();
      setEditingUser(null);
    } catch (e: any) {
      setFormError(e.message || 'Lỗi khi cập nhật.');
    }
  };

  const handleToggleStatus = (id: string) => {
    try {
      UserService.toggleStatus(id);
      refreshList();
    } catch (e: any) {
      alert(e.message || 'Không thể đổi trạng thái.');
    }
  };

  const handleOpenResetPassword = (user: UserItem) => {
    setResettingUser(user);
    // Generate a secure suggested 8-character password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let autoPass = '';
    for (let i = 0; i < 8; i++) {
      autoPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(autoPass);
    setCopiedPass(false);
    setFormError('');
  };

  const handleSaveResetPassword = () => {
    if (!resettingUser) return;
    if (!newPassword || newPassword.length < 6) {
      setFormError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      UserService.resetPassword(resettingUser.id, newPassword);
      refreshList();
      alert(`Đã đặt lại mật khẩu cho tài khoản ${resettingUser.email} thành công!`);
      setResettingUser(null);
    } catch (e: any) {
      setFormError(e.message || 'Lỗi khi đặt lại mật khẩu.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    try {
      UserService.deleteUser(deletingUser.id);
      refreshList();
      setDeletingUser(null);
    } catch (e: any) {
      alert(e.message || 'Không thể xóa người dùng.');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Mã NV', 'Họ và Tên', 'Email', 'Số điện thoại', 'Phòng ban', 'Vai trò', 'Trạng thái', 'Ngày tham gia'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.lastName} ${u.firstName}"`,
      u.email,
      u.phone || '',
      `"${u.department || ''}"`,
      `"${ROLE_LABELS[u.role]?.label || u.role}"`,
      u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa',
      new Date(u.createdAt).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Danh_sach_Nhan_su_LogiFlow_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-900 dark:text-slate-100">
      {/* Header Area */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Quay lại Cài đặt"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <ShieldCheck size={26} className="text-blue-600 dark:text-blue-400" />
                <span>Quản lý Thành viên & Phân quyền (RBAC)</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quản trị danh sách nhân sự, phân cấp vai trò hệ thống, ma trận cấp phép và bảo mật mật khẩu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveView('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'users'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Danh sách Thành viên</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>Ma trận Phân quyền</span>
              </button>
            </div>

            {activeView === 'users' && (
              <>
                <Button variant="secondary" size="sm" onClick={handleExportCsv} icon={<Download size={15} />}>
                  <span>Xuất CSV</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={15} />}>
                  <span>Thêm thành viên</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-6">
        {/* KPI Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tổng nhân sự</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.total}{' '}
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ({stats.active} hoạt động)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Quản trị viên (Admin)</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.admin}{' '}
                <span className="text-xs font-normal text-slate-400">Toàn quyền</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Vận hành (Logistics)</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.logistic}{' '}
                <span className="text-xs font-normal text-slate-400">5 Mốc & Lô hàng</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Kế toán (Accountant)</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.accountant}{' '}
                <span className="text-xs font-normal text-slate-400">AR/AP/Sổ quỹ</span>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 1: USER LIST */}
        {activeView === 'users' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo họ tên, email, số điện thoại, phòng ban..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="logistic">Vận hành (Logistics)</option>
                  <option value="accountant">Kế toán (Accountant)</option>
                  <option value="viewer">Khách hàng (Viewer)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm khóa</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Thành viên / Họ tên</th>
                      <th className="py-3.5 px-4">Liên hệ & Email</th>
                      <th className="py-3.5 px-4">Phòng ban</th>
                      <th className="py-3.5 px-4">Vai trò (Role)</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4">Đăng nhập gần nhất</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Users size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">Không tìm thấy thành viên nào</p>
                          <p className="text-xs mt-1">Hãy thử tìm với từ khóa khác hoặc thêm thành viên mới.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const roleMeta = ROLE_LABELS[user.role];
                        const initials = `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`.toUpperCase();

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Member info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full ${user.avatarColor || 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {user.lastName} {user.firstName}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">{user.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Contact & Email */}
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.email}</div>
                              {user.phone ? (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={11} /> {user.phone}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                <Building size={12} className="text-slate-400" />
                                <span>{user.department || 'Vận hành'}</span>
                              </div>
                            </td>

                            {/* Role badge */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${roleMeta.badgeCls}`}>
                                {user.role === 'admin' && <Shield size={12} />}
                                {user.role === 'logistic' && <UserCheck size={12} />}
                                {user.role === 'accountant' && <Sparkles size={12} />}
                                <span>{roleMeta.label}</span>
                              </span>
                            </td>

                            {/* Status toggle */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                                  user.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}
                                title="Bấm để khóa / kích hoạt tài khoản"
                              >
                                {user.status === 'ACTIVE' ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Hoạt động</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Tạm khóa</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Last Login */}
                            <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                              {user.lastLoginAt ? (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>{new Date(user.lastLoginAt).toLocaleString('vi-VN')}</span>
                                </div>
                              ) : (
                                <span>Chưa đăng nhập</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenResetPassword(user)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Đặt lại mật khẩu"
                                >
                                  <Key size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(user)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(user)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa thành viên"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ROLE PERMISSIONS MATRIX */}
        {activeView === 'matrix' && (
          <div className="space-y-6">
            {/* Roles Header cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['admin', 'logistic', 'accountant', 'viewer'] as UserRole[]).map((roleKey) => {
                const r = ROLE_LABELS[roleKey];
                return (
                  <div
                    key={roleKey}
                    className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${r.badgeCls}`}>
                        {r.label}
                      </span>
                      <ShieldCheck size={16} className={r.color} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Permissions Matrix Table */}
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <span>Chi tiết Ma trận Phân quyền theo Phân hệ (Role-Based Access Matrix)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Đối chiếu danh mục quyền hạn được thực thi nghiêm ngặt trên cả giao diện (Client) lẫn API kiểm soát (Server).
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {ROLE_PERMISSIONS_MATRIX.map((group) => (
                  <div key={group.moduleKey} className="p-0">
                    <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <Layers size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>{group.moduleName}</span>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                          <th className="py-2.5 px-6">Quyền hạn / Chức năng</th>
                          <th className="py-2.5 px-4 text-center w-32 text-blue-700 dark:text-blue-400">Admin</th>
                          <th className="py-2.5 px-4 text-center w-32 text-emerald-700 dark:text-emerald-400">Logistics</th>
                          <th className="py-2.5 px-4 text-center w-32 text-purple-700 dark:text-purple-400">Accountant</th>
                          <th className="py-2.5 px-4 text-center w-32 text-slate-600 dark:text-slate-400">Viewer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {group.permissions.map((perm, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-6 font-medium text-slate-800 dark:text-slate-200">
                              {perm.name}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {perm.admin ? (
                                <Check size={16} className="text-blue-600 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {perm.logistic ? (
                                <Check size={16} className="text-emerald-600 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {perm.accountant ? (
                                <Check size={16} className="text-purple-600 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {perm.viewer ? (
                                <Check size={16} className="text-slate-600 dark:text-slate-400 mx-auto" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD USER ─────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Thêm Thành viên mới</h3>
                  <p className="text-xs text-slate-400">Khởi tạo tài khoản đăng nhập & phân vai trò</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <XCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ & Tên đệm *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nguyễn Văn"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Huy"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="huy.nguyen@logiflow.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phòng ban</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Phòng Vận Hành (Ops)"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vai trò hệ thống (Role) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="logistic">🚢 Vận hành (Logistics) - Quản lý 5 mốc & Lô hàng</option>
                  <option value="accountant">💰 Kế toán (Accountant) - AR/AP & Sổ quỹ & P&L</option>
                  <option value="admin">👑 Quản trị viên (Admin) - Toàn quyền hệ thống</option>
                  <option value="viewer">👁️ Khách hàng (Viewer) - Chỉ tra cứu thông tin</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {ROLE_LABELS[formData.role].desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Tạo thành viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT USER ────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Chỉnh sửa Thành viên</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <XCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ & Tên đệm *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phòng ban</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vai trò hệ thống (Role) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="logistic">🚢 Vận hành (Logistics) - Quản lý 5 mốc & Lô hàng</option>
                  <option value="accountant">💰 Kế toán (Accountant) - AR/AP & Sổ quỹ & P&L</option>
                  <option value="admin">👑 Quản trị viên (Admin) - Toàn quyền hệ thống</option>
                  <option value="viewer">👁️ Khách hàng (Viewer) - Chỉ tra cứu thông tin</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {ROLE_LABELS[formData.role].desc}
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RESET PASSWORD ───────────────────────────────────────────── */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Đặt lại Mật khẩu</h3>
                  <p className="text-xs text-slate-400">{resettingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Nhập mật khẩu mới cho thành viên <strong className="text-slate-800 dark:text-slate-200">{resettingUser.lastName} {resettingUser.firstName}</strong> hoặc sử dụng mật khẩu được gợi ý bên dưới:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                      copiedPass
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {copiedPass ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedPass ? 'Đã chép' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 font-semibold">{formError}</p>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveResetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Xác nhận đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CONFIRM DELETE ───────────────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Xóa thành viên?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản <strong className="text-slate-800 dark:text-slate-200">{deletingUser.email}</strong> khỏi hệ thống? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
