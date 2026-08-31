import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  Download, 
  Search, 
  Edit3, 
  Sparkles, 
  BarChart3, 
  Info
} from 'lucide-react';
import { 
  getShipmentDirectCost, 
  loadShipmentPnl, 
  saveShipmentPnl, 
  formatAccountingCurrency 
} from '../../components/shipment/transit_types.js';

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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh thu lô</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">
              {totals.totalRevenue.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Trung bình: <strong className="font-mono text-slate-700">{totals.count > 0 ? Math.round(totals.totalRevenue / totals.count).toLocaleString('vi-VN') : 0}</strong> đ/lô
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card 2: Chi phí */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Chi phí</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">
              {totals.totalCost.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Trực tiếp: <span className="font-mono text-amber-700 font-bold">{totals.totalDirect.toLocaleString('vi-VN')}</span> đ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
        </div>

        {/* Card 3: Lợi nhuận ròng */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
          totals.totalNetProfit >= 0 
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
            : 'bg-red-50/60 border-red-200 text-red-950'
        }`}>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Lợi nhuận ròng toàn kỳ</span>
            <h3 className={`text-xl font-bold font-mono ${totals.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatAccountingCurrency(totals.totalNetProfit)} <span className="text-xs font-normal opacity-70">VNĐ</span>
            </h3>
            <p className="text-[11px] opacity-80 flex items-center gap-1 font-medium">
              <span>Biên lợi nhuận:</span>
              <strong className="font-mono">{totals.marginPercentage.toFixed(1)}%</strong>
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            totals.totalNetProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
          }`}>
            {totals.totalNetProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
        </div>

        {/* Card 4: Tối ưu hóa kinh doanh */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tối ưu hóa kinh doanh</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Hiệu quả</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700">{totals.profitCount} Lô lãi</span>
            <span className="text-slate-300">•</span>
            <span className="text-red-600">{totals.lossCount} Lô lỗ</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{totals.breakEvenCount} Hòa vốn</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            💡 CP quản lý TB: <strong className="font-mono text-purple-700">{Math.round(totals.avgManagementCost).toLocaleString('vi-VN')} đ</strong>/lô (Tăng số lượng lô để giảm CP quản lý/lô).
          </p>
        </div>

      </div>

      {/* Control Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lô hàng QC, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PROFIT', label: 'Có lãi (+)' },
              { key: 'LOSS', label: 'Bị lỗ (-)' },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterProfit(f.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterProfit === f.key ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Batch Actions & Export */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setBulkModal({ open: true, type: 'management', value: '800000' })}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Áp dụng chi phí quản lý cho toàn bộ các lô hàng"
          >
            <Sparkles size={14} />
            <span>Gán CP quản lý loạt</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkModal({ open: true, type: 'revenue', value: '3400000' })}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Áp dụng doanh thu tiêu chuẩn cho toàn bộ các lô hàng"
          >
            <DollarSign size={14} />
            <span>Gán doanh thu loạt</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Main P&L Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Đang tải và tính toán doanh thu chi phí từng lô...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
            <BarChart3 size={36} className="text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu lô hàng</p>
            <p className="text-xs text-slate-400 mt-1">Hãy tạo lô hàng mới và nhập chi phí tại các mốc để theo dõi báo cáo P&L.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 text-center w-12">STT</th>
                  <th className="p-3.5 min-w-[160px]">MÃ LÔ HÀNG</th>
                  <th className="p-3.5 text-right min-w-[180px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>TỔNG CHI PHÍ TRỰC TIẾP</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-normal lowercase">tự động</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>CHI PHÍ QUẢN LÝ</span>
                      <Edit3 size={11} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[170px] bg-slate-100/60 font-black text-slate-900">
                    TỔNG CHI PHÍ
                  </th>
                  <th className="p-3.5 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>DOANH THU LÔ</span>
                      <Edit3 size={11} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right min-w-[180px] bg-slate-100/60 font-black">
                    LỢI NHUẬN RÒNG
                  </th>
                  <th className="p-3.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => {
                  const isProfit = row.netProfit > 0;
                  const isLoss = row.netProfit < 0;

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* STT */}
                      <td className="p-3.5 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* Mã lô hàng */}
                      <td className="p-3.5">
                        <div 
                          onClick={() => navigate(`/shipments/${row.id}`)}
                          className="cursor-pointer group-hover:underline"
                        >
                          <span className="font-mono font-bold text-blue-700 text-xs">
                            {row.trackingNumber}
                          </span>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {row.customerName}
                          </div>
                        </div>
                      </td>

                      {/* Tổng chi phí trực tiếp (Tự động đồng bộ từ 5 mốc & Tab Tài chính) */}
                      <td className="p-3.5 text-right font-mono font-bold text-amber-800">
                        {row.directCost > 0 ? row.directCost.toLocaleString('vi-VN') : '0'}
                      </td>

                      {/* Chi phí quản lý (Editable inline) */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="text"
                            value={row.managementCost.toLocaleString('vi-VN')}
                            onChange={(e) => {
                              const rawVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                              handleUpdatePnlField(row.id, 'managementCost', rawVal);
                            }}
                            className="w-28 text-right px-2 py-1 font-mono font-semibold text-slate-800 bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none transition-all text-xs"
                            title="Bấm để chỉnh sửa chi phí quản lý của lô này"
                          />
                        </div>
                      </td>

                      {/* Tổng chi phí = directCost + managementCost */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                        {row.totalCost.toLocaleString('vi-VN')}
                      </td>

                      {/* Doanh thu lô (Editable inline) */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="text"
                            value={row.revenue.toLocaleString('vi-VN')}
                            onChange={(e) => {
                              const rawVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                              handleUpdatePnlField(row.id, 'revenue', rawVal);
                            }}
                            className="w-28 text-right px-2 py-1 font-mono font-bold text-blue-900 bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none transition-all text-xs"
                            title="Bấm để chỉnh sửa doanh thu thu khách của lô này"
                          />
                        </div>
                      </td>

                      {/* Lợi nhuận ròng (Theo đúng chuẩn: > 0 xanh, = 0 gạch ngang, < 0 đỏ trong ngoặc) */}
                      <td className={`p-3.5 text-right font-mono font-bold bg-slate-50/50 ${
                        isProfit 
                          ? 'text-emerald-700' 
                          : isLoss 
                          ? 'text-red-600 font-extrabold' 
                          : 'text-slate-500 font-normal'
                      }`}>
                        <span className={`inline-block px-2 py-0.5 rounded ${isLoss ? 'bg-red-50 border border-red-200' : isProfit ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                          {formatAccountingCurrency(row.netProfit)}
                        </span>
                      </td>

                      {/* Link action */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/shipments/${row.id}`)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
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
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-800 shadow-xl">
                  <td className="p-4 text-center font-bold text-slate-300">
                    Tổng
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-300">
                    {totals.count} lô hàng
                  </td>
                  <td className="p-4 text-right font-mono text-amber-300 font-black text-sm">
                    {totals.totalDirect.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-purple-300 font-bold text-sm">
                    {totals.totalManagement.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-white font-black text-sm bg-slate-950">
                    {totals.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4 text-right font-mono text-blue-200 font-black text-sm">
                    {totals.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className={`p-4 text-right font-mono font-black text-sm bg-slate-950 ${
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              <strong>Công thức:</strong> [Tổng chi phí] = [Tổng CP trực tiếp] + [CP quản lý] • [Lợi nhuận ròng] = [Doanh thu lô] - [Tổng chi phí].
            </span>
          </div>
          <div className="text-slate-400 italic">
            * Dữ liệu chi phí trực tiếp tự động đồng bộ từ Tab Tài chính của từng lô. Bấm vào số tiền để chỉnh sửa nhanh.
          </div>
        </div>
      </div>

      {/* Modal Áp dụng hàng loạt (Batch Apply) */}
      {bulkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span>
                  {bulkModal.type === 'management' 
                    ? 'Áp dụng Chi phí quản lý hàng loạt' 
                    : 'Áp dụng Doanh thu tiêu chuẩn hàng loạt'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkModal({ ...bulkModal, open: false })}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Nhập số tiền áp dụng đồng loạt cho tất cả <strong>{shipments.length} lô hàng</strong> trong kỳ này:
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={Number(bulkModal.value.replace(/[^0-9]/g, '') || 0).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                    setBulkModal({ ...bulkModal, value: rawVal });
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-3 flex gap-2.5">
              <button
                type="button"
                onClick={() => setBulkModal({ ...bulkModal, open: false })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Xác nhận áp dụng loạt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
