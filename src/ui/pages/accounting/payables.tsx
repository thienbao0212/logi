import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Truck,
  Package,
  Calendar
} from 'lucide-react';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';
import { apiFetch } from '@/lib/fetch.js';
import { RequestDrawer } from '../../components/shipment/tabs/financial/components/request_drawer.js';
import { AddRequestModal } from '../../components/shipment/tabs/financial/components/add_request_modal.js';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ExportButton,
  Badge,
  SearchInput,
  SegmentedControl,
} from '../../components/common/index.js';

type PayablesStatusFilter = 'ALL' | 'ĐÃ CHI' | 'CHI MỘT PHẦN' | 'CHỜ CHI' | 'CHỜ DUYỆT';

export default function PayablesTab() {
  const navigate = useNavigate();
  const [data, setData] = useState<FinancialRequest[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayablesStatusFilter>('ALL');

  const load = async () => {
    const reqs = await FinancialService.getRequests('');
    setData(reqs.filter(r => r.type === 'CHI'));
    
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
    switch (status) {
      case 'ĐÃ CHI':
        return <Badge variant="success" dot size="sm">{status}</Badge>;
      case 'CHI MỘT PHẦN':
        return <Badge variant="info" dot size="sm">{status}</Badge>;
      case 'CHỜ DUYỆT':
        return <Badge variant="warning" dot size="sm">{status}</Badge>;
      case 'CHỜ CHI':
        return <Badge variant="danger" dot size="sm">{status}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  // KPIs
  const metrics = useMemo(() => {
    let total = 0;
    let paid = 0;
    let remaining = 0;
    let pendingCount = 0;

    data.forEach(r => {
      total += r.amount;
      paid += r.paidAmount || 0;
      remaining += r.remainingAmount || (r.amount - (r.paidAmount || 0));
      if (r.status === 'CHỜ DUYỆT' || r.status === 'CHỜ CHI') {
        pendingCount++;
      }
    });

    return { total, paid, remaining, pendingCount, count: data.length };
  }, [data]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.shipmentId && (trackingMap[r.shipmentId] || r.shipmentId).toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ĐÃ CHI' && r.status !== 'ĐÃ CHI') return false;
        if (statusFilter === 'CHI MỘT PHẦN' && r.status !== 'CHI MỘT PHẦN') return false;
        if (statusFilter === 'CHỜ CHI' && r.status !== 'CHỜ CHI') return false;
        if (statusFilter === 'CHỜ DUYỆT' && r.status !== 'CHỜ DUYỆT') return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, trackingMap]);

  const handleExportCsv = () => {
    const headers = ['Mã phiếu chi', 'Mã lô hàng', 'Nhà cung cấp / Đối tác', 'Hạng mục chi', 'Nội dung', 'Số tiền chi', 'Đã chi', 'Còn lại', 'Hạn chi', 'Trạng thái'];
    const rows = filteredData.map(r => [
      r.id,
      trackingMap[r.shipmentId] || r.shipmentId || 'GLOBAL',
      `"${r.partyName || ''}"`,
      `"${r.category || ''}"`,
      `"${r.description || ''}"`,
      r.amount,
      r.paidAmount || 0,
      r.remainingAmount || 0,
      r.expectedDate,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cong_no_Phai_tra_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng phải trả */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tổng công nợ phải trả</span>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono mt-1">
              ${metrics.total.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">{metrics.count} chứng từ phát sinh</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 2: Đã chi thực tế */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đã chi thanh toán</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              ${metrics.paid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              {metrics.total > 0 ? Math.round((metrics.paid / metrics.total) * 100) : 0}% tổng giá trị
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 3: Còn phải trả */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Còn phải trả (Dư nợ)</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 font-mono mt-1">
              ${metrics.remaining.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 block">Cần chuẩn bị ngân quỹ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 4: Chờ xử lý */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đề nghị chi chờ duyệt</span>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-400 font-mono mt-1">
              {metrics.pendingCount} phiếu
            </div>
            <span className="text-[11px] text-orange-700 dark:text-orange-400 font-medium mt-0.5 block">Chờ phê duyệt chi / Chờ chi</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/40">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Quick Filter + Action buttons */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Box */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã phiếu chi, nhà cung cấp, mã lô QC, nội dung..."
          maxWidth="max-w-md"
        />

        {/* Center/Right: Quick Filter Pills */}
        <SegmentedControl
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as PayablesStatusFilter)}
          options={[
            { id: 'ALL', label: 'Tất cả', count: data.length },
            { id: 'ĐÃ CHI', label: 'Đã chi đủ', count: data.filter(r => r.status === 'ĐÃ CHI').length, activeClass: 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold', activeBadge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' },
            { id: 'CHI MỘT PHẦN', label: 'Chi 1 phần', count: data.filter(r => r.status === 'CHI MỘT PHẦN').length, activeClass: 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs font-bold', activeBadge: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300' },
            { id: 'CHỜ CHI', label: 'Chờ chi', count: data.filter(r => r.status === 'CHỜ CHI').length, activeClass: 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-2xs font-bold', activeBadge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300' },
            { id: 'CHỜ DUYỆT', label: 'Chờ duyệt', count: data.filter(r => r.status === 'CHỜ DUYỆT').length, activeClass: 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-2xs font-bold', activeBadge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' },
          ]}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <ExportButton onExport={handleExportCsv} />
          <Button
            variant="danger"
            icon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Lập Đề Nghị Chi
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs min-w-[950px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <th className="px-4 py-3.5">Mã phiếu chi</th>
                <th className="px-4 py-3.5">Lô hàng (Shipment)</th>
                <th className="px-4 py-3.5">Nhà cung cấp / Đối tác</th>
                <th className="px-4 py-3.5">Hạng mục chi</th>
                <th className="px-4 py-3.5">Nội dung diễn giải</th>
                <th className="px-4 py-3.5 text-right">Tổng phải chi</th>
                <th className="px-4 py-3.5 text-right">Đã chi</th>
                <th className="px-4 py-3.5 text-right">Còn lại</th>
                <th className="px-4 py-3.5">Hạn chi</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredData.map(req => {
                const shipmentTracking = trackingMap[req.shipmentId] || req.shipmentId;
                return (
                  <tr 
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-900 dark:group-hover:text-rose-300 group-hover:underline">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{req.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {shipmentTracking ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (req.shipmentId) navigate(`/shipments/${req.shipmentId}?tab=financial`);
                          }}
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]"
                        >
                          <Package size={12} className="text-slate-400" />
                          <span>{shipmentTracking}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Toàn hệ thống (Global)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]" title={req.partyName}>
                        <Truck size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{req.partyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px]">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={req.description}>
                      {req.description}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono">
                      ${req.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      ${(req.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-700 dark:text-amber-400 font-mono">
                      ${(req.remainingAmount || (req.amount - (req.paidAmount || 0))).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{req.expectedDate ? new Date(req.expectedDate).toLocaleDateString('vi-VN') : '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    Không tìm thấy phiếu chi nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
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

      {/* Modal Add Chi */}
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
