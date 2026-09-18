import { useState, useRef, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, ChevronDown, Check, X, RotateCcw } from 'lucide-react';
import ShipmentPnlTab from './accounting/shipment_pnl_tab.js';

export type DatePreset = 'ALL' | '1_WEEK' | '1_MONTH' | '2_MONTHS' | 'CUSTOM';

interface PresetOption {
  id: DatePreset;
  label: string;
  subLabel: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  { id: 'ALL', label: 'Tất cả thời gian', subLabel: 'Toàn bộ dữ liệu lô hàng' },
  { id: '1_WEEK', label: '1 tuần qua', subLabel: '7 ngày gần nhất' },
  { id: '1_MONTH', label: '1 tháng qua', subLabel: '30 ngày gần nhất' },
  { id: '2_MONTHS', label: '2 tháng qua', subLabel: '60 ngày gần nhất' },
  { id: 'CUSTOM', label: 'Tùy chỉnh khoảng ngày', subLabel: 'Tự chọn ngày bắt đầu & kết thúc' },
];

const calculatePresetRange = (preset: DatePreset): { startDate: string; endDate: string } => {
  if (preset === 'ALL' || preset === 'CUSTOM') {
    return { startDate: '', endDate: '' };
  }
  const end = new Date();
  const endDate = end.toISOString().slice(0, 10);
  const start = new Date(end);
  if (preset === '1_WEEK') {
    start.setDate(start.getDate() - 7);
  } else if (preset === '1_MONTH') {
    start.setMonth(start.getMonth() - 1);
  } else if (preset === '2_MONTHS') {
    start.setMonth(start.getMonth() - 2);
  }
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
};

const formatDateVi = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatDateRangeShort = (start: string, end: string) => {
  if (!start && !end) return '';
  const [sy, sm, sd] = (start || '').split('-');
  const [ey, em, ed] = (end || '').split('-');
  if (sy && ey && sy === ey) {
    return `${sd}/${sm} - ${ed}/${em}/${ey}`;
  }
  return `${formatDateVi(start)} - ${formatDateVi(end)}`;
};

export default function ShipmentFinancial() {
  const [appliedPreset, setAppliedPreset] = useState<DatePreset>('ALL');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Local state for popover interactions
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customError, setCustomError] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync popover temporary state when opening
  const handleOpenPopover = () => {
    setSelectedPreset(appliedPreset);
    if (appliedPreset === 'CUSTOM') {
      setCustomStart(appliedStartDate);
      setCustomEnd(appliedEndDate);
    } else {
      const now = new Date();
      const endStr = now.toISOString().slice(0, 10);
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      setCustomStart(appliedStartDate || start.toISOString().slice(0, 10));
      setCustomEnd(appliedEndDate || endStr);
    }
    setCustomError('');
    setIsOpen(true);
  };

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (presetId: DatePreset) => {
    setSelectedPreset(presetId);
    setCustomError('');

    if (presetId !== 'CUSTOM') {
      // Direct apply for standard presets
      const range = calculatePresetRange(presetId);
      setAppliedPreset(presetId);
      setAppliedStartDate(range.startDate);
      setAppliedEndDate(range.endDate);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart && !customEnd) {
      setCustomError('Vui lòng chọn ngày bắt đầu hoặc kết thúc');
      return;
    }
    if (customStart && customEnd && customStart > customEnd) {
      setCustomError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }

    setAppliedPreset('CUSTOM');
    setAppliedStartDate(customStart);
    setAppliedEndDate(customEnd);
    setIsOpen(false);
  };

  const handleResetToAll = () => {
    setAppliedPreset('ALL');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setSelectedPreset('ALL');
    setCustomStart('');
    setCustomEnd('');
    setCustomError('');
    setIsOpen(false);
  };

  // Label to display on the trigger button
  const triggerLabel = useMemo(() => {
    if (appliedPreset === 'ALL') {
      return 'Tất cả thời gian';
    }
    if (appliedPreset === '1_WEEK') {
      return `1 tuần qua (${formatDateRangeShort(appliedStartDate, appliedEndDate)})`;
    }
    if (appliedPreset === '1_MONTH') {
      return `1 tháng qua (${formatDateRangeShort(appliedStartDate, appliedEndDate)})`;
    }
    if (appliedPreset === '2_MONTHS') {
      return `2 tháng qua (${formatDateRangeShort(appliedStartDate, appliedEndDate)})`;
    }
    if (appliedPreset === 'CUSTOM') {
      return formatDateRangeShort(appliedStartDate, appliedEndDate) || 'Tùy chỉnh khoảng ngày';
    }
    return 'Lọc theo ngày';
  }, [appliedPreset, appliedStartDate, appliedEndDate]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
              <span>Tài chính lô hàng (P&L)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Phân tích doanh thu, chi phí trực tiếp, chi phí quản lý phân bổ và theo dõi lợi nhuận ròng từng lô hàng.
            </p>
          </div>

          {/* Top Right Date Filter Popover */}
          <div className="relative" ref={popoverRef}>
            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => (isOpen ? setIsOpen(false) : handleOpenPopover())}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-xs ${
                appliedPreset !== 'ALL'
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Calendar
                size={14}
                className={appliedPreset !== 'ALL' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}
              />
              <span className="font-medium">{triggerLabel}</span>
              {appliedPreset !== 'ALL' ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetToAll();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleResetToAll();
                    }
                  }}
                  className="p-0.5 rounded-md hover:bg-blue-200/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors ml-0.5"
                  title="Xóa bộ lọc ngày (Về Tất cả thời gian)"
                >
                  <X size={13} />
                </span>
              ) : (
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                />
              )}
            </button>

            {/* Date Filter Popover */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right space-y-3.5">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Lọc theo thời gian
                    </span>
                  </div>
                  {appliedPreset !== 'ALL' && (
                    <button
                      type="button"
                      onClick={handleResetToAll}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>Mặc định</span>
                    </button>
                  )}
                </div>

                {/* Preset Options Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map((p) => {
                    const isSelected = selectedPreset === p.id;
                    const isAll = p.id === 'ALL';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`flex flex-col items-start px-3 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                        } ${isAll ? 'col-span-2' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">{p.label}</span>
                          {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400" />}
                        </div>
                        {p.subLabel && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                            {p.subLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range Picker (Expands when CUSTOM is active) */}
                {selectedPreset === 'CUSTOM' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Khoảng ngày tùy chọn
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Từ ngày:
                        </label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => {
                            setCustomStart(e.target.value);
                            setCustomError('');
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Đến ngày:
                        </label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => {
                            setCustomEnd(e.target.value);
                            setCustomError('');
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {customError && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                        {customError}
                      </p>
                    )}

                    {/* Popover Custom Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCustom}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <ShipmentPnlTab startDate={appliedStartDate} endDate={appliedEndDate} />
      </div>
    </div>
  );
}
