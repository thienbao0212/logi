import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Ship,
  MapPin,
  DollarSign,
  Wallet,
  AlertCircle,
  ChevronRight,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '@/lib/fetch.js';
import {
  loadMilestonesFromStorage,
  validateMilestone1,
  validateMilestone2,
  validateMilestone3,
  validateMilestone4,
  validateMilestone5,
  getDaysDiffFromToday,
  getShipmentDirectCost,
  loadShipmentPnl
} from '../components/shipment/transit_types.js';
import { FinancialService } from '../components/shipment/tabs/financial/mockService.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShipmentSummary {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  originId: string;
  destinationId: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  completedMilestones: number;
  isAllDone: boolean;
  demAlert: { text: string; type: 'warning' | 'critical' } | null;
  directCost: number;
  revenue: number;
  netProfit: number;
  arrivalDate?: string;
}

// ─── Mode badge ───────────────────────────────────────────────────────────────
const ModeIcon = ({ mode }: { mode: string }) => {
  if (mode === 'SEA') return <Ship size={12} className="text-blue-500" />;
  if (mode === 'AIR') return <span className="text-[10px] font-bold text-purple-600">✈</span>;
  return <Truck size={12} className="text-orange-500" />;
};

const ModeText: Record<string, string> = { SEA: 'Đường biển', AIR: 'Hàng không', LAND: 'Đường bộ' };

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<{ arTotal: number; apTotal: number; cashBalance: number }>({
    arTotal: 0,
    apTotal: 0,
    cashBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load all data
  const loadAll = async () => {
    setLoading(true);
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;

      let list: any[] = [];
      try {
        const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        list = json.data || [];
        localStorage.setItem('shipments_cache', JSON.stringify(list));
      } catch {
        const cache = localStorage.getItem('shipments_cache');
        if (cache) list = JSON.parse(cache);
      }
      setShipments(list);

      // Load financial data
      try {
        const reqs = await FinancialService.getRequests('');
        let arTotal = 0;
        let apTotal = 0;
        let cashIn = 0;
        let cashOut = 0;
        reqs.forEach(r => {
          if (r.type === 'THU') {
            arTotal += r.amount;
            cashIn += r.paidAmount || 0;
          } else {
            apTotal += r.amount;
            cashOut += r.paidAmount || 0;
          }
        });
        setFinancialData({ arTotal, apTotal, cashBalance: cashIn - cashOut });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [refreshKey]);

  // ── Enrich shipment data ─────────────────────────────────────────────────
  const enrichedShipments = useMemo((): ShipmentSummary[] => {
    return shipments.map(s => {
      const milestones = loadMilestonesFromStorage(s.id, s);
      const v1 = validateMilestone1(milestones.m1);
      const v2 = validateMilestone2(milestones.m2);
      const v3 = validateMilestone3(milestones.m3);
      const v4 = validateMilestone4(milestones.m4);
      const v5 = validateMilestone5(milestones.m5);

      const completedMilestones = [v1, v2, v3, v4, v5].filter(v => v.isCompleted).length;
      const isAllDone = completedMilestones === 5;

      let demAlert: { text: string; type: 'warning' | 'critical' } | null = null;
      if (!isAllDone && milestones.m1.demExpiryDate) {
        const diff = getDaysDiffFromToday(milestones.m1.demExpiryDate);
        if (diff !== null && diff < 0) demAlert = { text: `Quá hạn DEM ${Math.abs(diff)}N`, type: 'critical' };
        else if (diff !== null && diff <= 3) demAlert = { text: `DEM còn ${diff} ngày`, type: 'warning' };
      }
      if (!isAllDone && !demAlert && milestones.m3.detExpiryDate) {
        const diff = getDaysDiffFromToday(milestones.m3.detExpiryDate);
        if (diff !== null && diff < 0) demAlert = { text: `Quá hạn DET ${Math.abs(diff)}N`, type: 'critical' };
        else if (diff !== null && diff <= 2) demAlert = { text: `DET còn ${diff} ngày`, type: 'warning' };
      }

      const directCost = getShipmentDirectCost(s.id);
      const pnl = loadShipmentPnl(s.id);
      const totalCost = directCost + (pnl.managementCost || 0);
      const revenue = pnl.revenue || 0;
      const netProfit = revenue - totalCost;

      return {
        id: s.id,
        trackingNumber: s.trackingNumber,
        status: s.status,
        mode: s.mode || 'SEA',
        originId: s.originId || s.origin || '',
        destinationId: s.destinationId || s.destination || '',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        customerName: s.customerName || s.customerId,
        completedMilestones,
        isAllDone,
        demAlert,
        directCost,
        revenue,
        netProfit,
        arrivalDate: milestones.m1?.arrivalDate
      };
    });
  }, [shipments]);

  // ── Summary stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const inProgress = enrichedShipments.filter(s => !s.isAllDone && s.status !== 'CANCELLED');
    const completed = enrichedShipments.filter(s => s.isAllDone || s.status === 'COMPLETED' || s.status === 'DELIVERED');
    const cancelled = enrichedShipments.filter(s => s.status === 'CANCELLED');
    const demCritical = enrichedShipments.filter(s => s.demAlert?.type === 'critical');
    const demWarning = enrichedShipments.filter(s => s.demAlert?.type === 'warning');

    const totalRevenue = enrichedShipments.reduce((sum, s) => sum + s.revenue, 0);
    const totalCost = enrichedShipments.reduce((sum, s) => sum + s.directCost, 0);
    const totalProfit = enrichedShipments.reduce((sum, s) => sum + s.netProfit, 0);
    const profitableCount = enrichedShipments.filter(s => s.netProfit > 0).length;
    const lossCount = enrichedShipments.filter(s => s.netProfit < 0).length;

    return {
      total: enrichedShipments.length,
      inProgress: inProgress.length,
      completed: completed.length,
      cancelled: cancelled.length,
      demCritical: demCritical.length,
      demWarning: demWarning.length,
      totalRevenue,
      totalCost,
      totalProfit,
      profitableCount,
      lossCount
    };
  }, [enrichedShipments]);

  // ── Recent critical alerts ────────────────────────────────────────────────
  const alertItems = useMemo(() => {
    return enrichedShipments
      .filter(s => s.demAlert !== null && s.status !== 'CANCELLED')
      .sort((a, b) => (a.demAlert?.type === 'critical' ? -1 : 1) - (b.demAlert?.type === 'critical' ? -1 : 1))
      .slice(0, 6);
  }, [enrichedShipments]);

  // ── In-progress shipments ─────────────────────────────────────────────────
  const inProgressShipments = useMemo(() => {
    return enrichedShipments
      .filter(s => !s.isAllDone && s.status !== 'CANCELLED')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 8);
  }, [enrichedShipments]);

  // ── Monthly chart data (last 6 months) ────────────────────────────────────
  const chartData = useMemo(() => {
    const months: Record<string, { month: string; 'Doanh thu': number; 'Chi phí': number; 'Lợi nhuận': number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        month: `Th${d.getMonth() + 1}`,
        'Doanh thu': 0,
        'Chi phí': 0,
        'Lợi nhuận': 0
      };
    }

    enrichedShipments.forEach(s => {
      const date = s.arrivalDate || s.createdAt;
      if (!date) return;
      const key = date.substring(0, 7);
      if (months[key]) {
        months[key]['Doanh thu'] += s.revenue;
        months[key]['Chi phí'] += s.directCost;
        months[key]['Lợi nhuận'] += s.netProfit;
      }
    });

    return Object.values(months);
  }, [enrichedShipments]);

  // ── Mode distribution ─────────────────────────────────────────────────────
  const modeDistribution = useMemo(() => {
    const counts: Record<string, number> = { SEA: 0, LAND: 0, AIR: 0 };
    enrichedShipments.forEach(s => {
      counts[s.mode] = (counts[s.mode] || 0) + 1;
    });
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }));
  }, [enrichedShipments]);

  const fmtVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
  const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B ₫`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`;
    return fmtVND(n);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-transparent">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Đang tải dữ liệu Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-auto">
      <div className="px-8 pt-7 pb-6 space-y-6">
        
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Activity size={24} className="text-blue-600 dark:text-blue-400" />
              <span>Dashboard Tổng quan Hệ thống</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')} &nbsp;·&nbsp; Tổng {stats.total} lô hàng trong hệ thống
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            className="px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* ── Row 1: Main KPI Cards (6 cards) ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Đang vận hành */}
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Đang vận hành</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Package size={15} />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-400 font-mono">{stats.inProgress}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">lô đang xử lý</div>
          </button>

          {/* 2. Đã hoàn thành */}
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Đã hoàn thành</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{stats.completed}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">lô đã kết thúc</div>
          </button>

          {/* 3. Cảnh báo khẩn */}
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-red-400 dark:hover:border-red-600 transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">DEM/DET khẩn</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-800/60 group-hover:bg-red-600 group-hover:text-white transition-all">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="text-3xl font-black text-red-700 dark:text-red-400 font-mono">{stats.demCritical}</div>
            <div className="text-[11px] mt-1 font-medium">
              <span className="text-red-600 dark:text-red-400 font-bold">{stats.demCritical} quá hạn</span>
              {stats.demWarning > 0 && <span className="text-amber-600 dark:text-amber-400 ml-1">· {stats.demWarning} gần hạn</span>}
            </div>
          </button>

           {/* 5. Lợi nhuận ròng */}
          <button
            type="button"
            onClick={() => navigate('/shipments/financial')}
            className={`bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 ${stats.totalProfit >= 0 ? 'hover:border-emerald-400 dark:hover:border-emerald-600 focus-visible:ring-emerald-500' : 'hover:border-red-400 dark:hover:border-red-600 focus-visible:ring-red-500'}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lợi nhuận ròng</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                stats.totalProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white'
                  : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/60 group-hover:bg-red-600 group-hover:text-white'
              }`}>
                {stats.totalProfit >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              </div>
            </div>
            <div className={`text-2xl font-black font-mono ${stats.totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {stats.totalProfit < 0 ? '(' : ''}{fmtCompact(Math.abs(stats.totalProfit))}{stats.totalProfit < 0 ? ')' : ''}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {stats.lossCount > 0 && <span className="text-red-600 dark:text-red-400 font-semibold">{stats.lossCount} lô lỗ</span>}
              {stats.lossCount === 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tất cả có lãi</span>}
            </div>
          </button>

          {/* 6. Số dư quỹ */}
          <button
            type="button"
            onClick={() => navigate('/accounting')}
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Số dư quỹ</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Wallet size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">{fmtCompact(financialData.cashBalance)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">tiền mặt & ngân hàng</div>
          </button>
        </div>

        {/* ── Row 2: Chart + Alert Panel ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Revenue Chart (2 cols) */}
          <div className="xl:col-span-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                  Phân tích Doanh thu – Chi phí – Lợi nhuận (6 tháng)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Đơn vị: VNĐ — tổng hợp theo lô hàng</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/shipments/financial')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
              >
                Xem báo cáo chi tiết <ChevronRight size={13} />
              </button>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200/80 dark:text-slate-800/80" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => fmtCompact(v)} />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '11px' }}
                    formatter={(v: any, name?: any) => [fmtVND(Number(v)), name ?? '']}
                  />
                  <Bar dataKey="Doanh thu" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Chi phí" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Lợi nhuận" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DEM/DET Alert Panel (1 col) */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                Cảnh báo DEM / DET
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                stats.demCritical > 0 ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
              }`}>
                {alertItems.length} lô
              </span>
            </div>

            {alertItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
                <span className="text-xs font-medium">Tất cả lô hàng đều an toàn!</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Không có lô nào gần / quá hạn DEM·DET</span>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-auto custom-scrollbar">
                {alertItems.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 hover:border-red-300 dark:hover:border-red-800/80 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ModeIcon mode={s.mode} />
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">{s.trackingNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <MapPin size={10} />
                          <span className="truncate">{s.originId || '?'} → {s.destinationId || '?'}</span>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          s.demAlert?.type === 'critical' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        }`}>
                          {s.demAlert?.text}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1 w-5 rounded-full ${i <= s.completedMilestones ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">{s.completedMilestones}/5 mốc</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Accounting Summary + Shipment Stats ─────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Accounting Summary */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                Tổng quan Kế toán
              </h2>
              <button
                type="button"
                onClick={() => navigate('/accounting')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5"
              >
                Chi tiết <ChevronRight size={13} />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* AR */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <ArrowUpRight size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Công nợ Phải thu</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Accounts Receivable (AR)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">{fmtCompact(financialData.arTotal)}</div>
                </div>
              </div>

              {/* AP */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                    <ArrowDownRight size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Công nợ Phải trả</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Accounts Payable (AP)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">{fmtCompact(financialData.apTotal)}</div>
                </div>
              </div>

              {/* Cash Balance */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center">
                    <Wallet size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Số dư quỹ thực tế</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Tiền mặt & Ngân hàng</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${financialData.cashBalance >= 0 ? 'text-purple-700 dark:text-purple-400' : 'text-red-700 dark:text-red-400'}`}>
                    {fmtCompact(financialData.cashBalance)}
                  </div>
                </div>
              </div>

              {/* Profit margin */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Biên lợi nhuận</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {stats.totalRevenue > 0 ? `${Math.round((stats.totalProfit / stats.totalRevenue) * 100)}% tổng doanh thu` : 'Chưa có dữ liệu'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${stats.totalProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                    {stats.totalRevenue > 0 ? `${Math.round((stats.totalProfit / stats.totalRevenue) * 100)}%` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Status Distribution */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Package size={16} className="text-blue-600 dark:text-blue-400" />
                Phân bổ Lô hàng
              </h2>
              <button
                type="button"
                onClick={() => navigate('/shipments')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5"
              >
                Xem tất cả <ChevronRight size={13} />
              </button>
            </div>

            {/* Status bars */}
            <div className="space-y-3 mb-4">
              {[
                { label: 'Đang vận hành', count: stats.inProgress, total: stats.total, color: 'bg-blue-500', lightColor: 'bg-blue-100 dark:bg-blue-950/60', textColor: 'text-blue-700 dark:text-blue-400' },
                { label: 'Đã hoàn thành', count: stats.completed, total: stats.total, color: 'bg-emerald-500', lightColor: 'bg-emerald-100 dark:bg-emerald-950/60', textColor: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Đã hủy', count: stats.cancelled, total: stats.total, color: 'bg-slate-400', lightColor: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-600 dark:text-slate-400' },
              ].map(item => {
                const pct = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                      <span className={`font-bold font-mono ${item.textColor}`}>{item.count} lô ({Math.round(pct)}%)</span>
                    </div>
                    <div className={`h-2 rounded-full w-full ${item.lightColor}`}>
                      <div className={`h-2 rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mode distribution */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Phân loại theo Phương thức vận tải</p>
              <div className="grid grid-cols-3 gap-2">
                {modeDistribution.map(({ mode, count }) => (
                  <div key={mode} className="text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-center mb-1">
                      <ModeIcon mode={mode} />
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{count}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{ModeText[mode] || mode}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* P&L Summary per shipment */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                P&L Nhanh – Top lô hàng
              </h2>
              <button
                type="button"
                onClick={() => navigate('/shipments/financial')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5"
              >
                Phân tích đầy đủ <ChevronRight size={13} />
              </button>
            </div>
            <div className="space-y-2 flex-1 overflow-auto custom-scrollbar">
              {enrichedShipments
                .filter(s => s.revenue > 0)
                .sort((a, b) => b.netProfit - a.netProfit)
                .slice(0, 6)
                .map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <ModeIcon mode={s.mode} />
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{s.trackingNumber}</span>
                      </div>
                      <span className={`font-bold font-mono text-xs ${s.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                        {s.netProfit < 0 ? '(' : '+'}
                        {fmtCompact(Math.abs(s.netProfit))}
                        {s.netProfit < 0 ? ')' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>DT: <span className="text-blue-600 dark:text-blue-400 font-semibold">{fmtCompact(s.revenue)}</span></span>
                      <span>CP: <span className="text-rose-600 dark:text-rose-400 font-semibold">{fmtCompact(s.directCost)}</span></span>
                      <span className={`font-bold ${s.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {s.revenue > 0 ? `${Math.round((s.netProfit / s.revenue) * 100)}%` : '—'}
                      </span>
                    </div>
                  </button>
                ))}
              {enrichedShipments.filter(s => s.revenue > 0).length === 0 && (
                <div className="flex-1 flex items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-xs italic">
                  Chưa có dữ liệu P&L lô hàng nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 4: In-Progress Shipment Table ──────────────────────────── */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Clock size={16} className="text-blue-600 dark:text-blue-400" />
              Lô hàng đang vận hành — Theo dõi thời gian thực
            </h2>
            <button
              type="button"
              onClick={() => navigate('/shipments')}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5"
            >
              Xem danh sách đầy đủ <ChevronRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs min-w-[900px]">
              <thead className="bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <th className="px-4 py-3">Mã lô hàng</th>
                  <th className="px-4 py-3">Tuyến vận chuyển</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Tiến độ 5 mốc</th>
                  <th className="px-4 py-3">Cảnh báo DEM/DET</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {inProgressShipments.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                  >
                    {/* Tracking */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ModeIcon mode={s.mode} />
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs">{s.trackingNumber}</span>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
                        <span>{s.originId || '?'}</span>
                        <ChevronRight size={11} className="text-slate-400" />
                        <span>{s.destinationId || '?'}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium max-w-[140px] truncate">
                      {s.customerName || '—'}
                    </td>

                    {/* Milestone progress */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div
                              key={i}
                              className={`h-1.5 w-6 rounded-full ${
                                i <= s.completedMilestones ? 'bg-emerald-500' :
                                i === s.completedMilestones + 1 ? 'bg-blue-500' :
                                'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">{s.completedMilestones}/5</span>
                      </div>
                    </td>

                    {/* DEM Alert */}
                    <td className="px-4 py-3">
                      {s.demAlert ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.demAlert.type === 'critical'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        }`}>
                          ⚠ {s.demAlert.text}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">An toàn</span>
                      )}
                    </td>

                    {/* P&L */}
                    <td className="px-4 py-3 text-right">
                      {s.revenue > 0 ? (
                        <span className={`font-bold font-mono text-xs ${s.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                          {s.netProfit >= 0 ? '+' : '('}{fmtCompact(Math.abs(s.netProfit))}{s.netProfit < 0 ? ')' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-[11px] text-slate-400 dark:text-slate-500">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}

                {inProgressShipments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <span>Không có lô hàng nào đang vận hành.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
