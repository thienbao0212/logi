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
  ExternalLink, 
  DollarSign, 
  Box, 
  Info
} from 'lucide-react';
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
  ContainerItem
} from './transit_types.js';

interface TransitMilestonesPanelProps {
  shipment: any;
  onMilestonesChange?: (milestones: TransitMilestonesData) => void;
  onAllCompleted?: () => void;
  onNavigateToFinancial?: () => void;
}

const MILESTONES_CONFIG = [
  { id: 0, key: 'm1', label: '1. Hàng đến cảng', icon: Anchor, color: 'blue' },
  { id: 1, key: 'm2', label: '2. Hải quan', icon: FileCheck2, color: 'purple' },
  { id: 2, key: 'm3', label: '3. Vận chuyển', icon: Truck, color: 'amber' },
  { id: 3, key: 'm4', label: '4. Cửa khẩu xuất', icon: Building2, color: 'indigo' },
  { id: 4, key: 'm5', label: '5. Trả rỗng', icon: RotateCcw, color: 'emerald' },
];

export default function TransitMilestonesPanel({ 
  shipment, 
  onMilestonesChange, 
  onAllCompleted,
  onNavigateToFinancial
}: TransitMilestonesPanelProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<TransitMilestonesData>(() => loadMilestonesFromStorage(shipment.id, shipment));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    const loaded = loadMilestonesFromStorage(shipment.id, shipment);
    setData(loaded);
  }, [shipment.id]);

  // Validations for all 5 milestones
  const v1 = useMemo(() => validateMilestone1(data.m1), [data.m1]);
  const v2 = useMemo(() => validateMilestone2(data.m2), [data.m2]);
  const v3 = useMemo(() => validateMilestone3(data.m3), [data.m3]);
  const v4 = useMemo(() => validateMilestone4(data.m4), [data.m4]);
  const v5 = useMemo(() => validateMilestone5(data.m5), [data.m5]);

  const validations = [v1, v2, v3, v4, v5];
  const allCompleted = v1.isCompleted && v2.isCompleted && v3.isCompleted && v4.isCompleted && v5.isCompleted;

  // Handle updates in state & auto-calculate dates
  const updateM1 = (fields: Partial<typeof data.m1>) => {
    setData(prev => {
      const nextM1 = { ...prev.m1, ...fields };
      // Auto-recalculate DEM & STO expiry
      if (fields.arrivalDate !== undefined || fields.freeDemDays !== undefined) {
        nextM1.demExpiryDate = calculateExpiryDate(nextM1.arrivalDate, nextM1.freeDemDays || 3);
      }
      if (fields.arrivalDate !== undefined || fields.freeStoDays !== undefined) {
        nextM1.stoExpiryDate = calculateExpiryDate(nextM1.arrivalDate, nextM1.freeStoDays || 2);
      }
      // Also update M3 DET expiry if M1 freeDetDays changed
      const nextM3 = { ...prev.m3 };
      if (fields.freeDetDays !== undefined && nextM3.departureDate) {
        nextM3.detExpiryDate = calculateExpiryDate(nextM3.departureDate, fields.freeDetDays);
      }
      return { ...prev, m1: nextM1, m3: nextM3 };
    });
  };

  const updateM2 = (fields: Partial<typeof data.m2>) => {
    setData(prev => ({ ...prev, m2: { ...prev.m2, ...fields } }));
  };

  const updateM3 = (fields: Partial<typeof data.m3>) => {
    setData(prev => {
      const nextM3 = { ...prev.m3, ...fields };
      // Auto-recalculate DET expiry when departureDate changes
      if (fields.departureDate !== undefined) {
        nextM3.detExpiryDate = calculateExpiryDate(nextM3.departureDate, prev.m1.freeDetDays || 4);
      }
      return { ...prev, m3: nextM3 };
    });
  };

  const updateM4 = (fields: Partial<typeof data.m4>) => {
    setData(prev => ({ ...prev, m4: { ...prev.m4, ...fields } }));
  };

  const updateM5 = (fields: Partial<typeof data.m5>) => {
    setData(prev => ({ ...prev, m5: { ...prev.m5, ...fields } }));
  };

  // Container list helpers
  const handleAddContainer = () => {
    const newCont: ContainerItem = {
      id: Date.now().toString(),
      containerNumber: '',
      sealNumber: '',
      containerType: '40HC',
      grossWeight: '',
    };
    updateM1({ containers: [...(data.m1.containers || []), newCont] });
  };

  const handleUpdateContainer = (index: number, key: keyof ContainerItem, value: string) => {
    const nextContainers = [...(data.m1.containers || [])];
    if (nextContainers[index]) {
      nextContainers[index] = { ...nextContainers[index], [key]: value };
      updateM1({ containers: nextContainers });
    }
  };

  const handleRemoveContainer = (index: number) => {
    const nextContainers = (data.m1.containers || []).filter((_, i) => i !== index);
    updateM1({ containers: nextContainers });
  };

  // Save handler (saves draft even with missing fields)
  const handleSave = () => {
    saveMilestonesToStorage(shipment.id, data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (onMilestonesChange) {
      onMilestonesChange(data);
    }

    if (checkAllMilestonesCompleted(data) && onAllCompleted) {
      onAllCompleted();
    }
  };

  const formatVND = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₫';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  const currentValidation = validations[activeStep];

  return (
    <div className="space-y-6">
      {/* 5-Milestone Stepper Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Hành trình 5 Mốc Vận chuyển Quá cảnh</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Điền đầy đủ các trường có dấu <span className="text-red-500 font-bold">*</span> để hoàn thành từng công đoạn. Các trường phí sẽ tự động đồng bộ qua Tab Tài chính.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {allCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full">
                <CheckCircle2 size={14} className="text-emerald-600" />
                5/5 MỐC ĐÃ HOÀN THÀNH
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                <Clock size={13} className="text-blue-500" />
                {validations.filter(v => v.isCompleted).length}/5 Mốc Hoàn Thành
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {MILESTONES_CONFIG.map((step, idx) => {
            const Icon = step.icon;
            const validation = validations[idx];
            const isDone = validation.isCompleted;
            const isActive = activeStep === idx;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> Xong
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
                      {validation.missingFields.length > 0 ? `Thiếu ${validation.missingFields.length}` : 'Chưa xong'}
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs text-slate-800 truncate">{step.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>Tiến độ:</span>
                  <span className="font-semibold text-slate-700">{validation.completionPercentage}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${validation.completionPercentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Milestone Content Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              {React.createElement(MILESTONES_CONFIG[activeStep].icon, { size: 20 })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {MILESTONES_CONFIG[activeStep].label}
                </h3>
                {currentValidation.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={13} /> Đã hoàn thành mốc này
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle size={13} /> Đang xử lý (Lưu nháp được)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật thông tin chi tiết và các khoản phí để đồng bộ sang Kế toán.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToFinancial && (
              <button
                type="button"
                onClick={onNavigateToFinancial}
                className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <DollarSign size={14} />
                <span>Xem đối chiếu Kế toán</span>
                <ExternalLink size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Lưu thông tin mốc</span>
            </button>
          </div>
        </div>

        {/* Missing Fields Reminder Notification */}
        {!currentValidation.isCompleted && currentValidation.missingFields.length > 0 && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Nhắc nhở công đoạn chưa hoàn thành:</span> Còn thiếu{' '}
              <span className="font-bold text-amber-950">{currentValidation.missingFields.length} trường bắt buộc (*)</span>:
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentValidation.missingFields.map((f, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-medium text-[11px] border border-amber-300">
                    * {f.label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-amber-700 mt-1 italic">
                (Bạn vẫn có thể bấm "Lưu thông tin mốc" để lưu lại dữ liệu hiện tại mà không bị mất).
              </p>
            </div>
          </div>
        )}

        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Đã lưu thành công dữ liệu mốc và tự động đồng bộ chi phí sang Tab Tài chính!</span>
          </div>
        )}

        {/* Step Body Form */}
        <div className="p-6 space-y-6">

          {/* ══════════════════════════════════════════════════════════════════
              MỐC 1: HÀNG ĐẾN CẢNG
          ══════════════════════════════════════════════════════════════════ */}
          {activeStep === 0 && (
            <div className="space-y-6">
              
              {/* Section 1: Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Ngày hàng đến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m1.arrivalDate || ''}
                    onChange={(e) => updateM1({ arrivalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Cảng đến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cảng Cát Lái (VNSGN), Cảng Cái Mép..."
                    value={data.m1.arrivalPort || ''}
                    onChange={(e) => updateM1({ arrivalPort: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Chi cục hải quan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chi cục HQ Cát Lái..."
                    value={data.m1.customsOffice || ''}
                    onChange={(e) => updateM1({ customsOffice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    4. Hãng tàu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SITC, COSCO, ONE, MAERSK, EVERGREEN..."
                    value={data.m1.shippingLine || ''}
                    onChange={(e) => updateM1({ shippingLine: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. Số BL (Bill of Lading) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SITCSZX260899"
                    value={data.m1.billOfLading || ''}
                    onChange={(e) => updateM1({ billOfLading: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>6. Phí local charge (VNĐ) <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-blue-600 font-normal">Link Tab Tài chính</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 2,850,000"
                    value={data.m1.localChargeFee ?? ''}
                    onChange={(e) => updateM1({ localChargeFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m1.localChargeFee)}</span>
                </div>
              </div>

              {/* Section 2: Danh sách Container & Seal song song */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      7 & 8. Danh sách Container & Số Seal song song <span className="text-red-500">*</span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddContainer}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all flex items-center gap-1"
                  >
                    <Plus size={13} /> Thêm Container
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-12 text-center">STT</th>
                        <th className="p-2.5">Số Container <span className="text-red-500">*</span></th>
                        <th className="p-2.5">Số Seal <span className="text-red-500">*</span></th>
                        <th className="p-2.5 w-36">Loại Container</th>
                        <th className="p-2.5 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!data.m1.containers || data.m1.containers.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                            Chưa có container nào. Vui lòng bấm "+ Thêm Container" để thêm cont.
                          </td>
                        </tr>
                      ) : (
                        data.m1.containers.map((cont, idx) => (
                          <tr key={cont.id || idx} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                placeholder="VD: SITU8934120"
                                value={cont.containerNumber}
                                onChange={(e) => handleUpdateContainer(idx, 'containerNumber', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold uppercase text-blue-700 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                placeholder="VD: VN882341"
                                value={cont.sealNumber}
                                onChange={(e) => handleUpdateContainer(idx, 'sealNumber', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={cont.containerType || '40HC'}
                                onChange={(e) => handleUpdateContainer(idx, 'containerType', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                              >
                                <option value="40HC">40ft High Cube (40HC)</option>
                                <option value="20GP">20ft General (20GP)</option>
                                <option value="40GP">40ft General (40GP)</option>
                                <option value="45HC">45ft High Cube (45HC)</option>
                                <option value="20RF">20ft Reefer Lạnh (20RF)</option>
                                <option value="40RF">40ft Reefer Lạnh (40RF)</option>
                                <option value="LCL">Hàng lẻ (LCL)</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveContainer(idx)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Xóa dòng container này"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Tờ khai hải quan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số tờ khai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 106782390120"
                    value={data.m1.declarationNumber || ''}
                    onChange={(e) => updateM1({ declarationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày tờ khai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m1.declarationDate || ''}
                    onChange={(e) => updateM1({ declarationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Luồng tờ khai <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.m1.declarationChannel || ''}
                    onChange={(e) => updateM1({ declarationChannel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="">-- Chọn luồng tờ khai --</option>
                    <option value="GREEN" className="text-emerald-700 font-bold">Luồng Xanh (Thông quan ngay)</option>
                    <option value="YELLOW" className="text-amber-700 font-bold">Luồng Vàng (Kiểm tra hồ sơ)</option>
                    <option value="RED" className="text-red-700 font-bold">Luồng Đỏ (Kiểm tra thực tế hàng)</option>
                  </select>
                </div>
              </div>

              {/* Section 4: DEM / DET / STO Thông minh */}
              <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 rounded-xl border border-amber-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Bộ 3 chỉ số DEM / DET / STO (Tự động tính toán ngày hết hạn)
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-medium">
                    Quy tắc: Ngày bắt đầu tính là ngày 1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* DEM */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Số ngày DEM miễn phí</label>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={data.m1.freeDemDays ?? 3}
                        onChange={(e) => updateM1({ freeDemDays: Number(e.target.value) })}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-slate-50"
                      />
                      <span className="text-xs text-slate-500 font-medium">ngày</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Hạn DEM: </span>
                      <span className="font-bold text-red-600 font-mono">
                        {data.m1.demExpiryDate || 'Chưa tính (cần ngày hàng đến)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-tight">
                      = Ngày hàng đến ({data.m1.arrivalDate || '—'}) + {(data.m1.freeDemDays || 3) - 1} ngày
                    </p>
                  </div>

                  {/* DET */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Số ngày DET miễn phí</label>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Hãng tàu thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={data.m1.freeDetDays ?? 4}
                        onChange={(e) => updateM1({ freeDetDays: Number(e.target.value) })}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-slate-50"
                      />
                      <span className="text-xs text-slate-500 font-medium">ngày</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Hạn DET: </span>
                      <span className="font-bold text-purple-700 font-mono">
                        {data.m3.detExpiryDate || 'Tính khi có ngày xe rời cảng'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-tight">
                      = Ngày xe rời cảng (Mốc 3) + {(data.m1.freeDetDays || 4) - 1} ngày
                    </p>
                  </div>

                  {/* STO */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Số ngày STO miễn phí</label>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Cảng thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={data.m1.freeStoDays ?? 2}
                        onChange={(e) => updateM1({ freeStoDays: Number(e.target.value) })}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center bg-slate-50"
                      />
                      <span className="text-xs text-slate-500 font-medium">ngày</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Hạn STO: </span>
                      <span className="font-bold text-amber-700 font-mono">
                        {data.m1.stoExpiryDate || 'Chưa tính'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-tight">
                      = Ngày hàng đến ({data.m1.arrivalDate || '—'}) + {(data.m1.freeStoDays || 2) - 1} ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: Trường không gắn sao (Thông tin thêm) */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>{showOptionalFields ? '▼ Thu gọn' : '▶ Mở rộng các trường thông tin thêm (Không gắn sao)'}</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Tên hàng hóa (Commodity)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Thiết bị điện tử, Hàng may mặc, Hạt nhựa..."
                        value={data.m1.commodityName || ''}
                        onChange={(e) => updateM1({ commodityName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Mã HS Code
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 8471.30.20, 3901.10..."
                        value={data.m1.hsCode || ''}
                        onChange={(e) => updateM1({ hsCode: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phí cược container (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 5,000,000"
                        value={data.m1.containerDepositFee ?? ''}
                        onChange={(e) => updateM1({ containerDepositFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m1.containerDepositFee)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phí khai báo hải quan (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 800,000"
                        value={data.m1.declarationServiceFee ?? ''}
                        onChange={(e) => updateM1({ declarationServiceFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m1.declarationServiceFee)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Tên tàu / Chuyến tàu
                      </label>
                      <input
                        type="text"
                        placeholder="VD: SITC HOCHIMINH V.2608S"
                        value={data.m1.vesselName || ''}
                        onChange={(e) => updateM1({ vesselName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Ghi chú mốc cảng
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú về tình trạng bãi cảng, thời gian bốc hạ..."
                        value={data.m1.notes || ''}
                        onChange={(e) => updateM1({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MỐC 2: HẢI QUAN
          ══════════════════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>1. Phí hải quan (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 500,000"
                    value={data.m2.customsFee ?? ''}
                    onChange={(e) => updateM2({ customsFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m2.customsFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>2. Phí gắn seal định vị (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 350,000"
                    value={data.m2.sealTrackingFee ?? ''}
                    onChange={(e) => updateM2({ sealTrackingFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m2.sealTrackingFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>3. Phí cảng (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 1,200,000"
                    value={data.m2.portFee ?? ''}
                    onChange={(e) => updateM2({ portFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m2.portFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    4. Ngày thông quan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m2.clearanceDate || ''}
                    onChange={(e) => updateM2({ clearanceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>{showOptionalFields ? '▼ Thu gọn' : '▶ Mở rộng các trường thông tin thêm (Không gắn sao)'}</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phí soi chiếu (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 400,000"
                        value={data.m2.inspectionScanFee ?? ''}
                        onChange={(e) => updateM2({ inspectionScanFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m2.inspectionScanFee)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phí kiểm hóa (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 500,000"
                        value={data.m2.physicalCheckFee ?? ''}
                        onChange={(e) => updateM2({ physicalCheckFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m2.physicalCheckFee)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Giấy phép vận chuyển quá cảnh
                      </label>
                      <input
                        type="text"
                        placeholder="VD: QC-VN-2026-8812"
                        value={data.m2.transitPermitNo || ''}
                        onChange={(e) => updateM2({ transitPermitNo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Ghi chú hải quan
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú về phân luồng, thời gian ký duyệt của cán bộ hải quan..."
                        value={data.m2.notes || ''}
                        onChange={(e) => updateM2({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MỐC 3: VẬN CHUYỂN
          ══════════════════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Tên đơn vị vận chuyển <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Vận tải Á Châu (Asia Trucking), Công ty Vận tải Nam Việt..."
                    value={data.m3.carrierName || ''}
                    onChange={(e) => updateM3({ carrierName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Ngày xe rời cảng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m3.departureDate || ''}
                    onChange={(e) => updateM3({ departureDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                  <span className="text-[10px] text-purple-700 mt-1 block font-semibold">
                    Kích hoạt hạn DET: {data.m3.detExpiryDate || 'Chưa có'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    4. Ngày xe tới cảng đích <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m3.destinationArrivalDate || ''}
                    onChange={(e) => updateM3({ destinationArrivalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Tuyến đường đi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cát Lái (TP.HCM) → QL22 → Cửa khẩu Mộc Bài (Tây Ninh)"
                    value={data.m3.route || ''}
                    onChange={(e) => updateM3({ route: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. Biển số xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 51C-892.44 / 51R-129.88"
                    value={data.m3.truckPlate || ''}
                    onChange={(e) => updateM3({ truckPlate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    6. Tên tài xế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Hùng"
                    value={data.m3.driverName || ''}
                    onChange={(e) => updateM3({ driverName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    7. Số điện thoại tài xế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0908 123 456"
                    value={data.m3.driverPhone || ''}
                    onChange={(e) => updateM3({ driverPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>8. Phí vận chuyển (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 8,500,000"
                    value={data.m3.transportFee ?? ''}
                    onChange={(e) => updateM3({ transportFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m3.transportFee)}</span>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>{showOptionalFields ? '▼ Thu gọn' : '▶ Mở rộng phụ phí phát sinh vận chuyển (Không gắn sao)'}</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phụ phí phát sinh vận chuyển (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 500,000"
                        value={data.m3.extraFees ?? ''}
                        onChange={(e) => updateM3({ extraFees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m3.extraFees)}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Nội dung phụ phí (Gợi ý: Lưu đêm xe, bốc xếp ngoài giờ, phụ phí đường cấm...)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Phí lưu đêm xe đầu kéo tại bãi trung chuyển..."
                        value={data.m3.extraFeeDescription || ''}
                        onChange={(e) => updateM3({ extraFeeDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Ghi chú vận chuyển
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú về định vị xe, sự cố dọc đường..."
                        value={data.m3.notes || ''}
                        onChange={(e) => updateM3({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MỐC 4: CỬA KHẨU XUẤT (ĐỔI CONT)
          ══════════════════════════════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div className="space-y-6">
              
              {/* Box nghiệp vụ */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Nghiệp vụ Mốc Cửa khẩu xuất (Đổi cont):</span> Đến cửa khẩu biên giới, xe giao container full hàng cho đối tác vận tải Campuchia và cửa khẩu bàn giao lại vỏ container rỗng để xe mang về trả rỗng tại depot Việt Nam.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Tên cửa khẩu xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cửa khẩu Quốc tế Mộc Bài, Hoa Lư, Xa Mát, Tịnh Biên, Bình Hiệp..."
                    value={data.m4.borderGateName || ''}
                    onChange={(e) => updateM4({ borderGateName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>2. Phí hải quan CK (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 400,000"
                    value={data.m4.customsBorderFee ?? ''}
                    onChange={(e) => updateM4({ customsBorderFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m4.customsBorderFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>3. Phí dịch vụ (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 600,000"
                    value={data.m4.serviceFee ?? ''}
                    onChange={(e) => updateM4({ serviceFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m4.serviceFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>4. Phí cửa khẩu (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 300,000"
                    value={data.m4.borderFee ?? ''}
                    onChange={(e) => updateM4({ borderFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m4.borderFee)}</span>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>{showOptionalFields ? '▼ Thu gọn' : '▶ Mở rộng phụ phí phát sinh & thông tin cửa khẩu (Không gắn sao)'}</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Ngày hàng qua cửa khẩu
                      </label>
                      <input
                        type="date"
                        value={data.m4.borderPassDate || ''}
                        onChange={(e) => updateM4({ borderPassDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phụ phí phát sinh tại cửa khẩu (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 200,000"
                        value={data.m4.extraFees ?? ''}
                        onChange={(e) => updateM4({ extraFees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m4.extraFees)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Nội dung phụ phí cửa khẩu
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Phí sang xe, bốc xếp kiểm hóa..."
                        value={data.m4.extraFeeDescription || ''}
                        onChange={(e) => updateM4({ extraFeeDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Ghi chú cửa khẩu
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú về việc đổi cont, bàn giao phiếu kiểm hóa..."
                        value={data.m4.notes || ''}
                        onChange={(e) => updateM4({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MỐC 5: TRẢ RỖNG
          ══════════════════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Tên depot trả rỗng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Depot Tân Cảng Suối Tiên, ICD Sotrans, Depot Mỹ Thủy..."
                    value={data.m5.depotName || ''}
                    onChange={(e) => updateM5({ depotName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>2. Phí trả rỗng (VNĐ) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 750,000"
                    value={data.m5.returnFee ?? ''}
                    onChange={(e) => updateM5({ returnFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m5.returnFee)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Ngày trả rỗng thực tế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={data.m5.actualReturnDate || ''}
                    onChange={(e) => updateM5({ actualReturnDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  />
                  {data.m3.detExpiryDate && data.m5.actualReturnDate && (
                    <span className={`text-[10px] mt-1 block font-semibold ${
                      data.m5.actualReturnDate > data.m3.detExpiryDate ? 'text-red-600' : 'text-emerald-700'
                    }`}>
                      {data.m5.actualReturnDate > data.m3.detExpiryDate
                        ? `🚨 Trả trễ hơn hạn DET (${data.m3.detExpiryDate})`
                        : `✅ Trả đúng hạn DET (${data.m3.detExpiryDate})`}
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>{showOptionalFields ? '▼ Thu gọn' : '▶ Mở rộng phụ phí phát sinh & tình trạng vỏ cont (Không gắn sao)'}</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phụ phí phát sinh trả rỗng (VNĐ)
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 300,000 (phí sửa chữa, rửa cont...)"
                        value={data.m5.extraFees ?? ''}
                        onChange={(e) => updateM5({ extraFees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatVND(data.m5.extraFees)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Nội dung phụ phí (Gợi ý: Sửa chữa hư hỏng vỏ cont, phí vệ sinh cont, phí nâng hạ ngoài giờ...)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Phí sửa móp vách container..."
                        value={data.m5.extraFeeDescription || ''}
                        onChange={(e) => updateM5({ extraFeeDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Tình trạng vỏ container khi trả & Ghi chú
                      </label>
                      <textarea
                        rows={2}
                        placeholder="VD: Vỏ cont nguyên vẹn, đã có phiếu EIR xác nhận của depot..."
                        value={data.m5.containerCondition || ''}
                        onChange={(e) => updateM5({ containerCondition: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Step Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                ← Mốc trước ({MILESTONES_CONFIG[activeStep - 1].label})
              </button>
            )}
            {activeStep < 4 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Mốc tiếp theo ({MILESTONES_CONFIG[activeStep + 1].label}) →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Save size={15} />
              <span>Lưu thông tin mốc này</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
