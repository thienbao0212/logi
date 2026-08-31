import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/fetch.js';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Sliders,
  Layers,
  MapPin,
  FileText,
  Save,
  Tag,
  Anchor,
  ExternalLink,
  Loader2,
  Receipt,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  X,
  CreditCard
} from 'lucide-react';
import { SearchableSelect, SelectOption } from '../../components/common/searchable_select.js';

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
  isActive: boolean;
}

export interface DefaultShipmentFee {
  id: string;
  code: string;
  name: string;
  category: string;
  type: 'CHI' | 'THU';
  amount: number;
  currency: string;
  isBillable: boolean;
  notes?: string;
  active: boolean;
}

const INITIAL_DEFAULT_FEES: DefaultShipmentFee[] = [
  {
    id: 'fee-1',
    code: 'CUSTOMS_DECLARATION',
    name: 'Phí khai báo',
    category: 'Hải quan',
    type: 'CHI',
    amount: 1000000,
    currency: 'VND',
    isBillable: true,
    notes: 'Phí mở tờ khai hải quan quá cảnh',
    active: true,
  },
  {
    id: 'fee-2',
    code: 'FIELD_OPERATIONS',
    name: 'Hiện trường',
    category: 'Hiện trường',
    type: 'CHI',
    amount: 500000,
    currency: 'VND',
    isBillable: true,
    notes: 'Giám sát kiểm hóa, thủ tục bấm chì tại cảng/cửa khẩu',
    active: true,
  },
  {
    id: 'fee-3',
    code: 'INLAND_TRUCKING',
    name: 'Vận chuyển',
    category: 'Vận chuyển',
    type: 'CHI',
    amount: 8000000,
    currency: 'VND',
    isBillable: true,
    notes: 'Cước vận chuyển container Cát Lái → Mộc Bài → Phnom Penh',
    active: true,
  },
  {
    id: 'fee-4',
    code: 'PORT_CHARGES',
    name: 'Phí cảng',
    category: 'Cảng / Terminal',
    type: 'CHI',
    amount: 3000000,
    currency: 'VND',
    isBillable: true,
    notes: 'Nâng hạ container, THC và phí lưu bãi tại cảng',
    active: true,
  },
  {
    id: 'fee-5',
    code: 'DELIVERY_ORDER',
    name: 'D/O',
    category: 'Chứng từ',
    type: 'CHI',
    amount: 500000,
    currency: 'VND',
    isBillable: true,
    notes: 'Phí phát hành lệnh giao hàng Delivery Order',
    active: true,
  },
  {
    id: 'fee-6',
    code: 'MISC_OTHER',
    name: 'Khác',
    category: 'Khác',
    type: 'CHI',
    amount: 500000,
    currency: 'VND',
    isBillable: false,
    notes: 'Chi phí dự phòng và phát sinh dọc đường',
    active: true,
  },
];

