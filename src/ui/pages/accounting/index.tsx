import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  LayoutDashboard,
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Layers
} from 'lucide-react';

import ReceivablesTab from './receivables.js';
import PayablesTab from './payables.js';
import CashbookTab from './cashbook.js';
import OverviewTab from './overview.js';
import InvoicesTab from './invoices.js';
import ExpensesTab from './expenses.js';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';

type AccountingTabType = 'receivables' | 'payables' | 'cashbook' | 'overview' | 'invoices' | 'expenses';

interface TabItem {
  id: AccountingTabType;
  label: string;
  icon: any;
  badgeCount?: number;
  badgeClass?: string;
}

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState<AccountingTabType>('receivables');
  const [counts, setCounts] = useState<{ thu: number; chi: number }>({ thu: 0, chi: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const reqs = await FinancialService.getRequests('');
        const thuCount = reqs.filter(r => r.type === 'THU' && r.status !== 'ĐÃ THU').length;
        const chiCount = reqs.filter(r => r.type === 'CHI' && r.status !== 'ĐÃ CHI').length;
        setCounts({ thu: thuCount, chi: chiCount });
      } catch (e) {
        console.error('Failed to load request counts', e);
      }
    };
    loadCounts();
  }, [activeTab]);

  const tabs: TabItem[] = [
    { 
      id: 'receivables', 
      label: 'Công nợ Phải thu (AR)', 
      icon: ArrowDownLeft,
      badgeCount: counts.thu,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    },
    { 
      id: 'payables', 
      label: 'Công nợ Phải trả (AP)', 
      icon: ArrowUpRight,
      badgeCount: counts.chi,
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
    },
    { 
      id: 'cashbook', 
      label: 'Sổ quỹ Tiền mặt & Ngân hàng', 
      icon: BookOpen 
    },
    {
      id: 'invoices',
      label: 'Hóa đơn VAT',
      icon: Receipt,
    },
    {
      id: 'expenses',
      label: 'Chi phí Hoạt động',
      icon: Layers,
    },
    { 
      id: 'overview', 
      label: 'Báo cáo & Tổng quan Tài chính', 
      icon: LayoutDashboard 
    },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Calculator size={24} className="text-blue-600 dark:text-blue-400" />
              <span>Quản lý Kế toán & Sổ quỹ Doanh nghiệp</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý toàn diện công nợ phải thu khách hàng, công nợ phải trả đối tác/hãng tàu, sổ quỹ tiền mặt ngân hàng và báo cáo dòng tiền.
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Modern Segmented Underline Styling */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900/90 rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                <span>{tab.label}</span>
                {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${tab.badgeClass}`}>
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 pt-6">
        {activeTab === 'receivables' && <ReceivablesTab />}
        {activeTab === 'payables' && <PayablesTab />}
        {activeTab === 'cashbook' && <CashbookTab />}
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'overview' && <OverviewTab />}
      </div>
    </div>
  );
}
