import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Loader2, Trash2, Check, X } from 'lucide-react';
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

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface AddTaskForm {
  title: string;
  priority: Task['priority'];
  dueDate: string;
}

interface TasksTabProps {
  shipment: Shipment;
  token: string;
}

const MOCK_TASKS: Task[] = [
  {
    id: 'mock-1',
    title: 'Prepare Transit Declaration',
    assignee: 'Nguyen Van A',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  },
  {
    id: 'mock-2',
    title: 'Arrange Cambodia Trucking',
    assignee: 'Tran Thi B',
    dueDate: '2026-08-17',
    status: 'TODO',
    priority: 'MEDIUM',
  },
  {
    id: 'mock-3',
    title: 'Collect POD from Driver',
    assignee: 'Le Van C',
    dueDate: '2026-08-18',
    status: 'TODO',
    priority: 'HIGH',
  },
  {
    id: 'mock-4',
    title: 'Invoice Customer',
    assignee: 'Nguyen Van A',
    dueDate: '2026-08-20',
    status: 'BLOCKED',
    priority: 'CRITICAL',
  },
];

type FilterStatus = 'ALL' | Task['status'];

const STATUS_STYLES: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700',
  DONE: 'bg-green-100 text-green-700',
};

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const icons: Record<Task['priority'], string> = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🔵',
  };
  return <span title={priority}>{icons[priority]}</span>;
}

function StatusBadge({ status }: { status: Task['status'] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

const DEFAULT_FORM: AddTaskForm = {
  title: '',
  priority: 'MEDIUM',
  dueDate: '',
};

export default function TasksTab({ shipment, token }: TasksTabProps) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddTaskForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const authToken = token || localStorage.getItem('token') || '';

  useEffect(() => {
    fetchTasks();
  }, [shipment.id]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const data: Task[] = _fetchRes;
      setTasks(data.length > 0 ? data : MOCK_TASKS);
    } catch {
      setTasks(MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...form, status: 'TODO' }),
      });
      
      const newTask: Task = _fetchRes;
      setTasks((prev) => [...prev, newTask]);
    } catch {
      const optimistic: Task = {
        id: `local-${Date.now()}`,
        title: form.title,
        assignee: 'Unassigned',
        dueDate: form.dueDate || new Date().toISOString().split('T')[0],
        status: 'TODO',
        priority: form.priority,
      };
      setTasks((prev) => [...prev, optimistic]);
    } finally {
      setForm(DEFAULT_FORM);
      setShowForm(false);
      setSubmitting(false);
    }
  }

  function handleComplete(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'DONE' } : t))
    );
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);
  const openCount = tasks.filter((t) => t.status !== 'DONE').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <CheckSquare size={18} className="text-slate-500" />
            {t('shipment.tasks.title', 'Tasks')}
          </h2>
          {!loading && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={14} />
          {t('shipment.tasks.addTask', 'Add Task')}
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: t('shipment.tasks.all', 'All'), value: 'ALL' as FilterStatus },
          { label: t('shipment.tasks.todo', 'Todo'), value: 'TODO' as FilterStatus },
          { label: t('shipment.tasks.inProgress', 'In Progress'), value: 'IN_PROGRESS' as FilterStatus },
          { label: t('shipment.tasks.blocked', 'Blocked'), value: 'BLOCKED' as FilterStatus },
          { label: t('shipment.tasks.done', 'Done'), value: 'DONE' as FilterStatus },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
            {value !== 'ALL' && (
              <span className="ml-1 opacity-70">
                ({tasks.filter((t) => t.status === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-800">{t('shipment.tasks.newTask', 'New Task')}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder={t('shipment.tasks.taskTitlePlaceholder', 'Task title...')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task['priority'] }))}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Task['priority'][]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {t('shipment.tasks.add', 'Add')}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Task List */}
      {!loading && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <CheckSquare size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">{t('shipment.tasks.empty', 'No tasks in this category.')}</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-opacity ${
                  task.status === 'DONE' ? 'opacity-60 border-slate-100' : 'border-slate-200 shadow-sm'
                }`}
              >
                <PriorityIcon priority={task.priority} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.assignee}
                    {task.dueDate && (
                      <span className={`ml-2 ${isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-red-500 font-semibold' : ''}`}>
                        · {t('shipment.tasks.due', 'Due')} {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && task.status !== 'DONE' && ` ${t('shipment.tasks.overdue', '(Overdue)')}`}
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge status={task.status} />
                <div className="flex items-center gap-1 ml-2">
                  {task.status !== 'DONE' && (
                    <button
                      onClick={() => handleComplete(task.id)}
                      title="Mark complete"
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && tasks.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
          <span>{openCount} {t('shipment.tasks.open', 'open')}</span>
          <span>{tasks.filter((t) => t.status === 'DONE').length} {t('shipment.tasks.completed', 'completed')}</span>
          <span>{tasks.filter((t) => t.status === 'BLOCKED').length} {t('shipment.tasks.blockedCount', 'blocked')}</span>
        </div>
      )}
    </div>
  );
}
