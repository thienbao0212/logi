import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinancialRequest } from '../types.js';
import { FinancialService } from '../mockService.js';
import { RequestTable } from '../components/request_table.js';

interface RequestTabProps {
  shipment: { id: string; [key: string]: any };
}

export function RequestTab({ shipment }: RequestTabProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'THU' | 'CHI' | 'CHỜ DUYỆT' | 'ĐÃ DUYỆT' | 'TỪ CHỐI'>('ALL');

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

  const filteredRequests = requests.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'THU') return r.type === 'THU';
    if (filter === 'CHI') return r.type === 'CHI';
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-2 overflow-x-auto hide-scrollbar">
        {['ALL', 'THU', 'CHI', 'CHỜ DUYỆT', 'ĐÃ DUYỆT', 'TỪ CHỐI'].map((f) => {
          let label = f;
          if (f === 'ALL') label = t('financial.request.all', 'All');
          else if (f === 'THU') label = t('financial.kpi.thu', 'Revenue');
          else if (f === 'CHI') label = t('financial.kpi.chi', 'Expenses');
          else if (f === 'CHỜ DUYỆT') label = t('financial.request.pending', 'Pending Approval');
          else if (f === 'ĐÃ DUYỆT') label = t('financial.request.approved', 'Approved');
          else if (f === 'TỪ CHỐI') label = t('financial.request.rejected', 'Rejected');
          return (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-4 text-slate-500">{t('financial.common.loading', 'Loading...')}</div>
      ) : (
        <RequestTable requests={filteredRequests} mode="ALL" />
      )}
    </div>
  );
}
