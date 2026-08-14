import { useState, useEffect } from 'react';
import { Activity, Plus, Send, X, FileText, Ship, CheckCircle, ClipboardList, Truck, Package, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/fetch.js';

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

interface ActivityTabProps {
  shipment: Shipment;
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  timestamp: string;
  description: string;
  user: string;
  isNote?: boolean;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    icon: <FileText size={15} />,
    iconBg: 'bg-indigo-500',
    timestamp: 'Aug 11 · 09:15',
    description: 'Bill of Lading uploaded',
    user: 'Nguyen Van A',
  },
  {
    id: 'act-2',
    icon: <Ship size={15} />,
    iconBg: 'bg-blue-500',
    timestamp: 'Aug 11 · 08:00',
    description: 'Container MSCU1234567 arrived at Cat Lai Port',
    user: 'System',
  },
  {
    id: 'act-3',
    icon: <CheckCircle size={15} />,
    iconBg: 'bg-green-500',
    timestamp: 'Aug 10 · 16:30',
    description: 'Vietnam Transit Customs Declaration CLEARED',
    user: 'Tran Thi B',
  },
  {
    id: 'act-4',
    icon: <ClipboardList size={15} />,
    iconBg: 'bg-slate-500',
    timestamp: 'Aug 10 · 14:00',
    description: 'Transit Declaration submitted to Chi cục HQ Cát Lái',
    user: 'Tran Thi B',
  },
  {
    id: 'act-5',
    icon: <Truck size={15} />,
    iconBg: 'bg-orange-500',
    timestamp: 'Aug 09 · 07:00',
    description: 'Shipment departed Shenzhen, China',
    user: 'System',
  },
  {
    id: 'act-6',
    icon: <Package size={15} />,
    iconBg: 'bg-purple-500',
    timestamp: 'Aug 08 · 15:00',
    description: 'Shipment created (Status: DRAFT)',
    user: 'Nguyen Van A',
  },
];

function TimelineDot({ icon, bg }: { icon: React.ReactNode; bg: string }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${bg} shadow-sm`}>
      {icon}
    </div>
  );
}

export default function ActivityTab({ shipment: _shipment }: ActivityTabProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadActivities() {
      try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;

        const json = await apiFetch(`/api/shipments/${_shipment.id}/activities`);
        // Map backend activities to UI structure and merge with INITIAL_ACTIVITIES if empty, or just replace
        if (json.data && json.data.length > 0) {
          const mapped = json.data.map((a: any) => ({
            id: a.id,
            icon: a.entityType === 'NOTE' ? <MessageSquare size={15} /> : <Activity size={15} />,
            iconBg: a.entityType === 'NOTE' ? 'bg-teal-500' : 'bg-slate-500',
            timestamp: new Date(a.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·'),
            description: typeof a.description === 'object' ? (a.description.vi || a.description.en) : a.description,
            user: a.createdBy === currentUser?.id ? t('shipment.activity.you', 'You') : (a.createdBy || 'System'),
            isNote: a.entityType === 'NOTE',
          }));
          setActivities(mapped);
        }
      } catch (err) {
        console.error('Failed to load activities', err);
      }
    }
    loadActivities();
  }, [_shipment.id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);

    try {
      const json = await apiFetch(`/api/shipments/${_shipment.id}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'NOTE_ADDED',
          description: noteText.trim(),
          entityType: 'NOTE',
        }),
      });

      const a = json.data;
      const newNote: ActivityItem = {
        id: a.id || `note-${Date.now()}`,
        icon: <MessageSquare size={15} />,
        iconBg: 'bg-teal-500',
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·'),
        description: noteText.trim(),
        user: 'You',
        isNote: true,
      };

      setActivities((prev) => [newNote, ...prev]);
      setNoteText('');
      setShowNoteForm(false);
    } catch (err) {
      console.error('Failed to post note', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">{t('shipment.activity.title', 'Activity & Timeline')}</h2>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {activities.length}
          </span>
        </div>
        <button
          onClick={() => setShowNoteForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={14} />
          {t('shipment.activity.addNote', 'Add Note')}
        </button>
      </div>

      {/* Add Note Form */}
      {showNoteForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-teal-800 flex items-center gap-1.5">
              <MessageSquare size={14} />
              {t('shipment.activity.newNote', 'New Note')}
            </h3>
            <button onClick={() => setShowNoteForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              placeholder={t('shipment.activity.notePlaceholder', 'Write a note or update about this shipment...')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {t('shipment.activity.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || !noteText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                <Send size={13} />
                {t('shipment.activity.postNote', 'Post Note')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 divide-y divide-slate-50">
          {activities.map((item, index) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-2 last:pb-2">
              {/* Icon + vertical line */}
              <div className="flex flex-col items-center">
                <TimelineDot icon={item.icon} bg={item.iconBg} />
                {index < activities.length - 1 && (
                  <div className="w-0.5 bg-slate-100 flex-1 mt-2 min-h-[16px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
                  <p className={`text-sm font-medium ${item.isNote ? 'text-teal-800 italic' : 'text-slate-800'}`}>
                    {item.isNote ? <span className="text-xs font-semibold text-teal-600 uppercase mr-1.5">{t('shipment.activity.noteBadge', 'Note')}</span> : null}
                    {item.description}
                  </p>
                  <span className="text-xs text-slate-400 whitespace-nowrap font-mono">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {item.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
