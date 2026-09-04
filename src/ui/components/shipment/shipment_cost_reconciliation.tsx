import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, 
  Plus, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Save, 
  FileCheck,
  ChevronDown,
  ShieldCheck,
  XCircle,
  Check
} from 'lucide-react';
import { 
  FinancialCostItem, 
  saveShipmentCostsToStorage,
  loadMilestonesFromStorage,
  syncMilestonesToFinancialStorage
} from './transit_types.js';
import CurrencyInput from '../common/currency_input.js';

interface ShipmentCostReconciliationProps {
  shipmentId: string;
}

// 2. Custom Portal-Based Status Dropdown (Appended to Body with Modern UI)
const STATUS_OPTIONS: Array<{
  value: FinancialCostItem['status'];
  label: string;
  desc: string;
  icon: any;
  colorClass: string;
  iconColor: string;
  pillClass: string;
}> = [
  {
    value: 'PENDING',
    label: 'Chờ duyệt chi',
    desc: 'Đang chờ kế toán kiểm tra và phê duyệt',
    icon: Clock,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80',
  },
  {
    value: 'APPROVED',
    label: 'Kế toán đã duyệt',
    desc: 'Đã xác nhận khoản chi, chuẩn bị thanh toán',
    icon: ShieldCheck,
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
    pillClass: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/80',
  },
  {
    value: 'PAID',
    label: 'Đã thanh toán (Có UNC)',
    desc: 'Đã chuyển tiền và đính kèm ủy nhiệm chi',
    icon: CheckCircle2,
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-500',
    pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80',
  },
  {
    value: 'REJECTED',
    label: 'Từ chối duyệt',
    desc: 'Chi phí không hợp lệ hoặc thiếu chứng từ',
    icon: XCircle,
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    iconColor: 'text-rose-500',
    pillClass: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80',
  },
];

