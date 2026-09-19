import React, { useState, useEffect, useMemo } from 'react';
import { 
  Anchor, 
  FileCheck2, 
  Truck, 
  Building2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  DollarSign, 
  Box, 
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Package
} from 'lucide-react';
import CurrencyInput from '../common/currency_input.js';
import { 
  TransitMilestonesData, 
  loadMilestonesFromStorage, 
  saveMilestonesToStorage, 
  validateMilestone1, 
  validateMilestone2, 
  validateMilestone3, 
  validateMilestone4, 
  validateMilestone5,
  calculateExpiryDate,
  checkAllMilestonesCompleted,
  ContainerItem,
  scanShipmentTimeline
} from './transit_types.js';

interface TransitMilestonesPanelProps {
  shipment: any;
  onMilestonesChange?: (milestones: TransitMilestonesData) => void;
  onAllCompleted?: () => void;
  onNavigateToFinancial?: () => void;
}


// Shared input class helpers
const inputCls = 'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';
const inputErrCls = (issue: any) =>
  issue
    ? issue.type === 'ERROR'
      ? 'border-red-400 dark:border-red-500 ring-2 ring-red-100 dark:ring-red-950/40 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:outline-none font-normal'
      : 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-100 dark:ring-amber-950/40 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 focus:outline-none font-normal'
    : inputCls;

// Section header with left accent bar
function SectionHeader({ icon, title, badge }: { icon?: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
      {icon && <span className="text-slate-500 dark:text-slate-400 shrink-0">{icon}</span>}
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{title}</span>
      {badge && <span className="ml-1">{badge}</span>}
    </div>
  );
}

