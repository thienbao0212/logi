import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, MoreVertical, ArrowUpRight, Download } from 'lucide-react';
import FilterDropdown from '../../components/ui/filter_dropdown.js';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';
import { apiFetch } from '@/lib/fetch.js';
import { RequestDrawer } from '../../components/shipment/tabs/financial/components/request_drawer.js';
import { AddRequestModal } from '../../components/shipment/tabs/financial/components/add_request_modal.js';

export default function PayablesTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinancialRequest[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    const reqs = await FinancialService.getRequests('');
    setData(reqs.filter(r => r.type === 'CHI'));
    
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      if (companyId) {
        const res = await apiFetch(`/api/shipments?companyId=${companyId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data) {
          const map: Record<string, string> = {};
          res.data.forEach((s: any) => {
            map[s.id] = s.trackingNumber;
          });
          setTrackingMap(map);
        }
      }
    } catch (e) {
      console.error('Failed to load tracking map', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-200/80 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-64 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder={t('accounting.payables.search', 'Search bills...')}
            />
          </div>
          <FilterDropdown
            label="Status"
            options={[{label: 'Pending', value: 'pending'}, {label: 'Paid', value: 'paid'}]}
            selectedValues={[]}
            onChange={() => {}}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download size={16} />
            {t('common.export', 'Export')}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            {t('accounting.payables.recordBill', 'Record Bill')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md shadow-[0_1px_0_0_#e2e8f0]">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
              </th>
              <th className="p-4">Bill No.</th>
              <th className="p-4">Shipment Ref</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Due Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} onClick={() => setSelectedRequest(row)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </td>
                <td className="p-4 font-bold text-slate-800">{row.id}</td>
                <td className="p-4 text-sm font-medium text-slate-600">
                  {trackingMap[row.shipmentId] || row.shipmentId || '-'}
                </td>
                <td className="p-4 font-medium text-slate-700">{row.partyName}</td>
                <td className="p-4">
                  <span className="font-bold text-slate-900">${row.amount.toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    row.status === 'ĐÃ CHI' ? 'bg-emerald-100 text-emerald-700' :
                    row.status === 'CHI MỘT PHẦN' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-slate-600">{new Date(row.expectedDate).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No payables found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <RequestDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={async (id, status) => {
            await FinancialService.updateRequestStatus(id, status);
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
            await load();
          }}
          onRecordPayment={async (id, amount) => {
            await FinancialService.recordPayment(id, amount);
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
            await load();
          }}
          onUpdateNote={async (id, note) => {
            await FinancialService.updateRequestStatus(id, selectedRequest.status, { notes: note });
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
            await load();
          }}
        />
      )}

      {isModalOpen && (
        <AddRequestModal
          type="CHI"
          showShipmentSelect={true}
          onClose={() => setIsModalOpen(false)}
          onSave={async (payload, shipmentRef) => {
            await FinancialService.addRequest(shipmentRef || 'GLOBAL', payload);
            setIsModalOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
