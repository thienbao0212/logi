import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Plane, 
  Ship, 
  Package, 
  MapPin, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  Search,
  Trash2, 
  Loader2, 
  ChevronRight,
  Building2,
  ArrowRight,
  X
} from 'lucide-react';
import CreateShipmentModal from '../components/create_shipment_modal.js';
import { useTranslation } from 'react-i18next';
import { 
  loadMilestonesFromStorage, 
  validateMilestone1, 
  validateMilestone2, 
  validateMilestone3, 
  validateMilestone4, 
  validateMilestone5,
  getDaysDiffFromToday
} from '../components/shipment/transit_types.js';

type StatusFilterType = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const MILESTONE_STEPS = [
  '1. Cảng',
  '2. Hải quan',
  '3. Vận chuyển',
  '4. Cửa khẩu',
  '5. Trả rỗng'
];

export default function ShipmentList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Status Quick Filter: ALL, IN_PROGRESS, COMPLETED, CANCELLED
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'updatedAt', direction: 'desc' });
  const [visibleCount, setVisibleCount] = useState(30);
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('app-header-extra');
    if (el) setHeaderEl(el);
  }, []);

  const loadShipments = async () => {
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      
      const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (json.data) {
        setShipments(json.data);
      }
    } catch {
      const cache = localStorage.getItem('shipments_cache');
      if (cache) {
        setShipments(JSON.parse(cache));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const getShipmentMilestoneStatus = (shipmentId: string, s?: any) => {
    const data = loadMilestonesFromStorage(shipmentId, s);
    const v1 = validateMilestone1(data.m1);
    const v2 = validateMilestone2(data.m2);
    const v3 = validateMilestone3(data.m3);
    const v4 = validateMilestone4(data.m4);
    const v5 = validateMilestone5(data.m5);

    let completedCount = 0;
    if (v1.isCompleted) completedCount++;
    if (v2.isCompleted) completedCount++;
    if (v3.isCompleted) completedCount++;
    if (v4.isCompleted) completedCount++;
    if (v5.isCompleted) completedCount++;

    const isAllDone = completedCount === 5;

    // Calculate DEM / DET Alerts
    let demAlert: { text: string; type: 'warning' | 'critical' } | null = null;

    if (!isAllDone && data.m1.demExpiryDate) {
      const diff = getDaysDiffFromToday(data.m1.demExpiryDate);
      if (diff !== null && diff < 0) {
        demAlert = { text: `Quá hạn DEM ${Math.abs(diff)} ngày`, type: 'critical' };
      } else if (diff !== null && diff <= 3) {
        demAlert = { text: diff === 0 ? 'Hết hạn DEM hôm nay' : `Còn ${diff} ngày DEM`, type: 'warning' };
      }
    }

    if (!isAllDone && !demAlert && data.m3.detExpiryDate) {
      const diff = getDaysDiffFromToday(data.m3.detExpiryDate);
      if (diff !== null && diff < 0) {
        demAlert = { text: `Quá hạn DET ${Math.abs(diff)} ngày`, type: 'critical' };
      } else if (diff !== null && diff <= 2) {
        demAlert = { text: diff === 0 ? 'Hết hạn DET hôm nay' : `Còn ${diff} ngày DET`, type: 'warning' };
      }
    }

    const containerCount = data.m1.containers?.length || 1;

    return {
      data,
      v1, v2, v3, v4, v5,
      completedCount,
      isAllDone,
      demAlert,
      containerCount
    };
  };

  // Categorize shipments into quick filter buckets
  const categorizedShipments = useMemo(() => {
    const inProgress: any[] = [];
    const completed: any[] = [];
    const cancelled: any[] = [];

    for (const s of shipments) {
      if (s.status === 'CANCELLED') {
        cancelled.push(s);
        continue;
      }

      const info = getShipmentMilestoneStatus(s.id, s);
      if (info.isAllDone || s.status === 'COMPLETED' || s.status === 'DELIVERED') {
        completed.push(s);
      } else {
        inProgress.push(s);
      }
    }

    return { inProgress, completed, cancelled };
  }, [shipments]);

  // Filter & sort for the table
  const filteredData = useMemo(() => {
    let currentList = shipments;
    if (statusFilter === 'IN_PROGRESS') currentList = categorizedShipments.inProgress;
    else if (statusFilter === 'COMPLETED') currentList = categorizedShipments.completed;
    else if (statusFilter === 'CANCELLED') currentList = categorizedShipments.cancelled;

    let result = currentList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(query)) ||
        (s.customerId && s.customerId.toLowerCase().includes(query)) ||
        (s.originId && s.originId.toLowerCase().includes(query)) ||
        (s.destinationId && s.destinationId.toLowerCase().includes(query))
      );
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'updatedAt' || sortConfig.key === 'createdAt') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [shipments, categorizedShipments, statusFilter, searchQuery, sortConfig]);

  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  // Aggregate statistics
  const stats = useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let totalContainers = 0;

    for (const s of shipments) {
      const info = getShipmentMilestoneStatus(s.id, s);
      if (info.demAlert?.type === 'critical') criticalCount++;
      if (info.demAlert?.type === 'warning') warningCount++;
      totalContainers += info.containerCount;
    }

    return { criticalCount, warningCount, totalContainers };
  }, [shipments]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={13} className="ml-1 inline" /> : <ArrowDown size={13} className="ml-1 inline" />;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'AIR': return <Plane size={13} />;
      case 'SEA': return <Ship size={13} />;
      default: return <Truck size={13} />;
    }
  };

  const getCustomerDisplayName = (s: any) => {
    if (s.customerName && !s.customerName.includes('0000')) return s.customerName;
    if (s.customerId && s.customerId.startsWith('0000')) return 'ABC Logistics (Quá cảnh)';
    return s.customerName || 'ABC Logistics (Quá cảnh)';
  };

  const getLocationName = (id: string, isOrigin: boolean = true) => {
    if (!id) return isOrigin ? 'Shenzhen (CNSZX)' : 'Cát Lái (VNSGN)';
    if (id.includes('CNSZX') || id.toLowerCase().includes('shenzhen') || id.startsWith('1') || id.startsWith('97fa')) return 'Shenzhen (CNSZX)';
    if (id.includes('CNGZG') || id.toLowerCase().includes('guangzhou') || id.startsWith('2')) return 'Guangzhou (CNGZG)';
    if (id.includes('CNSHG') || id.toLowerCase().includes('shanghai')) return 'Shanghai (CNSHG)';
    if (id.includes('VNSGN') || id.toLowerCase().includes('cat lai') || id.startsWith('3') || id.startsWith('a2e1') || id.startsWith('d944')) return 'Cát Lái (VNSGN)';
    if (id.includes('VNMBA') || id.toLowerCase().includes('moc bai') || id.startsWith('d5ff')) return 'Mộc Bài (VNMBA)';
    if (id.includes('KHPNH') || id.toLowerCase().includes('phnom penh') || id.startsWith('4')) return 'Phnom Penh (KHPNH)';
    if (id.length > 20) return isOrigin ? 'Shenzhen (CNSZX)' : 'Cát Lái (VNSGN)';
    return id;
  };

  const handleClearAllShipments = async () => {
    setClearing(true);
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      if (companyId) {
        await apiFetch(`/api/shipments/all?companyId=${companyId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).catch(() => {});
      }
      
      // Clear localStorage milestone/cost caches
      localStorage.removeItem('shipments_cache');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('logiflow_transit_milestones_') || k?.startsWith('logiflow_shipment_costs_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      setShipments([]);
      setShowClearModal(false);
    } catch (e) {
      console.error('Failed to clear shipments:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full flex flex-col h-full animate-in fade-in duration-200 relative">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package size={24} className="text-blue-600" />
            <span>Quản lý Lô hàng Quá cảnh (LogiFlow Transit)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trực quan 5 mốc vận hành, hạn DEM/DET và đối chiếu chi phí phát sinh với kế toán.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button 
            type="button"
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Xóa tất cả dữ liệu lô hàng cũ để làm mới từ đầu"
          >
            <Trash2 size={14} />
            <span>Xóa tất cả dữ liệu (Làm mới)</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            <span>Tạo lô hàng mới (QC)</span>
          </button>
        </div>
      </div>

      {/* Top App Header Extra Portal (Injected into Main App Header: h-16 bg-white border-b) */}
      {headerEl && createPortal(
        <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/90 text-blue-800 border border-blue-200/80 rounded-full text-xs font-semibold shrink-0 shadow-2xs">
            <span className="text-blue-600 font-medium">
              {statusFilter === 'ALL' ? 'Tất cả lô hàng' : statusFilter === 'COMPLETED' ? 'Đã hoàn thành' : statusFilter === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã hủy'}:
            </span>
            <span className="font-mono font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full text-[11px]">
              {filteredData.length} / {shipments.length}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-medium shrink-0">
            <Package size={13} className="text-slate-500" />
            <span>Sản lượng: <strong className="font-mono text-slate-900">{stats.totalContainers} Cont/TEU</strong></span>
          </div>

          {stats.criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/90 rounded-full text-xs font-bold shrink-0 animate-pulse">
              <ShieldAlert size={14} className="text-rose-600" />
              <span>{stats.criticalCount} lô quá hạn</span>
            </div>
          )}

          {stats.warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/90 rounded-full text-xs font-semibold shrink-0">
              <Clock size={13} className="text-amber-600" />
              <span>{stats.warningCount} lô sắp hết hạn</span>
            </div>
          )}

          <div className="hidden xl:flex items-center gap-1 text-xs text-slate-500 pl-3 border-l border-slate-200 shrink-0">
            <span>Toàn hệ thống:</span>
            <strong className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-xs">{shipments.length}</strong>
          </div>
        </div>,
        headerEl
      )}

      {/* Integrated Quick Filter & Search Toolbar: Search on Left, Status Quick Filter on Right */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        
        {/* Left: Search Box */}
        <div className="relative min-w-[260px] max-w-md flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lô hàng QC, khách hàng, cảng đến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right: Status Quick Filter with Active Status Colors */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto hide-scrollbar self-start md:self-auto">
          {[
            { 
              id: 'ALL', 
              label: 'Tất cả', 
              count: shipments.length, 
              activeClass: 'bg-white text-slate-900 shadow-2xs font-bold', 
              activeBadge: 'bg-slate-200 text-slate-800' 
            },
            { 
              id: 'IN_PROGRESS', 
              label: 'Đang thực hiện', 
              count: categorizedShipments.inProgress.length, 
              activeClass: 'bg-white text-blue-600 shadow-2xs font-bold', 
              activeBadge: 'bg-blue-100 text-blue-800' 
            },
            { 
              id: 'COMPLETED', 
              label: 'Đã hoàn thành', 
              count: categorizedShipments.completed.length, 
              activeClass: 'bg-white text-emerald-600 shadow-2xs font-bold', 
              activeBadge: 'bg-emerald-100 text-emerald-800' 
            },
            { 
              id: 'CANCELLED', 
              label: 'Đã hủy', 
              count: categorizedShipments.cancelled.length, 
              activeClass: 'bg-white text-red-600 shadow-2xs font-bold', 
              activeBadge: 'bg-red-100 text-red-800' 
            },
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setStatusFilter(tab.id as StatusFilterType); setVisibleCount(30); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? tab.activeClass
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors ${
                  isActive ? tab.activeBadge : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">{t('common.loading', 'Đang tải danh sách lô hàng...')}</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
              <Package size={30} />
            </div>
            <p className="text-sm font-bold text-slate-800">Không tìm thấy lô hàng nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Chưa có lô hàng nào trong mục này. Bấm nút <strong>Tạo lô hàng mới (QC)</strong> để bắt đầu.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Tạo lô hàng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md shadow-2xs">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/80">
                  <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors" onClick={() => handleSort('trackingNumber')}>
                    Mã lô hàng (QC)
                    {getSortIcon('trackingNumber')}
                  </th>
                  <th className="px-5 py-3.5">Tiến độ 5 mốc vận hành</th>
                  <th className="px-5 py-3.5">Cảnh báo Deadline / DEM</th>
                  <th className="px-5 py-3.5">Lộ trình & Cửa khẩu</th>
                  <th className="px-5 py-3.5">Phương thức & Cont</th>
                  <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors" onClick={() => handleSort('updatedAt')}>
                    Cập nhật
                    {getSortIcon('updatedAt')}
                  </th>
                  <th className="px-4 py-3.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleData.map((s: any) => {
                  const info = getShipmentMilestoneStatus(s.id, s);
                  const isDone = info.isAllDone || s.status === 'COMPLETED' || s.status === 'DELIVERED';
                  const isCancelled = s.status === 'CANCELLED';

                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => navigate(`/shipments/${s.id}`)}
                      className="group transition-colors duration-150 cursor-pointer hover:bg-blue-50/40"
                    >
                      {/* Mã lô hàng & Khách hàng */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 text-xs tracking-tight group-hover:text-blue-900 group-hover:underline">
                            {s.trackingNumber}
                          </span>
                          {isCancelled ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px]">
                              Đã hủy
                            </span>
                          ) : isDone ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                              Hoàn thành 5/5
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold text-[10px]">
                              {info.completedCount}/5 mốc
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate max-w-[190px]">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{getCustomerDisplayName(s)}</span>
                        </div>
                      </td>

                      {/* Tiến độ 5 mốc vận hành (Sleek 5-Segment Track matching design) */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[185px] max-w-[215px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold truncate">
                              {isCancelled ? (
                                <span className="text-slate-400 font-medium flex items-center gap-1">
                                  <XCircle size={13} className="text-slate-400 shrink-0" />
                                  <span>Đã dừng lô</span>
                                </span>
                              ) : isDone ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                  <span>Hoàn thành 5/5</span>
                                </span>
                              ) : (
                                <span className="text-blue-600 font-semibold flex items-center gap-1">
                                  <Clock size={13} className="text-blue-600 shrink-0" />
                                  <span>{MILESTONE_STEPS[info.completedCount] || '1. Cảng'}</span>
                                </span>
                              )}
                            </span>
                            <span className="font-mono font-bold text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {info.completedCount}/5
                            </span>
                          </div>

                          {/* 5-Segment Track */}
                          <div className="grid grid-cols-5 gap-1 w-full h-1.5">
                            {[info.v1.isCompleted, info.v2.isCompleted, info.v3.isCompleted, info.v4.isCompleted, info.v5.isCompleted].map((done, idx) => {
                              const isCurrent = !isDone && !isCancelled && idx === info.completedCount;
                              return (
                                <div
                                  key={idx}
                                  title={MILESTONE_STEPS[idx]}
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    done
                                      ? 'bg-emerald-500'
                                      : isCurrent
                                      ? 'bg-blue-600'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Deadline / DEM Alert Badge */}
                      <td className="px-5 py-4">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                            <XCircle size={13} className="text-slate-400" />
                            <span>Lô hàng đã hủy</span>
                          </span>
                        ) : info.demAlert ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                            info.demAlert.type === 'critical'
                              ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <AlertTriangle size={13} className={info.demAlert.type === 'critical' ? 'text-red-600' : 'text-amber-600'} />
                            <span>{info.demAlert.text}</span>
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={13} />
                            <span>Đã trả rỗng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={13} className="text-slate-400" />
                            <span>Đúng tiến độ</span>
                          </span>
                        )}
                      </td>

                      {/* Route (POL -> POD) */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]" title={s.originId}>
                            {getLocationName(s.originId, true)}
                          </span>
                          <ArrowRight size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px] font-bold text-slate-900" title={s.destinationId}>
                            {getLocationName(s.destinationId, false)}
                          </span>
                        </div>
                      </td>

                      {/* Mode & Container volume */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md font-bold text-[11px]">
                            {getModeIcon(s.mode)}
                            <span>{s.mode || 'SEA'}</span>
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono font-semibold text-[11px]">
                            {info.containerCount} cont
                          </span>
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td className="px-5 py-4 text-slate-500 font-medium text-xs">
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Action Chevron */}
                      <td className="px-4 py-4 text-center text-slate-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Xóa Tất Cả Lô Hàng Để Làm Mới */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa tất cả dữ liệu lô hàng?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Thao tác này sẽ dọn sạch toàn bộ các lô hàng mẫu, mốc vận chuyển và đối chiếu chi phí để bạn có thể bắt đầu tạo và chạy thử dữ liệu mới từ đầu.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAllShipments}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{clearing ? 'Đang dọn dẹp...' : 'Xóa sạch ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Lô Hàng Mới */}
      {isModalOpen && (
        <CreateShipmentModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newShipment) => {
            setIsModalOpen(false);
            if (newShipment?.id) {
              navigate(`/shipments/${newShipment.id}`);
            } else {
              loadShipments();
            }
          }}
        />
      )}

    </div>
  );
}
