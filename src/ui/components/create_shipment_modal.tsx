import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Loader2, 
  MapPin, 
  Package, 
  Truck, 
  Anchor, 
  Calendar,
  RotateCw,
  Users,
  Building
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SearchableSelect, SelectOption } from './common/searchable_select.js';
import { FinancialService } from './shipment/tabs/financial/mockService.js';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Port {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string | null;
  type: string;
}

export default function CreateShipmentModal({ onClose, onSuccess }: { onClose: () => void, onSuccess?: (shipment?: any) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(true);
  const [error, setError] = useState('');

  // Master data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);

  // Company info
  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const companyId = memberships[0]?.companyId;

  // Retrieve saved system settings
  const getSavedSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      return {
        prefix: saved.trackingForm?.prefix || 'TRK',
        separator: saved.trackingForm?.separator || '-',
        includeDate: saved.trackingForm?.includeDate !== false,
        defaultMode: saved.routeConfig?.defaultMode || 'SEA',
        defaultOrigin: saved.routeConfig?.defaultOrigin || 'CNSZX',
        defaultTransit: saved.routeConfig?.defaultTransit || 'VNSGN',
        defaultDest: saved.routeConfig?.defaultDest || 'KHPNH',
        defaultBorder: saved.routeConfig?.defaultBorder || 'VNMBA',
      };
    } catch {
      return {
        prefix: 'TRK',
        separator: '-',
        includeDate: true,
        defaultMode: 'SEA',
        defaultOrigin: 'CNSZX',
        defaultTransit: 'VNSGN',
        defaultDest: 'KHPNH',
        defaultBorder: 'VNMBA',
      };
    }
  };

  const generateTrackingNumber = () => {
    const settings = getSavedSettings();
    const datePart = settings.includeDate
      ? new Date().toISOString().slice(0, 10).replace(/-/g, '') + settings.separator
      : '';
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    return `${settings.prefix}${settings.separator}${datePart}${randomPart}`;
  };

  // Form state initialized from settings
  const [form, setForm] = useState(() => {
    const s = getSavedSettings();
    return {
      trackingNumber: '',
      customerId: '',
      originId: s.defaultOrigin,
      destinationId: s.defaultDest,
      transitPort: s.defaultTransit,
      borderGate: s.defaultBorder,
      mode: s.defaultMode,
      containerType: '40HC',
      weightTotal: '',
      volumeTotal: '',
      estimatedDepartureDate: '',
      estimatedArrivalDate: '',
    };
  });

  // Fetch Master Data (Customers & Ports)
  useEffect(() => {
    if (!companyId) return;
    setLoadingMasterData(true);

    Promise.all([
      apiFetch<{ data: Customer[] }>(`/api/master-data/customers?companyId=${companyId}`),
      apiFetch<{ data: Port[] }>(`/api/master-data/ports?companyId=${companyId}`)
    ])
      .then(([customersRes, portsRes]) => {
        const custList = customersRes.data || [];
        const portList = portsRes.data || [];
        setCustomers(custList);
        setPorts(portList);

        const settings = getSavedSettings();

        // Match initial origin port (POL)
        const matchedOrigin = portList.find(p => p.code === settings.defaultOrigin || p.id === settings.defaultOrigin);
        const originVal = matchedOrigin ? matchedOrigin.code : (portList[0]?.code || '');

        // Match initial destination port (POD)
        const matchedDest = portList.find(p => p.code === settings.defaultDest || p.id === settings.defaultDest);
        const destVal = matchedDest ? matchedDest.code : (portList[portList.length - 1]?.code || '');

        // Match initial transit port
        const matchedTransit = portList.find(p => p.code === settings.defaultTransit || p.id === settings.defaultTransit);
        const transitVal = matchedTransit ? matchedTransit.code : (portList.find(p => p.code === 'VNSGN')?.code || '');

        // Match initial border gate
        const matchedBorder = portList.find(p => p.code === settings.defaultBorder || p.id === settings.defaultBorder);
        const borderVal = matchedBorder ? matchedBorder.code : (portList.find(p => p.code === 'VNMBA')?.code || '');

        setForm(prev => ({
          ...prev,
          trackingNumber: prev.trackingNumber || generateTrackingNumber(),
          customerId: prev.customerId || (custList[0]?.id || ''),
          originId: prev.originId || originVal,
          destinationId: prev.destinationId || destVal,
          transitPort: prev.transitPort || transitVal,
          borderGate: prev.borderGate || borderVal,
        }));
      })
      .catch((err) => {
        console.error('Failed to load master data for create shipment:', err);
        setError('Không thể tải danh mục khách hàng và cảng từ Master Data.');
      })
      .finally(() => {
        setLoadingMasterData(false);
      });
  }, [companyId]);

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRefreshTrackingNumber = () => {
    updateForm('trackingNumber', generateTrackingNumber());
  };

  // Convert Master Data to SearchableSelect options
  const customerOptions = useMemo<SelectOption[]>(() => {
    return customers.map(c => ({
      value: c.id,
      label: c.name,
      sublabel: c.phone || c.email || undefined,
      icon: <Users size={14} />,
      keywords: [c.address || '', c.email || '', c.phone || '']
    }));
  }, [customers]);

  const portOptions = useMemo<SelectOption[]>(() => {
    return ports.map(p => ({
      value: p.code,
      label: `[${p.code}] ${p.name}`,
      sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
      badge: p.type,
      icon: <Anchor size={14} />,
      keywords: [p.code, p.name, p.country, p.city || '', p.type]
    }));
  }, [ports]);

  const borderOptions = useMemo<SelectOption[]>(() => {
    return ports.map(p => ({
      value: p.code,
      label: `[${p.code}] ${p.name}`,
      sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
      badge: p.type === 'BORDER_GATE' ? 'Cửa khẩu' : p.type,
      icon: <Truck size={14} />,
      keywords: [p.code, p.name, p.country, p.city || '', p.type]
    }));
  }, [ports]);

  const containerOptions: SelectOption[] = [
    { value: '40HC', label: '40ft High Cube (40HC)', sublabel: '76 CBM • 28,500 kg', badge: 'Popular' },
    { value: '20GP', label: '20ft General Purpose (20GP)', sublabel: '33 CBM • 28,000 kg' },
    { value: '40GP', label: '40ft General Purpose (40GP)', sublabel: '67 CBM • 28,500 kg' },
    { value: '45HC', label: '45ft High Cube (45HC)', sublabel: '86 CBM • 29,000 kg' },
    { value: '20RF', label: '20ft Reefer Lạnh (20RF)', sublabel: '28 CBM • 27,000 kg' },
    { value: '40RF', label: '40ft Reefer Lạnh (40RF)', sublabel: '60 CBM • 29,000 kg' },
    { value: 'LCL', label: 'Hàng lẻ ghép cont (LCL)', sublabel: 'Tính theo m3 / CBM' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      setError('Vui lòng chọn khách hàng.');
      return;
    }
    if (!form.originId) {
      setError('Vui lòng chọn cảng xuất phát (POL).');
      return;
    }
    if (!form.destinationId) {
      setError('Vui lòng chọn cảng đích (POD).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        companyId,
        trackingNumber: form.trackingNumber || generateTrackingNumber(),
        customerId: form.customerId,
        originId: form.originId,
        destinationId: form.destinationId,
        mode: form.mode,
        weightTotal: form.weightTotal ? `${form.weightTotal} kg` : undefined,
        volumeTotal: form.volumeTotal ? `${form.volumeTotal} CBM` : undefined,
        estimatedDepartureDate: form.estimatedDepartureDate || undefined,
        estimatedArrivalDate: form.estimatedArrivalDate || undefined,
      };

      const res = await apiFetch<{ data: any }>('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const createdShipment = res.data;
      if (createdShipment?.id) {
        FinancialService.initializeDefaultFeesForShipment(createdShipment.id);
      }
      if (onSuccess) {
        onSuccess(createdShipment);
      }
      if (createdShipment?.id) {
        navigate(`/shipments/${createdShipment.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo lô hàng.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === form.customerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('createShipment.title', 'Tạo mới Lô hàng Vận chuyển')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('createShipment.subtitle', 'Khởi tạo lộ trình và hồ sơ vận tải Trung Quốc → Việt Nam → Campuchia.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loadingMasterData ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-medium">Đang tải dữ liệu từ Master Data và Cài đặt hệ thống...</p>
            </div>
          ) : (
            <form id="create-shipment-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs border border-red-100 flex items-start gap-2">
                  <span className="font-bold shrink-0">Lỗi:</span>
                  <span>{error}</span>
                </div>
              )}

              {/* 1. CUSTOMER & TRACKING NO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('createShipment.customer', 'Khách hàng (Bill To)')} <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <SearchableSelect
                    options={customerOptions}
                    value={form.customerId}
                    onChange={(val) => updateForm('customerId', val)}
                    placeholder={t('createShipment.selectCustomer', '-- Chọn Khách hàng --')}
                    searchPlaceholder="Tìm theo tên, SĐT, email..."
                    searchThreshold={8}
                    required
                  />
                  {selectedCustomer && (
                    <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Building size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{selectedCustomer.address || 'Chưa có địa chỉ trụ sở'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('createShipment.tracking_number', 'Mã vận đơn')}
                    </label>
                    <button
                      type="button"
                      onClick={handleRefreshTrackingNumber}
                      title="Sinh lại mã mới"
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <RotateCw size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={form.trackingNumber}
                    onChange={(e) => updateForm('trackingNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* 2. ROUTING & PORTS SECTION */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={15} className="text-blue-600" />
                    <span>{t('createShipment.routing', 'Lộ trình & Cảng vận chuyển')}</span>
                  </h3>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  {/* Visual 3-Stage Transit Journey */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                    {/* Origin / POL */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                        <Anchor size={14} className="text-blue-500" />
                        <span>{t('createShipment.origin', 'Cảng xuất phát (POL)')}</span>
                        <span className="text-red-500">*</span>
                      </div>
                      <SearchableSelect
                        options={portOptions}
                        value={form.originId}
                        onChange={(val) => updateForm('originId', val)}
                        placeholder="-- Chọn Cảng đi (POL) --"
                        searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                        searchThreshold={8}
                        required
                        size="sm"
                      />
                    </div>

                    {/* Transit Port */}
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                        <Anchor size={14} className="text-amber-500" />
                        <span>{t('createShipment.transit', 'Cảng trung chuyển (Transit)')}</span>
                      </div>
                      <SearchableSelect
                        options={portOptions}
                        value={form.transitPort}
                        onChange={(val) => updateForm('transitPort', val)}
                        placeholder="-- Chọn Cảng trung chuyển --"
                        searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                        searchThreshold={8}
                        size="sm"
                      />
                    </div>

                    {/* Destination / POD */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                        <Anchor size={14} className="text-emerald-500" />
                        <span>{t('createShipment.destination', 'Cảng đến (POD)')}</span>
                        <span className="text-red-500">*</span>
                      </div>
                      <SearchableSelect
                        options={portOptions}
                        value={form.destinationId}
                        onChange={(val) => updateForm('destinationId', val)}
                        placeholder="-- Chọn Cảng đến (POD) --"
                        searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                        searchThreshold={8}
                        required
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Border Gate Selection */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck size={15} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        {t('createShipment.border', 'Cửa khẩu đường bộ')}:
                      </span>
                    </div>
                    <div className="w-full sm:w-72">
                      <SearchableSelect
                        options={borderOptions}
                        value={form.borderGate}
                        onChange={(val) => updateForm('borderGate', val)}
                        placeholder="-- Chọn Cửa khẩu thông quan --"
                        searchPlaceholder="Tìm cửa khẩu..."
                        searchThreshold={8}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. CARGO & TRANSPORT MODE */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Package size={15} className="text-emerald-600" />
                  <span>{t('createShipment.cargo_transport', 'Thông số Hàng hóa & Vận tải')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Transport Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.transport_mode', 'Phương thức vận tải')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['SEA', 'LAND', 'AIR', 'RAIL'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateForm('mode', mode)}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all text-center ${
                            form.mode === mode 
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs' 
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Container Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.container_type', 'Quy cách Container')}
                    </label>
                    <SearchableSelect
                      options={containerOptions}
                      value={form.containerType}
                      onChange={(val) => updateForm('containerType', val)}
                      placeholder="Chọn loại container..."
                      searchThreshold={8}
                      size="sm"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.est_weight', 'Tổng trọng lượng (KG)')}
                    </label>
                    <input 
                      type="number"
                      placeholder={t('createShipment.placeholder_weight', 'VD: 15,000')}
                      value={form.weightTotal}
                      onChange={(e) => updateForm('weightTotal', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.est_volume', 'Tổng thể tích (CBM)')}
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      placeholder={t('createShipment.placeholder_volume', 'VD: 35')}
                      value={form.volumeTotal}
                      onChange={(e) => updateForm('volumeTotal', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* 4. SCHEDULE DATES */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-600" />
                  <span>{t('createShipment.dates', 'Lịch trình dự kiến')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.etd', 'Khởi hành dự kiến (ETD)')}
                    </label>
                    <input
                      type="date"
                      value={form.estimatedDepartureDate}
                      onChange={(e) => updateForm('estimatedDepartureDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createShipment.eta', 'Đến dự kiến (ETA)')}
                    </label>
                    <input
                      type="date"
                      value={form.estimatedArrivalDate}
                      onChange={(e) => updateForm('estimatedArrivalDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 italic">
            {t('createShipment.note', '* Mã vận đơn và trạng thái Nháp (DRAFT) được khởi tạo tự động theo cấu hình hệ thống.')}
          </p>
          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              form="create-shipment-form"
              disabled={loading || loadingMasterData}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? t('createShipment.creating', 'Đang khởi tạo...') : t('createShipment.create', 'Tạo lô hàng')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
