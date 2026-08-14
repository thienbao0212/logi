import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinancialRequest } from '../types.js';
import { FinancialService } from '../mockService.js';
import { RequestTable } from '../components/request_table.js';
import { Plus } from 'lucide-react';
import { AddRequestModal } from '../components/add_request_modal.js';

interface ThuTabProps {
  shipment: { id: string; [key: string]: any };
}

export function ThuTab({ shipment }: ThuTabProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await FinancialService.getRequests(shipment.id);
      setRequests(data.filter(r => r.type === 'THU'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shipment.id]);

  const totalThu = requests.reduce((sum, r) => sum + r.amount, 0);
  const daThu = requests.reduce((sum, r) => sum + r.paidAmount, 0);
  const conPhaiThu = requests.reduce((sum, r) => sum + r.remainingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header & KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase">{t('financial.kpi.thu', 'Revenue')}</h2>
            <p className="text-sm text-slate-500">{t('financial.thu.description', 'Manage expected revenues')}</p>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.summary.totalThu', 'Total Revenue')}</p>
              <p className="text-lg font-bold font-mono text-slate-900">${totalThu.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.thu.collected', 'Collected')}</p>
              <p className="text-lg font-bold font-mono text-green-600">${daThu.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('financial.kpi.receivables', 'Receivables')}</p>
              <p className="text-lg font-bold font-mono text-amber-600">${conPhaiThu.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> {t('financial.actions.createThu', 'Create Revenue Request')}
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-slate-500">{t('financial.common.loading', 'Loading...')}</div>
      ) : (
        <RequestTable requests={requests} mode="THU" />
      )}

      {showModal && (
        <AddRequestModal
          type="THU"
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
