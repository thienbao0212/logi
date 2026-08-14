import { Package, Truck, Ship, Calendar, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  weightTotal?: string;
  volumeTotal?: string;
  customerId: string;
  originId: string;
  destinationId: string;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  actualDepartureDate?: string;
  actualArrivalDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface OverviewTabProps {
  shipment: Shipment;
}

interface CriticalDate {
  label: string;
  date: string | undefined;
  mockDate: string;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
    case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-700';
    case 'ARRIVED': return 'bg-green-100 text-green-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function getModeIcon(mode: string) {
  switch (mode?.toUpperCase()) {
    case 'SEA': return <Ship size={14} className="inline mr-1" />;
    case 'AIR': return <AlertCircle size={14} className="inline mr-1" />;
    case 'ROAD': return <Truck size={14} className="inline mr-1" />;
    default: return <Package size={14} className="inline mr-1" />;
  }
}

function DateIndicator({ label, date }: { label: string; date: string | undefined }) {
  const now = new Date();
  const target = date ? new Date(date) : null;

  let color = 'text-slate-500';
  let dotColor = 'bg-slate-400';
  let displayDate = date ? formatDate(date) : 'TBD';

  if (target) {
    const diffMs = target.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffMs < 0) {
      color = 'text-red-600';
      dotColor = 'bg-red-500';
    } else if (diffHours <= 48) {
      color = 'text-yellow-600';
      dotColor = 'bg-yellow-500';
    } else {
      color = 'text-green-600';
      dotColor = 'bg-green-500';
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{displayDate}</span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function OverviewTab({ shipment }: OverviewTabProps) {
  const { t } = useTranslation();
  const criticalDates: CriticalDate[] = [
    {
      label: 'ETD China (Shenzhen)',
      date: shipment.estimatedDepartureDate,
      mockDate: '2026-08-09',
    },
    {
      label: 'ETA Cat Lai Port',
      date: shipment.estimatedArrivalDate,
      mockDate: '2026-08-14',
    },
    {
      label: 'ETA Cambodia (Phnom Penh)',
      date: undefined,
      mockDate: '2026-08-17',
    },
  ];

  const resolvedDates = criticalDates.map((d) => ({
    ...d,
    resolved: d.date || d.mockDate,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-5">
        {/* Shipment Information */}
        <Card title={t('shipment.overview.shipmentInfo', 'Shipment Information')} icon={<Package size={16} />}>
          <Field
            label={t('shipment.overview.trackingNumber', 'Tracking Number')}
            value={
              <span className="font-mono text-indigo-700 font-semibold">
                {shipment.trackingNumber}
              </span>
            }
          />
          <Field
            label={t('shipment.overview.type', 'Type')}
            value={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                {t('shipment.overview.transitCargo', 'Transit Cargo')}
              </span>
            }
          />
          <Field
            label={t('shipment.overview.transportMode', 'Transport Mode')}
            value={
              <span className="inline-flex items-center text-slate-700">
                {getModeIcon(shipment.mode)}
                {shipment.mode || 'SEA'}
              </span>
            }
          />
          <Field
            label={t('shipment.overview.status', 'Status')}
            value={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColor(shipment.status)}`}>
                {shipment.status?.replace(/_/g, ' ') || 'DRAFT'}
              </span>
            }
          />
          <Field
            label={t('shipment.overview.createdDate', 'Created Date')}
            value={formatDate(shipment.createdAt)}
          />
          <Field
            label={t('shipment.overview.lastUpdated', 'Last Updated')}
            value={formatDate(shipment.updatedAt)}
          />
        </Card>

        {/* Parties */}
        <Card title={t('shipment.overview.parties', 'Parties')} icon={<Users size={16} />}>
          <Field label={t('shipment.overview.customer', 'Customer')} value="ABC Logistics Cambodia" />
          <Field label={t('shipment.overview.shipper', 'Shipper / Exporter')} value="Shenzhen Trade Co." />
          <Field label={t('shipment.overview.consignee', 'Consignee')} value="Phnom Penh Freight" />
          <Field label={t('shipment.overview.customsBroker', 'Customs Broker')} value="Vietnam Transit Services" />
          <Field label={t('shipment.overview.notifyParty', 'Notify Party')} value="ABC Logistics Cambodia" />
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-5">
        {/* Cargo Details */}
        <Card title={t('shipment.overview.cargoDetails', 'Cargo Details')} icon={<Package size={16} />}>
          <Field
            label={t('shipment.overview.totalWeight', 'Total Weight')}
            value={shipment.weightTotal ? `${shipment.weightTotal} KG` : '30,700 KG'}
          />
          <Field
            label={t('shipment.overview.totalVolume', 'Total Volume')}
            value={shipment.volumeTotal ? `${shipment.volumeTotal} CBM` : '125 CBM'}
          />
          <Field label={t('shipment.overview.hsCode', 'HS Code')} value="8471.30" />
          <Field label={t('shipment.overview.commodity', 'Commodity')} value="Electronics" />
          <Field label={t('shipment.overview.packages', 'Packages')} value="150 Cartons" />
          <Field
            label={t('shipment.overview.cargoValue', 'Cargo Value')}
            value={
              <span className="text-emerald-700 font-semibold">$85,000 USD</span>
            }
          />
          <Field label={t('shipment.overview.incoterms', 'Incoterms')} value="FOB Shenzhen" />
        </Card>

        {/* Critical Dates */}
        <Card title={t('shipment.overview.criticalDates', 'Critical Dates')} icon={<Calendar size={16} />}>
          <div className="mb-3">
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{t('shipment.overview.pastOverdue', 'Past / Overdue')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />{t('shipment.overview.within48h', 'Within 48h')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('shipment.overview.onTrack', 'On Track')}</span>
            </div>
          </div>

          {resolvedDates.map((d) => (
            <DateIndicator key={d.label} label={d.label} date={d.resolved} />
          ))}

          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('shipment.overview.actualDates', 'Actual Dates')}</p>
            <DateIndicator
              label={t('shipment.overview.actualDeparture', 'Actual Departure')}
              date={shipment.actualDepartureDate}
            />
            <DateIndicator
              label={t('shipment.overview.actualArrival', 'Actual Arrival')}
              date={shipment.actualArrivalDate}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
