import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ArrowDownLeft, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  BarChart2
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

type ReceivablesStatusFilter = 'ALL' | 'ĐÃ THU' | 'THU MỘT PHẦN' | 'CHỜ THU' | 'CHỜ DUYỆT';

export default function ReceivablesTab() {
  const navigate = useNavigate();
  const [data, setData] = useState<FinancialRequest[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceivablesStatusFilter>('ALL');
  const [showAging, setShowAging] = useState(false);

  const load = async () => {
    const reqs = await FinancialService.getRequests('');
    setData(reqs.filter(r => r.type === 'THU'));
    
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
      case 'ĐÃ THU':
        return <Badge variant="success" dot size="sm">{status}</Badge>;
      case 'THU MỘT PHẦN':
        return <Badge variant="info" dot size="sm">{status}</Badge>;
      case 'CHỜ DUYỆT':
        return <Badge variant="warning" dot size="sm">{status}</Badge>;
      case 'CHỜ THU':
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
      if (r.status === 'CHỜ DUYỆT' || r.status === 'CHỜ THU') {
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
        if (statusFilter === 'ĐÃ THU' && r.status !== 'ĐÃ THU') return false;
        if (statusFilter === 'THU MỘT PHẦN' && r.status !== 'THU MỘT PHẦN') return false;
        if (statusFilter === 'CHỜ THU' && r.status !== 'CHỜ THU') return false;
        if (statusFilter === 'CHỜ DUYỆT' && r.status !== 'CHỜ DUYỆT') return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, trackingMap]);

  // Aging Report: group unpaid AR by days overdue since expectedDate
  const agingReport = useMemo(() => {
    const today = new Date();
    const unpaid = data.filter(r => r.status !== 'ĐÃ THU');
    const byPartner: Record<string, { name: string; current: number; d30: number; d60: number; d90: number; over90: number; total: number }> = {};

    unpaid.forEach(r => {
      const name = r.partyName || 'Không xác định';
      if (!byPartner[name]) byPartner[name] = { name, current: 0, d30: 0, d60: 0, d90: 0, over90: 0, total: 0 };
      const remaining = r.remainingAmount || (r.amount - (r.paidAmount || 0));
      byPartner[name].total += remaining;

      if (!r.expectedDate) { byPartner[name].current += remaining; return; }
      const due = new Date(r.expectedDate);
      const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) byPartner[name].current += remaining;
      else if (diffDays <= 30) byPartner[name].d30 += remaining;
      else if (diffDays <= 60) byPartner[name].d60 += remaining;
      else if (diffDays <= 90) byPartner[name].d90 += remaining;
      else byPartner[name].over90 += remaining;
    });

    return Object.values(byPartner).sort((a, b) => b.total - a.total);
  }, [data]);

  const handleExportCsv = () => {
    const headers = ['Mã phiếu thu', 'Mã lô hàng', 'Khách hàng', 'Hạng mục', 'Nội dung', 'Số tiền', 'Đã thu', 'Còn lại', 'Hạn thu', 'Trạng thái'];
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
    link.setAttribute('download', `Cong_no_Phai_thu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng phải thu */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng công nợ phải thu</span>
            <div className="text-xl font-bold text-blue-700 font-mono mt-1">
              ${metrics.total.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.count} chứng từ phát sinh</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 2: Đã thu thực tế */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Đã thu thực tế</span>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
              ${metrics.paid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              {metrics.total > 0 ? Math.round((metrics.paid / metrics.total) * 100) : 0}% tổng giá trị
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 3: Còn phải thu */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Còn phải thu (Dư nợ)</span>
            <div className="text-xl font-bold text-amber-700 font-mono mt-1">
              ${metrics.remaining.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">Cần theo dõi thu hồi nợ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 4: Chờ xử lý */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chứng từ chờ xử lý</span>
            <div className="text-xl font-bold text-orange-700 font-mono mt-1">
              {metrics.pendingCount} phiếu
            </div>
            <span className="text-[11px] text-orange-700 font-medium mt-0.5 block">Chờ duyệt / Chờ thu tiền</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Quick Filter + Action buttons */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Box */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã phiếu, khách hàng, mã lô QC, nội dung..."
          maxWidth="max-w-md"
        />

        {/* Center/Right: Quick Filter Pills */}
        <SegmentedControl
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as ReceivablesStatusFilter)}
          options={[
            { id: 'ALL', label: 'Tất cả', count: data.length },
            { id: 'ĐÃ THU', label: 'Đã thu đủ', count: data.filter(r => r.status === 'ĐÃ THU').length, activeClass: 'bg-white text-emerald-700 shadow-2xs font-bold', activeBadge: 'bg-emerald-100 text-emerald-800' },
            { id: 'THU MỘT PHẦN', label: 'Thu 1 phần', count: data.filter(r => r.status === 'THU MỘT PHẦN').length, activeClass: 'bg-white text-blue-700 shadow-2xs font-bold', activeBadge: 'bg-blue-100 text-blue-800' },
            { id: 'CHỜ THU', label: 'Chờ thu', count: data.filter(r => r.status === 'CHỜ THU').length, activeClass: 'bg-white text-orange-700 shadow-2xs font-bold', activeBadge: 'bg-orange-100 text-orange-800' },
            { id: 'CHỜ DUYỆT', label: 'Chờ duyệt', count: data.filter(r => r.status === 'CHỜ DUYỆT').length, activeClass: 'bg-white text-amber-700 shadow-2xs font-bold', activeBadge: 'bg-amber-100 text-amber-800' },
          ]}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={showAging ? 'primary' : 'secondary'}
            icon={<BarChart2 size={14} className={showAging ? 'text-white' : 'text-slate-500'} />}
            onClick={() => setShowAging(v => !v)}
          >
            Tuổi nợ
          </Button>
          <ExportButton onExport={handleExportCsv} />
          <Button
            variant="success"
            icon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Lập Phiếu Thu
          </Button>
        </div>
      </div>

      {/* Aging Report Panel — Phân tích tuổi nợ theo khách hàng */}
      {showAging && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-blue-100 bg-blue-50/40 flex items-center gap-2">
            <BarChart2 size={15} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-900">Phân tích Tuổi Nợ (AR Aging) — Theo khách hàng</span>
            <span className="ml-auto text-[11px] text-blue-600 font-medium">Chỉ tính các khoản chưa thu đủ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-right">Chưa đến hạn</th>
                  <th className="px-4 py-3 text-right text-amber-700">1–30 ngày</th>
                  <th className="px-4 py-3 text-right text-orange-700">31–60 ngày</th>
                  <th className="px-4 py-3 text-right text-red-700">61–90 ngày</th>
                  <th className="px-4 py-3 text-right text-rose-800">Trên 90 ngày</th>
                  <th className="px-4 py-3 text-right font-bold">Tổng dư nợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agingReport.map(row => (
                  <tr key={row.name} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{row.current > 0 ? row.current.toLocaleString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{row.d30 > 0 ? row.d30.toLocaleString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-orange-700">{row.d60 > 0 ? row.d60.toLocaleString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-700">{row.d90 > 0 ? row.d90.toLocaleString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-800">{row.over90 > 0 ? row.over90.toLocaleString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900">{row.total.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                ))}
                {agingReport.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs italic">
                      Không có công nợ chưa thu — tất cả đã hoàn tất 🎉
                    </td>
                  </tr>
                )}
              </tbody>
              {agingReport.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                  <tr className="text-[11px] font-bold text-slate-700">
                    <td className="px-4 py-3">TỔNG CỘNG</td>
                    {(['current', 'd30', 'd60', 'd90', 'over90'] as const).map(k => (
                      <td key={k} className="px-4 py-3 text-right font-mono">
                        {agingReport.reduce((s, r) => s + r[k], 0).toLocaleString('vi-VN')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                      {agingReport.reduce((s, r) => s + r.total, 0).toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs min-w-[950px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3.5">Mã phiếu thu</th>
                <th className="px-4 py-3.5">Lô hàng (Shipment)</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Hạng mục thu</th>
                <th className="px-4 py-3.5">Nội dung diễn giải</th>
                <th className="px-4 py-3.5 text-right">Tổng phải thu</th>
                <th className="px-4 py-3.5 text-right">Đã thu</th>
                <th className="px-4 py-3.5 text-right">Còn lại</th>
                <th className="px-4 py-3.5">Hạn thu</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(req => {
                const shipmentTracking = trackingMap[req.shipmentId] || req.shipmentId;
                return (
                  <tr 
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700 group-hover:text-blue-900 group-hover:underline">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownLeft size={14} className="text-emerald-600 shrink-0" />
                        <span>{req.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {shipmentTracking ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (req.shipmentId) navigate(`/shipments/${req.shipmentId}`);
                          }}
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 hover:text-blue-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]"
                        >
                          <Package size={12} className="text-slate-400" />
                          <span>{shipmentTracking}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Toàn hệ thống (Global)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]" title={req.partyName}>
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{req.partyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 truncate max-w-[200px]" title={req.description}>
                      {req.description}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                      ${req.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700 font-mono">
                      ${(req.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-700 font-mono">
                      ${(req.remainingAmount || (req.amount - (req.paidAmount || 0))).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
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
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-xs italic">
                    Không tìm thấy phiếu thu nào phù hợp với điều kiện tìm kiếm.
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

      {/* Modal Add Thu */}
      {isModalOpen && (
        <AddRequestModal
          type="THU"
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