export default function ShipmentConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tracking' | 'fees' | 'stages' | 'containers' | 'routes' | 'documents'>('tracking');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Master data ports
  const [ports, setPorts] = useState<Port[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);

  // Fee modal state
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<DefaultShipmentFee | null>(null);
  const [feeForm, setFeeForm] = useState({
    name: '',
    category: 'Hải quan',
    type: 'CHI' as 'CHI' | 'THU',
    amount: 500000,
    currency: 'VND',
    isBillable: true,
    notes: '',
  });

  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const companyId = memberships[0]?.companyId;

  useEffect(() => {
    if (!companyId) return;
    setLoadingPorts(true);
    apiFetch<{ data: Port[] }>(`/api/master-data/ports?companyId=${companyId}`)
      .then((res) => {
        setPorts(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch ports for shipment config:', err);
      })
      .finally(() => {
        setLoadingPorts(false);
      });
  }, [companyId]);

  // Form states
  const [trackingForm, setTrackingForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      return saved.trackingForm || {
        prefix: 'TRK',
        separator: '-',
        includeDate: true,
        randomLength: 4,
        autoGenerate: true,
      };
    } catch {
      return { prefix: 'TRK', separator: '-', includeDate: true, randomLength: 4, autoGenerate: true };
    }
  });

  // Default Fees state
  const [fees, setFees] = useState<DefaultShipmentFee[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      return saved.fees || INITIAL_DEFAULT_FEES;
    } catch {
      return INITIAL_DEFAULT_FEES;
    }
  });

  const [stages, setStages] = useState([
    { code: 'DRAFT', name: 'Tạo nháp (Draft)', sla: 2, active: true },
    { code: 'PENDING', name: 'Chờ xác nhận (Pending)', sla: 4, active: true },
    { code: 'BOOKED', name: 'Đã đặt chỗ (Booked)', sla: 12, active: true },
    { code: 'CARGO_RECEIVED', name: 'Đã nhận hàng (Cargo Received)', sla: 24, active: true },
    { code: 'DEPARTED_CHINA', name: 'Rời cảng gốc (Departed Origin)', sla: 48, active: true },
    { code: 'IN_TRANSIT', name: 'Đang vận chuyển biển (In Transit)', sla: 72, active: true },
    { code: 'ARRIVED_CAT_LAI', name: 'Cập cảng Cát Lái (Arrived Cat Lai)', sla: 24, active: true },
    { code: 'CUSTOMS_TRANSIT_DECLARED', name: 'Mở tờ khai quá cảnh (Customs Declared)', sla: 6, active: true },
    { code: 'CUSTOMS_CLEARANCE', name: 'Làm thủ tục kiểm hóa (Customs Clearance)', sla: 12, active: true },
    { code: 'CUSTOMS_CLEARED', name: 'Thông quan quá cảnh (Customs Cleared)', sla: 6, active: true },
    { code: 'DEPARTED_VIETNAM', name: 'Rời Việt Nam qua Mộc Bài (Departed VN)', sla: 8, active: true },
    { code: 'ARRIVED_CAMBODIA', name: 'Đến Campuchia (Arrived Cambodia)', sla: 12, active: true },
    { code: 'OUT_FOR_DELIVERY', name: 'Đang giao hàng (Out for Delivery)', sla: 6, active: true },
    { code: 'DELIVERED', name: 'Giao thành công (Delivered)', sla: 0, active: true },
  ]);

  const [containers, setContainers] = useState([
    { code: '20GP', name: '20ft General Purpose', maxWeight: '28,000 kg', volume: '33 CBM', active: true },
    { code: '40GP', name: '40ft General Purpose', maxWeight: '28,500 kg', volume: '67 CBM', active: true },
    { code: '40HC', name: '40ft High Cube', maxWeight: '28,500 kg', volume: '76 CBM', active: true },
    { code: '45HC', name: '45ft High Cube', maxWeight: '29,000 kg', volume: '86 CBM', active: true },
    { code: '20RF', name: '20ft Reefer Container Lạnh', maxWeight: '27,000 kg', volume: '28 CBM', active: true },
    { code: '40RF', name: '40ft Reefer Container Lạnh', maxWeight: '29,000 kg', volume: '60 CBM', active: true },
    { code: 'LCL', name: 'Hàng lẻ LCL ghép cont', maxWeight: 'Linh hoạt', volume: 'Theo m3', active: true },
  ]);

  const [routeConfig, setRouteConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      return saved.routeConfig || {
        defaultMode: 'SEA',
        defaultOrigin: 'CNSZX',
        defaultTransit: 'VNSGN',
        defaultDest: 'KHPNH',
        defaultBorder: 'VNMBA',
      };
    } catch {
      return {
        defaultMode: 'SEA',
        defaultOrigin: 'CNSZX',
        defaultTransit: 'VNSGN',
        defaultDest: 'KHPNH',
        defaultBorder: 'VNMBA',
      };
    }
  });

  const [documents, setDocuments] = useState([
    { name: 'Vận đơn đường biển (Bill of Lading - B/L)', required: true, stage: 'BOOKED' },
    { name: 'Hóa đơn thương mại (Commercial Invoice)', required: true, stage: 'CARGO_RECEIVED' },
    { name: 'Bảng kê chi tiết hàng hóa (Packing List)', required: true, stage: 'CARGO_RECEIVED' },
    { name: 'Tờ khai hải quan quá cảnh (Transit Declaration)', required: true, stage: 'CUSTOMS_TRANSIT_DECLARED' },
    { name: 'Chứng nhận xuất xứ hàng hóa (C/O)', required: false, stage: 'CUSTOMS_CLEARANCE' },
  ]);

  const handleSave = () => {
    localStorage.setItem('shipment_settings', JSON.stringify({
      trackingForm,
      fees,
      routeConfig,
      stages,
      containers,
      documents
    }));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const getSampleTrackingCode = () => {
    const p = trackingForm.prefix || 'TRK';
    const s = trackingForm.separator || '-';
    const dateStr = trackingForm.includeDate ? '20260824' + s : '';
    return `${p}${s}${dateStr}8392`;
  };

  const portOptions = useMemo<SelectOption[]>(() => {
    return ports.map((p) => ({
      value: p.code,
      label: `[${p.code}] ${p.name}`,
      sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
      badge: p.type,
      icon: <Anchor size={14} />,
      keywords: [p.code, p.name, p.country, p.city || '', p.type],
    }));
  }, [ports]);

  const borderOptions = useMemo<SelectOption[]>(() => {
    return ports.map((p) => ({
      value: p.code,
      label: `[${p.code}] ${p.name}`,
      sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
      badge: p.type === 'BORDER_GATE' ? 'Cửa khẩu' : p.type,
      keywords: [p.code, p.name, p.country, p.city || '', p.type],
    }));
  }, [ports]);

  // Total Default Costs Calculations
  const totalDefaultCost = useMemo(() => {
    return fees
      .filter((f) => f.active && f.type === 'CHI')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  const totalBillable = useMemo(() => {
    return fees
      .filter((f) => f.active && f.isBillable)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  const activeFeesCount = useMemo(() => {
    return fees.filter((f) => f.active).length;
  }, [fees]);

  const handleOpenAddFee = () => {
    setEditingFee(null);
    setFeeForm({
      name: '',
      category: 'Hải quan',
      type: 'CHI',
      amount: 500000,
      currency: 'VND',
      isBillable: true,
      notes: '',
    });
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (fee: DefaultShipmentFee) => {
    setEditingFee(fee);
    setFeeForm({
      name: fee.name,
      category: fee.category,
      type: fee.type,
      amount: fee.amount,
      currency: fee.currency,
      isBillable: fee.isBillable,
      notes: fee.notes || '',
    });
    setIsFeeModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name.trim()) return;

    if (editingFee) {
      setFees(fees.map((f) => (f.id === editingFee.id ? { ...f, ...feeForm } : f)));
    } else {
      const newFee: DefaultShipmentFee = {
        id: `fee-${Date.now()}`,
        code: `FEE_${feeForm.name.toUpperCase().replace(/\s+/g, '_')}`,
        ...feeForm,
        active: true,
      };
      setFees([...fees, newFee]);
    }
    setIsFeeModalOpen(false);
  };

  const handleDeleteFee = (id: string) => {
    setFees(fees.filter((f) => f.id !== id));
  };

  const handleResetDefaultFees = () => {
    if (window.confirm('Khôi phục danh sách định mức 6 khoản phí mặc định ban đầu?')) {
      setFees(INITIAL_DEFAULT_FEES);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>{t('settingsPage.shipmentPage.backToSettings', 'Quay lại Cài đặt')}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('settingsPage.shipmentPage.title', 'Cấu hình Lô hàng & Vận hành')}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settingsPage.shipmentPage.subtitle', 'Thiết lập quy tắc mã lô hàng, định mức phí mặc định, 14 trạng thái và tuyến đường')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={14} />
              <span>{t('settingsPage.shipmentPage.saveSuccess', 'Đã lưu cấu hình!')}</span>
            </span>
          )}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Save size={15} />
            <span>{t('common.save', 'Lưu thay đổi')}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'tracking'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.tracking', 'Mã lô hàng')}</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'fees'
              ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.fees', 'Phí mặc định')}</span>
          <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
            {fees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'stages'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.stages', 'Chu trình trạng thái (14 Stages)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('containers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'containers'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.containers', 'Loại Container')}</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'routes'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.routes', 'Lộ trình & Cửa khẩu')}</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'documents'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={15} />
          <span>{t('settingsPage.shipmentPage.tabs.documents', 'Chứng từ bắt buộc')}</span>
        </button>
      </div>

      {/* TAB 1: TRACKING RULES */}
      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('settingsPage.shipmentPage.tracking.title', 'Quy tắc sinh mã lô hàng tự động')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập định dạng mã lô hàng (Tracking No) áp dụng cho mọi lô hàng mới.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.tracking.prefix', 'Tiền tố mã lô hàng (Prefix)')}
                </label>
                <input
                  type="text"
                  value={trackingForm.prefix}
                  onChange={(e) => setTrackingForm({ ...trackingForm, prefix: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ký tự phân cách</label>
                <select
                  value={trackingForm.separator}
                  onChange={(e) => setTrackingForm({ ...trackingForm, separator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                >
                  <option value="-">Gạch nối ( - )</option>
                  <option value="_">Gạch dưới ( _ )</option>
                  <option value="">Không có (Liền nhau)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Chèn ngày tháng vào mã (YYYYMMDD)</div>
                  <div className="text-[11px] text-slate-500">Giúp định danh ngày mở hồ sơ lô hàng</div>
                </div>
                <input
                  type="checkbox"
                  checked={trackingForm.includeDate}
                  onChange={(e) => setTrackingForm({ ...trackingForm, includeDate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white flex flex-col justify-between shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <Tag size={16} />
                <span>{t('settingsPage.shipmentPage.tracking.preview', 'Mẫu mã lô hàng xem trước')}</span>
              </div>
              <p className="text-xs text-slate-400">
                Mã lô hàng sẽ được gán tự động khi khởi tạo lô hàng:
              </p>
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 font-mono text-xl font-bold text-blue-400 tracking-wider text-center">
                {getSampleTrackingCode()}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Định dạng: Prefix + Date + Random</span>
              <span className="text-emerald-400 font-semibold">● Đang hoạt động</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEFAULT FEES & COSTS (NEW) */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Header Card & KPI Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t('settingsPage.shipmentPage.fees.title', 'Định mức các khoản phí mặc định của lô hàng mới tạo')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('settingsPage.shipmentPage.fees.subtitle', 'Các khoản chi phí tiêu chuẩn sẽ được tự động thiết lập và hạch toán khi tạo mới lô hàng.')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaultFees}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Khôi phục định mức</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddFee}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all"
                >
                  <Plus size={14} />
                  <span>{t('settingsPage.shipmentPage.fees.addFee', 'Thêm khoản phí mới')}</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Tổng chi phí định mức</span>
                  <Receipt size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
                  {formatVND(totalDefaultCost)}
                </div>
                <p className="text-[11px] text-emerald-600 mt-0.5">Áp dụng cho mỗi lô hàng tiêu chuẩn</p>
              </div>

              <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">Thu lại từ khách hàng</span>
                  <CreditCard size={16} className="text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-2 font-mono">
                  {formatVND(totalBillable)}
                </div>
                <p className="text-[11px] text-blue-600 mt-0.5">Các khoản phí xuất hóa đơn khách hàng</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Khoản phí kích hoạt</span>
                  <CheckCircle2 size={16} className="text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                  {activeFeesCount} <span className="text-sm font-normal text-slate-500">/ {fees.length} khoản phí</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Tự động tạo khi mở lô hàng mới</p>
              </div>
            </div>

            {/* Fees Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tên khoản phí</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Loại phí</th>
                    <th className="py-3 px-4">Số tiền định mức</th>
                    <th className="py-3 px-4 text-center">Thu lại khách</th>
                    <th className="py-3 px-4 text-center">Kích hoạt</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee, idx) => (
                    <tr key={fee.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{fee.name}</span>
                        </div>
                        {fee.notes && (
                          <div className="text-[11px] font-normal text-slate-400 pl-3.5 mt-0.5">
                            {fee.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {fee.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            fee.type === 'CHI'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {fee.type === 'CHI' ? 'Chi phí (CHI)' : 'Doanh thu (THU)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        {formatVND(fee.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            fee.isBillable
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {fee.isBillable ? 'Có (Billable)' : 'Không'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={fee.active}
                          onChange={(e) => {
                            const newFees = [...fees];
                            newFees[idx].active = e.target.checked;
                            setFees(newFees);
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFee(fee)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa khoản phí"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFee(fee.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa khoản phí"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAGES */}
      {activeTab === 'stages' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('settingsPage.shipmentPage.stages.title', 'Chu trình 14 trạng thái vận chuyển')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('settingsPage.shipmentPage.stages.description', 'Quản lý quy trình xử lý lô hàng từ lúc khởi tạo đến khi giao hàng thành công')}
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.stages.stage', 'Trạng thái')}</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.stages.code', 'Mã trạng thái')}</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.stages.sla', 'SLA định mức (Giờ)')}</th>
                  <th className="py-2.5 px-4 text-center">{t('settingsPage.shipmentPage.stages.active', 'Áp dụng')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stages.map((stage, idx) => (
                  <tr key={stage.code} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{stage.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{stage.code}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{stage.sla}h</td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={stage.active}
                        onChange={(e) => {
                          const newStages = [...stages];
                          newStages[idx].active = e.target.checked;
                          setStages(newStages);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONTAINERS */}
      {activeTab === 'containers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('settingsPage.shipmentPage.containers.title', 'Quy cách và loại Container')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh mục các loại vỏ container và quy chuẩn kích thước, tải trọng.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.containers.code', 'Mã Cont')}</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.containers.name', 'Tên loại Container')}</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.containers.maxWeight', 'Tải trọng tối đa')}</th>
                  <th className="py-2.5 px-4">{t('settingsPage.shipmentPage.containers.volume', 'Thể tích (CBM)')}</th>
                  <th className="py-2.5 px-4 text-center">{t('settingsPage.shipmentPage.containers.active', 'Sử dụng')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {containers.map((cont, idx) => (
                  <tr key={cont.code} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{cont.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{cont.name}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono">{cont.maxWeight}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono">{cont.volume}</td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={cont.active}
                        onChange={(e) => {
                          const newConts = [...containers];
                          newConts[idx].active = e.target.checked;
                          setContainers(newConts);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ROUTES & HUBS */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('settingsPage.shipmentPage.routes.title', 'Lộ trình & Điểm trung chuyển mặc định')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu cảng và cửa khẩu được đồng bộ trực tiếp từ danh mục Quản lý Cảng (Master Data Ports).
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/master-data/ports')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
            >
              <Anchor size={13} />
              <span>Quản lý danh mục cảng</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {loadingPorts ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600 mr-2" />
              <span className="text-xs font-medium">Đang tải danh mục cảng...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Default Transportation Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.routes.defaultMode', 'Phương thức vận tải mặc định')}
                </label>
                <select
                  value={routeConfig.defaultMode}
                  onChange={(e) => setRouteConfig({ ...routeConfig, defaultMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="SEA">Đường biển (SEA) — Tàu container & Sà lan</option>
                  <option value="LAND">Đường bộ (LAND) — Xe đầu kéo container</option>
                  <option value="AIR">Đường hàng không (AIR) — Vận chuyển máy bay</option>
                </select>
              </div>

              {/* Default POL (Port of Loading) Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.routes.defaultOrigin', 'Cảng xuất phát mặc định (POL)')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={portOptions}
                  value={routeConfig.defaultOrigin}
                  onChange={(val) => setRouteConfig({ ...routeConfig, defaultOrigin: val })}
                  placeholder="-- Chọn Cảng xuất phát (POL) --"
                  searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                  searchThreshold={8}
                  size="sm"
                />
              </div>

              {/* Default Transit Port Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.routes.defaultTransit', 'Cảng trung chuyển (Transit Port)')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={portOptions}
                  value={routeConfig.defaultTransit}
                  onChange={(val) => setRouteConfig({ ...routeConfig, defaultTransit: val })}
                  placeholder="-- Chọn Cảng trung chuyển (Transit Port) --"
                  searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                  searchThreshold={8}
                  size="sm"
                />
              </div>

              {/* Default POD (Port of Discharge) Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.routes.defaultDest', 'Cảng/Điểm đích mặc định (POD)')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={portOptions}
                  value={routeConfig.defaultDest}
                  onChange={(val) => setRouteConfig({ ...routeConfig, defaultDest: val })}
                  placeholder="-- Chọn Cảng đích (POD) --"
                  searchPlaceholder="Tìm theo mã UN/LOCODE, tên cảng..."
                  searchThreshold={8}
                  size="sm"
                />
              </div>

              {/* Default Border Gate Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('settingsPage.shipmentPage.routes.defaultBorder', 'Cửa khẩu đường bộ')}
                </label>
                <SearchableSelect
                  options={borderOptions}
                  value={routeConfig.defaultBorder}
                  onChange={(val) => setRouteConfig({ ...routeConfig, defaultBorder: val })}
                  placeholder="-- Chọn Cửa khẩu thông quan đường bộ --"
                  searchPlaceholder="Tìm cửa khẩu thông quan..."
                  searchThreshold={8}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: REQUIRED DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Danh mục chứng từ bắt buộc</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các tài liệu cần nhân viên logistics tải lên để chuyển tiếp trạng thái lô hàng.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
            {documents.map((doc, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{doc.name}</div>
                    <div className="text-[11px] text-slate-400">Yêu cầu tại mốc: <span className="font-mono font-medium text-slate-600">{doc.stage}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={doc.required}
                    onChange={(e) => {
                      const newDocs = [...documents];
                      newDocs[idx].required = e.target.checked;
                      setDocuments(newDocs);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600">Bắt buộc</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Add / Edit Modal */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Receipt size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingFee ? 'Chỉnh sửa khoản phí mặc định' : 'Thêm khoản phí mặc định mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên khoản phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phí kiểm hóa, Phí bốc xếp..."
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại / Nhóm</label>
                  <select
                    value={feeForm.category}
                    onChange={(e) => setFeeForm({ ...feeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Hải quan">Hải quan</option>
                    <option value="Hiện trường">Hiện trường</option>
                    <option value="Vận chuyển">Vận chuyển</option>
                    <option value="Cảng / Terminal">Cảng / Terminal</option>
                    <option value="Chứng từ">Chứng từ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại phí</label>
                  <select
                    value={feeForm.type}
                    onChange={(e) => setFeeForm({ ...feeForm, type: e.target.value as 'CHI' | 'THU' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="CHI">Chi phí (CHI)</option>
                    <option value="THU">Doanh thu (THU)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền định mức (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú & Mục đích</label>
                <input
                  type="text"
                  placeholder="Mô tả chi tiết mục đích chi phí..."
                  value={feeForm.notes}
                  onChange={(e) => setFeeForm({ ...feeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800">Thu lại từ khách hàng</div>
                  <div className="text-[11px] text-slate-500">Xuất hóa đơn hoặc quyết toán với khách hàng</div>
                </div>
                <input
                  type="checkbox"
                  checked={feeForm.isBillable}
                  onChange={(e) => setFeeForm({ ...feeForm, isBillable: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all"
                >
                  {editingFee ? 'Lưu thay đổi' : 'Thêm khoản phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
