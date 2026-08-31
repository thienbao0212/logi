import { useState } from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Columns, 
  LayoutDashboard
} from 'lucide-react';

import ShipmentPnlTab from './shipment_pnl_tab.js';
import OperationsTab from './operations.js';
import CashbookTab from './cashbook.js';
import OverviewTab from './overview.js';

interface TabItem {
  id: 'pnl' | 'operations' | 'cashbook' | 'overview';
  label: string;
  icon: any;
  badge?: string;
}

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'operations' | 'cashbook' | 'overview'>('pnl');

  const tabs: TabItem[] = [
    { id: 'pnl', label: 'Doanh thu - Chi phí - Lợi nhuận Lô hàng', icon: BarChart3, badge: 'Trọng tâm' },
    { id: 'operations', label: 'Nhật ký Thu / Chi', icon: Columns },
    { id: 'cashbook', label: 'Sổ quỹ tiền mặt', icon: BookOpen },
    { id: 'overview', label: 'Báo cáo Tổng quan', icon: LayoutDashboard },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 size={24} className="text-blue-600" />
              <span>Quản lý Tài chính & Hiệu quả Kinh doanh (P&L)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đối chiếu chi phí trực tiếp từng lô, chi phí quản lý phân bổ, doanh thu và theo dõi lợi nhuận ròng để tối ưu hóa kinh doanh.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200/70 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 pt-6">
        {activeTab === 'pnl' && <ShipmentPnlTab />}
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'cashbook' && <CashbookTab />}
        {activeTab === 'overview' && <OverviewTab />}
      </div>
    </div>
  );
}
