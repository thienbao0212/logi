import { useState, useEffect } from 'react';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, Clock, LayoutGrid, Table } from 'lucide-react';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';
import { apiFetch } from '@/lib/fetch.js';
import { RequestDrawer } from '../../components/shipment/tabs/financial/components/request_drawer.js';
import { AddRequestModal } from '../../components/shipment/tabs/financial/components/add_request_modal.js';

export default function DailyOperationsTab() {
  const [data, setData] = useState<FinancialRequest[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  const [isThuModalOpen, setIsThuModalOpen] = useState(false);
  const [isChiModalOpen, setIsChiModalOpen] = useState(false);

  const [thuSearch, setThuSearch] = useState('');
  const [chiSearch, setChiSearch] = useState('');

  const load = async () => {
    const reqs = await FinancialService.getRequests('');
    setData(reqs);
    
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      if (companyId) {
        const res = await apiFetch(`/api/shipments?companyId=${companyId}`);
        const shipments = res.data || [];
        const map: Record<string, string> = {};
        shipments.forEach((s: any) => {
          map[s.id] = s.trackingNumber;
        });
        setTrackingMap(map);
      }
    } catch (e) {
      console.error('Failed to load tracking map', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-slate-100 text-slate-700';
    if (status === 'ĐÃ THU' || status === 'ĐÃ CHI') colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    else if (status.includes('MỘT PHẦN')) colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
    else if (status === 'CHỜ DUYỆT') colorClass = 'bg-orange-100 text-orange-700 border-orange-200';
    else if (status === 'CHỜ THU' || status === 'CHỜ CHI') colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
        {status}
      </span>
    );
  };

  const thuData = data.filter(r => r.type === 'THU' && (r.id.toLowerCase().includes(thuSearch.toLowerCase()) || r.partyName.toLowerCase().includes(thuSearch.toLowerCase()) || r.shipmentId.toLowerCase().includes(thuSearch.toLowerCase())));
  const chiData = data.filter(r => r.type === 'CHI' && (r.id.toLowerCase().includes(chiSearch.toLowerCase()) || r.partyName.toLowerCase().includes(chiSearch.toLowerCase()) || r.shipmentId.toLowerCase().includes(chiSearch.toLowerCase())));

  const renderCard = (req: FinancialRequest, isThu: boolean) => (
    <div 
      key={req.id} 
      onClick={() => setSelectedRequest(req)}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group flex flex-col gap-3 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${isThu ? 'bg-emerald-500' : 'bg-rose-500'} opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex justify-between items-start ml-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{req.id}</span>
            {getStatusBadge(req.status)}
          </div>
          <div className="text-sm font-medium text-slate-700 mt-1">{req.partyName}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${isThu ? 'text-emerald-700' : 'text-rose-700'}`}>
            ${req.amount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 justify-end mt-1">
            <Clock size={12} />
            {new Date(req.expectedDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs ml-2 pt-2 border-t border-slate-100">
        <div className="text-slate-500 font-medium">
          Ref: <span className="text-slate-700 font-semibold">{trackingMap[req.shipmentId] || req.shipmentId || 'GLOBAL'}</span>
        </div>
        <div className="text-slate-500 truncate max-w-[150px]" title={req.description}>
          {req.description}
        </div>
      </div>
    </div>
  );

  const combinedData = [...thuData, ...chiData].sort((a, b) => new Date(b.expectedDate).getTime() - new Date(a.expectedDate).getTime());

  const renderCombinedTable = () => (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">Tất cả Phiếu Thu / Chi</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsThuModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Phiếu Thu
          </button>
          <button 
            onClick={() => setIsChiModalOpen(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Phiếu Chi
          </button>
        </div>
      </div>
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <th className="p-4">Ngày (Date)</th>
              <th className="p-4">Loại (Type)</th>
              <th className="p-4">Mã Phiếu (Ref)</th>
              <th className="p-4">Lô hàng (Shipment)</th>
              <th className="p-4">Đối tác (Party)</th>
              <th className="p-4">Hạng mục (Category)</th>
              <th className="p-4">Nội dung (Description)</th>
              <th className="p-4 text-right">Số tiền (Amount)</th>
              <th className="p-4 text-center">Trạng thái (Status)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {combinedData.map(req => {
              const isThu = req.type === 'THU';
              return (
                <tr 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-sm text-slate-600 font-medium">{new Date(req.expectedDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${isThu ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-900">{req.id}</td>
                  <td className="p-4 text-sm text-slate-600">{trackingMap[req.shipmentId] || req.shipmentId || 'GLOBAL'}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{req.partyName}</td>
                  <td className="p-4 text-sm text-slate-600">{req.category}</td>
                  <td className="p-4 text-sm text-slate-500 truncate max-w-[200px]" title={req.description}>{req.description}</td>
                  <td className={`p-4 text-right text-sm font-bold ${isThu ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${req.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">{getStatusBadge(req.status)}</td>
                </tr>
              );
            })}
            {combinedData.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  Không tìm thấy dữ liệu thu chi nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300 gap-4">
      
      <div className="flex justify-end shrink-0">
        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <LayoutGrid size={16} /> Card View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <Table size={16} /> Table View
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        /* 2 Columns */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          
          {/* Receivables Column */}
          <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ArrowDownLeft size={20} className="stroke-[2.5]" />
                  <h2 className="text-lg font-bold text-slate-900">Phiếu Thu (Receivables)</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{thuData.length}</span>
                </div>
                <button 
                  onClick={() => setIsThuModalOpen(true)}
                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                  title="Tạo Phiếu Thu Mới"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm phiếu thu..."
                  value={thuSearch}
                  onChange={(e) => setThuSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-4 flex flex-col gap-3">
              {thuData.map(r => renderCard(r, true))}
              {thuData.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Không tìm thấy phiếu thu nào.
                </div>
              )}
            </div>
          </div>

          {/* Payables Column */}
          <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700">
                  <ArrowUpRight size={20} className="stroke-[2.5]" />
                  <h2 className="text-lg font-bold text-slate-900">Phiếu Chi (Payables)</h2>
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">{chiData.length}</span>
                </div>
                <button 
                  onClick={() => setIsChiModalOpen(true)}
                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                  title="Tạo Phiếu Chi Mới"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm phiếu chi..."
                  value={chiSearch}
                  onChange={(e) => setChiSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-4 flex flex-col gap-3">
              {chiData.map(r => renderCard(r, false))}
              {chiData.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Không tìm thấy phiếu chi nào.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          {renderCombinedTable()}
        </div>
      )}

      {selectedRequest && (
        <RequestDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={async (id, status) => {
            await FinancialService.updateRequestStatus(id, status);
            await load();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
          onRecordPayment={async (id, amount) => {
            await FinancialService.recordPayment(id, amount);
            await load();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
          onUpdateNote={async (id, note) => {
            await FinancialService.updateRequestStatus(id, selectedRequest.status, { notes: note });
            await load();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
        />
      )}

      {isThuModalOpen && (
        <AddRequestModal
          type="THU"
          showShipmentSelect={true}
          onClose={() => setIsThuModalOpen(false)}
          onSave={async (payload, shipmentRef) => {
            await FinancialService.addRequest(shipmentRef || 'GLOBAL', payload);
            setIsThuModalOpen(false);
            await load();
          }}
        />
      )}
      
      {isChiModalOpen && (
        <AddRequestModal
          type="CHI"
          showShipmentSelect={true}
          onClose={() => setIsChiModalOpen(false)}
          onSave={async (payload, shipmentRef) => {
            await FinancialService.addRequest(shipmentRef || 'GLOBAL', payload);
            setIsChiModalOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
