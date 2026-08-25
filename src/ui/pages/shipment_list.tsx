import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plane, Ship, Package, MapPin, MoreVertical, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import CreateShipmentModal from '../components/create_shipment_modal.js';
import ShipmentFilterBar, { ShipmentFilters } from '../components/shipment/shipment_filter_bar.js';
import { useTranslation } from 'react-i18next';

export default function ShipmentList() {
  const { t } = useTranslation();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Advanced UI State
  const [filters, setFilters] = useState<ShipmentFilters>({ search: '', status: [], mode: [] });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadShipments = async () => {
    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;
      
      const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
       setShipments(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  // Client-side processing (Filter -> Sort)
  const processedData = useMemo(() => {
    // 1. Filter
    let result = shipments;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(s => 
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(query)) ||
        (s.customerId && s.customerId.toLowerCase().includes(query))
      );
    }
    if (filters.status.length > 0) {
      result = result.filter(s => filters.status.includes(s.status));
    }
    if (filters.mode.length > 0) {
      result = result.filter(s => filters.mode.includes(s.mode));
    }

    // 2. Sort
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle dates
        if (sortConfig.key === 'updatedAt' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [shipments, filters, sortConfig]);

  // Reset visible count when filters or sort change
  useEffect(() => {
    setVisibleCount(30);
  }, [filters, sortConfig]);

  const visibleData = useMemo(() => {
    return processedData.slice(0, visibleCount);
  }, [processedData, visibleCount]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when user scrolls within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (visibleCount < processedData.length) {
        setVisibleCount((prev) => Math.min(prev + 20, processedData.length));
      }
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 inline" /> : <ArrowDown size={14} className="ml-1 inline" />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedData.length && processedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedData.map(s => s.id)));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string, text: string, dot: string }> = {
      DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
      PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
      IN_TRANSIT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      CUSTOMS_CLEARANCE: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
      OUT_FOR_DELIVERY: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
      DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    const c = configs[status] || configs.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full border border-black/5 ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'AIR': return <Plane size={15} />;
      case 'SEA': return <Ship size={15} />;
      default: return <Truck size={15} />;
    }
  };

  // Mock UUID mapping for a better visual experience
  const getLocationName = (uuid: string) => {
    if (!uuid) return 'Unknown';
    if (uuid.startsWith('1')) return 'Shenzhen, CN';
    if (uuid.startsWith('2')) return 'Guangzhou, CN';
    if (uuid.startsWith('3')) return 'Cat Lai, VN';
    if (uuid.startsWith('4')) return 'Phnom Penh, KH';
    // Fallback: generate a fake city based on last character
    const cities = ['Shanghai, CN', 'Hong Kong, HK', 'Hai Phong, VN', 'Bangkok, TH'];
    const char = uuid.charCodeAt(uuid.length - 1) % cities.length;
    return cities[char] || 'Origin Port';
  };

  return (
    <div className="p-6 md:p-8 w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('shipmentList.title', 'Shipments')}</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your active logistics operations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <Plus size={18} />
          {t('shipmentList.new_shipment', 'New Shipment')}
        </button>
      </div>

      <div className="shrink-0">
        <ShipmentFilterBar filters={filters} onFilterChange={(f) => setFilters(f)} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-200/80 overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">{t('common.loading', 'Loading shipments...')}</span>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Package size={40} className="text-slate-300" />
            </div>
            <p className="text-lg font-semibold text-slate-900">{t('shipmentList.no_shipments', 'No shipments found')}</p>
            <p className="mt-1.5 text-sm text-slate-500">Adjust your filters or create a new shipment to get started.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar relative" onScroll={handleScroll}>
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md shadow-[0_1px_0_0_#e2e8f0]">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-5 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.size > 0 && selectedIds.size === processedData.length}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < processedData.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('trackingNumber')}>
                    {t('shipmentList.col_tracking', 'Tracking')}
                    <span className="text-slate-400 group-hover:text-slate-600">{getSortIcon('trackingNumber')}</span>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('status')}>
                    {t('shipmentList.col_status', 'Status')}
                    <span className="text-slate-400 group-hover:text-slate-600">{getSortIcon('status')}</span>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('originId')}>
                    {t('shipmentList.col_route', 'Route')}
                    <span className="text-slate-400 group-hover:text-slate-600">{getSortIcon('originId')}</span>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('mode')}>
                    {t('shipmentList.col_mode', 'Mode')}
                    <span className="text-slate-400 group-hover:text-slate-600">{getSortIcon('mode')}</span>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('updatedAt')}>
                    {t('shipmentList.col_updated', 'Updated')}
                    <span className="text-slate-400 group-hover:text-slate-600">{getSortIcon('updatedAt')}</span>
                  </th>
                  <th className="p-5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleData.map((s: any) => {
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <tr 
                      key={s.id} 
                      className={`group transition-all duration-150 cursor-pointer ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => navigate(`/shipments/${s.id}`)}
                    >
                      <td className="p-5 text-center" onClick={(e) => toggleSelectRow(s.id, e)}>
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={isSelected}
                          onChange={() => {}} 
                        />
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{s.trackingNumber}</span>
                      </td>
                      <td className="p-5">{getStatusBadge(s.status)}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <MapPin size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-700" title={s.originId}>{getLocationName(s.originId)}</span>
                          <span className="text-slate-300 shrink-0">→</span>
                          <span className="truncate font-medium text-slate-700" title={s.destinationId}>{getLocationName(s.destinationId)}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                          <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shadow-sm">
                            {getModeIcon(s.mode)}
                          </div>
                          {s.mode}
                        </div>
                      </td>
                      <td className="p-5 text-sm text-slate-500 font-medium">
                        {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm text-slate-400 hover:text-slate-700 rounded-md transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Loading more indicator */}
            {visibleCount < processedData.length && (
              <div className="p-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items Action Bar (Optional, can float at bottom) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="w-px h-4 bg-slate-700" />
          <button className="text-sm font-medium hover:text-slate-300 transition-colors">Export</button>
          <button className="text-sm font-medium hover:text-slate-300 transition-colors">Assign</button>
          <button className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">Delete</button>
        </div>
      )}

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
