import React from 'react';
import { Container, FileText, ShieldCheck, DollarSign, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface KpiData {
  containers: number;
  documents: number;
  customsStatus: string;
  revenue: number;
  cost: number;
  openIssues: number;
  transitDays: number;
  outstandingAmount: number;
}

const DEFAULT_KPIS: KpiData = {
  containers: 2,
  documents: 14,
  customsStatus: 'CLEARED',
  revenue: 12500,
  cost: 8750,
  openIssues: 1,
  transitDays: 3,
  outstandingAmount: 2500,
};

const CUSTOMS_COLOR: Record<string, string> = {
  CLEARED:     'text-green-600 bg-green-50',
  SUBMITTED:   'text-blue-600 bg-blue-50',
  CUSTOMS_HOLD:'text-red-600 bg-red-50',
  NOT_STARTED: 'text-slate-500 bg-slate-50',
};

export default function ShipmentKpis({ data = DEFAULT_KPIS, variant = 'default' }: { data?: Partial<KpiData>, variant?: 'default' | 'mini' }) {
  const { t } = useTranslation();
  const kpis = { ...DEFAULT_KPIS, ...data };
  const profit = kpis.revenue - kpis.cost;
  const margin = kpis.revenue > 0 ? Math.round((profit / kpis.revenue) * 100) : 0;
  const customsColor = CUSTOMS_COLOR[kpis.customsStatus] ?? 'text-slate-500 bg-slate-50';

  const items = [
    {
      label: t('shipment.kpi.transitDuration', 'Transit Duration'),
      value: `${kpis.transitDays} ${t('shipment.kpi.days', 'Days')}`,
      icon: <Clock size={16} />,
      iconBg: 'bg-indigo-50 text-indigo-600',
      valueClass: 'text-slate-900',
    },
    {
      label: t('shipment.kpi.containers', 'Containers'),
      value: kpis.containers.toString(),
      icon: <Container size={16} />,
      iconBg: 'bg-blue-50 text-blue-600',
      valueClass: 'text-slate-900',
    },
    {
      label: t('shipment.kpi.documents', 'Documents'),
      value: `${kpis.documents}/20`,
      icon: <FileText size={16} />,
      iconBg: 'bg-slate-50 text-slate-600',
      valueClass: kpis.documents < 20 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: t('shipment.kpi.customs', 'Customs'),
      value: kpis.customsStatus.replace('_', ' '),
      icon: <ShieldCheck size={16} />,
      iconBg: customsColor,
      valueClass: customsColor.split(' ')[0],
    },
    {
      label: t('shipment.kpi.revenue', 'Revenue'),
      value: `$${kpis.revenue.toLocaleString()}`,
      icon: <TrendingUp size={16} />,
      iconBg: 'bg-green-50 text-green-600',
      valueClass: 'text-green-600',
    },
    {
      label: t('shipment.kpi.cost', 'Cost'),
      value: `$${kpis.cost.toLocaleString()}`,
      icon: <DollarSign size={16} />,
      iconBg: 'bg-red-50 text-red-500',
      valueClass: 'text-red-500',
    },
    {
      label: t('shipment.kpi.profitMargin', 'Profit / Margin'),
      value: `$${profit.toLocaleString()} · ${margin}%`,
      icon: <TrendingUp size={16} />,
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-emerald-600',
    },
    {
      label: t('shipment.kpi.outstanding', 'Outstanding'),
      value: `$${kpis.outstandingAmount.toLocaleString()}`,
      icon: <DollarSign size={16} />,
      iconBg: 'bg-amber-50 text-amber-600',
      valueClass: 'text-amber-600',
    },
    {
      label: t('shipment.kpi.openIssues', 'Open Issues'),
      value: kpis.openIssues.toString(),
      icon: <AlertTriangle size={16} />,
      iconBg: kpis.openIssues > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600',
      valueClass: kpis.openIssues > 0 ? 'text-red-600' : 'text-green-600',
    },
  ];

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-6 overflow-x-auto overflow-y-hidden whitespace-nowrap hide-scrollbar w-full" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${item.iconBg}`}>
              {React.cloneElement(item.icon as React.ReactElement, { size: 14 })}
            </div>
            <div className="flex flex-col justify-center">
              <span className={`text-[11px] font-bold leading-tight ${item.valueClass}`}>{item.value}</span>
              <span className="text-[9px] text-slate-500 leading-tight uppercase font-medium">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-1.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${item.iconBg}`}>
            {item.icon}
          </div>
          <p className={`text-sm font-bold ${item.valueClass}`}>{item.value}</p>
          <p className="text-[10px] text-slate-500 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
