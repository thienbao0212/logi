import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ArrowDownLeft, ArrowUpRight, BookOpen, Download, Columns, Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

import OperationsTab from './operations.js';
import CashbookTab from './cashbook.js';
import OverviewTab from './overview.js';
import ReceivablesTab from './receivables.js';
import PayablesTab from './payables.js';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';

export default function AccountingDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'operations' | 'cashbook' | 'overview' | 'receivables' | 'payables'>('operations');
  const [reqs, setReqs] = useState<FinancialRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await FinancialService.getRequests('');
      setReqs(data);
    };
    load();
    
    // Listen for updates from other tabs
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'operations', label: t('accounting.tabs.operations', 'Daily Operations (Thu/Chi)'), icon: Columns },
    { id: 'cashbook', label: t('accounting.tabs.cashbook', 'Cashbook (Sổ quỹ)'), icon: BookOpen },
    { id: 'overview', label: t('accounting.tabs.overview', 'Dashboard (Tổng quan)'), icon: LayoutDashboard },
  ] as const;

  // Calculate stats
  let totalReceivables = 0;
  let totalPayables = 0;
  let collected = 0;
  let paid = 0;
  let pendingCount = 0;

  reqs.forEach(r => {
    if (r.status === 'CHỜ DUYỆT') pendingCount++;
    
    if (r.type === 'THU') {
      if (r.status !== 'ĐÃ THU') totalReceivables += r.amount;
      if (r.status === 'ĐÃ THU' || r.status.includes('MỘT PHẦN')) collected += r.amount; // simplification
    } else {
      if (r.status !== 'ĐÃ CHI') totalPayables += r.amount;
      if (r.status === 'ĐÃ CHI' || r.status.includes('MỘT PHẦN')) paid += r.amount;
    }
  });

  const cashOnHand = 125000 + collected - paid; // Base dummy cash + actuals

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('accounting.title', 'Accounting & Finance')}</h1>
            <p className="text-sm text-slate-500 mt-1">Manage daily operations, cash flow, and financial reports</p>
          </div>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            {t('common.export', 'Export Report')}
          </button>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quỹ tiền mặt (Cash)</p>
              <h3 className="text-xl font-bold text-slate-900">${cashOnHand.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phải thu (Receivables)</p>
              <h3 className="text-xl font-bold text-emerald-700">${totalReceivables.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phải trả (Payables)</p>
              <h3 className="text-xl font-bold text-rose-700">${totalPayables.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chờ duyệt (Pending)</p>
              <h3 className="text-xl font-bold text-amber-700">{pendingCount} <span className="text-sm font-medium text-slate-500">phiếu</span></h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 pt-4">
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'cashbook' && <CashbookTab />}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'receivables' && <ReceivablesTab />}
        {activeTab === 'payables' && <PayablesTab />}
      </div>
    </div>
  );
}
