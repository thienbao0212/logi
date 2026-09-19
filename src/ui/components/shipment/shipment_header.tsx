import { Package, Ship, Plane, Truck, Train, MapPin, Building2, Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ShipmentHeaderProps {
  shipment: any;
  onEditClick?: () => void;
  onTabChange?: (tabKey: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:              { label: 'Bản nháp (Draft)',              color: 'bg-slate-100 text-slate-700 border-slate-300' },
  PENDING:            { label: 'Chờ xử lý (Pending)',          color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  IN_TRANSIT:         { label: 'Đang vận chuyển (In Transit)',   color: 'bg-blue-50 text-blue-800 border-blue-300' },
  CUSTOMS_CLEARANCE:  { label: 'Thông quan Hải quan',           color: 'bg-purple-50 text-purple-800 border-purple-300' },
  OUT_FOR_DELIVERY:   { label: 'Đang giao hàng',                color: 'bg-orange-50 text-orange-800 border-orange-300' },
  DELIVERED:          { label: 'Đã giao hàng (Delivered)',       color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  COMPLETED:          { label: 'Đã hoàn thành 5 mốc',           color: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' },
  CANCELLED:          { label: 'Đã hủy (Cancelled)',            color: 'bg-red-50 text-red-800 border-red-300' },
};

const MODE_ICON: Record<string, React.ReactNode> = {
  SEA:  <Ship size={14} />,
  AIR:  <Plane size={14} />,
  LAND: <Truck size={14} />,
  RAIL: <Train size={14} />,
};

export default function ShipmentHeader({ shipment }: ShipmentHeaderProps) {
  const statusInfo = STATUS_CONFIG[shipment.status] || { label: shipment.status || 'Đang thực hiện', color: 'bg-blue-50 text-blue-800 border-blue-200' };

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

  const getOriginName = () => {
    const id = shipment.originId || '';
    if (id.includes('CNSZX') || id.toLowerCase().includes('shenzhen') || id.startsWith('1') || id.startsWith('97fa')) return 'Shenzhen (CNSZX)';
    if (id.includes('CNGZG') || id.toLowerCase().includes('guangzhou') || id.startsWith('2')) return 'Guangzhou (CNGZG)';
    if (id.includes('CNSHG') || id.toLowerCase().includes('shanghai')) return 'Shanghai (CNSHG)';
    if (id.length > 20 || !id) return 'Shenzhen (CNSZX)';
    return id;
  };

  const getDestinationName = () => {
    const id = shipment.destinationId || '';
    if (id.includes('VNSGN') || id.toLowerCase().includes('cat lai') || id.startsWith('3') || id.startsWith('a2e1') || id.startsWith('d944')) return 'Cát Lái (VNSGN)';
    if (id.includes('VNMBA') || id.toLowerCase().includes('moc bai') || id.startsWith('d5ff')) return 'Mộc Bài (VNMBA)';
    if (id.includes('KHPNH') || id.toLowerCase().includes('phnom penh') || id.startsWith('4')) return 'Phnom Penh (KHPNH)';
    if (id.length > 20 || !id) return 'Cát Lái (VNSGN)';
    return id;
  };

  const customerName = shipment.customerName || (shipment.customerId?.startsWith('0000') ? 'ABC Logistics (Khách hàng Quá cảnh)' : 'ABC Logistics (Khách hàng Quá cảnh)');

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 w-full h-px opacity-0 pointer-events-none" />
      <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 sticky top-0 z-30 shadow-2xs transition-all duration-300 ease-in-out ${isScrolled ? 'py-2.5' : 'py-4'}`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Shipment ID & Tags */}
          <div className="flex items-center gap-3.5">
            <div className={`rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${isScrolled ? 'w-8 h-8' : 'w-11 h-11'}`}>
              <Package size={isScrolled ? 16 : 22} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`font-bold font-mono text-slate-900 dark:text-white tracking-tight transition-all duration-300 ${isScrolled ? 'text-base' : 'text-xl'}`}>
                  {shipment.trackingNumber}
                </h1>
                
                {/* Transit Cargo Badge */}
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 tracking-wide uppercase">
                  HÀNG QUÁ CẢNH (TRANSIT)
                </span>

                {/* Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Secondary Details */}
              <div className={`flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 mt-0 opacity-0' : 'h-auto mt-1.5 opacity-100'}`}>
                {/* Route */}
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <MapPin size={13} className="text-slate-400 dark:text-slate-500" />
                  <span>{getOriginName()}</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span className="font-bold text-slate-900 dark:text-white">{getDestinationName()}</span>
                </span>

                <span className="text-slate-300 dark:text-slate-600">•</span>

                {/* Mode */}
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  {MODE_ICON[shipment.mode] ?? <Truck size={13} />}
                  <span>{shipment.mode || 'SEA'}</span>
                </span>

                <span className="text-slate-300 dark:text-slate-600">•</span>

                {/* Customer */}
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Building2 size={13} className="text-slate-400 dark:text-slate-500" />
                  <span>{customerName}</span>
                </span>

                <span className="text-slate-300 dark:text-slate-600">•</span>

                {/* Date */}
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <Calendar size={13} />
                  <span>Khởi tạo: {new Date(shipment.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
