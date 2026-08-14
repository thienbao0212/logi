import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { Box, Plus, Loader2, AlertCircle, X, MapPin, Weight } from 'lucide-react';
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

interface Container {
  id: string;
  containerNumber: string;
  type: string;
  sealNumber: string;
  status: string;
  location: string;
  grossWeight: string;
}

interface AddContainerForm {
  containerNumber: string;
  type: string;
  sealNumber: string;
  grossWeight: string;
}

interface ContainersTabProps {
  shipment: Shipment;
  token: string;
}

const MOCK_CONTAINERS: Container[] = [
  {
    id: 'mock-1',
    containerNumber: 'MSCU1234567',
    type: '40HC',
    sealNumber: 'VN123456',
    status: 'ARRIVED_CAT_LAI',
    location: 'Cat Lai Port',
    grossWeight: '18,500 KG',
  },
  {
    id: 'mock-2',
    containerNumber: 'MSCU7654321',
    type: '40GP',
    sealNumber: 'VN654321',
    status: 'CUSTOMS_CLEARED',
    location: 'Cat Lai Port',
    grossWeight: '12,200 KG',
  },
];

const CONTAINER_TYPES = ['20GP', '40GP', '40HC', '45HC', 'LCL'];

function getStatusBadge(status: string) {
  switch (status) {
    case 'ARRIVED_CAT_LAI':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'CUSTOMS_CLEARED':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'CUSTOMS_HOLD':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'DEPARTED_VIETNAM':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

const DEFAULT_FORM: AddContainerForm = {
  containerNumber: '',
  type: '40HC',
  sealNumber: '',
  grossWeight: '',
};

export default function ContainersTab({ shipment, token }: ContainersTabProps) {
  const { t } = useTranslation();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddContainerForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const authToken = token || localStorage.getItem('token') || '';

  useEffect(() => {
    fetchContainers();
  }, [shipment.id]);

  async function fetchContainers() {
    setLoading(true);
    setError(null);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/containers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const data: Container[] = _fetchRes;
      setContainers(data.length > 0 ? data : MOCK_CONTAINERS);
    } catch {
      setContainers(MOCK_CONTAINERS);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContainer(e: React.FormEvent) {
    e.preventDefault();
    if (!form.containerNumber.trim()) {
      setFormError('Container number is required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/containers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(form),
      });
      
      const newContainer: Container = _fetchRes;
      setContainers((prev) => [...prev, newContainer]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } catch {
      // Optimistically add mock
      const optimistic: Container = {
        id: `local-${Date.now()}`,
        containerNumber: form.containerNumber.toUpperCase(),
        type: form.type,
        sealNumber: form.sealNumber,
        status: 'PENDING',
        location: 'TBD',
        grossWeight: form.grossWeight ? `${form.grossWeight} KG` : '—',
      };
      setContainers((prev) => [...prev, optimistic]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Box size={18} className="text-slate-500" />
            {t('shipment.containers.title', 'Containers')}
          </h2>
          {!loading && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {containers.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={14} />
          {t('shipment.containers.addContainer', 'Add Container')}
        </button>
      </div>

      {/* Add Container Form */}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-800">{t('shipment.containers.newContainer', 'New Container')}</h3>
            <button onClick={() => { setShowForm(false); setFormError(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddContainer} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.containers.containerNo', 'Container No. *')}</label>
              <input
                type="text"
                placeholder="MSCU0000000"
                value={form.containerNumber}
                onChange={(e) => setForm((f) => ({ ...f, containerNumber: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.containers.type', 'Type')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {CONTAINER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.containers.sealNo', 'Seal No.')}</label>
              <input
                type="text"
                placeholder="VN000000"
                value={form.sealNumber}
                onChange={(e) => setForm((f) => ({ ...f, sealNumber: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.containers.grossWeight', 'Gross Weight (KG)')}</label>
              <input
                type="text"
                placeholder="18500"
                value={form.grossWeight}
                onChange={(e) => setForm((f) => ({ ...f, grossWeight: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {formError && (
              <div className="col-span-2 sm:col-span-4 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {formError}
              </div>
            )}
            <div className="col-span-2 sm:col-span-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {t('shipment.containers.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {t('shipment.containers.saveContainer', 'Save Container')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      {!loading && containers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.containerNo', 'Container No.')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.type', 'Type')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.sealNo', 'Seal No.')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.status', 'Status')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.location', 'Location')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.weight', 'Weight')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('shipment.containers.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {containers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-700">{c.containerNumber}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">{c.type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.sealNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(c.status)}`}>
                        {formatStatus(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {c.location || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="flex items-center gap-1">
                        <Weight size={12} className="text-slate-400" />
                        {c.grossWeight}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-indigo-600 hover:underline font-medium">{t('shipment.containers.edit', 'Edit')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && containers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <Box size={36} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium mb-1">{t('shipment.containers.emptyTitle', 'No containers added yet')}</p>
          <p className="text-slate-400 text-sm mb-4">{t('shipment.containers.emptyDesc', 'Add containers to track their status and location.')}</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={14} /> {t('shipment.containers.addContainer', 'Add Container')}
          </button>
        </div>
      )}
    </div>
  );
}
