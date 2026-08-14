import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinancialRequest } from '../types.js';
import { FinancialService } from '../mockService.js';
import { RequestTable } from '../components/request_table.js';
import { Plus } from 'lucide-react';
import { AddRequestModal } from '../components/add_request_modal.js';

interface ChiTabProps {
  shipment: { id: string; [key: string]: any };
}

export function ChiTab({ shipment }: ChiTabProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await FinancialService.getRequests(shipment.id);
      setRequests(data.filter(r => r.type === 'CHI'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shipment.id]);

  const totalChi = requests.reduce((sum, r) => sum + r.amount, 0);
  const daChi = requests.reduce((sum, r) => sum + r.paidAmount, 0);
  const conPhaiChi = requests.reduce((sum, r) => sum + r.remainingAmount, 0);
  const choDuyet = requests.filter(r => r.status === 'CHỜ DUYỆT').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & KPI */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase">{t('financial.kpi.chi', 'Expenses')}</h2>
            <p className="text-sm text-slate-500">{t('financial.chi.description', 'Manage expenses')}</p>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.summary.totalChi', 'Total Expenses')}</p>
              <p className="text-lg font-bold font-mono text-slate-900">${totalChi.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.chi.paid', 'Paid')}</p>
              <p className="text-lg font-bold font-mono text-slate-900">${daChi.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.kpi.payables', 'Payables')}</p>
              <p className="text-lg font-bold font-mono text-orange-600">${conPhaiChi.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.chi.pendingApproval', 'Pending Approval')}</p>
              <p className="text-lg font-bold font-mono text-amber-600">${choDuyet.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={16} /> {t('financial.actions.createChi', 'Create Expense Request')}
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-slate-500">{t('financial.common.loading', 'Loading...')}</div>
      ) : (
        <RequestTable requests={requests} mode="CHI" />
      )}

      {showModal && (
        <AddRequestModal
          type="CHI"
          onClose={() => setShowModal(false)}
          onSave={async (payload) => {
            await FinancialService.addRequest(shipment.id, payload);
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
