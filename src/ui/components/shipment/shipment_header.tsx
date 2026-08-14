import { ArrowLeft, Edit, Package, FileText, DollarSign, CheckSquare, AlertTriangle, MoreHorizontal, Ship, Plane, Truck, Train } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:              { label: 'Draft',              color: 'bg-slate-100 text-slate-600' },
  PENDING:            { label: 'Pending',            color: 'bg-yellow-100 text-yellow-700' },
  IN_TRANSIT:         { label: 'In Transit',         color: 'bg-blue-100 text-blue-700' },
  CUSTOMS_CLEARANCE:  { label: 'Customs Clearance',  color: 'bg-purple-100 text-purple-700' },
  OUT_FOR_DELIVERY:   { label: 'Out for Delivery',   color: 'bg-orange-100 text-orange-700' },
  DELIVERED:          { label: 'Delivered',          color: 'bg-green-100 text-green-700' },
  CANCELLED:          { label: 'Cancelled',          color: 'bg-red-100 text-red-700' },
};

const MODE_ICON: Record<string, React.ReactNode> = {
  SEA:  <Ship size={14} />,
  AIR:  <Plane size={14} />,
  LAND: <Truck size={14} />,
  RAIL: <Train size={14} />,
};

export default function ShipmentHeader({ shipment, onEditClick }: { shipment: Shipment, onEditClick?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusKey = `shipment.status.${shipment.status.toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase())}`;
  const statusLabel = STATUS_CONFIG[shipment.status]?.label ? t(statusKey as string, STATUS_CONFIG[shipment.status].label) : shipment.status;
  const statusColor = STATUS_CONFIG[shipment.status]?.color ?? 'bg-slate-100 text-slate-600';

  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 w-full h-px opacity-0 pointer-events-none" />
      <div className={`bg-white border-b border-slate-200 px-6 sticky top-0 z-40 shadow-sm transition-all duration-300 ease-in-out ${isScrolled ? 'py-2' : 'py-4'}`}>
        {/* Breadcrumb removed */}

        <div className="flex items-start justify-between gap-4">
          {/* Left: Identity */}
          <div className="flex items-start gap-4">
            <div className={`rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out ${isScrolled ? 'w-8 h-8' : 'w-12 h-12'}`}>
              <Package size={isScrolled ? 16 : 22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`font-bold text-slate-900 transition-all duration-300 ease-in-out ${isScrolled ? 'text-lg' : 'text-xl'}`}>{shipment.trackingNumber}</h1>
                {/* Transit badge */}
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 tracking-wide">
                  {t('shipment.header.transitCargo', 'TRANSIT CARGO')}
                </span>
                {/* Status badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              <div className={`flex items-center gap-3 text-sm text-slate-500 flex-wrap transition-all duration-300 ease-in-out overflow-hidden ${isScrolled ? 'h-0 mt-0 opacity-0' : 'h-5 mt-1.5 opacity-100'}`}>
                {/* Route */}
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  🇨🇳 China → 🇻🇳 Cat Lai, Vietnam → 🇰🇭 Cambodia
                </span>
                <span className="text-slate-300">|</span>
                {/* Mode */}
                <span className="flex items-center gap-1 capitalize">
                  {MODE_ICON[shipment.mode] ?? <Truck size={14} />}
                  {shipment.mode}
                </span>
                <span className="text-slate-300">|</span>
                <span>ABC Logistics Cambodia</span>
                <span className="text-slate-300">|</span>
                <span>{t('shipment.header.created', 'Created')} {new Date(shipment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEditClick} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Edit size={14} />
              {t('shipment.header.edit', 'Edit')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <FileText size={14} />
              {t('shipment.header.addDocument', 'Add Document')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <DollarSign size={14} />
              {t('shipment.header.addExpense', 'Add Expense')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <CheckSquare size={14} />
              {t('shipment.header.addTask', 'Add Task')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
              <AlertTriangle size={14} />
              {t('shipment.header.reportIssue', 'Report Issue')}
            </button>
            <button className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
