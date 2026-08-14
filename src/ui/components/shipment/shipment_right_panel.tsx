import { Clock, AlertTriangle, Zap, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface Shipment {
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  status: string;
}

function DeadlineItem({ label, date, urgency }: { label: string; date?: string; urgency: 'red' | 'yellow' | 'green' | 'none' }) {
  const colors = {
    red:    'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    green:  'bg-green-50 border-green-200 text-green-600',
    none:   'bg-slate-50 border-slate-200 text-slate-500',
  };
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${colors[urgency]}`}>
      <span className="font-medium">{label}</span>
      <span className="font-mono">{date ?? '—'}</span>
    </div>
  );
}

export default function ShipmentRightPanel({ shipment }: { shipment: Shipment }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* Critical Deadlines */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('shipment.rightPanel.criticalDates', 'Critical Dates')}</h3>
        </div>
        <div className="space-y-1.5">
          <DeadlineItem label={t('shipment.rightPanel.etdChina', 'ETD China')} date="Aug 09, 2026" urgency="green" />
          <DeadlineItem label={t('shipment.rightPanel.etaCatLai', 'ETA Cat Lai')} date="Aug 12, 2026" urgency="green" />
          <DeadlineItem label={t('shipment.rightPanel.customsDeadline', 'Customs Deadline')} date="Aug 13, 2026" urgency="red" />
          <DeadlineItem label={t('shipment.rightPanel.transitDeadline', 'Transit Deadline')} date="Aug 14, 2026" urgency="yellow" />
          <DeadlineItem label={t('shipment.rightPanel.etdVietnam', 'ETD Vietnam')} date="Aug 15, 2026" urgency="yellow" />
          <DeadlineItem label={t('shipment.rightPanel.etaCambodia', 'ETA Cambodia')} date={shipment.estimatedArrivalDate ? new Date(shipment.estimatedArrivalDate).toLocaleDateString() : 'Aug 17, 2026'} urgency="none" />
        </div>
      </div>

      {/* Open Issues */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-red-500" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('shipment.rightPanel.openIssues', 'Open Issues')}</h3>
          <span className="ml-auto text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">1</span>
        </div>
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs font-semibold text-red-700">{t('shipment.rightPanel.issueDesc', 'Customs Hold — Missing HS Code')}</p>
          <p className="text-[10px] text-red-500 mt-0.5">{t('shipment.rightPanel.issueDetail', 'Vietnam customs requires documentation')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('shipment.rightPanel.quickActions', 'Quick Actions')}</h3>
        </div>
        <div className="space-y-1.5">
          {[
            { label: t('shipment.rightPanel.updateCustomsStatus', 'Update Customs Status') },
            { label: t('shipment.rightPanel.addContainer', 'Add Container') },
            { label: t('shipment.rightPanel.uploadDocument', 'Upload Document') },
            { label: t('shipment.rightPanel.addTrackingEvent', 'Add Tracking Event') },
            { label: t('shipment.rightPanel.invoiceCustomer', 'Invoice Customer') },
          ].map((action) => (
            <button
              key={action.label}
              className="w-full text-left text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
            >
              + {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned Operator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={14} className="text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('shipment.rightPanel.operator', 'Operator')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">NA</div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Nguyen Van A</p>
            <p className="text-[10px] text-slate-500">{t('shipment.rightPanel.logisticsOfficer', 'Logistics Officer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
