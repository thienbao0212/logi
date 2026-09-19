import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Loader2, 
  Package, 
  Truck, 
  Anchor, 
  RotateCw, 
  Users,
  Building,
  CheckCircle2
} from 'lucide-react';
import { SearchableSelect, SelectOption } from './common/searchable_select.js';
import { FinancialService } from './shipment/tabs/financial/mockService.js';
import { getDefaultMilestones, saveMilestonesToStorage } from './shipment/transit_types.js';

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

  // Generator: Prefix (QC) + Date (YYMMDD/YYYYMMDD) + Incremental Sequence Number (01, 02, 03...)
  const generateTrackingNumber = () => {
    let prefix = 'QC';
    let separator = '';
    let includeDate = true;
    let dateFormat = 'YYMMDD';
    let seqDigits = 2;

    try {
      const savedSettings = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      if (savedSettings.trackingForm) {
        prefix = savedSettings.trackingForm.prefix ?? 'QC';
        separator = savedSettings.trackingForm.separator ?? '';
        includeDate = savedSettings.trackingForm.includeDate ?? true;
        dateFormat = savedSettings.trackingForm.dateFormat ?? 'YYMMDD';
        seqDigits = savedSettings.trackingForm.seqDigits ?? 2;
      }
    } catch {
      // Use standard default QC + YYMMDD + 01
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const yy = yyyy.slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let dateStr = '';
    if (includeDate) {
      dateStr = (dateFormat === 'YYYYMMDD' ? `${yyyy}${mm}${dd}` : `${yy}${mm}${dd}`);
    }

    let basePrefix = '';
    if (separator) {
      basePrefix = dateStr ? `${prefix}${separator}${dateStr}${separator}` : `${prefix}${separator}`;
    } else {
      basePrefix = `${prefix}${dateStr}`;
    }

    try {
      const existingList = JSON.parse(localStorage.getItem('shipments_cache') || '[]');
      const matchingNumbers = existingList
        .map((s: any) => s.trackingNumber)
        .filter((tn: any) => typeof tn === 'string' && tn.startsWith(basePrefix));

      let maxSeq = 0;
      for (const tn of matchingNumbers) {
        const remainder = tn.slice(basePrefix.length);
        const parsed = parseInt(remainder, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }

      const nextSeq = String(maxSeq + 1).padStart(seqDigits, '0');
      return `${basePrefix}${nextSeq}`;
    } catch {
      return `${basePrefix}${String(1).padStart(seqDigits, '0')}`;
    }
  };

  // Form state focused strictly on the 5 essential fields
  const [form, setForm] = useState({
    customerId: '',
    customerName: 'ABC Logistics (Khách hàng Quá cảnh)',
    trackingNumber: generateTrackingNumber(),
    originPort: 'CNSZX', // Cảng đi
    destinationPort: 'VNSGN', // Cảng đến
    borderGate: 'VNMBA', // Cửa khẩu xuất
  });

  // Fetch Master Data (Customers & Ports)
  useEffect(() => {
    if (!companyId) {
      setLoadingMasterData(false);
      return;
    }
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

        const defaultCustId = custList[0]?.id || 'default-customer-id';
        const defaultCustName = custList[0]?.name || 'ABC Logistics (Khách hàng Quá cảnh)';

        setForm(prev => ({
          ...prev,
          customerId: prev.customerId || defaultCustId,
          customerName: prev.customerName || defaultCustName,
          trackingNumber: prev.trackingNumber || generateTrackingNumber(),
          originPort: prev.originPort || (portList.find(p => p.code === 'CNSZX')?.code || portList[0]?.code || 'CNSZX'),
          destinationPort: prev.destinationPort || (portList.find(p => p.code === 'VNSGN')?.code || 'VNSGN'),
          borderGate: prev.borderGate || (portList.find(p => p.code === 'VNMBA')?.code || 'VNMBA'),
        }));
      })
      .catch((err) => {
        console.error('Failed to load master data:', err);
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

  // Convert to options
  const customerOptions = useMemo<SelectOption[]>(() => {
    if (customers.length === 0) {
      return [
        { value: 'default-customer-id', label: 'ABC Logistics (Khách hàng Quá cảnh)', icon: <Users size={14} /> }
      ];
    }
    return customers.map(c => ({
      value: c.id,
      label: c.name,
      sublabel: c.phone || c.email || undefined,
      icon: <Users size={14} />,
      keywords: [c.address || '', c.email || '', c.phone || '']
    }));
  }, [customers]);

  const portOptions = useMemo<SelectOption[]>(() => {
    // Only include actual ports (exclude border gates)
    const filteredPorts = ports.filter(p => p.type !== 'BORDER_GATE');
    if (filteredPorts.length === 0) {
      return [
        { value: 'CNSZX', label: '[CNSZX] Cảng Shenzhen (Thâm Quyến, TQ)', icon: <Anchor size={14} /> },
        { value: 'CNGZG', label: '[CNGZG] Cảng Guangzhou (Quảng Châu, TQ)', icon: <Anchor size={14} /> },
        { value: 'CNSHG', label: '[CNSHG] Cảng Shanghai (Thượng Hải, TQ)', icon: <Anchor size={14} /> },
        { value: 'VNSGN', label: '[VNSGN] Cảng Cát Lái (TP.HCM, VN)', icon: <Anchor size={14} /> },
        { value: 'VNCMT', label: '[VNCMT] Cảng Cái Mép (Bà Rịa - Vũng Tàu)', icon: <Anchor size={14} /> },
        { value: 'VNHPH', label: '[VNHPH] Cảng Hải Phòng (VN)', icon: <Anchor size={14} /> },
        { value: 'VNDAD', label: '[VNDAD] Cảng Đà Nẵng (VN)', icon: <Anchor size={14} /> },
        { value: 'KHPNH', label: '[KHPNH] Cảng Phnom Penh (Campuchia)', icon: <Anchor size={14} /> },
      ];
    }
    return filteredPorts.map(p => ({
      value: p.code,
      label: `[${p.code}] ${p.name}`,
      sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
      badge: p.type,
      icon: <Anchor size={14} />,
      keywords: [p.code, p.name, p.country, p.city || '', p.type]
    }));
  }, [ports]);

  const borderOptions = useMemo<SelectOption[]>(() => {
    const borderPorts = ports.filter(p => p.type === 'BORDER_GATE');
    if (borderPorts.length > 0) {
      return borderPorts.map(p => ({
        value: p.code,
        label: `[${p.code}] ${p.name}`,
        sublabel: `${p.city ? `${p.city}, ` : ''}${p.country}`,
        badge: 'Cửa khẩu',
        icon: <Truck size={14} />,
        keywords: [p.code, p.name, p.country, p.city || '']
      }));
    }
    return [
      { value: 'VNMBA', label: '[VNMBA] Cửa khẩu Quốc tế Mộc Bài (Tây Ninh)', sublabel: 'Tuyến chính sang Phnom Penh', icon: <Truck size={14} /> },
      { value: 'VNXAM', label: '[VNXAM] Cửa khẩu Quốc tế Xa Mát (Tây Ninh)', sublabel: 'Tây Ninh, VN', icon: <Truck size={14} /> },
      { value: 'VNHLU', label: '[VNHLU] Cửa khẩu Quốc tế Hoa Lư (Bình Phước)', sublabel: 'Bình Phước, VN', icon: <Truck size={14} /> },
      { value: 'VNTBI', label: '[VNTBI] Cửa khẩu Quốc tế Tịnh Biên (An Giang)', sublabel: 'An Giang, VN', icon: <Truck size={14} /> },
      { value: 'VNBHI', label: '[VNBHI] Cửa khẩu Quốc tế Bình Hiệp (Long An)', sublabel: 'Long An, VN', icon: <Truck size={14} /> },
    ];
  }, [ports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trackingNumber) {
      setError('Mã lô hàng không được để trống.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        companyId: companyId || 'default-company-id',
        trackingNumber: form.trackingNumber,
        customerId: form.customerId || 'default-customer-id',
        originId: form.originPort,
        destinationId: form.destinationPort,
        mode: 'SEA',
      };

      let createdShipment: any = null;

      try {
        const res = await apiFetch<{ data: any }>('/api/shipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        createdShipment = res.data;
      } catch {
        // Fallback for offline / instant creation
        createdShipment = {
          id: `shipment_${Date.now()}`,
          companyId: companyId || 'default-company-id',
          trackingNumber: form.trackingNumber,
          customerId: form.customerId,
          customerName: form.customerName,
          originId: form.originPort,
          destinationId: form.destinationPort,
          mode: 'SEA',
          status: 'IN_TRANSIT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (createdShipment?.id) {
        // Initialize default milestone template with chosen routing
        const portObj = ports.find(p => p.code === form.destinationPort);
        const borderObj = borderOptions.find(b => b.value === form.borderGate);

        const initialMilestones = getDefaultMilestones(createdShipment.id, {
          actualArrivalDate: new Date().toISOString().slice(0, 10),
          transitPort: portObj?.name || form.destinationPort,
        });

        if (borderObj) {
          initialMilestones.m4.borderGateName = borderObj.label;
        }

        saveMilestonesToStorage(createdShipment.id, initialMilestones);
        FinancialService.initializeDefaultFeesForShipment(createdShipment.id);

        // Update local shipments cache
        try {
          const cache = JSON.parse(localStorage.getItem('shipments_cache') || '[]');
          localStorage.setItem('shipments_cache', JSON.stringify([createdShipment, ...cache]));
        } catch (e) {
          console.error(e);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center shrink-0">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Tạo mới Lô hàng Quá cảnh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập 5 thông tin cơ bản để khởi tạo lô hàng nhanh chóng và chính xác.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-7 overflow-y-auto space-y-5">
          {loadingMasterData ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-2.5" />
              <p className="text-xs font-medium">Đang tải cấu hình khởi tạo...</p>
            </div>
          ) : (
            <form id="create-shipment-quick-form" onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs border border-red-100 font-semibold">
                  {error}
                </div>
              )}

              {/* 1. KHÁCH HÀNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Khách hàng <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={customerOptions}
                  value={form.customerId}
                  onChange={(val) => {
                    const found = customers.find(c => c.id === val);
                    setForm(prev => ({ 
                      ...prev, 
                      customerId: val, 
                      customerName: found?.name || prev.customerName 
                    }));
                  }}
                  placeholder="-- Chọn Khách hàng --"
                  searchPlaceholder="Tìm tên khách hàng..."
                  required
                />
                {selectedCustomer && (
                  <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Building size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{selectedCustomer.address || selectedCustomer.phone || 'Khách hàng mặc định'}</span>
                  </div>
                )}
              </div>

              {/* 2. MÃ LÔ HÀNG (TỰ SINH QC...) */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-blue-900">
                    2. Mã lô hàng (Tự sinh QC + YYMMDD + STT) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshTrackingNumber}
                    title="Sinh lại mã mới"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-semibold transition-colors"
                  >
                    <RotateCw size={13} />
                    <span>Làm mới</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.trackingNumber}
                  onChange={(e) => updateForm('trackingNumber', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-blue-300 rounded-xl text-sm font-mono font-bold uppercase text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 shadow-xs tracking-wider"
                />
                <span className="text-[11px] text-blue-600/90 mt-1.5 block">
                  Định dạng chuẩn: QC + Năm (26) + Tháng (08) + Ngày (31) + Số thứ tự (01, 02...)
                </span>
              </div>

              {/* 3. CẢNG ĐI & 4. CẢNG ĐẾN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Anchor size={14} className="text-blue-600" />
                    <span>3. Cảng đi (POL) <span className="text-red-500">*</span></span>
                  </label>
                  <SearchableSelect
                    options={portOptions}
                    value={form.originPort}
                    onChange={(val) => updateForm('originPort', val)}
                    placeholder="-- Chọn Cảng đi --"
                    searchPlaceholder="Tìm cảng đi..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Anchor size={14} className="text-emerald-600" />
                    <span>4. Cảng đến (POD) <span className="text-red-500">*</span></span>
                  </label>
                  <SearchableSelect
                    options={portOptions}
                    value={form.destinationPort}
                    onChange={(val) => updateForm('destinationPort', val)}
                    placeholder="-- Chọn Cảng đến --"
                    searchPlaceholder="Tìm cảng đến..."
                    required
                  />
                </div>
              </div>

              {/* 5. CỬA KHẨU XUẤT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Truck size={14} className="text-purple-600" />
                  <span>5. Cửa khẩu xuất (Đổi cont) <span className="text-red-500">*</span></span>
                </label>
                <SearchableSelect
                  options={borderOptions}
                  value={form.borderGate}
                  onChange={(val) => updateForm('borderGate', val)}
                  placeholder="-- Chọn Cửa khẩu xuất --"
                  searchPlaceholder="Tìm cửa khẩu..."
                  required
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
                <span className="text-sm">ℹ️</span>
                <span>
                  Sau khi tạo lô hàng, hệ thống sẽ tự động chuyển bạn vào trang chi tiết để điền và theo dõi chi tiết <strong>5 Mốc Vận chuyển Quá cảnh</strong>.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="create-shipment-quick-form"
            disabled={loading || loadingMasterData}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 active:bg-emerald-800 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{loading ? 'Đang tạo...' : 'Tạo lô hàng ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