function StatusSelectDropdown({
  status,
  onChange,
}: {
  status: FinancialCostItem['status'];
  onChange: (newStatus: FinancialCostItem['status']) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  const calculatePosition = () => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenTop = spaceBelow < 240 && spaceAbove > spaceBelow;

    return {
      top: shouldOpenTop ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(12, Math.min(window.innerWidth - 280, rect.left)),
      placement: shouldOpenTop ? ('top' as const) : ('bottom' as const),
    };
  };

  const handleToggle = () => {
    if (!isOpen) {
      const pos = calculatePosition();
      if (pos) setCoords(pos);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      const pos = calculatePosition();
      if (pos) setCoords(pos);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* Trigger Pill Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-colors duration-150 active:scale-95 ${currentOption.pillClass}`}
      >
        <CurrentIcon size={13} className={currentOption.iconColor} />
        <span>{currentOption.label}</span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu Appended to Body */}
      {isOpen && coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.placement === 'top' ? 'auto' : `${coords.top}px`,
              bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: '270px',
              zIndex: 99999,
            }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 animate-in fade-in-0 zoom-in-95 duration-100 space-y-1"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Cập nhật trạng thái duyệt chi
            </div>

            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.value === status;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/80 text-blue-900 border border-blue-200/80 shadow-2xs'
                      : 'hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${opt.colorClass}`}>
                    <Icon size={14} className={opt.iconColor} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                      {isSelected && <Check size={13} className="text-blue-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug truncate">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

export default function ShipmentCostReconciliation({ shipmentId }: ShipmentCostReconciliationProps) {
  const [costs, setCosts] = useState<FinancialCostItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [previewUNC, setPreviewUNC] = useState<{ url: string; name: string } | null>(null);

  // New ad-hoc fee form state
  const [newFee, setNewFee] = useState<{
    milestoneLabel: string;
    feeName: string;
    amount: number | '';
    requestDate: string;
    notes: string;
  }>({
    milestoneLabel: 'Phụ phí phát sinh',
    feeName: '',
    amount: '',
    requestDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadData = () => {
    const milestones = loadMilestonesFromStorage(shipmentId);
    const synced = syncMilestonesToFinancialStorage(shipmentId, milestones);
    setCosts(synced);
  };

  useEffect(() => {
    loadData();
  }, [shipmentId]);

  const updateCostItem = (id: string, fields: Partial<FinancialCostItem>) => {
    setCosts(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...fields } : item);
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });
  };

  const handleStatusChange = (id: string, status: FinancialCostItem['status']) => {
    updateCostItem(id, { status });
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local blob URL for preview
    const fileUrl = URL.createObjectURL(file);
    updateCostItem(id, {
      uncAttachmentUrl: fileUrl,
      uncFileName: file.name,
      uncUploadDate: new Date().toISOString().slice(0, 10),
      status: 'PAID', // Auto-set to PAID once payment proof is uploaded
    });
  };

  const handleRemoveItem = (id: string) => {
    setCosts(prev => {
      const next = prev.filter(item => item.id !== id);
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });
  };

  const handleAddNewFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.feeName.trim() || !newFee.amount || Number(newFee.amount) <= 0) return;

    const newItem: FinancialCostItem = {
      id: `${shipmentId}_extra_${Date.now()}`,
      shipmentId,
      milestoneKey: 'extra',
      milestoneLabel: newFee.milestoneLabel,
      feeName: newFee.feeName.trim(),
      amount: Number(newFee.amount),
      requestDate: newFee.requestDate || new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      isMandatoryFee: false,
      notes: newFee.notes,
    };

    setCosts(prev => {
      const next = [...prev, newItem];
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });

    setShowAddModal(false);
    setNewFee({
      milestoneLabel: 'Phụ phí phát sinh',
      feeName: '',
      amount: '',
      requestDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  };

  // Financial calculations
  const mandatoryTotal = useMemo(() => {
    return costs.filter(c => c.isMandatoryFee).reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const extraTotal = useMemo(() => {
    return costs.filter(c => !c.isMandatoryFee).reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const grandTotal = mandatoryTotal + extraTotal;

  const paidTotal = useMemo(() => {
    return costs.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const pendingTotal = useMemo(() => {
    return costs.filter(c => c.status === 'PENDING' || c.status === 'APPROVED').reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const formatVND = (val: number) => {
    return `${(val || 0).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng chi phí cơ bản */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Chi phí cơ bản (Từ 5 mốc *)</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">★</div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">{formatVND(mandatoryTotal)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đồng bộ tự động từ các trường có dấu *</div>
        </div>

        {/* Card 2: Phụ phí phát sinh */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Phụ phí phát sinh thêm</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold">+</div>
          </div>
          <div className="text-lg font-bold text-amber-700 font-mono">{formatVND(extraTotal)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lưu đêm, nâng hạ, kiểm hóa ngoài giờ...</div>
        </div>

        {/* Card 3: Đã chi (Có UNC) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
            <span>Đã thanh toán (Có UNC)</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono">{formatVND(paidTotal)}</div>
          <div className="text-[11px] text-emerald-600 mt-1">{costs.filter(c => c.status === 'PAID').length} khoản đã có ủy nhiệm chi</div>
        </div>

        {/* Card 4: Chờ kế toán duyệt/chi */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
            <span>Còn phải đối chiếu / Chưa chi</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700 font-mono">{formatVND(pendingTotal)}</div>
          <div className="text-[11px] text-amber-600 mt-1">Tổng cộng: <strong className="text-slate-900">{formatVND(grandTotal)}</strong></div>
        </div>
      </div>

      {/* Main Reconciliation Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              <span>Bảng Đối chiếu Chi phí Lô hàng với Kế toán</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi việc kế toán duyệt lệnh và đối soát bằng chứng chi tiền (Ủy nhiệm chi - UNC).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Thêm phụ phí phát sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveShipmentCostsToStorage(shipmentId, costs);
                setSavedAlert(true);
                setTimeout(() => setSavedAlert(false), 2500);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Save size={14} />
              <span>Lưu bảng đối chiếu</span>
            </button>
          </div>
        </div>

        {savedAlert && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Đã lưu thành công các thay đổi đối chiếu kế toán!</span>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-4 py-3.5">Mốc phát sinh</th>
                <th className="px-4 py-3.5">Nội dung khoản phí</th>
                <th className="px-4 py-3.5 text-right pr-6">Số tiền (VNĐ)</th>
                <th className="px-4 py-3.5">Ngày yêu cầu</th>
                <th className="px-4 py-3.5">Kế toán duyệt lệnh</th>
                <th className="px-4 py-3.5">Đính kèm Ủy nhiệm chi (UNC)</th>
                <th className="px-4 py-3.5 w-16 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Chưa có khoản phí nào. Vui lòng nhập thông tin tại 5 Mốc Vận chuyển hoặc bấm "Thêm phụ phí phát sinh".
                  </td>
                </tr>
              ) : (
                costs.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    
                    {/* 1. STT */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    {/* 2. Mốc phát sinh */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs ${
                        item.isMandatoryFee 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.milestoneLabel}
                      </span>
                    </td>

                    {/* 3. Nội dung phí */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{item.feeName}</div>
                      {item.isMandatoryFee ? (
                        <span className="text-[10px] text-blue-600 font-medium">Khoản phí chuẩn (*)</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">Phụ phí phát sinh ngoài</span>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* 4. Số tiền (VNĐ) - Modern Formatted Input */}
                    <td className="px-4 py-3.5 text-right pr-6">
                      <div className="w-36 inline-block">
                        <CurrencyInput
                          value={item.amount || 0}
                          onChange={(newVal) => updateCostItem(item.id, { amount: newVal })}
                        />
                      </div>
                    </td>

                    {/* 5. Ngày yêu cầu */}
                    <td className="px-4 py-3.5">
                      <input
                        type="date"
                        value={item.requestDate || ''}
                        onChange={(e) => updateCostItem(item.id, { requestDate: e.target.value })}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/70 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-2xs transition-all"
                      />
                    </td>

                    {/* 6. Kế toán duyệt lệnh - Single Modern Dropdown Pill Attached to Body */}
                    <td className="px-4 py-3.5">
                      <StatusSelectDropdown
                        status={item.status}
                        onChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                      />
                    </td>

                    {/* 7. Đính kèm Ủy nhiệm chi (UNC) / Bằng chứng */}
                    <td className="px-4 py-3.5">
                      {item.uncAttachmentUrl ? (
                        <div className="flex items-center gap-2 bg-emerald-50/90 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                          <FileCheck size={16} className="text-emerald-600 shrink-0" />
                          <div className="truncate max-w-[130px]">
                            <div className="text-[11px] font-bold text-emerald-900 truncate" title={item.uncFileName}>
                              {item.uncFileName || 'UNC_ChungTu.pdf'}
                            </div>
                            <div className="text-[9px] text-emerald-600 font-medium">{item.uncUploadDate || 'Đã đính kèm'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewUNC({ url: item.uncAttachmentUrl!, name: item.uncFileName || 'Ủy nhiệm chi' })}
                            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Xem bằng chứng UNC"
                          >
                            <Eye size={13} />
                          </button>
                          <label className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Đổi file khác">
                            <Upload size={13} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50/40 cursor-pointer transition-all shadow-2xs font-semibold text-xs">
                          <Upload size={13} className="text-slate-400" />
                          <span>Tải lên UNC</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                        </label>
                      )}
                    </td>

                    {/* 8. Thao tác */}
                    <td className="px-4 py-3.5 text-center">
                      {!item.isMandatoryFee ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa phụ phí phát sinh này"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary of Table */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{costs.length} khoản phí</strong> ({costs.filter(c => c.isMandatoryFee).length} khoản chuẩn, {costs.filter(c => !c.isMandatoryFee).length} phát sinh thêm)
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Đã chi (Có UNC): </span>
              <span className="font-bold text-emerald-700 font-mono">{formatVND(paidTotal)}</span>
            </div>
            <div>
              <span className="text-slate-500">Tổng chi phí lô hàng: </span>
              <span className="font-bold text-blue-700 font-mono text-sm">{formatVND(grandTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Thêm phụ phí phát sinh */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                <span>Thêm Khoản Chi Phí Phát Sinh</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleAddNewFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mốc phát sinh</label>
                <select
                  value={newFee.milestoneLabel}
                  onChange={(e) => setNewFee({ ...newFee, milestoneLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="1. Hàng đến cảng">1. Hàng đến cảng (Phí lưu bãi DEM/STO, nâng hạ ngoài giờ...)</option>
                  <option value="2. Hải quan">2. Hải quan (Phí kiểm hóa ngoài giờ, sửa tờ khai...)</option>
                  <option value="3. Vận chuyển">3. Vận chuyển (Lưu đêm xe tải, phụ phí đường cấm...)</option>
                  <option value="4. Cửa khẩu xuất">4. Cửa khẩu xuất (Phí bến bãi biên giới, phí hạ tải...)</option>
                  <option value="5. Trả rỗng">5. Trả rỗng (Phí sửa chữa hư hỏng vỏ cont, vệ sinh cont...)</option>
                  <option value="Phụ phí phát sinh">Phụ phí phát sinh khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên khoản phí <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phí lưu đêm xe tải chờ qua cửa khẩu"
                  value={newFee.feeName}
                  onChange={(e) => setNewFee({ ...newFee, feeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                <CurrencyInput
                  required
                  placeholder="VD: 500,000"
                  value={typeof newFee.amount === 'number' ? newFee.amount : undefined}
                  onChange={(val) => setNewFee({ ...newFee, amount: val })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày yêu cầu chi</label>
                <input
                  type="date"
                  value={newFee.requestDate}
                  onChange={(e) => setNewFee({ ...newFee, requestDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú / Lý do phát sinh</label>
                <textarea
                  rows={2}
                  placeholder="Lý do chi thêm..."
                  value={newFee.notes}
                  onChange={(e) => setNewFee({ ...newFee, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Thêm vào bảng đối chiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal for UNC attachment */}
      {previewUNC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                <span>Ủy nhiệm chi (UNC): {previewUNC.name}</span>
              </h3>
              <button onClick={() => setPreviewUNC(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] bg-slate-100 text-slate-500">
              <FileCheck size={48} className="text-emerald-500 mb-3" />
              <p className="text-xs font-bold text-slate-700">{previewUNC.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">File chứng từ thanh toán ngân hàng (Ủy nhiệm chi)</p>
              <a
                href={previewUNC.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
              >
                Mở trong tab mới
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
