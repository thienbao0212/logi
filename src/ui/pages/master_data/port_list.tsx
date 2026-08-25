import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Anchor, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Building,
  Truck,
  Plane,
  Layers,
  Filter
} from 'lucide-react';

interface Port {
  id: string;
  companyId: string;
  code: string;
  name: string;
  country: string;
  countryCode: string | null;
  city: string | null;
  type: 'SEAPORT' | 'INLAND_PORT' | 'ICD' | 'BORDER_GATE' | 'AIRPORT';
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PortList() {
  const { t } = useTranslation();
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    country: string;
    countryCode: string;
    city: string;
    type: 'SEAPORT' | 'INLAND_PORT' | 'ICD' | 'BORDER_GATE' | 'AIRPORT';
    address: string;
    notes: string;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    country: 'Việt Nam',
    countryCode: 'VN',
    city: '',
    type: 'SEAPORT',
    address: '',
    notes: '',
    isActive: true,
  });

  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const companyId = memberships[0]?.companyId;

  const fetchPorts = async (searchQuery = '', typeFilter = 'ALL') => {
    if (!companyId) return;
    try {
      setLoading(true);
      let url = `/api/master-data/ports?companyId=${companyId}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (typeFilter && typeFilter !== 'ALL') {
        url += `&type=${encodeURIComponent(typeFilter)}`;
      }
      const res = await apiFetch<{ data: Port[] }>(url);
      setPorts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts(search, selectedType);
  }, [search, selectedType]);

  const handleOpenAddModal = () => {
    setEditingPort(null);
    setFormData({
      code: '',
      name: '',
      country: 'Việt Nam',
      countryCode: 'VN',
      city: '',
      type: 'SEAPORT',
      address: '',
      notes: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (port: Port) => {
    setEditingPort(port);
    setFormData({
      code: port.code || '',
      name: port.name || '',
      country: port.country || 'Việt Nam',
      countryCode: port.countryCode || '',
      city: port.city || '',
      type: port.type || 'SEAPORT',
      address: port.address || '',
      notes: port.notes || '',
      isActive: port.isActive !== undefined ? port.isActive : true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Mã cảng không được để trống.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Tên cảng không được để trống.');
      return;
    }
    if (!formData.country.trim()) {
      setFormError('Quốc gia không được để trống.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingPort) {
        // Update
        await apiFetch(`/api/master-data/ports/${editingPort.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await apiFetch('/api/master-data/ports', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            companyId,
          }),
        });
      }

      setIsModalOpen(false);
      fetchPorts(search, selectedType);
    } catch (err: any) {
      console.error('Save port error:', err);
      setFormError(err.message || 'Có lỗi xảy ra khi lưu thông tin cảng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await apiFetch(`/api/master-data/ports/${id}`, {
        method: 'DELETE',
      });
      setDeletingId(null);
      fetchPorts(search, selectedType);
    } catch (err) {
      console.error('Delete port error:', err);
      alert('Không thể xóa cảng. Có thể cảng đang được liên kết với một lô hàng.');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeBadge = (type: Port['type']) => {
    switch (type) {
      case 'SEAPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Anchor size={12} />
            {t('masterData.ports.types.SEAPORT', 'Cảng biển')}
          </span>
        );
      case 'ICD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Building size={12} />
            {t('masterData.ports.types.ICD', 'Cảng cạn (ICD)')}
          </span>
        );
      case 'BORDER_GATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Truck size={12} />
            {t('masterData.ports.types.BORDER_GATE', 'Cửa khẩu')}
          </span>
        );
      case 'INLAND_PORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Layers size={12} />
            {t('masterData.ports.types.INLAND_PORT', 'Cảng sông')}
          </span>
        );
      case 'AIRPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Plane size={12} />
            {t('masterData.ports.types.AIRPORT', 'Sân bay')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Anchor size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('masterData.ports.title', 'Quản lý cảng & cửa khẩu')}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {t('masterData.ports.subtitle', 'Quản lý danh mục cảng biển, cảng cạn ICD, cửa khẩu và sân bay')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          <Plus size={18} />
          <span>{t('masterData.ports.addPort', 'Thêm cảng mới')}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('masterData.ports.searchPlaceholder', 'Tìm kiếm theo mã cảng, tên cảng, thành phố, quốc gia...')}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter size={16} className="text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="ALL">{t('masterData.ports.filterAll', 'Tất cả loại cảng')}</option>
            <option value="SEAPORT">{t('masterData.ports.types.SEAPORT', 'Cảng biển')}</option>
            <option value="ICD">{t('masterData.ports.types.ICD', 'Cảng cạn (ICD)')}</option>
            <option value="BORDER_GATE">{t('masterData.ports.types.BORDER_GATE', 'Cửa khẩu đường bộ')}</option>
            <option value="INLAND_PORT">{t('masterData.ports.types.INLAND_PORT', 'Cảng sông / Nội địa')}</option>
            <option value="AIRPORT">{t('masterData.ports.types.AIRPORT', 'Sân bay')}</option>
          </select>

          <span className="text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-100 rounded-lg whitespace-nowrap">
            {ports.length} {t('nav.ports', 'Cảng')}
          </span>
        </div>
      </div>

      {/* Ports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">{t('common.loading', 'Đang tải danh sách...')}</p>
          </div>
        ) : ports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Anchor size={48} className="text-slate-300 stroke-1 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              {t('masterData.ports.noPorts', 'Chưa có cảng nào trong danh mục')}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
              Thêm các cảng biển, cảng ICD hoặc cửa khẩu như Cát Lái, Cái Mép, Thượng Hải, Mộc Bài để quản lý và tạo lộ trình vận chuyển.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span>{t('masterData.ports.addPort', 'Thêm cảng mới')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('masterData.ports.code', 'Mã cảng (UN/LOCODE)')}</th>
                  <th className="py-3.5 px-4">{t('masterData.ports.name', 'Tên cảng')}</th>
                  <th className="py-3.5 px-4">{t('masterData.ports.type', 'Phân loại')}</th>
                  <th className="py-3.5 px-4">{t('masterData.ports.country', 'Quốc gia / Thành phố')}</th>
                  <th className="py-3.5 px-4">{t('masterData.ports.address', 'Địa chỉ / Khu vực')}</th>
                  <th className="py-3.5 px-4">{t('masterData.ports.status', 'Trạng thái')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {ports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Globe size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium">{item.country}</span>
                        {item.city && (
                          <span className="text-slate-400 text-xs">({item.city})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {item.address ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={item.address}>{item.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          {t('masterData.ports.active', 'Đang hoạt động')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle size={12} />
                          {t('masterData.ports.inactive', 'Tạm ngưng')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('masterData.ports.editPort', 'Chỉnh sửa')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('masterData.ports.deletePort', 'Xóa')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Anchor size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPort
                    ? t('masterData.ports.editPort', 'Chỉnh sửa cảng')
                    : t('masterData.ports.addPort', 'Thêm cảng mới')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('masterData.ports.code', 'Mã cảng (UN/LOCODE)')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: VNSGN, CNSHA, KHPNH"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('masterData.ports.type', 'Phân loại')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="SEAPORT">{t('masterData.ports.types.SEAPORT', 'Cảng biển')}</option>
                    <option value="ICD">{t('masterData.ports.types.ICD', 'Cảng cạn (ICD)')}</option>
                    <option value="BORDER_GATE">{t('masterData.ports.types.BORDER_GATE', 'Cửa khẩu đường bộ')}</option>
                    <option value="INLAND_PORT">{t('masterData.ports.types.INLAND_PORT', 'Cảng sông / Nội địa')}</option>
                    <option value="AIRPORT">{t('masterData.ports.types.AIRPORT', 'Sân bay')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('masterData.ports.name', 'Tên cảng / Điểm trung chuyển')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Cảng Cát Lái (Cat Lai Port)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('masterData.ports.country', 'Quốc gia')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="VD: Việt Nam"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('masterData.ports.countryCode', 'Mã QG')}
                  </label>
                  <input
                    type="text"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                    placeholder="VN"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('masterData.ports.city', 'Thành phố / Tỉnh')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="VD: TP. Hồ Chí Minh"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('masterData.ports.address', 'Địa chỉ / Vị trí')}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Khu phố 2, Phường Cát Lái, TP. Thủ Đức"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('masterData.ports.notes', 'Ghi chú')}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về thủ tục hải quan, luồng trung chuyển..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="portIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="portIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  {t('masterData.ports.active', 'Đang hoạt động')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{t('common.save', 'Lưu')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              {t('masterData.ports.deletePort', 'Xóa cảng')}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {t('masterData.ports.deleteConfirm', 'Bạn có chắc chắn muốn xóa cảng này không? Hành động này không thể hoàn tác.')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-1"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-all flex-1"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>{t('masterData.ports.deletePort', 'Xác nhận xóa')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
