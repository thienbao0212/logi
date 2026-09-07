import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Warehouse, 
  Check
} from 'lucide-react';
import { 
  Vendor, 
  VendorType, 
  PaymentTerm, 
  VendorService, 
  VENDOR_TYPE_LABELS, 
  VENDOR_TYPE_COLORS, 
  PAYMENT_TERM_LABELS 
} from './vendor_service.js';
import { 
  Button, 
  Badge, 
  SearchInput, 
  SegmentedControl, 
  ExportButton, 
  Modal 
} from '../../components/common/index.js';

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<VendorType | 'ALL'>('ALL');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Vendor>>({
    code: '',
    name: '',
    type: 'TRUCKING',
    taxCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerm: 'NET30',
    bankAccount: '',
    bankName: '',
    notes: '',
    isActive: true,
  });

  const loadData = () => {
    const list = VendorService.getAll();
    setVendors(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      code: VendorService.nextCode('TRUCKING'),
      name: '',
      type: 'TRUCKING',
      taxCode: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      paymentTerm: 'NET30',
      bankAccount: '',
      bankName: '',
      notes: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({ ...vendor });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp / đối tác.');
      return;
    }

    const vendorToSave: Vendor = {
      id: editingVendor?.id || `VND-${Date.now()}`,
      code: formData.code?.trim() || VendorService.nextCode(formData.type as VendorType || 'TRUCKING'),
      name: formData.name.trim(),
      type: (formData.type as VendorType) || 'TRUCKING',
      taxCode: formData.taxCode?.trim() || '',
      contactPerson: formData.contactPerson?.trim() || '',
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      paymentTerm: (formData.paymentTerm as PaymentTerm) || 'NET30',
      bankAccount: formData.bankAccount?.trim() || '',
      bankName: formData.bankName?.trim() || '',
      notes: formData.notes?.trim() || '',
      isActive: formData.isActive ?? true,
      createdAt: editingVendor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    VendorService.save(vendorToSave);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhà cung cấp "${name}"?`)) {
      VendorService.delete(id);
      loadData();
    }
  };

  // KPIs
  const metrics = useMemo(() => {
    const total = vendors.length;
    const trucking = vendors.filter(v => v.type === 'TRUCKING').length;
    const customs = vendors.filter(v => v.type === 'CUSTOMS').length;
    const airline = vendors.filter(v => v.type === 'AIRLINE').length;
    const warehouse = vendors.filter(v => v.type === 'WAREHOUSE').length;
    return { total, trucking, customs, airline, warehouse };
  }, [vendors]);

  // Filtered rows
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = search.toLowerCase().trim();
      const matchSearch = 
        !q ||
        v.code.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        (v.taxCode && v.taxCode.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (selectedType !== 'ALL' && v.type !== selectedType) return false;
      return true;
    });
  }, [vendors, search, selectedType]);

  const handleExportCsv = () => {
    const headers = ['Mã đối tác', 'Tên nhà cung cấp / Đối tác', 'Loại dịch vụ', 'Mã số thuế', 'Người liên hệ', 'Số điện thoại', 'Email', 'Điều khoản TT', 'Số TK Ngân hàng', 'Ngân hàng', 'Trạng thái'];
    const rows = filteredVendors.map(v => [
      v.code,
      `"${v.name}"`,
      `"${VENDOR_TYPE_LABELS[v.type]}"`,
      v.taxCode || '',
      `"${v.contactPerson || ''}"`,
      v.phone || '',
      v.email || '',
      v.paymentTerm,
      v.bankAccount || '',
      `"${v.bankName || ''}"`,
      v.isActive ? 'Đang hợp tác' : 'Tạm ngưng',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Danh_sach_Nha_cung_cap_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Building2 size={24} className="text-blue-600 dark:text-blue-400" />
              <span>Quản lý Nhà cung cấp & Đối tác Dịch vụ</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Danh mục đội xe vận chuyển, đại lý hải quan, hãng hàng không, kho bãi ICD và đại lý forwarder quốc tế.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tổng nhà cung cấp</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{metrics.total}</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">Đối tác mạng lưới</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Building2 size={20} />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đội xe / Vận tải</span>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono mt-1">{metrics.trucking}</div>
              <span className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5 block">Xe kéo container / Tải</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
              <Truck size={20} />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đại lý Hải quan</span>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono mt-1">{metrics.customs}</div>
              <span className="text-[11px] text-blue-600 dark:text-blue-500 mt-0.5 block">Thủ tục & kiểm hóa cảng</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kho bãi & ICD</span>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">{metrics.warehouse}</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5 block">Depot & CFS tập kết</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              <Warehouse size={20} />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã, tên NCC, MST, hotline, người liên hệ..."
              maxWidth="max-w-md"
            />

            <SegmentedControl
              value={selectedType}
              onChange={(val) => setSelectedType(val as any)}
              options={[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'TRUCKING', label: 'Đội xe' },
                { id: 'CUSTOMS', label: 'Hải quan' },
                { id: 'AIRLINE', label: 'Hàng không' },
                { id: 'WAREHOUSE', label: 'Kho bãi / ICD' },
                { id: 'OVERSEAS_AGENT', label: 'Đại lý quốc tế' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <ExportButton onExport={handleExportCsv} />
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={openCreateModal}
            >
              Thêm nhà cung cấp
            </Button>
          </div>
        </div>

        {/* Vendor Table */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Mã NCC</th>
                  <th className="px-4 py-3">Tên Nhà cung cấp / Đối tác</th>
                  <th className="px-4 py-3">Lĩnh vực</th>
                  <th className="px-4 py-3">MST</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Điều khoản TT</th>
                  <th className="px-4 py-3">Tài khoản Ngân hàng</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400">{vendor.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[220px]">
                      <div>{vendor.name}</div>
                      {vendor.address && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span>{vendor.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${VENDOR_TYPE_COLORS[vendor.type].container}`}>
                        {VENDOR_TYPE_LABELS[vendor.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{vendor.taxCode || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px]">
                      {vendor.contactPerson && <div className="font-semibold text-slate-700 dark:text-slate-200">{vendor.contactPerson}</div>}
                      {vendor.phone && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                          <Phone size={10} /> {vendor.phone}
                        </div>
                      )}
                      {vendor.email && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                          <Mail size={10} /> {vendor.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">
                        {vendor.paymentTerm}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate">
                      {vendor.bankAccount ? (
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-200">{vendor.bankAccount}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{vendor.bankName}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={vendor.isActive ? 'success' : 'neutral'} dot size="sm">
                        {vendor.isActive ? 'Đang hợp tác' : 'Tạm ngưng'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(vendor)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 size={24} className="text-slate-300 dark:text-slate-600" />
                        <span>Không tìm thấy nhà cung cấp hoặc đối tác phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Create / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? 'Chỉnh sửa Nhà cung cấp / Đối tác' : 'Thêm Nhà cung cấp / Đối tác Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Phân loại dịch vụ *
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.type}
                onChange={e => {
                  const newType = e.target.value as VendorType;
                  setFormData(prev => ({
                    ...prev,
                    type: newType,
                    code: !editingVendor ? VendorService.nextCode(newType) : prev.code
                  }));
                }}
              >
                {(Object.keys(VENDOR_TYPE_LABELS) as VendorType[]).map(t => (
                  <option key={t} value={t}>{VENDOR_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Mã đối tác (Code) *
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/30 outline-none uppercase bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="TRK-001"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Tên công ty / Đơn vị cung cấp *
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Công ty TNHH Vận tải Hàng hải Á Châu..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Mã số thuế (MST)
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.taxCode}
                onChange={e => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Điều khoản thanh toán
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.paymentTerm}
                onChange={e => setFormData(prev => ({ ...prev, paymentTerm: e.target.value as PaymentTerm }))}
              >
                {(Object.keys(PAYMENT_TERM_LABELS) as PaymentTerm[]).map(term => (
                  <option key={term} value={term}>{PAYMENT_TERM_LABELS[term]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Người liên hệ
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Họ tên"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Hotline / SĐT
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="09xx..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Email nhận hóa đơn
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="accounting@..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Địa chỉ văn phòng / Kho bãi
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Số tài khoản thụ hưởng
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.bankAccount}
                onChange={e => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="007100..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Ngân hàng & Chi nhánh
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={formData.bankName}
                onChange={e => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Vietcombank - CN Tân Cảng"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Ghi chú hợp đồng / Dịch vụ
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Tuyến chuyên chạy, biểu phí thỏa thuận..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" icon={<Check size={14} />}>
              {editingVendor ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
