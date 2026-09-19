import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building2,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Button } from '../../components/common/index.js';

interface Customer {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerList() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const companyId = memberships[0]?.companyId;

  const fetchCustomers = async (searchQuery = '') => {
    if (!companyId) return;
    try {
      setLoading(true);
      const url = searchQuery 
        ? `/api/master-data/customers?companyId=${companyId}&search=${encodeURIComponent(searchQuery)}`
        : `/api/master-data/customers?companyId=${companyId}`;
      const res = await apiFetch<{ data: Customer[] }>(url);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Tên khách hàng không được để trống.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingCustomer) {
        // Update
        await apiFetch(`/api/master-data/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await apiFetch('/api/master-data/customers', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            companyId,
          }),
        });
      }

      setIsModalOpen(false);
      fetchCustomers(search);
    } catch (err: any) {
      console.error('Save customer error:', err);
      setFormError(err.message || 'Có lỗi xảy ra khi lưu khách hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await apiFetch(`/api/master-data/customers/${id}`, {
        method: 'DELETE',
      });
      setDeletingId(null);
      fetchCustomers(search);
    } catch (err) {
      console.error('Delete customer error:', err);
      alert('Không thể xóa khách hàng. Có thể khách hàng đang được liên kết với một lô hàng.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Mã KH', 'Tên khách hàng', 'Email', 'Số điện thoại', 'Địa chỉ', 'Ngày tạo'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email || '',
      c.phone || '',
      `"${(c.address || '').replace(/"/g, '""')}"`,
      new Date(c.createdAt).toLocaleDateString('vi-VN')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Danh_sach_Khach_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users size={24} className="text-blue-600 dark:text-blue-400" />
              <span>{t('masterData.customers.title', 'Quản lý khách hàng')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('masterData.customers.subtitle', 'Quản lý danh mục khách hàng và thông tin liên hệ')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={handleExportCsv} icon={<Download size={15} />}>
              <span>Xuất CSV</span>
            </Button>
            <Button variant="success" size="sm" onClick={handleOpenAddModal} icon={<Plus size={15} />}>
              <span>{t('masterData.customers.addCustomer', 'Thêm khách hàng')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-6">
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('masterData.customers.searchPlaceholder', 'Tìm kiếm theo tên, email, số điện thoại, địa chỉ...')}
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
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {customers.length} {t('nav.customers', 'Khách hàng')}
        </span>
      </div>

      {/* Customer Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium">{t('common.loading', 'Đang tải danh sách...')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <Building2 size={48} className="text-slate-300 dark:text-slate-600 stroke-1 mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              {t('masterData.customers.noCustomers', 'Chưa có khách hàng nào')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
              Hãy tạo khách hàng mới để quản lý và gán vào các đơn hàng vận chuyển.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('masterData.customers.addCustomer', 'Thêm khách hàng')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('masterData.customers.name', 'Tên khách hàng')}</th>
                  <th className="py-3.5 px-4">{t('masterData.customers.email', 'Email')}</th>
                  <th className="py-3.5 px-4">{t('masterData.customers.phone', 'Số điện thoại')}</th>
                  <th className="py-3.5 px-4">{t('masterData.customers.address', 'Địa chỉ')}</th>
                  <th className="py-3.5 px-4">{t('masterData.customers.createdAt', 'Ngày tạo')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.email ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Mail size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {c.address ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={c.address}>{c.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('masterData.customers.editCustomer', 'Chỉnh sửa')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('masterData.customers.deleteCustomer', 'Xóa')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingCustomer
                    ? t('masterData.customers.editCustomer', 'Chỉnh sửa khách hàng')
                    : t('masterData.customers.addCustomer', 'Thêm khách hàng')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/40 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.customers.name', 'Tên khách hàng')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: ABC Logistics Vietnam Co., Ltd"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.customers.email', 'Email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.customers.phone', 'Số điện thoại')}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+84 901 234 567"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.customers.address', 'Địa chỉ')}
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Tòa nhà Landmark, Quận 1, TP. Hồ Chí Minh"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t('common.cancel', 'Hủy')}
                </Button>
                <Button
                  variant={editingCustomer ? 'primary' : 'success'}
                  size="sm"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingCustomer ? t('common.save', 'Lưu thay đổi') : t('common.create', 'Thêm khách hàng')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/40">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {t('masterData.customers.deleteCustomer', 'Xóa khách hàng')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {t('masterData.customers.deleteConfirm', 'Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác.')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setDeletingId(null)}
              >
                {t('common.cancel', 'Hủy')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => handleDelete(deletingId)}
                disabled={deleting}
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>{t('masterData.customers.deleteCustomer', 'Xác nhận xóa')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
