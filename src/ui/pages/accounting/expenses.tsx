import { useState, useEffect, useMemo } from 'react';
import {
  Layers, Plus, X, Check, Trash2, Edit3,
  Clock, CheckCircle2, AlertTriangle, PiggyBank
} from 'lucide-react';
import {
  ExpenseService, OperatingExpense, ExpenseCategory, ExpenseStatus,
  CATEGORY_LABELS, CATEGORY_COLORS
} from './expense_service.js';
import {
  Button,
  ExportButton,
  Badge,
  SearchInput,
  SegmentedControl,
  CurrencyInput,
} from '../../components/common/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B ₫`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
  return fmtVND(n);
};

const CATEGORIES: ExpenseCategory[] = ['SALARY', 'OFFICE', 'UTILITIES', 'MARKETING', 'TRANSPORT', 'OTHER'];
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

// ─── Modal ─────────────────────────────────────────────────────────────────
function ExpenseModal({
  expense,
  onClose,
  onSaved,
}: {
  expense: OperatingExpense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState<Partial<OperatingExpense>>(
    isEdit
      ? { ...expense }
      : {
          date: new Date().toISOString().slice(0, 10),
          category: 'SALARY',
          description: '',
          amount: 0,
          paidBy: '',
          status: 'PENDING',
          notes: '',
        }
  );

  const set = (k: keyof OperatingExpense, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.description?.trim()) { alert('Vui lòng nhập nội dung chi phí.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { alert('Vui lòng nhập số tiền hợp lệ.'); return; }
    if (!form.date) { alert('Vui lòng chọn ngày.'); return; }

    const now = new Date().toISOString();
    const saved: OperatingExpense = {
      id: expense?.id || `EXP-${Date.now()}`,
      date: form.date!,
      category: form.category as ExpenseCategory || 'OTHER',
      description: form.description!,
      amount: Number(form.amount),
      paidBy: form.paidBy,
      status: form.status as ExpenseStatus || 'PENDING',
      notes: form.notes,
      createdAt: expense?.createdAt || now,
    };
    ExpenseService.save(saved);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-purple-600" />
            <span className="font-bold text-slate-900 text-sm">{isEdit ? 'Chỉnh sửa' : 'Thêm'} Chi phí Hoạt động</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Row: Ngày + Loại */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Ngày phát sinh *</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none"
                value={form.date || ''}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Loại chi phí</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none bg-white"
                value={form.category || 'OTHER'}
                onChange={e => set('category', e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Nội dung *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none"
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Lương tháng 9, Tiền điện VP, Chi phí in ấn..."
            />
          </div>

          {/* Row: Số tiền + Người chi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CurrencyInput
                label="Số tiền *"
                value={form.amount || 0}
                onChange={val => set('amount', val)}
                placeholder="0 ₫"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Người / Bộ phận chi</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none"
                value={form.paidBy || ''}
                onChange={e => set('paidBy', e.target.value)}
                placeholder="Kế toán, Giám đốc..."
              />
            </div>
          </div>

          {/* Status + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none bg-white"
                value={form.status || 'PENDING'}
                onChange={e => set('status', e.target.value as ExpenseStatus)}
              >
                <option value="PENDING">Chờ thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Ghi chú</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none"
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleSave} icon={<Check size={14} />}>
            {isEdit ? 'Lưu thay đổi' : 'Thêm chi phí'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<OperatingExpense | null>(null);

  const load = () => setExpenses(ExpenseService.getAll());
  useEffect(() => { load(); }, []);

  // Monthly summary
  const summary = useMemo(() => ExpenseService.getMonthlySummary(selectedMonth), [expenses, selectedMonth]);

  // Previous month summary for comparison
  const prevMonth = useMemo(() => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, [selectedMonth]);
  const prevSummary = useMemo(() => ExpenseService.getMonthlySummary(prevMonth), [expenses, prevMonth]);

  const vsLastMonth = summary.total - prevSummary.total;
  const vsLastMonthPct = prevSummary.total > 0 ? Math.round((vsLastMonth / prevSummary.total) * 100) : 0;

  // Filtered rows
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (selectedMonth && !e.date.startsWith(selectedMonth)) {
        return false;
      }
      const q = search.toLowerCase().trim();
      const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.paidBy || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [expenses, search, categoryFilter, statusFilter, selectedMonth]);

  const handleDelete = (id: string) => {
    if (!confirm('Xóa chi phí này?')) return;
    ExpenseService.delete(id);
    load();
  };

  const handleExportCsv = () => {
    const headers = ['Ngày', 'Loại', 'Nội dung', 'Số tiền', 'Người chi', 'Trạng thái', 'Ghi chú'];
    const rows = filtered.map(e => [e.date, CATEGORY_LABELS[e.category], `"${e.description}"`, e.amount, e.paidBy || '', e.status === 'PAID' ? 'Đã TT' : 'Chờ TT', e.notes || '']);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `ChiPhi_HoatDong_${selectedMonth}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          <h2 className="text-sm font-bold text-slate-800">Chi phí Hoạt động Doanh nghiệp</h2>
        </div>
        <input
          type="month"
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/30 outline-none"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tổng chi tháng</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <PiggyBank size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-800 font-mono">{fmtCompact(summary.total)}</div>
          <div className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${vsLastMonth > 0 ? 'text-red-600' : vsLastMonth < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {vsLastMonth > 0 ? '▲' : vsLastMonth < 0 ? '▼' : ''}
            {Math.abs(vsLastMonthPct)}% so với tháng trước
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Đã thanh toán</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">{fmtCompact(summary.paid)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0}% tổng chi tháng
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Chờ thanh toán</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">{fmtCompact(summary.pending)}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Cần xử lý thanh toán</div>
        </div>

        {/* Largest category */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Chi phí lớn nhất</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle size={16} />
            </div>
          </div>
          {Object.keys(summary.byCategory).length > 0 ? (() => {
            const top = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0];
            return (
              <>
                <div className="text-sm font-black text-rose-800">{CATEGORY_LABELS[top[0] as ExpenseCategory]}</div>
                <div className="text-[11px] text-rose-600 font-mono font-bold mt-0.5">{fmtCompact(top[1])}</div>
              </>
            );
          })() : <div className="text-xs text-slate-400 italic mt-1">Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* ── Category Breakdown ───────────────────────────────────────────── */}
      {Object.keys(summary.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Phân bổ theo Loại chi phí — {selectedMonth}</h3>
          <div className="space-y-2.5">
            {CATEGORIES.map(cat => {
              const amt = summary.byCategory[cat] || 0;
              const pct = summary.total > 0 ? (amt / summary.total) * 100 : 0;
              if (amt === 0) return null;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border w-36 text-center shrink-0 ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 w-28 text-right shrink-0">{fmtCompact(amt)}</span>
                  <span className="text-[11px] text-slate-400 w-10 text-right shrink-0">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expense Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm nội dung, người chi..."
              maxWidth="max-w-xs"
            />

            {/* Category filter */}
            <select
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none bg-white font-medium"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as ExpenseCategory | 'ALL')}
            >
              <option value="ALL">Tất cả loại chi phí</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>

            {/* Status pills in segmented container */}
            <SegmentedControl
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PENDING', label: 'Chờ thanh toán', activeClass: 'bg-white text-amber-700 shadow-2xs font-bold' },
                { id: 'PAID', label: 'Đã thanh toán', activeClass: 'bg-white text-emerald-700 shadow-2xs font-bold' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <ExportButton onExport={handleExportCsv} />
            <Button
              variant="danger"
              icon={<Plus size={15} />}
              onClick={() => { setEditExpense(null); setModalOpen(true); }}
            >
              Thêm chi phí
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Người chi</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-mono">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[e.category]}`}>
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{e.description}</td>
                  <td className="px-4 py-3 text-slate-500">{e.paidBy || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmtVND(e.amount)}</td>
                  <td className="px-4 py-3">
                    {e.status === 'PAID' ? (
                      <Badge variant="success" dot size="sm">Đã TT</Badge>
                    ) : (
                      <Badge variant="warning" dot size="sm">Chờ TT</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px] max-w-[120px] truncate">{e.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { setEditExpense(e); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-600">
                        <Edit3 size={13} />
                      </button>
                      <button type="button" onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs italic">
                    <div className="flex flex-col items-center gap-2">
                      <Layers size={24} className="text-slate-300" />
                      <span>Chưa có chi phí nào. Nhấn <strong>Thêm chi phí</strong> để bắt đầu ghi nhận.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

