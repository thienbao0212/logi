import React, { useState, useEffect, useMemo } from 'react';
import { 
  Anchor, 
  FileCheck2, 
  Truck, 
  Building2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  ExternalLink, 
  DollarSign, 
  Box, 
  Info,
  ChevronLeft,
  ChevronRight,
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

const MILESTONES_CONFIG = [
  { id: 0, key: 'm1', label: '1. Hàng đến cảng', shortLabel: 'Cảng', icon: Anchor },
  { id: 1, key: 'm2', label: '2. Hải quan', shortLabel: 'Hải quan', icon: FileCheck2 },
  { id: 2, key: 'm3', label: '3. Vận chuyển', shortLabel: 'Vận chuyển', icon: Truck },
  { id: 3, key: 'm4', label: '4. Cửa khẩu', shortLabel: 'Cửa khẩu', icon: Building2 },
  { id: 4, key: 'm5', label: '5. Trả rỗng', shortLabel: 'Trả rỗng', icon: RotateCcw },
];

// Shared input class helpers
const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400';
const inputErrCls = (issue: any) =>
  issue
    ? issue.type === 'ERROR'
      ? 'border-red-400 ring-2 ring-red-100 bg-red-50/40 text-red-900 focus:outline-none'
      : 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/40 text-amber-900 focus:outline-none'
    : inputCls;

// Section header with left accent bar
function SectionHeader({ icon, title, badge }: { icon?: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
      {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
      {badge && <span className="ml-1">{badge}</span>}
    </div>
  );
}

// Field wrapper
function FieldGroup({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
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
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<TransitMilestonesData>(() => loadMilestonesFromStorage(shipment.id, shipment));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

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

  // --- Timeline scan ---
  const timelineIssues = useMemo(() => scanShipmentTimeline(data), [data]);
  const errorIssues = useMemo(() => timelineIssues.filter(i => i.type === 'ERROR'), [timelineIssues]);
  const warningIssues = useMemo(() => timelineIssues.filter(i => i.type === 'WARNING'), [timelineIssues]);
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

  // --- Save ---
  const handleSave = () => {
    saveMilestonesToStorage(shipment.id, data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onMilestonesChange) onMilestonesChange(data);
    if (checkAllMilestonesCompleted(data) && onAllCompleted) onAllCompleted();
  };

  const currentValidation = validations[activeStep];

  return (
    <div className="space-y-4">

      {/* ── Timeline Stepper ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-6 py-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">5 Mốc vận hành</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Điền đầy đủ trường <span className="text-red-500 font-bold">*</span> để hoàn thành mỗi mốc · Phí tự động đồng bộ sang Kế toán
            </p>
          </div>
          <div className="shrink-0">
            {allCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                <CheckCircle2 size={13} className="text-emerald-600" /> Hoàn thành 5/5
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                <Clock size={13} className="text-slate-500" /> {completedCount}/5 mốc
              </span>
            )}
          </div>
        </div>

        {/* Timeline track */}
        <div className="relative flex items-start">
          {/* Connecting line — sits behind nodes */}
          <div className="absolute top-4 left-0 right-0 h-px bg-slate-200 z-0" />

          {MILESTONES_CONFIG.map((step, idx) => {
            const Icon = step.icon;
            const isDone = validations[idx].isCompleted;
            const isActive = activeStep === idx;
            const isPast = idx < activeStep;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center flex-1 min-w-0 group">
                {/* Connector segment — colored when done */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-px transition-all duration-500 -z-0 ${
                      isDone || isPast ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Node button */}
                <button
                  type="button"
                  onClick={() => { setActiveStep(idx); setShowOptional(false); }}
                  className="relative flex items-center justify-center focus:outline-none"
                  title={step.label}
                >
                  {/* Outer pulse ring for active */}
                  {isActive && (
                    <span className="absolute w-9 h-9 rounded-full bg-blue-100 animate-pulse" />
                  )}

                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-sm ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {isDone
                      ? <CheckCircle2 size={16} className="text-white" />
                      : <Icon size={15} />
                    }
                  </div>
                </button>

                {/* Label + status below node */}
                <button
                  type="button"
                  onClick={() => { setActiveStep(idx); setShowOptional(false); }}
                  className="mt-2.5 text-center focus:outline-none"
                >
                  <div className={`text-[11px] font-bold leading-tight transition-colors ${
                    isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    {step.shortLabel}
                  </div>
                  <div className={`text-[10px] mt-0.5 font-medium ${
                    isDone
                      ? 'text-emerald-600'
                      : isActive
                      ? 'text-blue-500'
                      : 'text-slate-400'
                  }`}>
                    {isDone ? '✓ Xong' : isActive ? 'Đang nhập' : `Còn ${validations[idx].missingFields.length > 0 ? validations[idx].missingFields.length + ' trường' : '—'}`}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Timeline Health Banner ── */}
      {timelineIssues.length > 0 ? (
        <div className={`p-4 rounded-2xl border ${
          errorIssues.length > 0
            ? 'bg-rose-50/90 border-rose-200'
            : 'bg-amber-50/90 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg shrink-0 ${errorIssues.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              {errorIssues.length > 0 ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Kiểm tra tính hợp lệ dòng thời gian</span>
              <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                errorIssues.length > 0 ? 'bg-rose-200/80 text-rose-900' : 'bg-amber-200/80 text-amber-900'
              }`}>
                {errorIssues.length > 0 && `${errorIssues.length} lỗi`}
                {errorIssues.length > 0 && warningIssues.length > 0 && ' · '}
                {warningIssues.length > 0 && `${warningIssues.length} cảnh báo`}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {timelineIssues.map((issue) => {
              const isErr = issue.type === 'ERROR';
              const targetMs = issue.milestones[issue.milestones.length - 1];
              const msIdx = targetMs === 'm1' ? 0 : targetMs === 'm2' ? 1 : targetMs === 'm3' ? 2 : targetMs === 'm4' ? 3 : 4;
              return (
                <div key={issue.id} className={`p-3 rounded-xl border bg-white/95 text-xs ${isErr ? 'border-rose-200' : 'border-amber-200'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isErr ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isErr ? '🚨 Lỗi ngược thời gian' : '⚠️ Cảnh báo hạn chót'}
                    </span>
                    <button type="button" onClick={() => setActiveStep(msIdx)} className="text-[11px] font-bold text-blue-600 hover:underline">
                      Sửa tại {MILESTONES_CONFIG[msIdx].shortLabel} →
                    </button>
                  </div>
                  <div className="font-bold text-slate-900">{issue.title}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{issue.message}</p>
                  {issue.suggestion && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 flex items-start gap-1">
                      <span className="font-bold text-blue-600 shrink-0">💡</span>
                      <span>{issue.suggestion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : data.m1?.arrivalDate ? (
        <div className="px-4 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">Dòng thời gian qua 5 mốc hợp lệ và đúng thứ tự quy trình.</span>
        </div>
      ) : null}

      {/* ── Main Content Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">

        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              {React.createElement(MILESTONES_CONFIG[activeStep].icon, { size: 18 })}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">{MILESTONES_CONFIG[activeStep].label}</h3>
                {currentValidation.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Đã hoàn thành
                  </span>
                ) : currentValidation.missingFields.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={11} /> Còn thiếu {currentValidation.missingFields.length} trường
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Chưa có dữ liệu
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Dữ liệu sẽ tự động đồng bộ qua tab Kế toán khi lưu.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToFinancial && (
              <button type="button" onClick={onNavigateToFinancial} className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5">
                <DollarSign size={13} />
                <span>Kế toán</span>
                <ExternalLink size={11} />
              </button>
            )}
            <button type="button" onClick={handleSave} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5">
              <Save size={13} />
              <span>Lưu mốc</span>
            </button>
          </div>
        </div>

        {/* Save success toast */}
        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Đã lưu thành công và đồng bộ sang Kế toán!</span>
          </div>
        )}

        {/* ── Step Body ── */}
        <div className="p-6 space-y-8">

          {/* ═══════════════════════════════════════════
              MỐC 1: HÀNG ĐẾN CẢNG
          ═══════════════════════════════════════════ */}
          {activeStep === 0 && (
            <div className="space-y-8">

              {/* Nhóm 1: Thông tin vận đơn & hãng tàu */}
              <div>
                <SectionHeader icon={<Package size={13} />} title="Vận đơn & Hãng tàu" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldGroup label="Số B/L (Bill of Lading)" required>
                    <input type="text" required placeholder="VD: SITCSZX260899"
                      value={data.m1.billOfLading || ''}
                      onChange={(e) => updateM1({ billOfLading: e.target.value.toUpperCase() })}
                      className={`${inputCls} font-mono font-bold text-blue-700`} />
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

              {/* Nhóm 2: Thông tin cảng đến & hải quan */}
              <div>
                <SectionHeader icon={<Anchor size={13} />} title="Cảng đến & Khai báo" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FieldGroup label="Ngày hàng đến cảng" required>
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
                    <input type="text" required placeholder="VD: Cảng Cát Lái (VNSGN)"
                      value={data.m1.arrivalPort || ''}
                      onChange={(e) => updateM1({ arrivalPort: e.target.value })}
                      className={inputCls} />
                  </FieldGroup>
                  <FieldGroup label="Chi cục hải quan" required>
                    <input type="text" required placeholder="VD: Chi cục HQ Cát Lái"
                      value={data.m1.customsOffice || ''}
                      onChange={(e) => updateM1({ customsOffice: e.target.value })}
                      className={inputCls} />
                  </FieldGroup>

                  <FieldGroup label="Số tờ khai" required>
                    <input type="text" required placeholder="VD: 106782390120"
                      value={data.m1.declarationNumber || ''}
                      onChange={(e) => updateM1({ declarationNumber: e.target.value })}
                      className={`${inputCls} font-mono font-semibold`} />
                  </FieldGroup>
                  <FieldGroup label="Ngày tờ khai" required>
                    <input type="date" required value={data.m1.declarationDate || ''}
                      onChange={(e) => updateM1({ declarationDate: e.target.value })}
                      className={inputCls} />
                  </FieldGroup>
                  <FieldGroup label="Luồng tờ khai" required>
                    <select value={data.m1.declarationChannel || ''}
                      onChange={(e) => updateM1({ declarationChannel: e.target.value as any })}
                      className={`${inputCls} cursor-pointer`}>
                      <option value="">-- Chọn luồng --</option>
                      <option value="GREEN">🟢 Luồng Xanh — Thông quan ngay</option>
                      <option value="YELLOW">🟡 Luồng Vàng — Kiểm tra hồ sơ</option>
                      <option value="RED">🔴 Luồng Đỏ — Kiểm tra thực tế</option>
                    </select>
                  </FieldGroup>

                  <FieldGroup label="Phí local charge (₫)" required hint="Tự động đồng bộ sang Kế toán">
                    <CurrencyInput required placeholder="VD: 2,850,000"
                      value={data.m1.localChargeFee}
                      onChange={(val) => updateM1({ localChargeFee: val })} />
                  </FieldGroup>
                </div>
              </div>

              {/* Nhóm 3: DEM / DET / STO */}
              <div>
                <SectionHeader icon={<Clock size={13} />} title="Hạn DEM / DET / STO"
                  badge={<span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">Tự động tính từ ngày hàng đến</span>} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* DEM — đỏ */}
                  <div className="bg-red-50/40 p-3.5 rounded-xl border border-red-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">DEM — Lưu container tại cảng</span>
                      <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={data.m1.freeDemDays ?? 3}
                        onChange={(e) => updateM1({ freeDemDays: Number(e.target.value) })}
                        className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white" />
                      <span className="text-xs text-slate-500">ngày miễn phí</span>
                    </div>
                    <div className="pt-2 border-t border-red-100 text-[11px] flex items-center justify-between">
                      <span className="text-slate-500">Hạn chót:</span>
                      <span className="font-bold text-red-700 font-mono">{data.m1.demExpiryDate || '—'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">= ngày đến + {(data.m1.freeDemDays || 3) - 1} ngày</p>
                  </div>

                  {/* DET — tím */}
                  <div className="bg-purple-50/40 p-3.5 rounded-xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">DET — Sử dụng vỏ container</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={data.m1.freeDetDays ?? 4}
                        onChange={(e) => updateM1({ freeDetDays: Number(e.target.value) })}
                        className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white" />
                      <span className="text-xs text-slate-500">ngày miễn phí</span>
                    </div>
                    <div className="pt-2 border-t border-purple-100 text-[11px] flex items-center justify-between">
                      <span className="text-slate-500">Hạn chót:</span>
                      <span className="font-bold text-purple-700 font-mono">{data.m3.detExpiryDate || '—'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">= ngày xuất bến (Mốc 3) + {(data.m1.freeDetDays || 4) - 1} ngày</p>
                  </div>

                  {/* STO — cam */}
                  <div className="bg-orange-50/40 p-3.5 rounded-xl border border-orange-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">STO — Lưu hàng tại bãi cảng</span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">Cảng thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={data.m1.freeStoDays ?? 2}
                        onChange={(e) => updateM1({ freeStoDays: Number(e.target.value) })}
                        className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white" />
                      <span className="text-xs text-slate-500">ngày miễn phí</span>
                    </div>
                    <div className="pt-2 border-t border-orange-100 text-[11px] flex items-center justify-between">
                      <span className="text-slate-500">Hạn chót:</span>
                      <span className="font-bold text-orange-700 font-mono">{data.m1.stoExpiryDate || '—'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">= ngày đến + {(data.m1.freeStoDays || 2) - 1} ngày</p>
                  </div>
                </div>
              </div>

              {/* Nhóm 4: Container & Seal */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionHeader icon={<Box size={13} />} title="Container & Seal" badge={<span className="text-red-500 font-bold text-xs">*</span>} />
                  <button type="button" onClick={handleAddContainer}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all flex items-center gap-1">
                    <Plus size={13} /> Thêm container
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse bg-white">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 w-10 text-center">#</th>
                        <th className="px-3 py-2.5">Số container <span className="text-red-500">*</span></th>
                        <th className="px-3 py-2.5">Số seal <span className="text-red-500">*</span></th>
                        <th className="px-3 py-2.5 w-40">Loại container</th>
                        <th className="px-3 py-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!data.m1.containers || data.m1.containers.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs italic">
                            Chưa có container. Nhấn "+ Thêm container" để thêm.
                          </td>
                        </tr>
                      ) : (
                        data.m1.containers.map((cont, idx) => (
                          <tr key={cont.id || idx} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-center font-semibold text-slate-500">{idx + 1}</td>
                            <td className="px-2 py-1.5">
                              <input type="text" required placeholder="VD: SITU8934120"
                                value={cont.containerNumber}
                                onChange={(e) => handleUpdateContainer(idx, 'containerNumber', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold uppercase text-blue-700 text-xs bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="text" required placeholder="VD: VN882341"
                                value={cont.sealNumber}
                                onChange={(e) => handleUpdateContainer(idx, 'sealNumber', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-800 text-xs bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                            </td>
                            <td className="px-2 py-1.5">
                              <select value={cont.containerType || '40HC'}
                                onChange={(e) => handleUpdateContainer(idx, 'containerType', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium">
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
                                className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Xóa container">
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
              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  {showOptional ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  {showOptional ? 'Thu gọn thông tin thêm' : 'Thông tin thêm (tùy chọn)'}
                </button>
                {showOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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

          {/* ═══════════════════════════════════════════
              MỐC 2: HẢI QUAN
          ═══════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className="space-y-8">

              <div>
                <SectionHeader icon={<FileCheck2 size={13} />} title="Phí hải quan" />
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
                <SectionHeader icon={<Calendar size={13} />} title="Ngày thông quan" />
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

              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  {showOptional ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  {showOptional ? 'Thu gọn' : 'Phụ phí & thông tin thêm (tùy chọn)'}
                </button>
                {showOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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

          {/* ═══════════════════════════════════════════
              MỐC 3: VẬN CHUYỂN
          ═══════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className="space-y-8">

              {/* Nhóm 1: Nhà vận tải & Xe */}
              <div>
                <SectionHeader icon={<Truck size={13} />} title="Nhà vận tải & Xe" />
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

              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  {showOptional ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  {showOptional ? 'Thu gọn' : 'Phụ phí phát sinh (tùy chọn)'}
                </button>
                {showOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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

          {/* ═══════════════════════════════════════════
              MỐC 4: CỬA KHẨU
          ═══════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div className="space-y-8">

              {/* Nghiệp vụ info */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
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

              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  {showOptional ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  {showOptional ? 'Thu gọn' : 'Ngày qua cửa khẩu & phụ phí (tùy chọn)'}
                </button>
                {showOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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

          {/* ═══════════════════════════════════════════
              MỐC 5: TRẢ RỖNG
          ═══════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div className="space-y-8">

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
                    <div className={`sm:col-span-2 p-3 rounded-xl border flex items-center gap-3 ${
                      data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                        ? 'bg-red-50 border-red-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className={`p-2 rounded-lg shrink-0 ${
                        data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                          ? <AlertTriangle size={16} />
                          : <CheckCircle2 size={16} />}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-900 mb-0.5">
                          {data.m5.actualReturnDate && data.m5.actualReturnDate > data.m3.detExpiryDate
                            ? '🚨 Trả vỏ trễ hạn DET — Có thể phát sinh phí DET'
                            : data.m5.actualReturnDate
                            ? '✅ Trả vỏ đúng hạn DET'
                            : '⏳ Chưa có ngày trả — Hạn DET là ' + data.m3.detExpiryDate}
                        </div>
                        <div className="text-slate-500">
                          Hạn DET: <span className="font-mono font-bold text-purple-700">{data.m3.detExpiryDate}</span>
                          {data.m5.actualReturnDate && <> · Ngày trả: <span className="font-mono font-bold">{data.m5.actualReturnDate}</span></>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  {showOptional ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  {showOptional ? 'Thu gọn' : 'Phụ phí & tình trạng vỏ container (tùy chọn)'}
                </button>
                {showOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

        {/* ── Footer Nav ── (Prev/Next only, no duplicate Save) */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button type="button" onClick={() => { setActiveStep(activeStep - 1); setShowOptional(false); }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5">
                <ChevronLeft size={13} />
                {MILESTONES_CONFIG[activeStep - 1].shortLabel}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeStep < 4 && (
              <button type="button" onClick={() => { setActiveStep(activeStep + 1); setShowOptional(false); }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5">
                {MILESTONES_CONFIG[activeStep + 1].shortLabel}
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
