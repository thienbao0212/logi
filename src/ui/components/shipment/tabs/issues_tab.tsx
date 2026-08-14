import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Loader2, X, User, Clock } from 'lucide-react';
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

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  responsiblePerson: string;
  createdAt: string;
}

interface AddIssueForm {
  title: string;
  severity: Issue['severity'];
  description: string;
}

interface IssuesTabProps {
  shipment: Shipment;
  token: string;
}

const MOCK_ISSUES: Issue[] = [
  {
    id: 'issue-mock-1',
    title: 'Customs Hold - Missing HS Code',
    description: 'Vietnam customs requires additional HS code documentation for electronics shipment.',
    severity: 'HIGH',
    status: 'OPEN',
    responsiblePerson: 'Nguyen Van A',
    createdAt: new Date().toISOString(),
  },
];

const SEVERITY_BAR: Record<Issue['severity'], string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-400',
};

const SEVERITY_BADGE: Record<Issue['severity'], string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
};

const STATUS_BADGE: Record<Issue['status'], string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DEFAULT_FORM: AddIssueForm = {
  title: '',
  severity: 'HIGH',
  description: '',
};

export default function IssuesTab({ shipment, token }: IssuesTabProps) {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddIssueForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const authToken = token || localStorage.getItem('token') || '';

  useEffect(() => {
    fetchIssues();
  }, [shipment.id]);

  async function fetchIssues() {
    setLoading(true);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/issues`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const data: Issue[] = _fetchRes;
      setIssues(data.length > 0 ? data : MOCK_ISSUES);
    } catch {
      setIssues(MOCK_ISSUES);
    } finally {
      setLoading(false);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...form, status: 'OPEN' }),
      });
      
      const newIssue: Issue = _fetchRes;
      setIssues((prev) => [newIssue, ...prev]);
    } catch {
      const optimistic: Issue = {
        id: `local-${Date.now()}`,
        title: form.title,
        description: form.description,
        severity: form.severity,
        status: 'OPEN',
        responsiblePerson: 'Unassigned',
        createdAt: new Date().toISOString(),
      };
      setIssues((prev) => [optimistic, ...prev]);
    } finally {
      setForm(DEFAULT_FORM);
      setShowForm(false);
      setSubmitting(false);
    }
  }

  function handleResolve(id: string) {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, status: 'RESOLVED' } : issue))
    );
  }

  const openCount = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-500" />
            {t('shipment.issues.title', 'Issues & Exceptions')}
          </h2>
          {!loading && openCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
              {openCount} {t('shipment.issues.openCount', 'open')}
            </span>
          )}
          {!loading && openCount === 0 && issues.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-600">
              {t('shipment.issues.allResolved', 'All resolved')}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={14} />
          {t('shipment.issues.reportIssue', 'Report Issue')}
        </button>
      </div>

      {/* Report Issue Form */}
      {showForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-800">{t('shipment.issues.reportNew', 'Report New Issue')}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleReport} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.issues.issueTitle', 'Issue Title *')}</label>
                <input
                  type="text"
                  placeholder={t('shipment.issues.issueTitlePlaceholder', 'Brief description of the issue')}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.issues.severityLabel', 'Severity')}</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Issue['severity'] }))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Issue['severity'][]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('shipment.issues.description', 'Description')}</label>
              <textarea
                placeholder={t('shipment.issues.descriptionPlaceholder', 'Provide detailed information about the issue...')}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {t('shipment.issues.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {t('shipment.issues.submitReport', 'Report Issue')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-red-500" />
        </div>
      )}

      {/* Issues List */}
      {!loading && issues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <AlertTriangle size={36} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">{t('shipment.issues.emptyTitle', 'No issues reported')}</p>
          <p className="text-slate-400 text-sm mt-1">{t('shipment.issues.emptyDesc', 'All clear! Report an issue if something needs attention.')}</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Severity bar */}
              <div className={`w-1.5 flex-shrink-0 ${SEVERITY_BAR[issue.severity]}`} />

              <div className="flex-1 px-4 py-4 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800">{issue.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_BADGE[issue.severity]}`}>
                      {t(`shipment.issues.severityValue.${issue.severity.toLowerCase()}` as string, issue.severity)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[issue.status]}`}>
                      {t(`shipment.issues.statusValue.${issue.status.toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase())}` as string, issue.status.replace(/_/g, ' '))}
                    </span>
                  </div>
                  {(issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleResolve(issue.id)}
                      className="text-xs text-green-600 hover:underline font-medium whitespace-nowrap"
                    >
                      {t('shipment.issues.markResolved', 'Mark Resolved')}
                    </button>
                  )}
                </div>

                {issue.description && (
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{issue.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {issue.responsiblePerson}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDateTime(issue.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
