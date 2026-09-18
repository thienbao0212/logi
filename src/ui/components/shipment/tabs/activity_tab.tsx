import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Plus, Send, X, FileText, Ship, CheckCircle, 
  ClipboardList, Truck, Package, MessageSquare, DollarSign, 
  AlertTriangle, CheckSquare, ArrowRight, Search 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/fetch.js';
import { recordShipmentActivity } from '../transit_types.js';

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
  action?: string;
  entityType?: string;
  icon: React.ReactNode;
  iconBg: string;
  timestamp: string;
  rawTime: number;
  description: string;
  user: string;
  oldValue?: string;
  newValue?: string;
  isNote?: boolean;
}

type FilterCategory = 'ALL' | 'STATUS' | 'MILESTONE' | 'CUSTOMS_DOC' | 'FINANCIAL' | 'NOTE';

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-init-1',
    entityType: 'DOCUMENT',
    icon: <FileText size={15} />,
    iconBg: 'bg-indigo-500',
    timestamp: 'Vừa xong',
    rawTime: Date.now() - 3600000 * 2,
    description: 'Tải lên Bill of Lading (Vận đơn đường biển)',
    user: 'Nguyễn Văn A',
  },
  {
    id: 'act-init-2',
    entityType: 'MILESTONE',
    icon: <Ship size={15} />,
    iconBg: 'bg-sky-500',
    timestamp: 'Hôm nay',
    rawTime: Date.now() - 3600000 * 5,
    description: 'Container MSCU1234567 cập cảng Cát Lái an toàn',
    user: 'Hệ thống',
  },
  {
    id: 'act-init-3',
    entityType: 'CUSTOMS',
    icon: <CheckCircle size={15} />,
    iconBg: 'bg-emerald-500',
    timestamp: 'Hôm qua',
    rawTime: Date.now() - 86400000,
    description: 'Tờ khai hải quan quá cảnh Việt Nam ĐÃ THÔNG QUAN',
    user: 'Trần Thị B',
    oldValue: 'CHỜ THÔNG QUAN',
    newValue: 'ĐÃ THÔNG QUAN',
  },
  {
    id: 'act-init-4',
    entityType: 'SHIPMENT',
    icon: <Package size={15} />,
    iconBg: 'bg-blue-500',
    timestamp: '2 ngày trước',
    rawTime: Date.now() - 86400000 * 2,
    description: 'Tạo mới hồ sơ lô hàng (Trạng thái khởi tạo: DRAFT)',
    user: 'Hệ thống',
  },
];

function getActivityIcon(entityType?: string): { icon: React.ReactNode; bg: string } {
  const type = (entityType || '').toUpperCase();
  switch (type) {
    case 'NOTE':
      return { icon: <MessageSquare size={15} />, bg: 'bg-teal-500' };
    case 'STATUS':
      return { icon: <CheckCircle size={15} />, bg: 'bg-emerald-500' };
    case 'MILESTONE':
      return { icon: <Ship size={15} />, bg: 'bg-sky-500' };
    case 'CONTAINER':
      return { icon: <Truck size={15} />, bg: 'bg-amber-500' };
    case 'CUSTOMS':
      return { icon: <ClipboardList size={15} />, bg: 'bg-purple-500' };
    case 'DOCUMENT':
      return { icon: <FileText size={15} />, bg: 'bg-indigo-500' };
    case 'FINANCIAL':
      return { icon: <DollarSign size={15} />, bg: 'bg-emerald-600' };
    case 'TASK':
      return { icon: <CheckSquare size={15} />, bg: 'bg-blue-600' };
    case 'ISSUE':
      return { icon: <AlertTriangle size={15} />, bg: 'bg-rose-500' };
    case 'SHIPMENT':
    default:
      return { icon: <Package size={15} />, bg: 'bg-blue-500' };
  }
}

