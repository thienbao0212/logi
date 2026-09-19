import { Clock, ShieldAlert, DollarSign, ChevronRight } from 'lucide-react';
import { TransitMilestonesData, getDaysDiffFromToday, FinancialCostItem } from './transit_types.js';

interface MilestoneAlertBannerProps {
  milestones: TransitMilestonesData;
  costs?: FinancialCostItem[];
  onNavigateMilestone?: (milestoneIndex: number) => void;
  compact?: boolean;
}

export default function MilestoneAlertBanner({ 
  milestones, 
  costs = [], 
  onNavigateMilestone 
}: MilestoneAlertBannerProps) {
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
          title: `🚨 Quá hạn DEM ${Math.abs(diff)} ngày (${m1.demExpiryDate})!`,
          description: `Container chưa rời cảng mà đã quá hạn miễn phí lưu bãi. Đang phát sinh phí phạt DEM lưu bãi hãng tàu.`,
          actionLabel: 'Xử lý Mốc 2 / Mốc 3 ngay',
          milestoneIndex: isCustomsCleared ? 2 : 1,
        });
      } else if (diff === 0) {
        alerts.push({
          id: 'dem_today',
          type: 'critical',
          title: `⚠️ Hôm nay là hạn chót DEM (${m1.demExpiryDate})!`,
          description: `Hết hôm nay sẽ bắt đầu tính phí phạt lưu bãi. Cần thông quan và kéo cont rời cảng khẩn cấp.`,
          actionLabel: 'Xem Mốc 1 & 2',
          milestoneIndex: 0,
        });
      } else if (diff <= 2) {
        alerts.push({
          id: 'dem_soon',
          type: 'warning',
          title: `⏰ Còn ${diff} ngày là hết hạn DEM (${m1.demExpiryDate})`,
          description: `Vui lòng đẩy nhanh tiến độ làm Hải quan để kịp kéo cont rời cảng trước hạn.`,
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
          title: `🚨 Quá hạn DET ${Math.abs(diff)} ngày (${m3.detExpiryDate})!`,
          description: `Chưa hoàn tất trả rỗng container về depot. Đang phát sinh phí phạt lưu vỏ hãng tàu.`,
          actionLabel: 'Điền Mốc 5 Trả rỗng',
          milestoneIndex: 4,
        });
      } else if (diff === 0) {
        alerts.push({
          id: 'det_today',
          type: 'critical',
          title: `⚠️ Hôm nay hết hạn DET lưu vỏ (${m3.detExpiryDate})!`,
          description: `Cần hạ bãi trả rỗng về depot trong hôm nay để tránh bị hãng tàu phạt phí DET.`,
          actionLabel: 'Xử lý Trả rỗng',
          milestoneIndex: 4,
        });
      } else if (diff <= 2) {
        alerts.push({
          id: 'det_soon',
          type: 'warning',
          title: `⏰ Còn ${diff} ngày là hết hạn DET lưu vỏ (${m3.detExpiryDate})`,
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
        title: `Phát sinh phí lưu bãi Cảng STO (+${Math.abs(diff)} ngày)`,
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
      title: `Đối soát Kế toán: ${pendingUNC.length} khoản chi thiếu UNC`,
      description: `Vui lòng tải lên file/ảnh UNC để hoàn tất chứng từ đối chiếu chi phí phát sinh.`,
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const isCritical = alert.type === 'critical';
        const isWarning = alert.type === 'warning';

        const bgClass = isCritical
          ? 'bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-rose-200/90 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
          : isWarning
          ? 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border-amber-200/90 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
          : 'bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border-blue-200/90 dark:border-blue-900/60 text-blue-900 dark:text-blue-200';

        const iconColor = isCritical
          ? 'text-rose-600 dark:text-rose-400'
          : isWarning
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-blue-600 dark:text-blue-400';

        const tooltipText = `${alert.title}\n\n${alert.description}${alert.actionLabel ? `\n\n👉 Nhấp để: ${alert.actionLabel}` : ''}`;

        return (
          <button
            key={alert.id}
            type="button"
            onClick={() => alert.milestoneIndex !== undefined && onNavigateMilestone?.(alert.milestoneIndex)}
            title={tooltipText}
            className={`w-full group px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs ${bgClass}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 ${iconColor}`}>
                {isCritical ? (
                  <ShieldAlert size={15} />
                ) : isWarning ? (
                  <Clock size={15} />
                ) : (
                  <DollarSign size={15} />
                )}
              </span>
              <span className="text-xs font-semibold truncate leading-tight">
                {alert.title}
              </span>
            </div>

            <ChevronRight 
              size={14} 
              className={`shrink-0 ${iconColor} opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} 
            />
          </button>
        );
      })}
    </div>
  );
}
