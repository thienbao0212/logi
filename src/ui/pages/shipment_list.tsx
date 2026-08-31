import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect, useMemo } from 'react';
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
  Loader2
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

type TabType = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function ShipmentList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Outer 3 Tabs: IN_PROGRESS (Tab 2), COMPLETED (Tab 1), CANCELLED (Tab 3)
  // Default to IN_PROGRESS so active operations are immediately visible
  const [activeTab, setActiveTab] = useState<TabType>('IN_PROGRESS');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'updatedAt', direction: 'desc' });
  const [visibleCount, setVisibleCount] = useState(30);

  const loadShipments = async () => {
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      
      const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const list = json.data || [];
      // Cache list for code generation
      localStorage.setItem('shipments_cache', JSON.stringify(list));
      setShipments(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  // Helper to get milestone details & DEM warning for a shipment
  const getShipmentMilestoneStatus = (shipmentId: string, s: any) => {
    const milestones = loadMilestonesFromStorage(shipmentId, s);
    const v1 = validateMilestone1(milestones.m1);
    const v2 = validateMilestone2(milestones.m2);
    const v3 = validateMilestone3(milestones.m3);
    const v4 = validateMilestone4(milestones.m4);
    const v5 = validateMilestone5(milestones.m5);

    const completedCount = [v1, v2, v3, v4, v5].filter(v => v.isCompleted).length;
    const isAllDone = completedCount === 5;

    // DEM Alert check
    let demAlert: { type: 'critical' | 'warning' | 'normal'; text: string } | null = null;
    if (milestones.m1?.demExpiryDate) {
      const diff = getDaysDiffFromToday(milestones.m1.demExpiryDate);
      const isCustomsCleared = Boolean(milestones.m2?.clearanceDate && v2.isCompleted);
      const hasDeparted = Boolean(milestones.m3?.departureDate && v3.isCompleted);

      if (diff !== null && (!isCustomsCleared || !hasDeparted)) {
        if (diff < 0) {
          demAlert = { type: 'critical', text: `Quá hạn DEM ${Math.abs(diff)} ngày` };
        } else if (diff <= 2) {
          demAlert = { type: 'warning', text: diff === 0 ? 'Hết hạn DEM hôm nay' : `Còn ${diff} ngày DEM` };
        }
      }
    }

    const containerCount = milestones.m1?.containers?.length || 1;

    return {
      milestones,
      v1, v2, v3, v4, v5,
      completedCount,
      isAllDone,
      demAlert,
      containerCount,
    };
  };

  // Categorize into the 3 Outer Tabs
  const categorizedShipments = useMemo(() => {
    const inProgress: any[] = [];
    const completed: any[] = [];
    const cancelled: any[] = [];

    for (const s of shipments) {
      if (s.status === 'CANCELLED') {
        cancelled.push(s);
      } else {
        const info = getShipmentMilestoneStatus(s.id, s);
        if (s.status === 'DELIVERED' || s.status === 'COMPLETED' || info.isAllDone) {
          completed.push(s);
        } else {
          inProgress.push(s);
        }
      }
    }

    return {
      inProgress,
      completed,
      cancelled,
    };
  }, [shipments]);

  // Filter & sort for the current active tab
  const filteredData = useMemo(() => {
    let currentList = categorizedShipments.inProgress;
    if (activeTab === 'COMPLETED') currentList = categorizedShipments.completed;
    if (activeTab === 'CANCELLED') currentList = categorizedShipments.cancelled;

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

    if (selectedMode !== 'ALL') {
      result = result.filter(s => s.mode === selectedMode);
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
  }, [categorizedShipments, activeTab, searchQuery, selectedMode, sortConfig]);

  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  // Aggregate statistics for active tab
  const activeTabStats = useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let totalContainers = 0;

    for (const s of filteredData) {
      const info = getShipmentMilestoneStatus(s.id, s);
      if (info.demAlert?.type === 'critical') criticalCount++;
      if (info.demAlert?.type === 'warning') warningCount++;
      totalContainers += info.containerCount;
    }

    return { criticalCount, warningCount, totalContainers };
  }, [filteredData]);

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
      case 'AIR': return <Plane size={14} />;
      case 'SEA': return <Ship size={14} />;
      default: return <Truck size={14} />;
    }
  };

  const getCustomerDisplayName = (s: any) => {
    if (s.customerName && !s.customerName.includes('0000')) return s.customerName;
    if (s.customerId && s.customerId.startsWith('0000')) return 'ABC Logistics (Khách hàng Quá cảnh)';
    return s.customerName || 'ABC Logistics (Khách hàng Quá cảnh)';
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
    <div className="p-6 md:p-8 w-full flex flex-col h-full animate-in fade-in duration-300 relative">
      
      {/* Top Header */}
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
            className="px-3.5 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Xóa tất cả dữ liệu lô hàng cũ để làm mới từ đầu"
          >
            <Trash2 size={15} />
            <span>Xóa tất cả dữ liệu (Làm mới)</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Tạo lô hàng mới (QC)</span>
          </button>
        </div>
      </div>

      {/* 3 Main Outer Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px mb-4 shrink-0 overflow-x-auto hide-scrollbar">
        {/* Tab 1: Đã hoàn thành */}
        <button
          type="button"
          onClick={() => { setActiveTab('COMPLETED'); setVisibleCount(30); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'COMPLETED'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={16} className={activeTab === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>1. Các lô hàng đã hoàn thành</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            activeTab === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedShipments.completed.length}
          </span>
        </button>

        {/* Tab 2: Đang thực hiện */}
        <button
          type="button"
          onClick={() => { setActiveTab('IN_PROGRESS'); setVisibleCount(30); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'IN_PROGRESS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock size={16} className={activeTab === 'IN_PROGRESS' ? 'text-blue-600' : 'text-slate-400'} />
          <span>2. Các lô hàng đang thực hiện</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            activeTab === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedShipments.inProgress.length}
          </span>
        </button>

        {/* Tab 3: Đã hủy */}
        <button
          type="button"
          onClick={() => { setActiveTab('CANCELLED'); setVisibleCount(30); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'CANCELLED'
              ? 'border-red-600 text-red-700 bg-red-50/50 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <XCircle size={16} className={activeTab === 'CANCELLED' ? 'text-red-600' : 'text-slate-400'} />
          <span>3. Các lô hàng đã hủy</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            activeTab === 'CANCELLED' ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedShipments.cancelled.length}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lô hàng QC, khách hàng, cảng đến..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'SEA', 'LAND', 'AIR'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMode(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  selectedMode === m ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL' ? 'Tất cả Mode' : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex-1 flex flex-col min-h-0 mb-14">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">{t('common.loading', 'Đang tải danh sách lô hàng...')}</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300">
              <Package size={32} />
            </div>
            <p className="text-sm font-bold text-slate-800">Không tìm thấy lô hàng nào</p>
            <p className="text-xs text-slate-400 mt-1">Không có lô hàng phù hợp với bộ lọc trong mục này.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-md shadow-xs">
                <tr className="text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-4 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('trackingNumber')}>
                    Mã lô hàng (QC)
                    {getSortIcon('trackingNumber')}
                  </th>
                  <th className="p-4">Tiến độ 5 Mốc Vận chuyển</th>
                  <th className="p-4">Cảnh báo Deadline / DEM</th>
                  <th className="p-4">Lộ trình & Cửa khẩu</th>
                  <th className="p-4">Mode / Sản lượng</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('updatedAt')}>
                    Cập nhật
                    {getSortIcon('updatedAt')}
                  </th>
                  <th className="p-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleData.map((s: any) => {
                  const info = getShipmentMilestoneStatus(s.id, s);
                  const isDone = info.isAllDone || s.status === 'COMPLETED' || s.status === 'DELIVERED';

                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => navigate(`/shipments/${s.id}`)}
                      className="group transition-all duration-150 cursor-pointer hover:bg-blue-50/40"
                    >
                      {/* Tracking Number */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 text-xs tracking-tight group-hover:underline">
                            {s.trackingNumber}
                          </span>
                          {isDone ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Xong 5 mốc
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                              {info.completedCount}/5 mốc
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                          {getCustomerDisplayName(s)}
                        </div>
                      </td>

                      {/* 5-Milestone Mini Visual Stepper */}
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {[
                            { key: 'm1', label: '1. Cảng', done: info.v1.isCompleted },
                            { key: 'm2', label: '2. Hải quan', done: info.v2.isCompleted },
                            { key: 'm3', label: '3. Vận chuyển', done: info.v3.isCompleted },
                            { key: 'm4', label: '4. Cửa khẩu', done: info.v4.isCompleted },
                            { key: 'm5', label: '5. Trả rỗng', done: info.v5.isCompleted },
                          ].map((step, idx) => (
                            <div key={step.key} className="flex items-center">
                              <span 
                                title={step.label}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                                  step.done 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {step.done ? <CheckCircle2 size={10} className="text-emerald-600" /> : <Clock size={10} />}
                                <span>{step.label}</span>
                              </span>
                              {idx < 4 && <span className="text-slate-300 mx-0.5 text-[10px]">→</span>}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Deadline / DEM Warning Badge */}
                      <td className="p-4">
                        {info.demAlert ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            info.demAlert.type === 'critical'
                              ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <AlertTriangle size={12} />
                            {info.demAlert.text}
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={12} /> Đã trả rỗng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <CheckCircle2 size={12} className="text-slate-400" /> Đúng tiến độ
                          </span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={s.originId}>{getLocationName(s.originId, true)}</span>
                          <span className="text-slate-300">→</span>
                          <span className="truncate max-w-[130px]" title={s.destinationId}>{getLocationName(s.destinationId, false)}</span>
                        </div>
                      </td>

                      {/* Mode & Container */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-semibold text-[11px]">
                            {getModeIcon(s.mode)} {s.mode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {info.containerCount} cont
                          </span>
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Arrow indicator */}
                      <td className="p-4 text-center text-slate-400 group-hover:text-blue-600 font-bold">
                        →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fixed Sticky Summary Footer (Ghim dưới cùng) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 text-white px-6 py-3 border-t border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4 text-xs backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold">
            <span>
              Tổng số lô [
              {activeTab === 'COMPLETED' ? 'Đã hoàn thành' : activeTab === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã hủy'}
              ]:
            </span>
            <span className="px-2.5 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded-full">
              {filteredData.length} lô
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-400 border-l border-slate-700 pl-4">
            <span>Sản lượng: <strong className="text-white font-mono">{activeTabStats.totalContainers} Cont/TEU</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          {activeTabStats.criticalCount > 0 && (
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <ShieldAlert size={14} />
              <span>{activeTabStats.criticalCount} lô quá hạn DEM/DET</span>
            </div>
          )}

          {activeTabStats.warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Clock size={14} />
              <span>{activeTabStats.warningCount} lô sắp hết hạn</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Tổng toàn hệ thống: <strong className="text-white font-mono">{shipments.length}</strong> lô
          </div>
        </div>
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