function TimelineDot({ icon, bg }: { icon: React.ReactNode; bg: string }) {
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${bg} shadow-xs`}>
      {icon}
    </div>
  );
}

export default function ActivityTab({ shipment: _shipment }: ActivityTabProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load activities from both Backend API & LocalStorage
  const loadActivities = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const myId = currentUser?.id;
      const myName = currentUser?.fullName || currentUser?.name || currentUser?.email;

      // 1. Fetch from server API
      let serverList: any[] = [];
      try {
        const json = await apiFetch(`/api/shipments/${_shipment.id}/activities`);
        serverList = json.data || [];
      } catch (err) {
        // console.warn('Could not fetch server activities:', err);
      }

      // 2. Fetch from LocalStorage audit store
      let localList: any[] = [];
      try {
        const rawLocal = localStorage.getItem(`logiflow_activities_${_shipment.id}`);
        if (rawLocal) localList = JSON.parse(rawLocal);
      } catch (err) {}

      // 3. Merge & Deduplicate
      const seen = new Set<string>();
      const combined: ActivityItem[] = [];

      const processItem = (a: any) => {
        // Create unique key for deduplication
        const key = a.id || `${a.action}_${a.createdAt}_${typeof a.description === 'object' ? a.description.vi : a.description}`;
        if (seen.has(key)) return;
        seen.add(key);

        const meta = getActivityIcon(a.entityType);
        const dateObj = new Date(a.createdAt || Date.now());
        const rawTime = dateObj.getTime();
        const timestamp = isNaN(rawTime) 
          ? 'Vừa xong'
          : dateObj.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        const isMe = (a.createdBy === myId || a.createdBy === myName || a.createdBy === 'You');

        let desc = '';
        if (typeof a.description === 'object' && a.description) {
          desc = a.description.vi || a.description.en || '';
        } else {
          desc = String(a.description || '');
        }

        combined.push({
          id: a.id || `act-${Math.random()}`,
          action: a.action,
          entityType: a.entityType,
          icon: meta.icon,
          iconBg: meta.bg,
          timestamp,
          rawTime,
          description: desc,
          user: isMe ? t('shipment.activity.you', 'Bạn') : (a.createdBy || 'Hệ thống'),
          oldValue: a.oldValue,
          newValue: a.newValue,
          isNote: a.entityType === 'NOTE' || a.action === 'NOTE_ADDED',
        });
      };

      serverList.forEach(processItem);
      localList.forEach(processItem);

      // If still empty, use INITIAL_ACTIVITIES
      if (combined.length === 0) {
        INITIAL_ACTIVITIES.forEach(processItem);
      }

      // Sort newest first
      combined.sort((a, b) => b.rawTime - a.rawTime);
      setActivities(combined);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [_shipment.id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);

    try {
      const text = noteText.trim();
      recordShipmentActivity(_shipment.id, {
        action: 'NOTE_ADDED',
        description: text,
        entityType: 'NOTE',
      });

      const meta = getActivityIcon('NOTE');
      const newNote: ActivityItem = {
        id: `note-${Date.now()}`,
        action: 'NOTE_ADDED',
        entityType: 'NOTE',
        icon: meta.icon,
        iconBg: meta.bg,
        timestamp: new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: Date.now(),
        description: text,
        user: t('shipment.activity.you', 'Bạn'),
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

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchUser = item.user.toLowerCase().includes(query);
        const matchOld = item.oldValue && item.oldValue.toLowerCase().includes(query);
        const matchNew = item.newValue && item.newValue.toLowerCase().includes(query);
        if (!matchDesc && !matchUser && !matchOld && !matchNew) return false;
      }

      // Category filter
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'STATUS') {
        return item.entityType === 'STATUS' || item.entityType === 'SHIPMENT';
      }
      if (activeCategory === 'MILESTONE') {
        return item.entityType === 'MILESTONE';
      }
      if (activeCategory === 'CUSTOMS_DOC') {
        return item.entityType === 'CUSTOMS' || item.entityType === 'DOCUMENT' || item.entityType === 'CONTAINER';
      }
      if (activeCategory === 'FINANCIAL') {
        return item.entityType === 'FINANCIAL' || item.entityType === 'EXPENSE';
      }
      if (activeCategory === 'NOTE') {
        return item.isNote;
      }
      return true;
    });
  }, [activities, activeCategory, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{t('shipment.activity.title', 'Nhật ký & Lịch sử Thay đổi')}</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {activities.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ghi vết tự động mọi chỉnh sửa dữ liệu, mốc vận chuyển, chứng từ và tài chính.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNoteForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{t('shipment.activity.addNote', 'Thêm ghi chú')}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'STATUS', label: 'Trạng thái & Lô' },
            { id: 'MILESTONE', label: '5 Mốc lộ trình' },
            { id: 'CUSTOMS_DOC', label: 'Hải quan & Chứng từ' },
            { id: 'FINANCIAL', label: 'Tài chính' },
            { id: 'NOTE', label: 'Ghi chú' },
          ].map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung nhật ký..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Add Note Form */}
      {showNoteForm && (
        <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquare size={14} className="text-teal-600 dark:text-teal-400" />
              <span>{t('shipment.activity.newNote', 'Tạo ghi chú nội bộ')}</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowNoteForm(false)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              placeholder={t('shipment.activity.notePlaceholder', 'Viết cập nhật, ghi chú nội bộ hoặc lưu ý đặc biệt cho lô hàng này...')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none shadow-2xs placeholder:text-slate-400"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {t('shipment.activity.cancel', 'Hủy')}
              </button>
              <button
                type="submit"
                disabled={submitting || !noteText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Send size={12} />
                <span>{t('shipment.activity.postNote', 'Lưu ghi chú')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải nhật ký hoạt động...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
            <Activity size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Không tìm thấy nhật ký phù hợp</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Thử thay đổi bộ lọc hoặc nhập nội dung tìm kiếm khác.
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredActivities.map((item, index) => (
              <div key={item.id} className="flex gap-4 py-3.5 first:pt-1 last:pb-1 group">
                {/* Icon + vertical line */}
                <div className="flex flex-col items-center">
                  <TimelineDot icon={item.icon} bg={item.iconBg} />
                  {index < filteredActivities.length - 1 && (
                    <div className="w-0.5 bg-slate-100 dark:bg-slate-800 flex-1 mt-2 min-h-[20px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isNote && (
                        <span className="px-1.5 py-0.2 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                          Ghi chú
                        </span>
                      )}
                      <p className={`text-xs font-semibold ${item.isNote ? 'text-teal-900 dark:text-teal-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-mono">
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Old vs New Value Diff Badge */}
                  {(item.oldValue || item.newValue) && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-mono my-1 text-slate-700 dark:text-slate-300">
                      {item.oldValue && (
                        <span className="text-slate-500 line-through opacity-80">
                          {item.oldValue}
                        </span>
                      )}
                      {item.oldValue && item.newValue && (
                        <ArrowRight size={11} className="text-blue-500 shrink-0" />
                      )}
                      {item.newValue && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {item.newValue}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Author / Timestamp */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400">{item.user}</span>
                    <span>•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                      {item.entityType || 'SHIPMENT'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
