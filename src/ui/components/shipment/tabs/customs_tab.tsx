import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Pencil, X, Check } from 'lucide-react';
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

interface CustomsEntry {
  id?: string;
  country: 'VN' | 'KH';
  declarationNumber: string;
  customsOffice: string;
  declarationDate: string;
  registrationDate?: string;
  clearanceDate: string;
  status: string;
  broker: string;
  transitPermit?: string;
  notes: string;
}

interface CustomsData {
  vietnam?: CustomsEntry;
  cambodia?: CustomsEntry;
}

interface CustomsTabProps {
  shipment: Shipment;
  token: string;
}

const MOCK_CUSTOMS: CustomsData = {
  vietnam: {
    id: 'vn-mock-1',
    country: 'VN',
    declarationNumber: 'TG-2026-001234',
    customsOffice: 'Chi cục HQ Cát Lái',
    declarationDate: '2026-08-10',
    registrationDate: '2026-08-10',
    clearanceDate: '2026-08-11',
    status: 'CLEARED',
    broker: 'Vietnam Transit Services',
    transitPermit: 'TP-2026-5678',
    notes: 'All documents verified. Transit permit issued.',
  },
  cambodia: {
    id: 'kh-mock-1',
    country: 'KH',
    declarationNumber: 'PNH-2026-000456',
    customsOffice: 'Phnom Penh Customs',
    declarationDate: '2026-08-12',
    registrationDate: '',
    clearanceDate: '',
    status: 'SUBMITTED',
    broker: 'PP Freight Services',
    notes: 'Awaiting customs officer review.',
  },
};

const STATUS_STYLES: Record<string, string> = {
  CLEARED: 'bg-green-100 text-green-700 border border-green-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border border-blue-200',
  CUSTOMS_HOLD: 'bg-red-100 text-red-700 border border-red-200',
  NOT_STARTED: 'bg-slate-100 text-slate-600 border border-slate-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES['NOT_STARTED'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value || '—'}</div>
    </div>
  );
}

interface CustomsPanelProps {
  flag: string;
  title: string;
  entry: CustomsEntry | undefined;
  onSave: (updated: CustomsEntry) => void;
}

function CustomsPanel({ flag, title, entry, onSave }: CustomsPanelProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomsEntry>(
    entry ?? {
      country: title.includes('Vietnam') ? 'VN' : 'KH',
      declarationNumber: '',
      customsOffice: '',
      declarationDate: '',
      registrationDate: '',
      clearanceDate: '',
      status: 'NOT_STARTED',
      broker: '',
      transitPermit: '',
      notes: '',
    }
  );

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  const isVN = title.includes('Vietnam');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-xl">{flag}</span>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {entry && <StatusBadge status={entry.status} />}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Pencil size={12} /> {t('shipment.customs.update', 'Update')}
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700"
              >
                <Check size={12} /> {t('shipment.customs.save', 'Save')}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X size={12} /> {t('shipment.customs.cancel', 'Cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-0">
        {editing ? (
          <div className="space-y-3">
            {[
              { key: 'declarationNumber', label: t('shipment.customs.declarationNo', 'Declaration No.') },
              { key: 'customsOffice', label: t('shipment.customs.customsOffice', 'Customs Office') },
              { key: 'declarationDate', label: t('shipment.customs.declarationDate', 'Declaration Date'), type: 'date' },
              ...(isVN ? [{ key: 'registrationDate', label: t('shipment.customs.registrationDate', 'Registration Date'), type: 'date' }] : []),
              { key: 'clearanceDate', label: t('shipment.customs.clearanceDate', 'Clearance Date'), type: 'date' },
              { key: 'broker', label: isVN ? t('shipment.customs.customsBroker', 'Customs Broker') : t('shipment.customs.broker', 'Broker') },
              ...(isVN ? [{ key: 'transitPermit', label: t('shipment.customs.transitPermit', 'Transit Permit') }] : []),
            ].map(({ key, label, type = 'text' }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={(form as unknown as Record<string, string>)[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.customs.status', 'Status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {['NOT_STARTED', 'SUBMITTED', 'PENDING', 'CLEARED', 'CUSTOMS_HOLD'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.customs.notes', 'Notes')}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>
        ) : entry ? (
          <>
            <Field label={t('shipment.customs.declarationNo', 'Declaration No.')} value={<span className="font-mono font-semibold text-indigo-700">{entry.declarationNumber}</span>} />
            <Field label={t('shipment.customs.customsOffice', 'Customs Office')} value={entry.customsOffice} />
            <Field label={t('shipment.customs.declarationDate', 'Declaration Date')} value={entry.declarationDate} />
            {isVN && <Field label={t('shipment.customs.registrationDate', 'Registration Date')} value={entry.registrationDate} />}
            <Field label={t('shipment.customs.clearanceDate', 'Clearance Date')} value={entry.clearanceDate || 'Pending'} />
            <Field label={t('shipment.customs.status', 'Status')} value={<StatusBadge status={entry.status} />} />
            <Field label={isVN ? t('shipment.customs.customsBroker', 'Customs Broker') : t('shipment.customs.broker', 'Broker')} value={entry.broker} />
            {isVN && <Field label={t('shipment.customs.transitPermit', 'Transit Permit')} value={entry.transitPermit} />}
            <Field label={t('shipment.customs.notes', 'Notes')} value={<span className="text-slate-600 text-xs leading-relaxed">{entry.notes}</span>} />
          </>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            {t('shipment.customs.empty', 'No customs data yet. Click Update to add.')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomsTab({ shipment, token }: CustomsTabProps) {
  const { t } = useTranslation();
  const [customs, setCustoms] = useState<CustomsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authToken = token || localStorage.getItem('token') || '';

  useEffect(() => {
    fetchCustoms();
  }, [shipment.id]);

  async function fetchCustoms() {
    setLoading(true);
    setError(null);
    try {
      const data: CustomsData = await apiFetch(`/api/shipments/${shipment.id}/customs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const hasData = data.vietnam || data.cambodia;
      setCustoms(hasData ? data : MOCK_CUSTOMS);
    } catch {
      setCustoms(MOCK_CUSTOMS);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveVN(updated: CustomsEntry) {
    setCustoms((prev) => ({ ...prev, vietnam: updated }));
  }

  function handleSaveKH(updated: CustomsEntry) {
    setCustoms((prev) => ({ ...prev, cambodia: updated }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-800">{t('shipment.customs.title', 'Customs Declarations')}</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle size={15} /> {t('shipment.customs.mockWarning', 'Showing mock data — API unavailable.')}
        </div>
      )}

      {/* Two Columns */}
      <div className="flex flex-col lg:flex-row gap-5">
        <CustomsPanel
          flag="🇻🇳"
          title={t('shipment.customs.vnCustoms', 'Vietnam Transit Customs')}
          entry={customs.vietnam}
          onSave={handleSaveVN}
        />
        <CustomsPanel
          flag="🇰🇭"
          title={t('shipment.customs.khCustoms', 'Cambodia Customs')}
          entry={customs.cambodia}
          onSave={handleSaveKH}
        />
      </div>
    </div>
  );
}
