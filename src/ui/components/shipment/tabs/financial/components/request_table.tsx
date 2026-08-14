import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FinancialRequest } from '../types.js';
import { RequestDrawer } from './request_drawer.js';
import { FinancialService } from '../mockService.js';

interface RequestTableProps {
  requests: FinancialRequest[];
  mode: 'THU' | 'CHI' | 'ALL';
  onRowClick?: (req: FinancialRequest) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ĐÃ DUYỆT':
    case 'ĐÃ THU':
    case 'ĐÃ CHI':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CHỜ DUYỆT':
    case 'CHỜ THU':
    case 'CHỜ CHI':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'THU MỘT PHẦN':
    case 'CHI MỘT PHẦN':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'TỪ CHỐI':
    case 'HỦY':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NHÁP':
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export function RequestTable({ requests, mode, onRowClick }: RequestTableProps) {
  const { t } = useTranslation();
  const [selectedReq, setSelectedReq] = useState<FinancialRequest | null>(null);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'ĐÃ DUYỆT': t('financial.status.APPROVED', 'Approved'),
      'ĐÃ THU': t('financial.status.COLLECTED', 'Collected'),
      'ĐÃ CHI': t('financial.status.PAID', 'Paid'),
      'CHỜ DUYỆT': t('financial.status.PENDING', 'Pending Approval'),
      'CHỜ THU': t('financial.status.PENDING_COLLECTION', 'Pending Collection'),
      'CHỜ CHI': t('financial.status.PENDING_PAYMENT', 'Pending Payment'),
      'THU MỘT PHẦN': t('financial.status.PARTIAL_COLLECTION', 'Partial Collection'),
      'CHI MỘT PHẦN': t('financial.status.PARTIAL_PAYMENT', 'Partial Payment'),
      'TỪ CHỐI': t('financial.status.REJECTED', 'Rejected'),
      'HỦY': t('financial.status.CANCELLED', 'Cancelled'),
      'NHÁP': t('financial.status.DRAFT', 'Draft'),
    };
    return statusMap[status] || status;
  };

  if (!requests || requests.length === 0) {
    return <div className="text-sm text-slate-500 py-4 text-center border border-slate-200 rounded-lg bg-slate-50">{t('financial.table.noRequests', 'No requests found.')}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.requestId', 'Request ID')}</th>
            {mode === 'ALL' && <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.type', 'Type')}</th>}
            
            <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.date', 'Date')}</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.description', 'Description')}</th>
            
            {mode !== 'ALL' && <th className="px-3 py-3 text-left font-semibold text-slate-700">{mode === 'THU' ? t('financial.table.thuCategory', 'Rev. Category') : t('financial.table.chiCategory', 'Exp. Category')}</th>}
            
            {mode === 'ALL' && <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.requester', 'Requester')}</th>}
            
            {mode === 'THU' && <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.customer', 'Customer')}</th>}
            {mode === 'CHI' && (
              <>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.vendor', 'Vendor')}</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.container', 'Container')}</th>
              </>
            )}
            
            <th className="px-3 py-3 text-right font-semibold text-slate-700">{t('financial.table.amount', 'Amount')}</th>
            
            {mode !== 'ALL' && (
              <>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">{mode === 'THU' ? t('financial.thu.collected', 'Collected') : t('financial.chi.paid', 'Paid')}</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">{t('financial.table.remaining', 'Remaining')}</th>
              </>
            )}
            
            <th className="px-3 py-3 text-left font-semibold text-slate-700">{mode === 'THU' ? t('financial.table.dueDateThu', 'Due Date') : mode === 'CHI' ? t('financial.table.dueDateChi', 'Payment Due') : t('financial.table.expectedDate', 'Expected Date')}</th>
            
            {mode === 'ALL' && <th className="px-3 py-3 text-left font-semibold text-slate-700">{t('financial.table.approver', 'Approver')}</th>}
            
            <th className="px-3 py-3 text-center font-semibold text-slate-700">{t('financial.table.status', 'Status')}</th>
            <th className="px-3 py-3 text-right font-semibold text-slate-700">{t('financial.table.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {requests.map((r) => (
            <tr 
              key={r.id} 
              className={`hover:bg-slate-50 cursor-pointer ${mode === 'ALL' && r.type === 'THU' ? 'border-l-4 border-l-green-500' : ''} ${mode === 'ALL' && r.type === 'CHI' ? 'border-l-4 border-l-red-500' : ''}`}
              onClick={() => {
                setSelectedReq(r);
                if (onRowClick) onRowClick(r);
              }}
            >
              <td className="px-3 py-3 whitespace-nowrap text-slate-900 font-medium">{r.id}</td>
              
              {mode === 'ALL' && (
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${r.type === 'THU' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.type}
                  </span>
                </td>
              )}
              
              <td className="px-3 py-3 whitespace-nowrap text-slate-500">{r.requestDate}</td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-900 truncate max-w-[200px]" title={r.description}>{r.description}</td>
              
              {mode !== 'ALL' && <td className="px-3 py-3 whitespace-nowrap text-slate-700">{r.category}</td>}
              
              {mode === 'ALL' && <td className="px-3 py-3 whitespace-nowrap text-slate-700">{r.requester}</td>}
              
              {mode !== 'ALL' && <td className="px-3 py-3 whitespace-nowrap text-slate-700 truncate max-w-[150px]" title={r.partyName}>{r.partyName}</td>}
              
              {mode === 'CHI' && (
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{r.containerNumber || '-'}</td>
              )}
              
              <td className="px-3 py-3 whitespace-nowrap text-right font-mono font-medium text-slate-900">
                ${r.amount.toLocaleString()}
              </td>
              
              {mode !== 'ALL' && (
                <>
                  <td className="px-3 py-3 whitespace-nowrap text-right font-mono text-slate-500">
                    ${r.paidAmount.toLocaleString()}
                  </td>
                  <td className={`px-3 py-3 whitespace-nowrap text-right font-mono font-medium ${r.remainingAmount > 0 ? (mode === 'THU' ? 'text-amber-600' : 'text-orange-600') : 'text-slate-400'}`}>
                    ${r.remainingAmount.toLocaleString()}
                  </td>
                </>
              )}
              
              <td className="px-3 py-3 whitespace-nowrap text-slate-500">{r.expectedDate}</td>
              
              {mode === 'ALL' && <td className="px-3 py-3 whitespace-nowrap text-slate-500">{r.approver || '-'}</td>}
              
              <td className="px-3 py-3 whitespace-nowrap text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusColor(r.status)}`}>
                  {getStatusText(r.status)}
                </span>
              </td>
              
              <td className="px-3 py-3 whitespace-nowrap text-right text-blue-600 hover:text-blue-800 font-medium text-xs">
                {t('financial.table.view', 'View')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedReq && (
        <RequestDrawer 
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onUpdateStatus={async (id, status) => {
            await FinancialService.updateRequestStatus(id, status);
            // Ideally we should reload data from parent, but for now we update local state or just close drawer
            // A real app would use React Query or pass a refresh callback
            setSelectedReq(null); 
            window.location.reload(); // Quick hack for mock UI to refresh parent
          }}
          onRecordPayment={async (id, amount) => {
            await FinancialService.recordPayment(id, amount);
            setSelectedReq(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
