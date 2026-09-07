import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, X, Check, Receipt,
  ArrowUpRight, ArrowDownLeft, AlertCircle,
  Trash2, Edit3
} from 'lucide-react';
import { InvoiceService, VATInvoice, InvoiceType, InvoiceStatus } from './invoice_service.js';
import {
  Button,
  ExportButton,
  Badge,
  SearchInput,
  SegmentedControl,
} from '../../components/common/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Bản nháp', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  ISSUED: { label: 'Đã phát hành', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 border-red-300' },
};

const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

// ─── Blank Form ───────────────────────────────────────────────────────────────
const blankForm = (type: InvoiceType): Partial<VATInvoice> => ({
  type,
  date: new Date().toISOString().slice(0, 10),
  partnerName: '',
  partnerTaxCode: '',
  trackingNumber: '',
  subtotal: 0,
  vatRate: 10,
  vatAmount: 0,
  total: 0,
  status: 'DRAFT',
  description: '',
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function InvoiceModal({
  invoice,
  type,
  onClose,
  onSaved,
}: {
  invoice: VATInvoice | null;
  type: InvoiceType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!invoice;
  const [form, setForm] = useState<Partial<VATInvoice>>(
    isEdit ? { ...invoice } : {
      ...blankForm(type),
      invoiceNumber: InvoiceService.nextInvoiceNumber(type),
    }
  );

  const set = (k: keyof VATInvoice, v: any) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      // Auto-calculate VAT and total when subtotal or vatRate changes
      if (k === 'subtotal' || k === 'vatRate') {
        const sub = k === 'subtotal' ? Number(v) : Number(prev.subtotal || 0);
        const rate = k === 'vatRate' ? Number(v) : Number(prev.vatRate || 0);
        const vatAmt = Math.round(sub * rate / 100);
        next.vatAmount = vatAmt;
        next.total = sub + vatAmt;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form.partnerName?.trim()) { alert('Vui lòng nhập tên đối tác.'); return; }
    if (!form.date) { alert('Vui lòng chọn ngày hóa đơn.'); return; }
    if (!form.subtotal || Number(form.subtotal) <= 0) { alert('Vui lòng nhập số tiền hợp lệ.'); return; }

    const now = new Date().toISOString();
    const saved: VATInvoice = {
      id: invoice?.id || `INV-${Date.now()}`,
      invoiceNumber: form.invoiceNumber || InvoiceService.nextInvoiceNumber(type),
      type: form.type || type,
      date: form.date || now.slice(0, 10),
      partnerName: form.partnerName!,
      partnerTaxCode: form.partnerTaxCode,
      shipmentId: form.shipmentId,
      trackingNumber: form.trackingNumber,
      subtotal: Number(form.subtotal || 0),
      vatRate: Number(form.vatRate || 10),
      vatAmount: Number(form.vatAmount || 0),
      total: Number(form.total || 0),
      status: form.status || 'DRAFT',
      description: form.description,
      createdAt: invoice?.createdAt || now,
    };
    InvoiceService.save(saved);
    onSaved();
    onClose();
  };

  const typeLabel = type === 'OUT' ? 'Hóa đơn Đầu ra (Bán hàng)' : 'Hóa đơn Đầu vào (Mua hàng)';
  const partnerLabel = type === 'OUT' ? 'Tên khách hàng *' : 'Tên nhà cung cấp *';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Receipt size={18} className={type === 'OUT' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'} />
            <span className="font-bold text-slate-900 dark:text-white text-sm">{isEdit ? 'Chỉnh sửa' : 'Thêm mới'} — {typeLabel}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-auto px-6 py-4 space-y-4 custom-scrollbar">
          {/* Row: Số HĐ + Ngày */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Số hóa đơn</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                value={form.invoiceNumber || ''}
                onChange={e => set('invoiceNumber', e.target.value)}
                placeholder="0000001"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Ngày hóa đơn *</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                value={form.date || ''}
                onChange={e => set('date', e.target.value)}
              />
            </div>
          </div>

          {/* Partner */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">{partnerLabel}</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
              value={form.partnerName || ''}
              onChange={e => set('partnerName', e.target.value)}
              placeholder={type === 'OUT' ? 'Công ty TNHH ABC...' : 'Hãng tàu / Cảng vụ...'}
            />
          </div>

          {/* Row: MST + Mã lô */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">MST đối tác</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                value={form.partnerTaxCode || ''}
                onChange={e => set('partnerTaxCode', e.target.value)}
                placeholder="0123456789"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Mã lô hàng</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                value={form.trackingNumber || ''}
                onChange={e => set('trackingNumber', e.target.value)}
                placeholder="LG-2025-001"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Nội dung / Diễn giải</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder={type === 'OUT' ? 'Dịch vụ vận chuyển lô hàng...' : 'Phí dịch vụ hãng tàu, phí cảng...'}
            />
          </div>

          {/* Row: Tiền + VAT rate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Tiền trước thuế *</label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                value={form.subtotal || 0}
                onChange={e => set('subtotal', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Thuế suất VAT</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={form.vatRate || 10}
                onChange={e => set('vatRate', Number(e.target.value))}
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Tiền VAT</label>
              <input
                type="number"
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-mono text-slate-600 dark:text-slate-400"
                value={form.vatAmount || 0}
              />
            </div>
          </div>

          {/* Total + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Tổng tiền (đã VAT)</label>
              <input
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 text-xs font-mono font-bold text-blue-800 dark:text-blue-300"
                value={fmtVND(form.total || 0)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={form.status || 'DRAFT'}
                onChange={e => set('status', e.target.value as InvoiceStatus)}
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="ISSUED">Đã phát hành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm ${type === 'OUT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            <Check size={14} />
            {isEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<VATInvoice[]>([]);
  const [subTab, setSubTab] = useState<InvoiceType>('OUT');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [filterMonthOnly, setFilterMonthOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<VATInvoice | null>(null);

  const load = () => setInvoices(InvoiceService.getAll());

  useEffect(() => { load(); }, []);

  // Monthly VAT summary (current month)
  const vatSummary = useMemo(() => InvoiceService.getMonthlyVATSummary(selectedMonth), [invoices, selectedMonth]);

  // Filtered list
  const filtered = useMemo(() => {
    return invoices
      .filter(i => i.type === subTab)
      .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
      .filter(i => !filterMonthOnly || !selectedMonth || i.date.startsWith(selectedMonth))
      .filter(i => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.partnerName.toLowerCase().includes(q) ||
          (i.trackingNumber || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q)
        );
      });
  }, [invoices, subTab, statusFilter, search, filterMonthOnly, selectedMonth]);

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa hóa đơn này không?')) return;
    InvoiceService.delete(id);
    load();
  };

  const handleOpenAdd = () => { setEditInvoice(null); setModalOpen(true); };
  const handleOpenEdit = (inv: VATInvoice) => { setEditInvoice(inv); setModalOpen(true); };

  const handleExportCsv = () => {
    const rows = filtered.map(i => [
      i.invoiceNumber, i.date, i.partnerName, i.partnerTaxCode || '',
      i.trackingNumber || '', i.description || '',
      i.subtotal, `${i.vatRate}%`, i.vatAmount, i.total,
      STATUS_CONFIG[i.status].label
    ]);
    const headers = ['Số HĐ', 'Ngày', 'Đối tác', 'MST', 'Mã lô', 'Nội dung', 'Trước thuế', 'Thuế suất', 'Tiền VAT', 'Tổng tiền', 'Trạng thái'];
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `HoaDon_${subTab}_${selectedMonth}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* ── VAT Monthly Summary ─────────────────────────────────────────── */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Tóm tắt Thuế VAT tháng</h2>
          </div>
          <input
            type="month"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/30 outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-center">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">VAT Đầu ra (Bán)</div>
            <div className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{fmtVND(vatSummary.vatOut)}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Thuế thu từ khách hàng</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 text-center">
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">VAT Đầu vào (Mua)</div>
            <div className="text-xl font-black text-blue-800 dark:text-blue-300 font-mono">{fmtVND(vatSummary.vatIn)}</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Thuế được khấu trừ đầu vào</div>
          </div>
          <div className={`p-4 rounded-xl border text-center ${vatSummary.vatPayable >= 0 ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800/60' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${vatSummary.vatPayable >= 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {vatSummary.vatPayable >= 0 ? 'VAT Phải nộp' : 'VAT Được hoàn'}
            </div>
            <div className={`text-xl font-black font-mono ${vatSummary.vatPayable > 0 ? 'text-rose-700 dark:text-rose-400' : vatSummary.vatPayable < 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{fmtVND(Math.abs(vatSummary.vatPayable))}</div>
            <div className={`text-[10px] mt-0.5 ${vatSummary.vatPayable >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {vatSummary.vatPayable >= 0 ? 'Đầu ra − Đầu vào' : 'Đầu vào > Đầu ra → được hoàn'}
            </div>
          </div>
        </div>
        {vatSummary.vatPayable > 0 && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Tháng <strong>{selectedMonth}</strong> có <strong>{fmtVND(vatSummary.vatPayable)}</strong> VAT phải nộp cho cơ quan thuế.</span>
          </div>
        )}
      </div>

      {/* ── Invoice List ──────────────────────────────────────────────────── */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex items-center gap-0 border-b border-slate-100 dark:border-slate-800">
          {([['OUT', 'Hóa đơn Đầu ra (Bán)', 'ArrowUpRight'], ['IN', 'Hóa đơn Đầu vào (Mua)', 'ArrowDownLeft']] as const).map(([key, label]) => {
            const isActive = subTab === key;
            const Icon = key === 'OUT' ? ArrowUpRight : ArrowDownLeft;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSubTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? key === 'OUT' ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400' : 'border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                {label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {invoices.filter(i => i.type === key).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm số HĐ, đối tác, mã lô..."
              maxWidth="max-w-sm"
            />

            <SegmentedControl
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'DRAFT', label: 'Bản nháp' },
                { id: 'ISSUED', label: 'Đã phát hành', activeClass: 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold' },
                { id: 'CANCELLED', label: 'Đã hủy', activeClass: 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-2xs font-bold' },
              ]}
            />

            <Button
              variant={filterMonthOnly ? 'primary' : 'secondary'}
              onClick={() => setFilterMonthOnly(v => !v)}
              title="Lọc hóa đơn theo tháng đã chọn ở phần tóm tắt"
            >
              {filterMonthOnly ? `Tháng ${selectedMonth}` : 'Tất cả thời gian'}
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <ExportButton onExport={handleExportCsv} />
            <Button
              variant={subTab === 'OUT' ? 'primary' : 'danger'}
              icon={<Plus size={15} />}
              onClick={handleOpenAdd}
            >
              Thêm hóa đơn
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="px-4 py-3">Số HĐ</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">{subTab === 'OUT' ? 'Khách hàng' : 'Nhà cung cấp'}</th>
                <th className="px-4 py-3">MST</th>
                <th className="px-4 py-3">Mã lô</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3 text-right">Trước thuế</th>
                <th className="px-4 py-3 text-right">VAT</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate">{inv.partnerName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{inv.partnerTaxCode || '—'}</td>
                  <td className="px-4 py-3 font-mono text-blue-700 dark:text-blue-400">{inv.trackingNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{inv.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{fmtVND(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-700 dark:text-amber-400">{fmtVND(inv.vatAmount)} ({inv.vatRate}%)</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{fmtVND(inv.total)}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'ISSUED' && <Badge variant="success" dot size="sm">Đã phát hành</Badge>}
                    {inv.status === 'DRAFT' && <Badge variant="neutral" dot size="sm">Bản nháp</Badge>}
                    {inv.status === 'CANCELLED' && <Badge variant="danger" dot size="sm">Đã hủy</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => handleOpenEdit(inv)} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Edit3 size={13} />
                      </button>
                      <button type="button" onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 dark:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={24} className="text-slate-300 dark:text-slate-600" />
                      <span>Chưa có hóa đơn nào. Nhấn <strong>Thêm hóa đơn</strong> để bắt đầu.</span>
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
        <InvoiceModal
          invoice={editInvoice}
          type={subTab}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
 
