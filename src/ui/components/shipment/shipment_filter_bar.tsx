import React from 'react';
import { Search, Save, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FilterDropdown, { FilterOption } from '../ui/filter_dropdown.js';

export interface ShipmentFilters {
  search: string;
  status: string[];
  mode: string[];
}

interface ShipmentFilterBarProps {
  filters: ShipmentFilters;
  onFilterChange: (newFilters: ShipmentFilters) => void;
}

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Customs Clearance', value: 'CUSTOMS_CLEARANCE' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const MODE_OPTIONS: FilterOption[] = [
  { label: 'Air', value: 'AIR' },
  { label: 'Sea', value: 'SEA' },
  { label: 'Land', value: 'LAND' },
  { label: 'Rail', value: 'RAIL' },
];

export default function ShipmentFilterBar({ filters, onFilterChange }: ShipmentFilterBarProps) {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (status: string[]) => {
    onFilterChange({ ...filters, status });
  };

  const handleModeChange = (mode: string[]) => {
    onFilterChange({ ...filters, mode });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-1 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Search */}
        <div className="relative shrink-0 mr-2 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-1.5 w-64 bg-white border border-slate-300 rounded-full text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            placeholder={t('shipmentList.searchPlaceholder', 'Search tracking or customer...')}
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Dropdowns */}
        <FilterDropdown
          label={t('shipmentList.status', 'Status')}
          options={STATUS_OPTIONS}
          selectedValues={filters.status}
          onChange={handleStatusChange}
        />

        <FilterDropdown
          label={t('shipmentList.mode', 'Mode')}
          options={MODE_OPTIONS}
          selectedValues={filters.mode}
          onChange={handleModeChange}
        />

        {/* More Filters */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <Settings2 size={15} className="text-slate-500" />
          <span>{t('common.moreFilters', 'More filters')}</span>
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm shrink-0 pl-4">
        <button className="text-slate-500 font-medium hover:text-slate-800 transition-colors">
          {t('common.clearFilters', 'Clear filters')}
        </button>
        <button className="text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5">
          <Save size={15} />
          {t('common.saveFilter', 'Save filter')}
        </button>
      </div>
    </div>
  );
}
