import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Ship, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  Globe, 
  ExternalLink, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Button } from '../../components/common/index.js';

interface ShippingLine {
  id: string;
  companyId: string;
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  trackingUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ShippingLineList() {
  const { t } = useTranslation();
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShippingLine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    trackingUrl: '',
    notes: '',
    isActive: true,
  });

  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const companyId = memberships[0]?.companyId;

  const fetchShippingLines = async (searchQuery = '') => {
    if (!companyId) return;
    try {
      setLoading(true);
      const url = searchQuery 
        ? `/api/master-data/shipping-lines?companyId=${companyId}&search=${encodeURIComponent(searchQuery)}`
        : `/api/master-data/shipping-lines?companyId=${companyId}`;
      const res = await apiFetch<{ data: ShippingLine[] }>(url);
      setShippingLines(res.data || []);
    } catch (err) {
      console.error('Failed to fetch shipping lines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingLines(search);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      trackingUrl: '',
      notes: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ShippingLine) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      name: item.name || '',
      contactPerson: item.contactPerson || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      trackingUrl: item.trackingUrl || '',
      notes: item.notes || '',
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Mã hãng tàu không được để trống.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Tên hãng tàu không được để trống.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingItem) {
        // Update
        await apiFetch(`/api/master-data/shipping-lines/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await apiFetch('/api/master-data/shipping-lines', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            companyId,
          }),
        });
      }

      setIsModalOpen(false);
      fetchShippingLines(search);
    } catch (err: any) {
      console.error('Save shipping line error:', err);
      setFormError(err.message || 'Có lỗi xảy ra khi lưu thông tin hãng tàu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await apiFetch(`/api/master-data/shipping-lines/${id}`, {
        method: 'DELETE',
      });
      setDeletingId(null);
      fetchShippingLines(search);
    } catch (err) {
      console.error('Delete shipping line error:', err);
      alert('Không thể xóa hãng tàu.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Mã hãng tàu', 'Tên hãng tàu', 'Người liên hệ', 'Số điện thoại', 'Email', 'Website', 'Link tra cứu', 'Trạng thái'];
    const rows = shippingLines.map(s => [
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
      s.phone || '',
      s.email || '',
      s.website || '',
      `"${(s.trackingUrl || '').replace(/"/g, '""')}"`,
      s.isActive ? 'Đang hoạt động' : 'Tạm ngưng'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Danh_sach_Hang_tau_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Ship size={24} className="text-blue-600 dark:text-blue-400" />
              <span>{t('masterData.shippingLines.title', 'Quản lý hãng tàu')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('masterData.shippingLines.subtitle', 'Quản lý danh sách các hãng tàu quốc tế & nội địa')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={handleExportCsv} icon={<Download size={15} />}>
              <span>Xuất CSV</span>
            </Button>
            <Button variant="success" size="sm" onClick={handleOpenAddModal} icon={<Plus size={15} />}>
              <span>{t('masterData.shippingLines.addShippingLine', 'Thêm hãng tàu')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-6">

      {/* Filter / Search Bar */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('masterData.shippingLines.searchPlaceholder', 'Tìm kiếm theo mã hãng tàu, tên, người liên hệ...')}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {shippingLines.length} {t('nav.shippingLines', 'Hãng tàu')}
        </span>
      </div>

      {/* Shipping Lines Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium">{t('common.loading', 'Đang tải danh sách...')}</p>
          </div>
        ) : shippingLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Ship size={48} className="text-slate-300 dark:text-slate-600 stroke-1 mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              {t('masterData.shippingLines.noShippingLines', 'Chưa có hãng tàu nào')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
              Thêm các hãng tàu như Maersk, COSCO, Evergreen, ONE để quản lý và theo dõi container dễ dàng.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('masterData.shippingLines.addShippingLine', 'Thêm hãng tàu')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.code', 'Mã hãng tàu')}</th>
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.name', 'Tên hãng tàu')}</th>
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.contactPerson', 'Người liên hệ')}</th>
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.phone', 'Hotline / SĐT')}</th>
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.website', 'Website / Tra cứu')}</th>
                  <th className="py-3.5 px-4">{t('masterData.shippingLines.status', 'Trạng thái')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                {shippingLines.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.contactPerson ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span>{item.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{item.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {item.website && (
                          <a
                            href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            <Globe size={13} />
                            <span>Website</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {item.trackingUrl && (
                          <a
                            href={item.trackingUrl.startsWith('http') ? item.trackingUrl : `https://${item.trackingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline font-medium"
                          >
                            <span>Tracking</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {!item.website && !item.trackingUrl && (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 size={12} />
                          {t('masterData.shippingLines.active', 'Đang hoạt động')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <XCircle size={12} />
                          {t('masterData.shippingLines.inactive', 'Tạm ngưng')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title={t('masterData.shippingLines.editShippingLine', 'Chỉnh sửa')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title={t('masterData.shippingLines.deleteShippingLine', 'Xóa')}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Ship size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingItem
                    ? t('masterData.shippingLines.editShippingLine', 'Chỉnh sửa hãng tàu')
                    : t('masterData.shippingLines.addShippingLine', 'Thêm hãng tàu')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/40 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.code', 'Mã hãng tàu')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: MSK, COSCO, EMC"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm uppercase font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.name', 'Tên hãng tàu')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Maersk Line"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.contactPerson', 'Người liên hệ')}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="VD: Mr. Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.phone', 'Hotline / SĐT')}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+84 28 3823 8888"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.shippingLines.email', 'Email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vietnam.sales@maersk.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.website', 'Website')}
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.maersk.com"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('masterData.shippingLines.trackingUrl', 'URL tra cứu tracking')}
                  </label>
                  <input
                    type="text"
                    value={formData.trackingUrl}
                    onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
                    placeholder="https://www.maersk.com/tracking"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('masterData.shippingLines.notes', 'Ghi chú')}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về lịch tàu, tuyến vận chuyển chính..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {t('masterData.shippingLines.active', 'Đang hoạt động')}
                </label>
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
                  variant={editingItem ? 'primary' : 'success'}
                  size="sm"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingItem ? t('common.save', 'Lưu thay đổi') : t('common.create', 'Thêm hãng tàu')}</span>
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
              {t('masterData.shippingLines.deleteShippingLine', 'Xóa hãng tàu')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {t('masterData.shippingLines.deleteConfirm', 'Bạn có chắc chắn muốn xóa hãng tàu này không? Hành động này không thể hoàn tác.')}
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
                <span>{t('masterData.shippingLines.deleteShippingLine', 'Xác nhận xóa')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
