import { Clock, Zap, User, FileText, DollarSign, Layers, AlertOctagon, AlertTriangle } from 'lucide-react';
import { TransitMilestonesData, getDaysDiffFromToday, scanShipmentTimeline } from './transit_types.js';

interface ShipmentRightPanelProps {
  shipment?: any;
  milestones?: TransitMilestonesData | null;
  onNavigateTab?: (tabKey: string) => void;
}

function DeadlineItem({ 
  label, 
  date, 
  status 
}: { 
  label: string; 
  date?: string; 
  status?: 'critical' | 'warning' | 'done' | 'normal' 
}) {
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-700 font-bold',
    warning:  'bg-amber-50 border-amber-200 text-amber-800 font-semibold',
    done:     'bg-emerald-50 border-emerald-200 text-emerald-700',
    normal:   'bg-slate-50 border-slate-200 text-slate-600',
  };
  
  return (
    <div className={`flex items-center justify-between p-2 rounded-xl border text-xs ${colors[status || 'normal']}`}>
      <span>{label}</span>
      <span className="font-mono">{date || '—'}</span>
    </div>
  );
}

export default function ShipmentRightPanel({ 
  milestones,
  onNavigateTab 
}: ShipmentRightPanelProps) {
  const timelineIssues = milestones ? scanShipmentTimeline(milestones) : [];
  const errorCount = timelineIssues.filter(i => i.type === 'ERROR').length;
  const warningCount = timelineIssues.filter(i => i.type === 'WARNING').length;

  const getDemStatus = () => {
    if (!milestones?.m1?.demExpiryDate) return 'normal';
    if (milestones.m5?.isCompleted) return 'done';
    const diff = getDaysDiffFromToday(milestones.m1.demExpiryDate);
    if (diff !== null && diff < 0) return 'critical';
    if (diff !== null && diff <= 3) return 'warning';
    return 'normal';
  };

  const getDetStatus = () => {
    if (!milestones?.m3?.detExpiryDate) return 'normal';
    if (milestones.m5?.isCompleted) return 'done';
    const diff = getDaysDiffFromToday(milestones.m3.detExpiryDate);
    if (diff !== null && diff < 0) return 'critical';
    if (diff !== null && diff <= 2) return 'warning';
    return 'normal';
  };

  return (
    <div className="space-y-4">
      {/* Timeline Logical Health Alert Card */}
      {timelineIssues.length > 0 && (
        <div 
          onClick={() => onNavigateTab && onNavigateTab('transit')}
          className={`p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${
            errorCount > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
            {errorCount > 0 ? <AlertOctagon size={16} className="text-rose-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
            <span>Cảnh báo ngày tháng ({timelineIssues.length})</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {errorCount > 0 
              ? `Có ${errorCount} lỗi ngược logic thời gian cần kiểm tra.` 
              : `Có ${warningCount} cảnh báo quá hạn DEM/DET.`}
          </p>
          <div className="mt-2 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
            <span>Bấm để xem và sửa tại Tab 5 Mốc →</span>
          </div>
        </div>
      )}

      {/* 1. Mốc Thời Gian & Hạn Chót (Critical Dates) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mốc Thời Gian Chính
          </h3>
        </div>

        <div className="space-y-2">
          <DeadlineItem 
            label="1. Ngày tàu đến cảng" 
            date={milestones?.m1?.arrivalDate} 
            status={milestones?.m1?.arrivalDate ? 'done' : 'normal'} 
          />
          <DeadlineItem 
            label="⚠️ Hạn DEM (Lưu bãi)" 
            date={milestones?.m1?.demExpiryDate} 
            status={getDemStatus()} 
          />
          <DeadlineItem 
            label="2. Ngày thông quan" 
            date={milestones?.m2?.clearanceDate} 
            status={milestones?.m2?.clearanceDate ? 'done' : 'normal'} 
          />
          <DeadlineItem 
            label="3. Ngày xe xuất bãi" 
            date={milestones?.m3?.departureDate} 
            status={milestones?.m3?.departureDate ? 'done' : 'normal'} 
          />
          <DeadlineItem 
            label="⚠️ Hạn DET (Lưu vỏ)" 
            date={milestones?.m3?.detExpiryDate} 
            status={getDetStatus()} 
          />
          <DeadlineItem 
            label="4. Ngày qua cửa khẩu" 
            date={milestones?.m4?.borderPassDate} 
            status={milestones?.m4?.borderPassDate ? 'done' : 'normal'} 
          />
          <DeadlineItem 
            label="5. Ngày trả rỗng" 
            date={milestones?.m5?.actualReturnDate} 
            status={milestones?.m5?.actualReturnDate ? 'done' : 'normal'} 
          />
        </div>
      </div>

      {/* 2. Thao Tác Nhanh (Quick Actions) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-amber-500" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Phím Tắt Điều Hướng
          </h3>
        </div>
        
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onNavigateTab?.('milestones')}
            className="w-full text-left text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 p-2.5 rounded-xl transition-colors border border-slate-100 hover:border-blue-200 flex items-center gap-2"
          >
            <Layers size={14} className="text-blue-600 shrink-0" />
            <span>Cập nhật 5 Mốc Vận chuyển</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('financial')}
            className="w-full text-left text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50/80 p-2.5 rounded-xl transition-colors border border-slate-100 hover:border-amber-200 flex items-center gap-2"
          >
            <DollarSign size={14} className="text-amber-600 shrink-0" />
            <span>Đối chiếu Chi phí & UNC</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('documents')}
            className="w-full text-left text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50/80 p-2.5 rounded-xl transition-colors border border-slate-100 hover:border-purple-200 flex items-center gap-2"
          >
            <FileText size={14} className="text-purple-600 shrink-0" />
            <span>Tải lên Chứng từ Lô hàng</span>
          </button>
        </div>
      </div>

      {/* 3. Phụ Trách Vận Hành (Assigned Operator) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-slate-500" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Nhân Viên Phụ Trách
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-xs">
            OP
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Điều phối Vận tải Quá cảnh</p>
            <p className="text-[11px] text-slate-500 font-medium">Logistics Ops Team</p>
          </div>
        </div>
      </div>

    </div>
  );
}
