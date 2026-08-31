import { Clock, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';
import { TransitMilestonesData, getDaysDiffFromToday, FinancialCostItem } from './transit_types.js';

interface MilestoneAlertBannerProps {
  milestones: TransitMilestonesData;
  costs?: FinancialCostItem[];
  onNavigateMilestone?: (milestoneIndex: number) => void;
}

export default function MilestoneAlertBanner({ milestones, costs = [], onNavigateMilestone }: MilestoneAlertBannerProps) {
  const alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel?: string;
    milestoneIndex?: number;
  }> = [];

  const { m1, m2, m3, m5 } = milestones;

  // 1. DEM Alerts (Demurrage - Hạn lưu bãi tại cảng)
  if (m1?.demExpiryDate) {
    const diff = getDaysDiffFromToday(m1.demExpiryDate);
    const isCustomsCleared = Boolean(m2?.clearanceDate && m2?.isCompleted);
    const hasDepartedPort = Boolean(m3?.departureDate && m3?.isCompleted);

    if (diff !== null && (!isCustomsCleared || !hasDepartedPort)) {
      if (diff < 0) {
        alerts.push({
          id: 'dem_overdue',
          type: 'critical',
          title: `🚨 RỦI RO CAO: Đã quá hạn DEM ${Math.abs(diff)} ngày (${m1.demExpiryDate})!`,
          description: `Container chưa rời cảng mà đã quá hạn miễn phí lưu bãi. Đang phát sinh phí phạt DEM lưu bãi hãng tàu tính theo từng ngày.`,
          actionLabel: 'Xử lý Mốc 2 / Mốc 3 ngay',
          milestoneIndex: isCustomsCleared ? 2 : 1,
        });
      } else if (diff === 0) {
        alerts.push({
          id: 'dem_today',
          type: 'critical',
          title: `⚠️ HÔM NAY LÀ HẠN CHÓT DEM (${m1.demExpiryDate})!`,
          description: `Hết ngày hôm nay sẽ bắt đầu tính phí phạt lưu bãi cảng. Cần hoàn tất thông quan và kéo cont rời cảng khẩn cấp.`,
          actionLabel: 'Xem Mốc 1 & 2',
          milestoneIndex: 0,
        });
      } else if (diff <= 2) {
        alerts.push({
          id: 'dem_soon',
          type: 'warning',
          title: `⏰ Cảnh báo Deadline: Còn ${diff} ngày là hết hạn DEM (${m1.demExpiryDate})`,
          description: `Vui lòng đẩy nhanh tiến độ làm thủ tục Hải quan (Mốc 2) để xe kịp kéo cont rời cảng trước hạn.`,
          actionLabel: 'Kiểm tra Mốc Hải quan',
          milestoneIndex: 1,
        });
      }
    }
  }

  // 2. DET Alerts (Detention - Hạn lưu vỏ cont sau khi rời cảng)
  if (m3?.detExpiryDate) {
    const diff = getDaysDiffFromToday(m3.detExpiryDate);
    const isReturned = Boolean(m5?.actualReturnDate && m5?.isCompleted);

    if (diff !== null && !isReturned) {
      if (diff < 0) {
        alerts.push({
          id: 'det_overdue',
          type: 'critical',
          title: `🚨 RỦI RO CAO: Đã quá hạn DET ${Math.abs(diff)} ngày (${m3.detExpiryDate})!`,
          description: `Chưa hoàn tất trả rỗng container về depot. Đang phát sinh phí phạt lưu vỏ hãng tàu.`,
          actionLabel: 'Điền Mốc 5 Trả rỗng',
          milestoneIndex: 4,
        });
      } else if (diff === 0) {
        alerts.push({
          id: 'det_today',
          type: 'critical',
          title: `⚠️ HÔM NAY HẾT HẠN DET LƯU VỎ (${m3.detExpiryDate})!`,
          description: `Cần hạ bãi trả rỗng về depot trong hôm nay để tránh bị hãng tàu phạt phí DET.`,
          actionLabel: 'Xử lý Trả rỗng',
          milestoneIndex: 4,
        });
      } else if (diff <= 2) {
        alerts.push({
          id: 'det_soon',
          type: 'warning',
          title: `⏰ Cảnh báo Deadline: Còn ${diff} ngày là hết hạn DET lưu vỏ (${m3.detExpiryDate})`,
          description: `Sau khi giao hàng tại Campuchia, cần điều phối xe kéo cont rỗng về depot kịp hạn.`,
          actionLabel: 'Theo dõi Mốc 4 & 5',
          milestoneIndex: 3,
        });
      }
    }
  }

  // 3. STO Alerts (Storage - Phí lưu bãi Cảng)
  if (m1?.stoExpiryDate) {
    const diff = getDaysDiffFromToday(m1.stoExpiryDate);
    const hasDepartedPort = Boolean(m3?.departureDate && m3?.isCompleted);

    if (diff !== null && diff < 0 && !hasDepartedPort) {
      alerts.push({
        id: 'sto_overdue',
        type: 'warning',
        title: `Phát sinh phí lưu bãi Cảng STO (${Math.abs(diff)} ngày vượt định mức)`,
        description: `Đã vượt quá số ngày miễn phí lưu bãi do Cảng quy định (${m1.freeStoDays || 2} ngày). Khoản này cảng sẽ thu thêm.`,
        actionLabel: 'Xem chi tiết phí',
        milestoneIndex: 0,
      });
    }
  }

  // 4. Financial & Payment Proof Reminder
  const pendingUNC = costs.filter(c => c.status === 'PAID' && !c.uncAttachmentUrl);
  if (pendingUNC.length > 0) {
    alerts.push({
      id: 'unc_missing',
      type: 'info',
      title: `Đối soát Kế toán: Có ${pendingUNC.length} khoản đã chi nhưng chưa đính kèm Ủy nhiệm chi (UNC)`,
      description: `Vui lòng tải lên file/ảnh UNC để hoàn tất chứng từ đối chiếu chi phí phát sinh.`,
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between text-emerald-800 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span><strong>Tiến độ an toàn:</strong> Không có cảnh báo rủi ro hay quá hạn deadline DEM/DET nào cho lô hàng này.</span>
        </div>
        <span className="text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300/60">
          On Track
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const isCritical = alert.type === 'critical';
        const isWarning = alert.type === 'warning';

        const bgClass = isCritical
          ? 'bg-red-50 border-red-200 text-red-900 shadow-xs'
          : isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
          : 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs';

        const iconColor = isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600';

        return (
          <div key={alert.id} className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bgClass}`}>
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-blue-100'}`}>
                {isCritical ? (
                  <ShieldAlert size={18} className={iconColor} />
                ) : isWarning ? (
                  <Clock size={18} className={iconColor} />
                ) : (
                  <DollarSign size={18} className={iconColor} />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">{alert.title}</h4>
                <p className="text-[11px] opacity-90 mt-0.5">{alert.description}</p>
              </div>
            </div>

            {alert.actionLabel && alert.milestoneIndex !== undefined && onNavigateMilestone && (
              <button
                type="button"
                onClick={() => onNavigateMilestone(alert.milestoneIndex!)}
                className={`self-start sm:self-center px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shrink-0 ${
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-xs'
                    : isWarning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs'
                }`}
              >
                {alert.actionLabel} →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
