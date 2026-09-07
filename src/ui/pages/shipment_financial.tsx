import { BarChart3 } from 'lucide-react';
import ShipmentPnlTab from './accounting/shipment_pnl_tab.js';

export default function ShipmentFinancial() {
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
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <ShipmentPnlTab />
      </div>
    </div>
  );
}
