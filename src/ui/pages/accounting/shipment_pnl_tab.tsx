import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  Sparkles, 
  BarChart3, 
  Info,
  Edit3
} from 'lucide-react';
import { 
  getShipmentDirectCost, 
  loadShipmentPnl, 
  saveShipmentPnl, 
  formatAccountingCurrency 
} from '../../components/shipment/transit_types.js';
import {
  Button,
  ExportButton,
  SearchInput,
  SegmentedControl,
  CurrencyInput,
  Modal,
} from '../../components/common/index.js';

interface ShipmentPnlRow {
  id: string;
  trackingNumber: string;
  customerName?: string;
  createdAt: string;
  directCost: number; // Tổng chi phí trực tiếp
  managementCost: number; // Chi phí quản lý
  totalCost: number; // Tổng chi phí = direct + management
  revenue: number; // Doanh thu lô
  netProfit: number; // Lợi nhuận ròng = revenue - totalCost
}

export default function ShipmentPnlTab() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfit, setFilterProfit] = useState<'ALL' | 'PROFIT' | 'LOSS' | 'BREAK_EVEN'>('ALL');
  
  // Local state for editable management cost and revenue
  // Map of shipmentId -> { managementCost: number, revenue: number }
  const [pnlMap, setPnlMap] = useState<Record<string, { managementCost: number; revenue: number }>>({});
  
  // Bulk update modal
  const [bulkModal, setBulkModal] = useState<{ open: boolean; type: 'management' | 'revenue'; value: string }>({
    open: false,
    type: 'management',
    value: '800000',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      
      let list: any[] = [];
      try {
        const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        list = json.data || [];
      } catch {
        list = JSON.parse(localStorage.getItem('shipments_cache') || '[]');
      }

      setShipments(list);

      // Load P&L configs for each shipment
      const map: Record<string, { managementCost: number; revenue: number }> = {};
      list.forEach((s) => {
        const pnl = loadShipmentPnl(s.id);
        map[s.id] = {
          managementCost: pnl.managementCost ?? 800000,
          revenue: pnl.revenue ?? 3400000,
        };
      });
      setPnlMap(map);
    } catch (e) {
      console.error('Failed to load accounting P&L shipments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePnlField = (shipmentId: string, field: 'managementCost' | 'revenue', value: number) => {
    const current = pnlMap[shipmentId] || { managementCost: 800000, revenue: 3400000 };
    const updated = {
      ...current,
      [field]: Math.max(0, value),
    };
    setPnlMap(prev => ({
      ...prev,
      [shipmentId]: updated,
    }));
    saveShipmentPnl(shipmentId, updated);
  };

  const handleApplyBulk = () => {
    const num = Number(bulkModal.value.replace(/[^0-9]/g, '')) || 0;
    const newMap = { ...pnlMap };
    
    shipments.forEach(s => {
      const cur = newMap[s.id] || { managementCost: 800000, revenue: 3400000 };
      if (bulkModal.type === 'management') {
        cur.managementCost = num;
      } else {
        cur.revenue = num;
      }
      newMap[s.id] = cur;
      saveShipmentPnl(s.id, cur);
    });

    setPnlMap(newMap);
    setBulkModal({ ...bulkModal, open: false });
  };

  // Compile all rows
  const pnlRows: ShipmentPnlRow[] = useMemo(() => {
    return shipments.map((s) => {
      const directCost = getShipmentDirectCost(s.id);
      const pnlConfig = pnlMap[s.id] || { managementCost: 800000, revenue: 3400000 };
      const managementCost = pnlConfig.managementCost;
      const totalCost = directCost + managementCost;
      const revenue = pnlConfig.revenue;
      const netProfit = revenue - totalCost;

      return {
        id: s.id,
        trackingNumber: s.trackingNumber,
        customerName: s.customerName || (s.customerId?.startsWith('0000') ? 'ABC Logistics' : 'Khách hàng Quá cảnh'),
        createdAt: s.createdAt,
        directCost,
        managementCost,
        totalCost,
        revenue,
        netProfit,
      };
    });
  }, [shipments, pnlMap]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return pnlRows.filter((r) => {
      const matchSearch = 
        r.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (r.customerName && r.customerName.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      
      if (!matchSearch) return false;

      if (filterProfit === 'PROFIT') return r.netProfit > 0;
      if (filterProfit === 'LOSS') return r.netProfit < 0;
      if (filterProfit === 'BREAK_EVEN') return r.netProfit === 0;
      return true;
    });
  }, [pnlRows, searchQuery, filterProfit]);

  // Totals calculations
  const totals = useMemo(() => {
    let totalDirect = 0;
    let totalManagement = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalNetProfit = 0;
    let profitCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;

    filteredRows.forEach((r) => {
      totalDirect += r.directCost;
      totalManagement += r.managementCost;
      totalCost += r.totalCost;
      totalRevenue += r.revenue;
      totalNetProfit += r.netProfit;

      if (r.netProfit > 0) profitCount++;
      else if (r.netProfit < 0) lossCount++;
      else breakEvenCount++;
    });

    const marginPercentage = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const avgDirectCost = filteredRows.length > 0 ? totalDirect / filteredRows.length : 0;
    const avgManagementCost = filteredRows.length > 0 ? totalManagement / filteredRows.length : 0;

    return {
      totalDirect,
      totalManagement,
      totalCost,
      totalRevenue,
      totalNetProfit,
      marginPercentage,
      profitCount,
      lossCount,
      breakEvenCount,
      avgDirectCost,
      avgManagementCost,
      count: filteredRows.length,
    };
  }, [filteredRows]);

  const handleExportCsv = () => {
    const headers = ['STT', 'Mã lô hàng', 'Khách hàng', 'Tổng chi phí trực tiếp', 'Chi phí quản lý', 'Tổng chi phí', 'Doanh thu lô', 'Lợi nhuận ròng'];
    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      r.trackingNumber,
      `"${r.customerName || ''}"`,
      r.directCost,
      r.managementCost,
      r.totalCost,
      r.revenue,
      r.netProfit,
    ]);

    // Add total row
    rows.push([
      'Tổng',
      `${totals.count} lô`,
      '—',
      totals.totalDirect,
      totals.totalManagement,
      totals.totalCost,
      totals.totalRevenue,
      totals.totalNetProfit,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_Doanh_thu_Loi_nhuan_Lo_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 4 Financial & Business Optimization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Doanh thu */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Doanh thu lô</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.totalRevenue.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">VNĐ</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trung bình: <strong className="font-mono text-slate-700 dark:text-slate-300">{totals.count > 0 ? Math.round(totals.totalRevenue / totals.count).toLocaleString('vi-VN') : 0}</strong> đ/lô
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/60">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card 2: Chi phí */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Chi phí</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totals.totalCost.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">VNĐ</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trực tiếp: <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{totals.totalDirect.toLocaleString('vi-VN')}</span> đ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/60">
            <Layers size={24} />
          </div>
        </div>

        {/* Card 3: Lợi nhuận ròng */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between backdrop-blur-xl ${
          totals.totalNetProfit >= 0 
            ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200' 
            : 'bg-red-50/60 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60 text-red-950 dark:text-red-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Lợi nhuận ròng toàn kỳ</span>
            <h3 className={`text-xl font-bold font-mono ${totals.totalNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatAccountingCurrency(totals.totalNetProfit)} <span className="text-xs font-normal opacity-70">VNĐ</span>
            </h3>
            <p className="text-[11px] opacity-80 flex items-center gap-1 font-medium">
              <span>Biên lợi nhuận:</span>
              <strong className="font-mono">{totals.marginPercentage.toFixed(1)}%</strong>
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            totals.totalNetProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/60 border-red-200 dark:border-red-700 text-red-600 dark:text-red-300'
          }`}>
            {totals.totalNetProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
        </div>

        {/* Card 4: Tối ưu hóa kinh doanh */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tối ưu hóa kinh doanh</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded-full font-bold">Hiệu quả</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700 dark:text-emerald-400">{totals.profitCount} Lô lãi</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-red-600 dark:text-red-400">{totals.lossCount} Lô lỗ</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-400">{totals.breakEvenCount} Hòa vốn</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            💡 CP quản lý TB: <strong className="font-mono text-purple-700 dark:text-purple-400">{Math.round(totals.avgManagementCost).toLocaleString('vi-VN')} đ</strong>/lô (Tăng số lượng lô để giảm CP quản lý/lô).
          </p>
        </div>

      </div>

      {/* Control Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <SearchInput
            placeholder="Tìm theo mã lô hàng QC, khách hàng..."
            value={searchQuery}
            onChange={setSearchQuery}
            maxWidth="max-w-sm"
          />

          <SegmentedControl
            value={filterProfit}
            onChange={(val) => setFilterProfit(val as any)}
            options={[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PROFIT', label: 'Có lãi (+)', activeClass: 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold' },
              { id: 'LOSS', label: 'Bị lỗ (-)', activeClass: 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-2xs font-bold' },
            ]}
          />
        </div>

        {/* Quick Batch Actions & Export */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkModal({ open: true, type: 'management', value: '800000' })}
            className="text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            title="Áp dụng chi phí quản lý cho toàn bộ các lô hàng"
          >
            <Sparkles size={14} className="text-purple-600 dark:text-purple-400 mr-1.5" />
            <span>Gán CP quản lý loạt</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkModal({ open: true, type: 'revenue', value: '3400000' })}
            className="text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            title="Áp dụng doanh thu tiêu chuẩn cho toàn bộ các lô hàng"
          >
            <DollarSign size={14} className="text-blue-600 dark:text-blue-400 mr-1.5" />
            <span>Gán doanh thu loạt</span>
          </Button>

          <ExportButton onExport={handleExportCsv} />
        </div>
      </div>

      {/* Main P&L Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Đang tải và tính toán doanh thu chi phí từng lô...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
            <BarChart3 size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Chưa có dữ liệu lô hàng</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hãy tạo lô hàng mới và nhập chi phí tại các mốc để theo dõi báo cáo P&L.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-950/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 text-center w-12">STT</th>
                  <th className="p-3.5 min-w-[160px]">MÃ LÔ HÀNG</th>
                  <th className="p-3.5 text-right min-w-[180px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>TỔNG CHI PHÍ TRỰC TIẾP</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1 py-0.2 rounded font-normal lowercase">tự động</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>CHI PHÍ QUẢN LÝ</span>
                      <Edit3 size={11} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[170px] bg-slate-100/60 dark:bg-slate-950/60 font-black text-slate-900 dark:text-white">
                    TỔNG CHI PHÍ
                  </th>
                  <th className="p-3.5 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>DOANH THU LÔ</span>
                      <Edit3 size={11} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[180px] bg-slate-100/60 dark:bg-slate-950/60 font-black text-slate-900 dark:text-white">
                    LỢI NHUẬN RÒNG
                  </th>
                  <th className="p-3.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRows.map((row, idx) => {
                  const isProfit = row.netProfit > 0;
                  const isLoss = row.netProfit < 0;

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group"
                    >
                      {/* STT */}
                      <td className="p-3.5 text-center text-slate-500 dark:text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Mã lô hàng */}
                      <td className="p-3.5">
                        <div 
                          onClick={() => navigate(`/shipments/${row.id}?tab=financial`)}
                          className="cursor-pointer group-hover:underline"
                        >
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs">
                            {row.trackingNumber}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {row.customerName}
                          </div>
                        </div>
                      </td>

                      {/* Tổng chi phí trực tiếp (Tự động đồng bộ từ 5 mốc & Tab Tài chính) */}
                      <td className="p-3.5 text-right font-mono font-bold text-amber-800 dark:text-amber-300">
                        {row.directCost > 0 ? row.directCost.toLocaleString('vi-VN') : '0'}
                      </td>

                      {/* Chi phí quản lý (Editable inline) */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end w-32">
                          <CurrencyInput
                            size="sm"
                            value={row.managementCost}
                            onChange={(val) => handleUpdatePnlField(row.id, 'managementCost', val)}
                          />
                        </div>
                      </td>

                      {/* Tổng chi phí = directCost + managementCost */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950/30">
                        {row.totalCost.toLocaleString('vi-VN')}
                      </td>

                      {/* Doanh thu lô (Editable inline) */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end w-32">
                          <CurrencyInput
                            size="sm"
                            value={row.revenue}
                            onChange={(val) => handleUpdatePnlField(row.id, 'revenue', val)}
                          />
                        </div>
                      </td>

                      {/* Lợi nhuận ròng (Theo đúng chuẩn: > 0 xanh, = 0 gạch ngang, < 0 đỏ trong ngoặc) */}
                      <td className={`p-3.5 text-right font-mono font-bold bg-slate-50/50 dark:bg-slate-950/30 ${
                        isProfit 
                          ? 'text-emerald-700 dark:text-emerald-400' 
                          : isLoss 
                          ? 'text-red-600 dark:text-red-400 font-extrabold' 
                          : 'text-slate-500 dark:text-slate-400 font-normal'
                      }`}>
                        <span className={`inline-block px-2 py-0.5 rounded ${isLoss ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60' : isProfit ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60' : ''}`}>
                          {formatAccountingCurrency(row.netProfit)}
                        </span>
                      </td>

                      {/* Link action */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/shipments/${row.id}?tab=financial`)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                          title="Xem chi tiết các mốc & chi phí của lô này"
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* STICKY / HIGHLIGHTED TOTAL SUMMARY ROW */}
              <tfoot>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold text-xs border-t-2 border-slate-800 dark:border-slate-700 shadow-xl">
                  <td className="p-4 text-center font-bold text-slate-300 dark:text-slate-400">
                    Tổng
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-300 dark:text-blue-400">
                    {totals.count} lô hàng
                  </td>
                  <td className="p-4 text-right font-mono text-amber-300 dark:text-amber-400 font-black text-sm">
                    {totals.totalDirect.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-purple-300 dark:text-purple-400 font-bold text-sm">
                    {totals.totalManagement.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-white font-black text-sm bg-slate-950 dark:bg-black">
                    {totals.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-blue-200 dark:text-blue-300 font-black text-sm">
                    {totals.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className={`p-4 text-right font-mono font-black text-sm bg-slate-950 dark:bg-black ${
                    totals.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatAccountingCurrency(totals.totalNetProfit)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Footer Note explaining formula */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Công thức:</strong> [Tổng chi phí] = [Tổng CP trực tiếp] + [CP quản lý] • [Lợi nhuận ròng] = [Doanh thu lô] - [Tổng chi phí].
            </span>
          </div>
          <div className="text-slate-400 dark:text-slate-500 italic">
            * Dữ liệu chi phí trực tiếp tự động đồng bộ từ Tab Tài chính của từng lô. Bấm vào số tiền để chỉnh sửa nhanh.
          </div>
        </div>
      </div>

      {/* Modal Áp dụng hàng loạt (Batch Apply) */}
      <Modal
        isOpen={bulkModal.open}
        onClose={() => setBulkModal({ ...bulkModal, open: false })}
        title={
          bulkModal.type === 'management'
            ? 'Áp dụng Chi phí quản lý hàng loạt'
            : 'Áp dụng Doanh thu tiêu chuẩn hàng loạt'
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Nhập số tiền áp dụng đồng loạt cho tất cả <strong>{shipments.length} lô hàng</strong> trong kỳ này:
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số tiền (VNĐ) <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              size="lg"
              value={Number(bulkModal.value) || 0}
              onChange={(val) => setBulkModal({ ...bulkModal, value: String(val) })}
            />
          </div>

          <div className="pt-3 flex gap-2.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setBulkModal({ ...bulkModal, open: false })}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyBulk}
            >
              Xác nhận áp dụng loạt
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
