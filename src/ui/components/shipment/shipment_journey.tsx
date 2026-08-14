import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface Shipment {
  status: string;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  actualDepartureDate?: string;
  actualArrivalDate?: string;
}

// Map shipment status to step index
const STATUS_TO_STEP: Record<string, number> = {
  DRAFT: 0,
  PENDING: 1,
  IN_TRANSIT: 3,
  CUSTOMS_CLEARANCE: 5,
  OUT_FOR_DELIVERY: 7,
  CANCELLED: -1,
  
  BOOKED: 0,
  CARGO_RECEIVED: 1,
  DEPARTED_CHINA: 2,
  ARRIVED_CAT_LAI: 3,
  CUSTOMS_TRANSIT_DECLARED: 4,
  CUSTOMS_CLEARED: 5,
  DEPARTED_VIETNAM: 6,
  ARRIVED_CAMBODIA: 7,
  DELIVERED: 8,
};

export default function ShipmentJourney({ shipment, onUpdateStatus }: { shipment: Shipment, onUpdateStatus?: (status: string) => void }) {
  const { t } = useTranslation();
  
  const TRANSIT_STEPS = [
    { key: 'BOOKED',                    label: t('shipment.journey.step.booked', 'Booked'),                                       location: 'Shenzhen, China',    flag: '🇨🇳' },
    { key: 'CARGO_RECEIVED',            label: t('shipment.journey.step.cargoReceived', 'Cargo Received in China'),                location: 'Shenzhen Warehouse', flag: '🇨🇳' },
    { key: 'DEPARTED_CHINA',            label: t('shipment.journey.step.departedChina', 'Departed China'),                         location: 'Yantian Port',       flag: '🇨🇳' },
    { key: 'ARRIVED_CAT_LAI',           label: t('shipment.journey.step.arrivedCatLai', 'Arrived Cat Lai'),                        location: 'Cat Lai Port, HCMC', flag: '🇻🇳', transit: true },
    { key: 'CUSTOMS_TRANSIT_DECLARED',  label: t('shipment.journey.step.customsTransitDeclared', 'Transit Customs Declared'),       location: 'Chi cục HQ Cát Lái', flag: '🇻🇳', transit: true },
    { key: 'CUSTOMS_CLEARED',           label: t('shipment.journey.step.customsCleared', 'Customs Cleared'),                       location: 'Chi cục HQ Cát Lái', flag: '🇻🇳', transit: true },
    { key: 'DEPARTED_VIETNAM',          label: t('shipment.journey.step.departedVietnam', 'Departed Vietnam'),                     location: 'Vietnam Border',     flag: '🇻🇳' },
    { key: 'ARRIVED_CAMBODIA',          label: t('shipment.journey.step.arrivedCambodia', 'Arrived Cambodia'),                     location: 'Phnom Penh',         flag: '🇰🇭' },
    { key: 'DELIVERED',                 label: t('shipment.journey.step.delivered', 'Delivered'),                                  location: 'Final Destination',  flag: '🇰🇭' },
  ];

  const currentStep = STATUS_TO_STEP[shipment.status] ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t('shipment.journey.title', 'Shipment Journey')}</h2>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-medium">
          {t('shipment.journey.route', '🇨🇳 CHINA → 🇻🇳 VIETNAM TRANSIT → 🇰🇭 CAMBODIA')}
        </span>
      </div>

      {/* Horizontal stepper */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-500"
          style={{ width: `${Math.min(100, (currentStep / (TRANSIT_STEPS.length - 1)) * 100)}%` }}
        />

        <div className="relative flex justify-between">
          {TRANSIT_STEPS.map((step, idx) => {
            const done = idx < currentStep;
            const active = idx === currentStep;

            return (
              <div 
                key={step.key} 
                className="flex flex-col items-center gap-1.5 group cursor-pointer" 
                style={{ width: `${100 / TRANSIT_STEPS.length}%` }}
                onClick={() => onUpdateStatus && onUpdateStatus(step.key)}
              >
                {/* Circle */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${
                  done   ? 'bg-blue-500 border-blue-500 text-white group-hover:bg-blue-600' :
                  active ? 'bg-white border-blue-500 text-blue-600 ring-4 ring-blue-100 group-hover:ring-blue-200' :
                           'bg-white border-slate-200 text-slate-300 group-hover:border-blue-400 group-hover:text-blue-500'
                }`}>
                  {done ? <CheckCircle2 size={14} /> : active ? <Clock size={12} /> : <Circle size={10} />}
                </div>

                {/* Label */}
                <div className="text-center px-1 transition-transform duration-300 group-hover:translate-y-0.5">
                  <div className={`text-[10px] font-semibold leading-tight transition-colors duration-300 ${
                    active ? 'text-blue-700' : done ? 'text-slate-700 group-hover:text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                  }`}>
                    {step.flag} {step.label}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{step.location}</div>
                  {/* Transit badge */}
                  {step.transit && (
                    <span className="inline-block mt-0.5 text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-bold tracking-wide">{t('shipment.journey.transit', 'TRANSIT')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
