import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Tag,
  Receipt,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Button,
  ExportButton,
  Badge,
  BadgeVariant,
  SearchInput,
  SegmentedControl,
  Card,
  Modal,
  Input,
  Dropdown,
} from '@/ui/components/common';
import {
  ChargeItem,
  ChargeCategory,
  ChargeType,
  ChargeUnit,
  CHARGE_CATEGORIES,
  CHARGE_UNITS,
  getCharges,
  saveCharge,
  deleteCharge,
  resetCharges,
} from './charge_service';

export const ChargeList: React.FC = () => {
  const [charges, setCharges] = useState<ChargeItem[]>(() => getCharges());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ChargeItem> | null>(null);

  const refresh = () => {
    setCharges(getCharges());
  };

  const handleOpenAdd = () => {
    setEditingItem({
      code: '',
      nameVi: '',
      nameEn: '',
      category: 'LOCAL_CHARGE',
      type: 'BOTH',
      unit: 'CONT',
      defaultVat: 8,
      defaultCurrency: 'VND',
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ChargeItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa biểu phí "${code}" không?`)) {
      deleteCharge(id);
      refresh();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Khôi phục danh mục biểu phí logistics mặc định chuẩn?')) {
      resetCharges();
      refresh();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.code || !editingItem?.nameVi) {
      alert('Vui lòng nhập Mã phí và Tên phí!');
      return;
    }

    saveCharge(editingItem as Partial<ChargeItem> & { code: string; nameVi: string });
    setIsModalOpen(false);
    setEditingItem(null);
    refresh();
  };

  const handleExportCsv = () => {
    const headers = ['Mã phí', 'Tên khoản phí', 'Tên tiếng Anh', 'Phân nhóm', 'Tính chất', 'Đơn vị', 'Thuế VAT', 'Tiền tệ', 'Trạng thái'];
    const rows = filteredCharges.map(c => [
      `"${c.code}"`,
      `"${c.nameVi}"`,
      `"${c.nameEn || ''}"`,
      c.category,
      c.type,
      c.unit,
      `${c.defaultVat}%`,
      c.defaultCurrency,
      c.isActive ? 'Đang dùng' : 'Ngưng'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `logiflow_charges_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI stats
  const stats = useMemo(() => {
    const total = charges.length;
    const freightCount = charges.filter((c) => c.category === 'FREIGHT').length;
    const localChargeCount = charges.filter((c) => c.category === 'LOCAL_CHARGE').length;
    const activeCount = charges.filter((c) => c.isActive).length;

    return { total, freightCount, localChargeCount, activeCount };
  }, [charges]);

  // Filtered charges
  const filteredCharges = useMemo(() => {
    return charges.filter((c) => {
      const matchSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.nameVi.toLowerCase().includes(search.toLowerCase()) ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [charges, search, categoryFilter]);

  const categoryBadgeVariant = (cat: ChargeCategory): BadgeVariant => {
    switch (cat) {
      case 'FREIGHT':
        return 'info';
      case 'LOCAL_CHARGE':
        return 'purple';
      case 'CUSTOMS':
        return 'success';
      case 'TRUCKING':
        return 'warning';
      case 'WAREHOUSE':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const typeBadge = (type: ChargeType) => {
    switch (type) {
      case 'RECEIVABLE':
        return <Badge variant="success">Phải thu (AR)</Badge>;
      case 'PAYABLE':
        return <Badge variant="warning">Phải trả (AP)</Badge>;
      case 'BOTH':
        return <Badge variant="info">Thu & Trả (AR/AP)</Badge>;
    }
  };

  const categoryTabs = [
    { id: 'ALL', label: 'Tất cả' },
    ...CHARGE_CATEGORIES.map((c) => ({ id: c.id, label: c.labelVi.split(' (')[0] })),
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Danh mục Biểu phí Logistics (Charges & Fees)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý mã cước biển, cước hàng không, phụ phí local charges, hải quan và vận chuyển nội địa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetDefaults}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Mặc định chuẩn
            </Button>

            <ExportButton onExport={handleExportCsv} />

            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm khoản phí mới
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tổng số biểu phí</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cước quốc tế (Freight)</div>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">{stats.freightCount}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Phụ phí cảng (Local Charges)</div>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.localChargeCount}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Đang áp dụng</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.activeCount}</div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã O/F, THC, tên khoản phí..."
            />
          </div>

          <div className="overflow-x-auto pb-1 md:pb-0">
            <SegmentedControl
              options={categoryTabs}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Mã phí</th>
                <th className="py-3 px-4">Tên khoản phí</th>
                <th className="py-3 px-4">Phân nhóm</th>
                <th className="py-3 px-4">Tính chất</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4">Thuế & Tiền tệ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Không tìm thấy khoản biểu phí nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredCharges.map((item) => {
                  const catMeta = CHARGE_CATEGORIES.find((c) => c.id === item.category);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.nameVi}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item.nameEn}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs truncate" title={item.description}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={categoryBadgeVariant(item.category)}>
                          {catMeta?.labelVi.split(' (')[0] || item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{typeBadge(item.type)}</td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{item.unit}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{item.defaultCurrency}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">VAT: {item.defaultVat}%</div>
                      </td>
                      <td className="py-3 px-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sử dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Ngưng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.code)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem?.id ? `Chỉnh sửa biểu phí: ${editingItem.code}` : 'Thêm khoản biểu phí logistics'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mã khoản phí <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingItem?.code || ''}
                onChange={(e) => setEditingItem((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="VD: O/F, THC, D/O, TRUCK..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Đơn vị tính chuẩn
              </label>
              <Dropdown
                options={CHARGE_UNITS.map((u) => ({ value: u, label: u }))}
                value={editingItem?.unit || 'CONT'}
                onChange={(val) => setEditingItem((prev) => ({ ...prev, unit: val as ChargeUnit }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên phí (Tiếng Việt) <span className="text-red-500">*</span>
            </label>
            <Input
              value={editingItem?.nameVi || ''}
              onChange={(e) => setEditingItem((prev) => ({ ...prev, nameVi: e.target.value }))}
              placeholder="VD: Phí xếp dỡ tại cảng (Terminal Handling)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên tiếng Anh (In ấn hóa đơn / Debit Note)
            </label>
            <Input
              value={editingItem?.nameEn || ''}
              onChange={(e) => setEditingItem((prev) => ({ ...prev, nameEn: e.target.value }))}
              placeholder="VD: Terminal Handling Charge"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Phân nhóm phí
              </label>
              <Dropdown
                options={CHARGE_CATEGORIES.map((c) => ({ value: c.id, label: c.labelVi }))}
                value={editingItem?.category || 'LOCAL_CHARGE'}
                onChange={(val) => setEditingItem((prev) => ({ ...prev, category: val as ChargeCategory }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tính chất hạch toán
              </label>
              <Dropdown
                options={[
                  { value: 'BOTH', label: 'Cả Thu & Trả (AR / AP)' },
                  { value: 'RECEIVABLE', label: 'Chỉ Phải Thu (AR - Khách hàng)' },
                  { value: 'PAYABLE', label: 'Chỉ Phải Trả (AP - Nhà cung cấp)' },
                ]}
                value={editingItem?.type || 'BOTH'}
                onChange={(val) => setEditingItem((prev) => ({ ...prev, type: val as ChargeType }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiền tệ mặc định
              </label>
              <Dropdown
                options={[
                  { value: 'VND', label: 'VND (Đồng)' },
                  { value: 'USD', label: 'USD (Đô la Mỹ)' },
                ]}
                value={editingItem?.defaultCurrency || 'VND'}
                onChange={(val) => setEditingItem((prev) => ({ ...prev, defaultCurrency: val as 'USD' | 'VND' }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thuế suất VAT mặc định (%)
              </label>
              <Dropdown
                options={[
                  { value: '0', label: '0% (Cước quốc tế O/F, A/F)' },
                  { value: '5', label: '5%' },
                  { value: '8', label: '8% (Chính sách ưu đãi)' },
                  { value: '10', label: '10% (Chuẩn)' },
                ]}
                value={String(editingItem?.defaultVat ?? 8)}
                onChange={(val) => setEditingItem((prev) => ({ ...prev, defaultVat: Number(val) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú / Quy định tính phí</label>
            <Input
              value={editingItem?.description || ''}
              onChange={(e) => setEditingItem((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="VD: Áp dụng cho hàng nhập FCL hạ bãi..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={editingItem?.isActive ?? true}
              onChange={(e) => setEditingItem((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-sm text-slate-700 font-medium cursor-pointer">
              Đang kích hoạt và cho phép áp dụng trên Báo giá / Vận đơn / Chi phí
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              {editingItem?.id ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  );
};
export default ChargeList;
