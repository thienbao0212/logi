import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinancialRequest } from '../types.js';
import { FinancialService } from '../mockService.js';
import { DollarSign, TrendingDown, TrendingUp, Clock, Plus } from 'lucide-react';
import { AddRequestModal } from '../components/add_request_modal.js';

interface OverviewProps {
  shipment: { id: string; [key: string]: any };
}

export function Overview({ shipment }: OverviewProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalType, setModalType] = useState<'THU' | 'CHI' | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await FinancialService.getRequests(shipment.id);
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shipment.id]);

  if (loading) {
    return <div className="p-4 text-slate-500">{t('financial.overview.loading', 'Loading overview...')}</div>;
  }

  const revenue = requests
    .filter(r => r.type === 'THU')
    .reduce((sum, r) => sum + r.amount, 0);

  const expenses = requests
    .filter(r => r.type === 'CHI')
    .reduce((sum, r) => sum + r.amount, 0);

  const grossProfit = revenue - expenses;
  const profitMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

  const outstandingReceivables = requests
    .filter(r => r.type === 'THU')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const outstandingPayables = requests
    .filter(r => r.type === 'CHI')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const pendingApprovals = requests.filter(r => r.status === 'CHỜ DUYỆT').length;

  const thuRequests = requests.filter(r => r.type === 'THU');
  const chiRequests = requests.filter(r => r.type === 'CHI');

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end gap-3 mb-2">
        <button 
          onClick={() => setModalType('THU')}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition-colors border border-green-200"
        >
          <Plus size={16} /> {t('financial.actions.createThu', 'Create Revenue Request')}
        </button>
        <button 
          onClick={() => setModalType('CHI')}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors border border-red-200"
        >
          <Plus size={16} /> {t('financial.actions.createChi', 'Create Expense Request')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.thu', 'Revenue')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">${revenue.toLocaleString()}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.chi', 'Expenses')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">${expenses.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign size={16} className="text-blue-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.profit', 'Profit')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">${grossProfit.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.receivables', 'Receivables')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">${outstandingReceivables.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.payables', 'Payables')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">${outstandingPayables.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={16} className="text-blue-500" />
            <span className="text-sm font-medium uppercase tracking-wide">{t('financial.kpi.pending', 'Pending')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900">{pendingApprovals}</span>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thu Summary */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-green-50/30">
            <h3 className="font-semibold text-slate-800 uppercase">{t('financial.kpi.thu', 'Revenue')}</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {thuRequests.map(r => (
              <li key={r.id} className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-slate-700">{r.category}</span>
                <span className="font-mono font-medium text-slate-900">${r.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-700">{t('financial.summary.totalThu', 'Total Revenue')}</span>
            <span className="font-mono font-bold text-green-600 text-lg">${revenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Chi Summary */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-red-50/30">
            <h3 className="font-semibold text-slate-800 uppercase">{t('financial.kpi.chi', 'Expenses')}</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {chiRequests.map(r => (
              <li key={r.id} className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-slate-700">{r.category}</span>
                <span className="font-mono font-medium text-slate-900">${r.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-700">{t('financial.summary.totalChi', 'Total Expenses')}</span>
            <span className="font-mono font-bold text-red-600 text-lg">${expenses.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Profit Margin Simple Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
        <span className="text-blue-800 font-semibold uppercase">{t('financial.kpi.profit', 'Profit')}</span>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-blue-700">${grossProfit.toLocaleString()}</span>
          <p className="text-sm text-blue-600 mt-1">{t('financial.summary.margin', 'Margin')}: {profitMargin}%</p>
        </div>
      </div>

      {modalType && (
        <AddRequestModal
          type={modalType}
          onClose={() => setModalType(null)}
          onSave={async (payload) => {
            await FinancialService.addRequest(shipment.id, payload);
            setModalType(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