// Field wrapper
function FieldGroup({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// Issue hint below a field
function FieldIssueHint({ issue }: { issue: any }) {
  if (!issue) return null;
  return (
    <span className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${issue.type === 'ERROR' ? 'text-red-600' : 'text-amber-700'}`}>
      {issue.type === 'ERROR' ? '🚨' : '⚠️'} {issue.message}
    </span>
  );
}

export default function TransitMilestonesPanel({ 
  shipment, 
  onMilestonesChange, 
  onAllCompleted,
  onNavigateToFinancial
}: TransitMilestonesPanelProps) {
  const [data, setData] = useState<TransitMilestonesData>(() => loadMilestonesFromStorage(shipment.id, shipment));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedMilestoneKey, setSavedMilestoneKey] = useState<string | null>(null);

  // Expand / collapse state for each milestone card (all expanded by default for full continuous visibility)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    m1: true,
    m2: true,
    m3: true,
    m4: true,
    m5: true,
  });

  // Optional sub-sections toggles
  const [showOptionalM1, setShowOptionalM1] = useState(false);
  const [showOptionalM2, setShowOptionalM2] = useState(false);
  const [showOptionalM3, setShowOptionalM3] = useState(false);
  const [showOptionalM4, setShowOptionalM4] = useState(false);
  const [showOptionalM5, setShowOptionalM5] = useState(false);

  useEffect(() => {
    const loaded = loadMilestonesFromStorage(shipment.id, shipment);
    setData(loaded);
  }, [shipment.id]);

  // --- Validations ---
  const v1 = useMemo(() => validateMilestone1(data.m1), [data.m1]);
  const v2 = useMemo(() => validateMilestone2(data.m2), [data.m2]);
  const v3 = useMemo(() => validateMilestone3(data.m3), [data.m3]);
  const v4 = useMemo(() => validateMilestone4(data.m4), [data.m4]);
  const v5 = useMemo(() => validateMilestone5(data.m5), [data.m5]);
  const validations = [v1, v2, v3, v4, v5];
  const allCompleted = v1.isCompleted && v2.isCompleted && v3.isCompleted && v4.isCompleted && v5.isCompleted;
  const completedCount = validations.filter(v => v.isCompleted).length;

  // --- Timeline scan for input field warnings ---
  const timelineIssues = useMemo(() => scanShipmentTimeline(data), [data]);
  const getFieldIssue = (fieldKey: string) => timelineIssues.find((issue) => issue.fieldKeys.includes(fieldKey));

  // --- Updaters ---
  const updateM1 = (fields: Partial<typeof data.m1>) => {
    setData(prev => {
      const nextM1 = { ...prev.m1, ...fields };
      if (fields.arrivalDate !== undefined || fields.freeDemDays !== undefined) {
        nextM1.demExpiryDate = calculateExpiryDate(nextM1.arrivalDate, nextM1.freeDemDays || 3);
      }
      if (fields.arrivalDate !== undefined || fields.freeStoDays !== undefined) {
        nextM1.stoExpiryDate = calculateExpiryDate(nextM1.arrivalDate, nextM1.freeStoDays || 2);
      }
      const nextM3 = { ...prev.m3 };
      if (fields.freeDetDays !== undefined && nextM3.departureDate) {
        nextM3.detExpiryDate = calculateExpiryDate(nextM3.departureDate, fields.freeDetDays);
      }
      return { ...prev, m1: nextM1, m3: nextM3 };
    });
  };
  const updateM2 = (fields: Partial<typeof data.m2>) => setData(prev => ({ ...prev, m2: { ...prev.m2, ...fields } }));
  const updateM3 = (fields: Partial<typeof data.m3>) => {
    setData(prev => {
      const nextM3 = { ...prev.m3, ...fields };
      if (fields.departureDate !== undefined) {
        nextM3.detExpiryDate = calculateExpiryDate(nextM3.departureDate, prev.m1.freeDetDays || 4);
      }
      return { ...prev, m3: nextM3 };
    });
  };
  const updateM4 = (fields: Partial<typeof data.m4>) => setData(prev => ({ ...prev, m4: { ...prev.m4, ...fields } }));
  const updateM5 = (fields: Partial<typeof data.m5>) => setData(prev => ({ ...prev, m5: { ...prev.m5, ...fields } }));

  // --- Container helpers ---
  const handleAddContainer = () => {
    const newCont: ContainerItem = { id: Date.now().toString(), containerNumber: '', sealNumber: '', containerType: '40HC', grossWeight: '' };
    updateM1({ containers: [...(data.m1.containers || []), newCont] });
  };
  const handleUpdateContainer = (index: number, key: keyof ContainerItem, value: string) => {
    const next = [...(data.m1.containers || [])];
    if (next[index]) { next[index] = { ...next[index], [key]: value }; updateM1({ containers: next }); }
  };
  const handleRemoveContainer = (index: number) => {
    updateM1({ containers: (data.m1.containers || []).filter((_, i) => i !== index) });
  };

  // --- Accordion helpers ---
  const toggleMilestone = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToMilestone = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      const el = document.getElementById(`milestone-section-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Listen to header milestone click navigation events
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.milestoneKey) {
        scrollToMilestone(e.detail.milestoneKey);
      }
    };
    window.addEventListener('scroll-to-milestone', handler);
    return () => window.removeEventListener('scroll-to-milestone', handler);
  }, []);

  // --- Save helpers ---
  const handleSaveAll = () => {
    saveMilestonesToStorage(shipment.id, data);
    setSavedSuccess(true);
    setSavedMilestoneKey('all');
    setTimeout(() => {
      setSavedSuccess(false);
      setSavedMilestoneKey(null);
    }, 3000);
    if (onMilestonesChange) onMilestonesChange(data);
    if (checkAllMilestonesCompleted(data) && onAllCompleted) onAllCompleted();
  };

  const handleSaveMilestone = (key: string) => {
    saveMilestonesToStorage(shipment.id, data);
    setSavedSuccess(true);
    setSavedMilestoneKey(key);
    setTimeout(() => {
      setSavedSuccess(false);
      setSavedMilestoneKey(null);
    }, 2500);
    if (onMilestonesChange) onMilestonesChange(data);
    if (checkAllMilestonesCompleted(data) && onAllCompleted) onAllCompleted();
  };

  // Helper summaries for collapsed preview
  const getMilestoneSummary = (key: string) => {
    switch (key) {
      case 'm1':
        return data.m1.billOfLading ? `B/L: ${data.m1.billOfLading} · ${data.m1.shippingLine || 'Chưa chọn hãng tàu'} · ${data.m1.containers?.length || 0} cont` : 'Chưa có thông tin vận đơn';
      case 'm2':
        return data.m2.clearanceDate ? `Thông quan: ${data.m2.clearanceDate} · Phí HQ: ${data.m2.customsFee ? Number(data.m2.customsFee).toLocaleString('vi-VN') + '₫' : '—'}` : 'Chưa cập nhật thông quan';
      case 'm3':
        return data.m3.truckPlate ? `Xe: ${data.m3.truckPlate} · Tài xế: ${data.m3.driverName || '—'} · Xuất bến: ${data.m3.departureDate || '—'}` : 'Chưa gán phương tiện & tài xế';
      case 'm4':
        return data.m4.borderGateName ? `Cửa khẩu: ${data.m4.borderGateName} · Phí CK: ${data.m4.customsBorderFee ? Number(data.m4.customsBorderFee).toLocaleString('vi-VN') + '₫' : '—'}` : 'Chưa đến cửa khẩu xuất';
      case 'm5':
        return data.m5.depotName ? `Depot: ${data.m5.depotName} · Trả vỏ: ${data.m5.actualReturnDate || '—'}` : 'Chưa hạ vỏ container';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">

      {/* Global Save Toast Notification */}
      {savedSuccess && savedMilestoneKey === 'all' && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-in shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Đã lưu thành công toàn bộ 5 mốc và đồng bộ dữ liệu sang Tab Kế toán!</span>
        </div>
      )}

      {/* ── VERTICAL CONTINUOUS TIMELINE JOURNEY ── */}
      <div className="space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════
            MỐC 1: HÀNG ĐẾN CẢNG
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="milestone-section-m1" className="flex items-start gap-4 sm:gap-6">
          {/* Left: Spine Node */}
          <div className="flex flex-col items-center shrink-0 self-stretch pt-1">
            <button
              type="button"
              onClick={() => toggleMilestone('m1')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer z-10 ${
                v1.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : v1.missingFields.length > 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="1. Hàng đến cảng (Nhấp để mở/thu gọn)"
            >
              {v1.isCompleted ? <CheckCircle2 size={20} /> : <Anchor size={20} />}
            </button>
            <div className={`w-1 grow min-h-[40px] my-2 rounded-full transition-colors ${
              v1.isCompleted && v2.isCompleted
                ? 'bg-emerald-500'
                : v1.isCompleted
                ? 'bg-gradient-to-b from-emerald-500 to-slate-200 dark:to-slate-800'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
          </div>

          {/* Right: Milestone Card */}
          <div className={`flex-1 min-w-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-all shadow-xs overflow-hidden ${
            v1.isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Hàng đến cảng (Port Arrival)</h4>
                    {v1.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Còn thiếu {v1.missingFields.length} trường
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {getMilestoneSummary('m1')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveMilestone('m1')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMilestone('m1')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={expanded.m1 ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expanded.m1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {savedSuccess && savedMilestoneKey === 'm1' && (
              <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã lưu thông tin Mốc 1!
              </div>
            )}

            {/* Card Body */}
            {expanded.m1 && (
              <div className="p-6 space-y-6 animate-fade-in">
                {/* Nhóm 1: Thông tin vận đơn & hãng tàu */}
                <div>
                  <SectionHeader icon={<Package size={13} />} title="Vận đơn & Hãng tàu" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FieldGroup label="Số B/L (Bill of Lading)" required>
                      <input type="text" required placeholder="VD: SITCSZX260899"
                        value={data.m1.billOfLading || ''}
                        onChange={(e) => updateM1({ billOfLading: e.target.value.toUpperCase() })}
                        className={`${inputCls} font-mono font-bold text-blue-700 dark:text-blue-400`} />
                    </FieldGroup>
                    <FieldGroup label="Hãng tàu" required>
                      <input type="text" required placeholder="VD: SITC, COSCO, ONE, MAERSK…"
                        value={data.m1.shippingLine || ''}
                        onChange={(e) => updateM1({ shippingLine: e.target.value })}
                        className={inputCls} />
                    </FieldGroup>
                    <FieldGroup label="Tên tàu / Chuyến tàu">
                      <input type="text" placeholder="VD: SITC HOCHIMINH V.2608S"
                        value={data.m1.vesselName || ''}
                        onChange={(e) => updateM1({ vesselName: e.target.value })}
                        className={inputCls} />
                    </FieldGroup>
                  </div>
                </div>

                {/* Nhóm 2: Cảng đến & Ngày tàu cập */}
                <div>
                  <SectionHeader icon={<Anchor size={13} />} title="Cảng đến & Khai báo" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FieldGroup label="Ngày hàng đến cảng" required hint="Cơ sở tính hạn DEM & STO">
                      {(() => {
                        const issue = getFieldIssue('arrivalDate');
                        return (
                          <>
                            <input type="date" required value={data.m1.arrivalDate || ''}
                              onChange={(e) => updateM1({ arrivalDate: e.target.value })}
                              className={inputErrCls(issue)} />
                            <FieldIssueHint issue={issue} />
                          </>
                        );
                      })()}
                    </FieldGroup>

                    <FieldGroup label="Cảng đến" required>
                      <input type="text" required placeholder="VD: Cảng Cát Lái, Cảng Cái Mép…"
                        value={data.m1.arrivalPort || ''}
                        onChange={(e) => updateM1({ arrivalPort: e.target.value })}
                        className={inputCls} />
                    </FieldGroup>

                    <FieldGroup label="Chi cục hải quan" required>
                      <input type="text" required placeholder="VD: Chi cục HQ Cát Lái…"
                        value={data.m1.customsOffice || ''}
                        onChange={(e) => updateM1({ customsOffice: e.target.value })}
                        className={inputCls} />
                    </FieldGroup>

                    <FieldGroup label="Số tờ khai">
                      <input type="text" placeholder="VD: 106782390120"
                        value={data.m1.declarationNumber || ''}
                        onChange={(e) => updateM1({ declarationNumber: e.target.value })}
                        className={`${inputCls} font-mono`} />
                    </FieldGroup>

                    <FieldGroup label="Ngày tờ khai">
                      <input type="date" value={data.m1.declarationDate || ''}
                        onChange={(e) => updateM1({ declarationDate: e.target.value })}
                        className={inputCls} />
                    </FieldGroup>

                    <FieldGroup label="Luồng tờ khai">
                      <select value={data.m1.declarationChannel || 'YELLOW'}
                        onChange={(e) => updateM1({ declarationChannel: e.target.value as any })}
                        className={inputCls}>
                        <option value="GREEN">🟢 Luồng Xanh — Thông quan tự động</option>
                        <option value="YELLOW">🟡 Luồng Vàng — Kiểm tra hồ sơ</option>
                        <option value="RED">🔴 Luồng Đỏ — Kiểm tra thực tế hàng hóa</option>
                      </select>
                    </FieldGroup>

                    <FieldGroup label="Phí local charge (₫)" hint="Tự động đồng bộ sang Kế toán">
                      <CurrencyInput placeholder="VD: 2,850,000"
                        value={data.m1.localChargeFee}
                        onChange={(val) => updateM1({ localChargeFee: val })} />
                    </FieldGroup>
                  </div>
                </div>

                {/* Nhóm 3: Định mức DEM/DET/STO */}
                <div>
                  <SectionHeader icon={<Clock size={13} />} title="Định mức & Hạn chót Lưu bãi / Lưu vỏ (DEM / DET / STO)" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* DEM */}
                    <div className="bg-red-50/50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200/80 dark:border-red-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">DEM — Lưu container tại cảng</span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={data.m1.freeDemDays ?? 3}
                          onChange={(e) => updateM1({ freeDemDays: Number(e.target.value) })}
                          className="w-16 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">ngày miễn phí</span>
                      </div>
                      <div className="pt-2 border-t border-red-100 dark:border-red-900/40 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Hạn chót:</span>
                        <span className="font-bold text-red-700 dark:text-red-400 font-mono">{data.m1.demExpiryDate || '—'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">= ngày đến + {(data.m1.freeDemDays || 3) - 1} ngày</p>
                    </div>

                    {/* DET */}
                    <div className="bg-purple-50/50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">DET — Sử dụng vỏ container</span>
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={data.m1.freeDetDays ?? 4}
                          onChange={(e) => updateM1({ freeDetDays: Number(e.target.value) })}
                          className="w-16 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">ngày miễn phí</span>
                      </div>
                      <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Hạn chót:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">{data.m3.detExpiryDate || '—'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">= ngày xuất bến (Mốc 3) + {(data.m1.freeDetDays || 4) - 1} ngày</p>
                    </div>

                    {/* STO */}
                    <div className="bg-orange-50/50 dark:bg-orange-950/30 p-3.5 rounded-xl border border-orange-200/80 dark:border-orange-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">STO — Lưu hàng tại bãi cảng</span>
                        <span className="text-[10px] bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold">Cảng thu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={data.m1.freeStoDays ?? 2}
                          onChange={(e) => updateM1({ freeStoDays: Number(e.target.value) })}
                          className="w-16 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">ngày miễn phí</span>
                      </div>
                      <div className="pt-2 border-t border-orange-100 dark:border-orange-900/40 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Hạn chót:</span>
                        <span className="font-bold text-orange-700 dark:text-orange-400 font-mono">{data.m1.stoExpiryDate || '—'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">= ngày đến + {(data.m1.freeStoDays || 2) - 1} ngày</p>
                    </div>
                  </div>
                </div>

                {/* Nhóm 4: Container & Seal */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader icon={<Box size={13} />} title="Container & Seal" badge={<span className="text-red-500 font-bold text-xs">*</span>} />
                    <button type="button" onClick={handleAddContainer}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all flex items-center gap-1 cursor-pointer">
                      <Plus size={13} /> Thêm container
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">#</th>
                          <th className="px-3 py-2.5">Số container <span className="text-red-500">*</span></th>
                          <th className="px-3 py-2.5">Số seal <span className="text-red-500">*</span></th>
                          <th className="px-3 py-2.5 w-40">Loại container</th>
                          <th className="px-3 py-2.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(!data.m1.containers || data.m1.containers.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                              Chưa có container. Nhấn "+ Thêm container" để thêm.
                            </td>
                          </tr>
                        ) : (
                          data.m1.containers.map((cont, idx) => (
                            <tr key={cont.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-center font-semibold text-slate-500">{idx + 1}</td>
                              <td className="px-2 py-1.5">
                                <input type="text" required placeholder="VD: SITU8934120"
                                  value={cont.containerNumber}
                                  onChange={(e) => handleUpdateContainer(idx, 'containerNumber', e.target.value.toUpperCase())}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase text-blue-700 dark:text-blue-400 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="text" required placeholder="VD: VN882341"
                                  value={cont.sealNumber}
                                  onChange={(e) => handleUpdateContainer(idx, 'sealNumber', e.target.value.toUpperCase())}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                              </td>
                              <td className="px-2 py-1.5">
                                <select value={cont.containerType || '40HC'}
                                  onChange={(e) => handleUpdateContainer(idx, 'containerType', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
                                  <option value="40HC">40ft High Cube (40HC)</option>
                                  <option value="20GP">20ft General (20GP)</option>
                                  <option value="40GP">40ft General (40GP)</option>
                                  <option value="45HC">45ft High Cube (45HC)</option>
                                  <option value="20RF">20ft Reefer (20RF)</option>
                                  <option value="40RF">40ft Reefer (40RF)</option>
                                  <option value="LCL">Hàng lẻ (LCL)</option>
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button type="button" onClick={() => handleRemoveContainer(idx)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer" title="Xóa container">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Nhóm tuỳ chọn */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button type="button" onClick={() => setShowOptionalM1(!showOptionalM1)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer">
                    {showOptionalM1 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    {showOptionalM1 ? 'Thu gọn thông tin thêm' : 'Thông tin thêm (tùy chọn: HS Code, Commodity, Phí cược cont…)'}
                  </button>
                  {showOptionalM1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-2 animate-fade-in">
                      <FieldGroup label="Tên hàng hóa (Commodity)">
                        <input type="text" placeholder="VD: Thiết bị điện tử, Hạt nhựa…"
                          value={data.m1.commodityName || ''}
                          onChange={(e) => updateM1({ commodityName: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                      <FieldGroup label="Mã HS Code">
                        <input type="text" placeholder="VD: 8471.30.20"
                          value={data.m1.hsCode || ''}
                          onChange={(e) => updateM1({ hsCode: e.target.value })}
                          className={`${inputCls} font-mono font-semibold`} />
                      </FieldGroup>
                      <FieldGroup label="Phí cược container (₫)">
                        <CurrencyInput placeholder="VD: 5,000,000"
                          value={data.m1.containerDepositFee}
                          onChange={(val) => updateM1({ containerDepositFee: val })} />
                      </FieldGroup>
                      <FieldGroup label="Phí khai báo hải quan (₫)">
                        <CurrencyInput placeholder="VD: 800,000"
                          value={data.m1.declarationServiceFee}
                          onChange={(val) => updateM1({ declarationServiceFee: val })} />
                      </FieldGroup>
                      <div className="sm:col-span-2">
                        <FieldGroup label="Ghi chú">
                          <textarea rows={2} placeholder="Tình trạng bãi cảng, thời gian bốc hạ…"
                            value={data.m1.notes || ''}
                            onChange={(e) => updateM1({ notes: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MỐC 2: HẢI QUAN & THÔNG QUAN
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="milestone-section-m2" className="flex items-start gap-4 sm:gap-6">
          {/* Left: Spine Node */}
          <div className="flex flex-col items-center shrink-0 self-stretch pt-1">
            <button
              type="button"
              onClick={() => toggleMilestone('m2')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer z-10 ${
                v2.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : v2.missingFields.length > 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="2. Thông quan Hải quan (Nhấp để mở/thu gọn)"
            >
              {v2.isCompleted ? <CheckCircle2 size={20} /> : <FileCheck2 size={20} />}
            </button>
            <div className={`w-1 grow min-h-[40px] my-2 rounded-full transition-colors ${
              v2.isCompleted && v3.isCompleted
                ? 'bg-emerald-500'
                : v2.isCompleted
                ? 'bg-gradient-to-b from-emerald-500 to-slate-200 dark:to-slate-800'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
          </div>

          {/* Right: Milestone Card */}
          <div className={`flex-1 min-w-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-all shadow-xs overflow-hidden ${
            v2.isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. Thông quan Hải quan (Customs Clearance)</h4>
                    {v2.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Còn thiếu {v2.missingFields.length} trường
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {getMilestoneSummary('m2')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveMilestone('m2')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMilestone('m2')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={expanded.m2 ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expanded.m2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {savedSuccess && savedMilestoneKey === 'm2' && (
              <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã lưu thông tin Mốc 2!
              </div>
            )}

            {/* Card Body */}
            {expanded.m2 && (
              <div className="p-6 space-y-6 animate-fade-in">
                <div>
                  <SectionHeader icon={<FileCheck2 size={13} />} title="Phí hải quan & Niêm phong" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FieldGroup label="Phí hải quan (₫)" required>
                      <CurrencyInput required placeholder="VD: 500,000"
                        value={data.m2.customsFee}
                        onChange={(val) => updateM2({ customsFee: val })} />
                    </FieldGroup>
                    <FieldGroup label="Phí seal định vị (₫)" required>
                      <CurrencyInput required placeholder="VD: 350,000"
                        value={data.m2.sealTrackingFee}
                        onChange={(val) => updateM2({ sealTrackingFee: val })} />
                    </FieldGroup>
                    <FieldGroup label="Phí cảng (₫)" required>
                      <CurrencyInput required placeholder="VD: 1,200,000"
                        value={data.m2.portFee}
                        onChange={(val) => updateM2({ portFee: val })} />
                    </FieldGroup>
                  </div>
                </div>

                <div>
                  <SectionHeader icon={<Calendar size={13} />} title="Thời gian thông quan" />
                  <div className="max-w-xs">
                    <FieldGroup label="Ngày thông quan" required>
                      {(() => {
                        const issue = getFieldIssue('clearanceDate');
                        return (
                          <>
                            <input type="date" required value={data.m2.clearanceDate || ''}
                              onChange={(e) => updateM2({ clearanceDate: e.target.value })}
                              className={inputErrCls(issue)} />
                            <FieldIssueHint issue={issue} />
                          </>
                        );
                      })()}
                    </FieldGroup>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button type="button" onClick={() => setShowOptionalM2(!showOptionalM2)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer">
                    {showOptionalM2 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    {showOptionalM2 ? 'Thu gọn' : 'Phụ phí & thông tin thêm (tùy chọn: kiểm hóa, giấy phép quá cảnh…)'}
                  </button>
                  {showOptionalM2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-2 animate-fade-in">
                      <FieldGroup label="Phí soi chiếu (₫)">
                        <CurrencyInput placeholder="VD: 400,000"
                          value={data.m2.inspectionScanFee}
                          onChange={(val) => updateM2({ inspectionScanFee: val })} />
                      </FieldGroup>
                      <FieldGroup label="Phí kiểm hóa (₫)">
                        <CurrencyInput placeholder="VD: 500,000"
                          value={data.m2.physicalCheckFee}
                          onChange={(val) => updateM2({ physicalCheckFee: val })} />
                      </FieldGroup>
                      <FieldGroup label="Giấy phép vận chuyển quá cảnh">
                        <input type="text" placeholder="VD: QC-VN-2026-8812"
                          value={data.m2.transitPermitNo || ''}
                          onChange={(e) => updateM2({ transitPermitNo: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                      <div className="sm:col-span-3">
                        <FieldGroup label="Ghi chú hải quan">
                          <textarea rows={2} placeholder="Phân luồng, thời gian ký duyệt của cán bộ HQ…"
                            value={data.m2.notes || ''}
                            onChange={(e) => updateM2({ notes: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MỐC 3: VẬN CHUYỂN ĐƯỜNG BỘ
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="milestone-section-m3" className="flex items-start gap-4 sm:gap-6">
          {/* Left: Spine Node */}
          <div className="flex flex-col items-center shrink-0 self-stretch pt-1">
            <button
              type="button"
              onClick={() => toggleMilestone('m3')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer z-10 ${
                v3.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : v3.missingFields.length > 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="3. Vận chuyển đường bộ (Nhấp để mở/thu gọn)"
            >
              {v3.isCompleted ? <CheckCircle2 size={20} /> : <Truck size={20} />}
            </button>
            <div className={`w-1 grow min-h-[40px] my-2 rounded-full transition-colors ${
              v3.isCompleted && v4.isCompleted
                ? 'bg-emerald-500'
                : v3.isCompleted
                ? 'bg-gradient-to-b from-emerald-500 to-slate-200 dark:to-slate-800'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
          </div>

          {/* Right: Milestone Card */}
          <div className={`flex-1 min-w-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-all shadow-xs overflow-hidden ${
            v3.isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. Vận chuyển đường bộ (Inland Trucking)</h4>
                    {v3.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Còn thiếu {v3.missingFields.length} trường
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {getMilestoneSummary('m3')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveMilestone('m3')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMilestone('m3')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={expanded.m3 ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expanded.m3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {savedSuccess && savedMilestoneKey === 'm3' && (
              <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã lưu thông tin Mốc 3!
              </div>
            )}

            {/* Card Body */}
            {expanded.m3 && (
              <div className="p-6 space-y-6 animate-fade-in">
                {/* Nhóm 1: Nhà vận tải & Xe */}
                <div>
                  <SectionHeader icon={<Truck size={13} />} title="Nhà vận tải & Xe đầu kéo" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <FieldGroup label="Nhà vận tải" required>
                        <input type="text" required placeholder="VD: Vận tải Á Châu, Nam Việt…"
                          value={data.m3.carrierName || ''}
                          onChange={(e) => updateM3({ carrierName: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Biển số xe" required>
                      <input type="text" required placeholder="VD: 51C-892.44"
                        value={data.m3.truckPlate || ''}
                        onChange={(e) => updateM3({ truckPlate: e.target.value.toUpperCase() })}
                        className={`${inputCls} font-mono font-bold`} />
                    </FieldGroup>
                    <div>{/* spacer */}</div>
                    <FieldGroup label="Tên tài xế" required>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" required placeholder="Nguyễn Văn Hùng"
                          value={data.m3.driverName || ''}
                          onChange={(e) => updateM3({ driverName: e.target.value })}
                          className={`${inputCls} pl-8`} />
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Số điện thoại tài xế" required>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" required placeholder="0908 123 456"
                          value={data.m3.driverPhone || ''}
                          onChange={(e) => updateM3({ driverPhone: e.target.value })}
                          className={`${inputCls} pl-8 font-mono`} />
                      </div>
                    </FieldGroup>
                  </div>
                </div>

                {/* Nhóm 2: Lịch trình */}
                <div>
                  <SectionHeader icon={<MapPin size={13} />} title="Lịch trình vận chuyển" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FieldGroup label="Tuyến đường" required>
                        <input type="text" required placeholder="VD: Cát Lái (TP.HCM) → QL22 → Cửa khẩu Mộc Bài (Tây Ninh)"
                          value={data.m3.route || ''}
                          onChange={(e) => updateM3({ route: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Ngày xuất bến khỏi cảng" required hint={data.m3.detExpiryDate ? `Kích hoạt hạn DET: ${data.m3.detExpiryDate}` : 'Nhập để tự động tính hạn DET'}>
                      {(() => {
                        const issue = getFieldIssue('departureDate');
                        return (
                          <>
                            <input type="date" required value={data.m3.departureDate || ''}
                              onChange={(e) => updateM3({ departureDate: e.target.value })}
                              className={inputErrCls(issue)} />
                            <FieldIssueHint issue={issue} />
                          </>
                        );
                      })()}
                    </FieldGroup>
                    <FieldGroup label="Ngày tới cảng đích" required>
                      {(() => {
                        const issue = getFieldIssue('destinationArrivalDate');
                        return (
                          <>
                            <input type="date" required value={data.m3.destinationArrivalDate || ''}
                              onChange={(e) => updateM3({ destinationArrivalDate: e.target.value })}
                              className={inputErrCls(issue)} />
                            <FieldIssueHint issue={issue} />
                          </>
                        );
                      })()}
                    </FieldGroup>
                  </div>
                </div>

                {/* Nhóm 3: Chi phí */}
                <div>
                  <SectionHeader icon={<DollarSign size={13} />} title="Chi phí vận chuyển" />
                  <div className="max-w-xs">
                    <FieldGroup label="Phí vận chuyển (₫)" required>
                      <CurrencyInput required placeholder="VD: 8,500,000"
                        value={data.m3.transportFee}
                        onChange={(val) => updateM3({ transportFee: val })} />
                    </FieldGroup>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button type="button" onClick={() => setShowOptionalM3(!showOptionalM3)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer">
                    {showOptionalM3 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    {showOptionalM3 ? 'Thu gọn' : 'Phụ phí phát sinh & ghi chú (tùy chọn)'}
                  </button>
                  {showOptionalM3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-2 animate-fade-in">
                      <FieldGroup label="Phụ phí phát sinh (₫)">
                        <CurrencyInput placeholder="VD: 500,000"
                          value={data.m3.extraFees}
                          onChange={(val) => updateM3({ extraFees: val })} />
                      </FieldGroup>
                      <div className="sm:col-span-2">
                        <FieldGroup label="Nội dung phụ phí">
                          <input type="text" placeholder="VD: Phí lưu đêm xe, bốc xếp ngoài giờ…"
                            value={data.m3.extraFeeDescription || ''}
                            onChange={(e) => updateM3({ extraFeeDescription: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                      <div className="sm:col-span-3">
                        <FieldGroup label="Ghi chú vận chuyển">
                          <textarea rows={2} placeholder="Định vị xe, sự cố dọc đường…"
                            value={data.m3.notes || ''}
                            onChange={(e) => updateM3({ notes: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MỐC 4: CỬA KHẨU XUẤT (QUÁ CẢNH)
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="milestone-section-m4" className="flex items-start gap-4 sm:gap-6">
          {/* Left: Spine Node */}
          <div className="flex flex-col items-center shrink-0 self-stretch pt-1">
            <button
              type="button"
              onClick={() => toggleMilestone('m4')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer z-10 ${
                v4.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : v4.missingFields.length > 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="4. Cửa khẩu xuất (Nhấp để mở/thu gọn)"
            >
              {v4.isCompleted ? <CheckCircle2 size={20} /> : <Building2 size={20} />}
            </button>
            <div className={`w-1 grow min-h-[40px] my-2 rounded-full transition-colors ${
              v4.isCompleted && v5.isCompleted
                ? 'bg-emerald-500'
                : v4.isCompleted
                ? 'bg-gradient-to-b from-emerald-500 to-slate-200 dark:to-slate-800'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
          </div>

          {/* Right: Milestone Card */}
          <div className={`flex-1 min-w-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-all shadow-xs overflow-hidden ${
            v4.isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  4
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">4. Cửa khẩu xuất (Border Gate Transit)</h4>
                    {v4.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Còn thiếu {v4.missingFields.length} trường
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {getMilestoneSummary('m4')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveMilestone('m4')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMilestone('m4')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={expanded.m4 ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expanded.m4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {savedSuccess && savedMilestoneKey === 'm4' && (
              <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã lưu thông tin Mốc 4!
              </div>
            )}

            {/* Card Body */}
            {expanded.m4 && (
              <div className="p-6 space-y-6 animate-fade-in">
                {/* Nghiệp vụ info */}
                <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3.5 flex items-start gap-3">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <span className="font-bold">Nghiệp vụ tại cửa khẩu:</span> Xe giao container đầy hàng cho đối tác vận tải Campuchia. Cửa khẩu bàn giao lại vỏ container rỗng để xe mang về trả tại depot Việt Nam.
                  </p>
                </div>

                <div>
                  <SectionHeader icon={<Building2 size={13} />} title="Thông tin cửa khẩu & Phí" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <FieldGroup label="Tên cửa khẩu" required>
                        <input type="text" required placeholder="VD: CK Quốc tế Mộc Bài, Hoa Lư, Xa Mát…"
                          value={data.m4.borderGateName || ''}
                          onChange={(e) => updateM4({ borderGateName: e.target.value })}
                          className={`${inputCls} font-semibold`} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Phí hải quan CK (₫)" required>
                      <CurrencyInput required placeholder="VD: 400,000"
                        value={data.m4.customsBorderFee}
                        onChange={(val) => updateM4({ customsBorderFee: val })} />
                    </FieldGroup>
                    <FieldGroup label="Phí dịch vụ CK (₫)" required>
                      <CurrencyInput required placeholder="VD: 600,000"
                        value={data.m4.serviceFee}
                        onChange={(val) => updateM4({ serviceFee: val })} />
                    </FieldGroup>
                    <FieldGroup label="Phí cửa khẩu (₫)" required>
                      <CurrencyInput required placeholder="VD: 300,000"
                        value={data.m4.borderFee}
                        onChange={(val) => updateM4({ borderFee: val })} />
                    </FieldGroup>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button type="button" onClick={() => setShowOptionalM4(!showOptionalM4)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer">
                    {showOptionalM4 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    {showOptionalM4 ? 'Thu gọn' : 'Ngày qua cửa khẩu & phụ phí (tùy chọn)'}
                  </button>
                  {showOptionalM4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-2 animate-fade-in">
                      <FieldGroup label="Ngày hàng qua cửa khẩu">
                        {(() => {
                          const issue = getFieldIssue('borderPassDate');
                          return (
                            <>
                              <input type="date" value={data.m4.borderPassDate || ''}
                                onChange={(e) => updateM4({ borderPassDate: e.target.value })}
                                className={inputErrCls(issue)} />
                              <FieldIssueHint issue={issue} />
                            </>
                          );
                        })()}
                      </FieldGroup>
                      <FieldGroup label="Phụ phí phát sinh (₫)">
                        <CurrencyInput placeholder="VD: 200,000"
                          value={data.m4.extraFees}
                          onChange={(val) => updateM4({ extraFees: val })} />
                      </FieldGroup>
                      <FieldGroup label="Nội dung phụ phí">
                        <input type="text" placeholder="VD: Phí sang xe, bốc xếp kiểm hóa…"
                          value={data.m4.extraFeeDescription || ''}
                          onChange={(e) => updateM4({ extraFeeDescription: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                      <div className="sm:col-span-3">
                        <FieldGroup label="Ghi chú cửa khẩu">
                          <textarea rows={2} placeholder="Đổi cont, bàn giao phiếu kiểm hóa…"
                            value={data.m4.notes || ''}
                            onChange={(e) => updateM4({ notes: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MỐC 5: HẠ VỎ & TRẢ RỖNG
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="milestone-section-m5" className="flex items-start gap-4 sm:gap-6">
          {/* Left: Spine Node */}
          <div className="flex flex-col items-center shrink-0 self-stretch pt-1">
            <button
              type="button"
              onClick={() => toggleMilestone('m5')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer z-10 ${
                v5.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : v5.missingFields.length > 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title="5. Trả rỗng depot (Nhấp để mở/thu gọn)"
            >
              {v5.isCompleted ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}
            </button>
            {/* End of line: subtle terminal dot */}
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 my-2" />
          </div>

          {/* Right: Milestone Card */}
          <div className={`flex-1 min-w-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border transition-all shadow-xs overflow-hidden ${
            v5.isCompleted ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  5
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">5. Hạ vỏ & Trả rỗng (Empty Container Return)</h4>
                    {v5.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Còn thiếu {v5.missingFields.length} trường
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {getMilestoneSummary('m5')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveMilestone('m5')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Lưu mốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMilestone('m5')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={expanded.m5 ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expanded.m5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {savedSuccess && savedMilestoneKey === 'm5' && (
              <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Đã lưu thông tin Mốc 5!
              </div>
            )}

            {/* Card Body */}
            {expanded.m5 && (
              <div className="p-6 space-y-6 animate-fade-in">
                <div>
                  <SectionHeader icon={<RotateCcw size={13} />} title="Thông tin trả vỏ container" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <FieldGroup label="Tên depot nhận vỏ" required>
                        <input type="text" required placeholder="VD: Depot Tân Cảng Suối Tiên, ICD Sotrans…"
                          value={data.m5.depotName || ''}
                          onChange={(e) => updateM5({ depotName: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Phí trả rỗng (₫)" required>
                      <CurrencyInput required placeholder="VD: 750,000"
                        value={data.m5.returnFee}
                        onChange={(val) => updateM5({ returnFee: val })} />
                    </FieldGroup>

                    <FieldGroup label="Ngày trả vỏ container" required>
                      {(() => {
                        const issue = getFieldIssue('actualReturnDate');
                        return (
                          <>
                            <input type="date" required value={data.m5.actualReturnDate || ''}
                              onChange={(e) => updateM5({ actualReturnDate: e.target.value })}
                              className={inputErrCls(issue)} />
                            <FieldIssueHint issue={issue} />
                          </>
                        );
                      })()}
                    </FieldGroup>

                    {/* DET vs Ngày trả status card */}
                    {data.m3.detExpiryDate && (
                      <div className={`sm:col-span-2 p-3.5 rounded-xl border flex items-center gap-3 ${
                        data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                      }`}>
                        <div className={`p-2 rounded-lg shrink-0 ${
                          data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        }`}>
                          {data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                            ? <AlertTriangle size={16} />
                            : <CheckCircle2 size={16} />}
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                            {data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                              ? '🚨 Trả vỏ trễ hạn DET — Có thể phát sinh phí phạt lưu vỏ'
                              : data.m5.actualReturnDate
                              ? '✅ Trả vỏ đúng hạn DET miễn phí'
                              : '⏳ Chưa có ngày trả — Hạn chót DET là ' + data.m3.detExpiryDate}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Hạn DET: <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{data.m3.detExpiryDate}</span>
                            {data.m5.actualReturnDate && <> · Ngày trả: <span className="font-mono font-bold text-slate-900 dark:text-white">{data.m5.actualReturnDate}</span></>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button type="button" onClick={() => setShowOptionalM5(!showOptionalM5)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer">
                    {showOptionalM5 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    {showOptionalM5 ? 'Thu gọn' : 'Phụ phí phát sinh & Tình trạng vỏ container (tùy chọn)'}
                  </button>
                  {showOptionalM5 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-2 animate-fade-in">
                      <FieldGroup label="Phụ phí phát sinh (₫)">
                        <CurrencyInput placeholder="VD: 300,000 (sửa chữa, rửa cont…)"
                          value={data.m5.extraFees}
                          onChange={(val) => updateM5({ extraFees: val })} />
                      </FieldGroup>
                      <FieldGroup label="Nội dung phụ phí">
                        <input type="text" placeholder="VD: Phí sửa móp vách container…"
                          value={data.m5.extraFeeDescription || ''}
                          onChange={(e) => updateM5({ extraFeeDescription: e.target.value })}
                          className={inputCls} />
                      </FieldGroup>
                      <div className="sm:col-span-2">
                        <FieldGroup label="Tình trạng vỏ container & Ghi chú">
                          <textarea rows={2} placeholder="VD: Vỏ cont nguyên vẹn, đã có phiếu EIR từ depot…"
                            value={data.m5.containerCondition || ''}
                            onChange={(e) => updateM5({ containerCondition: e.target.value })}
                            className={inputCls} />
                        </FieldGroup>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── BOTTOM GLOBAL ACTIONS ── */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            allCompleted ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
          }`}>
            {allCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {allCompleted ? '🎉 Toàn bộ 5 mốc vận hành đã hoàn tất' : `Đang hoàn thiện: ${completedCount}/5 mốc đã xong`}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mọi thay đổi chi phí đều được đồng bộ tự động sang Tab Tài chính & Đối chiếu Kế toán.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {onNavigateToFinancial && (
            <button 
              type="button" 
              onClick={onNavigateToFinancial} 
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <DollarSign size={13} />
              <span>Đối chiếu Kế toán</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </div>

    </div>
  );
}
