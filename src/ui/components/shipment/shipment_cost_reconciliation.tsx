import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  Eye, 
  Download, 
  ShieldCheck,
  Save,
  FileCheck
} from 'lucide-react';
import { 
  FinancialCostItem, 
  saveShipmentCostsToStorage,
  loadMilestonesFromStorage,
  syncMilestonesToFinancialStorage
} from './transit_types.js';

interface ShipmentCostReconciliationProps {
  shipmentId: string;
}

export default function ShipmentCostReconciliation({ shipmentId }: ShipmentCostReconciliationProps) {
  const [costs, setCosts] = useState<FinancialCostItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [previewUNC, setPreviewUNC] = useState<{ url: string; name: string } | null>(null);

  // New ad-hoc fee form state
  const [newFee, setNewFee] = useState<{
    milestoneLabel: string;
    feeName: string;
    amount: number | '';
    requestDate: string;
    notes: string;
  }>({
    milestoneLabel: 'Phụ phí phát sinh',
    feeName: '',
    amount: '',
    requestDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadData = () => {
    const milestones = loadMilestonesFromStorage(shipmentId);
    const synced = syncMilestonesToFinancialStorage(shipmentId, milestones);
    setCosts(synced);
  };

  useEffect(() => {
    loadData();
  }, [shipmentId]);

  const updateCostItem = (id: string, fields: Partial<FinancialCostItem>) => {
    setCosts(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...fields } : item);
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });
  };

  const handleStatusChange = (id: string, status: FinancialCostItem['status']) => {
    updateCostItem(id, { status });
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local blob URL for preview
    const fileUrl = URL.createObjectURL(file);
    updateCostItem(id, {
      uncAttachmentUrl: fileUrl,
      uncFileName: file.name,
      uncUploadDate: new Date().toISOString().slice(0, 10),
      status: 'PAID', // Auto-set to PAID once payment proof is uploaded
    });
  };

  const handleRemoveItem = (id: string) => {
    setCosts(prev => {
      const next = prev.filter(item => item.id !== id);
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });
  };

  const handleAddNewFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.feeName.trim() || !newFee.amount || Number(newFee.amount) <= 0) return;

    const newItem: FinancialCostItem = {
      id: `${shipmentId}_extra_${Date.now()}`,
      shipmentId,
      milestoneKey: 'extra',
      milestoneLabel: newFee.milestoneLabel,
      feeName: newFee.feeName.trim(),
      amount: Number(newFee.amount),
      requestDate: newFee.requestDate || new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      isMandatoryFee: false,
      notes: newFee.notes,
    };

    setCosts(prev => {
      const next = [...prev, newItem];
      saveShipmentCostsToStorage(shipmentId, next);
      return next;
    });

    setShowAddModal(false);
    setNewFee({
      milestoneLabel: 'Phụ phí phát sinh',
      feeName: '',
      amount: '',
      requestDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  };

  // Financial calculations
  const mandatoryTotal = useMemo(() => {
    return costs.filter(c => c.isMandatoryFee).reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const extraTotal = useMemo(() => {
    return costs.filter(c => !c.isMandatoryFee).reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const grandTotal = mandatoryTotal + extraTotal;

  const paidTotal = useMemo(() => {
    return costs.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const pendingTotal = useMemo(() => {
    return costs.filter(c => c.status === 'PENDING' || c.status === 'APPROVED').reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costs]);

  const formatVND = (val: number) => {
    return `${(val || 0).toLocaleString('vi-VN')} ₫`;
  };

  const getStatusBadge = (status: FinancialCostItem['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={12} /> Đã chi (Có UNC)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
            <ShieldCheck size={12} /> Kế toán đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
            <XCircle size={12} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            <Clock size={12} /> Chờ duyệt chi
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng chi phí cơ bản */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Chi phí cơ bản (Từ 5 mốc *)</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">★</div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">{formatVND(mandatoryTotal)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đồng bộ tự động từ các trường có dấu *</div>
        </div>

        {/* Card 2: Phụ phí phát sinh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Phụ phí phát sinh thêm</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold">+</div>
          </div>
          <div className="text-lg font-bold text-amber-700 font-mono">{formatVND(extraTotal)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lưu đêm, nâng hạ, kiểm hóa ngoài giờ...</div>
        </div>

        {/* Card 3: Đã chi (Có UNC) */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
            <span>Đã thanh toán (Có UNC)</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono">{formatVND(paidTotal)}</div>
          <div className="text-[11px] text-emerald-600 mt-1">{costs.filter(c => c.status === 'PAID').length} khoản đã có ủy nhiệm chi</div>
        </div>

        {/* Card 4: Chờ kế toán duyệt/chi */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
            <span>Còn phải đối chiếu / Chưa chi</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700 font-mono">{formatVND(pendingTotal)}</div>
          <div className="text-[11px] text-amber-600 mt-1">Tổng cộng: <strong className="text-slate-900">{formatVND(grandTotal)}</strong></div>
        </div>
      </div>

      {/* Main Reconciliation Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              <span>Bảng Đối chiếu Chi phí Lô hàng với Kế toán</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi việc kế toán duyệt lệnh và đối soát bằng chứng chi tiền (Ủy nhiệm chi - UNC).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Thêm phụ phí phát sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveShipmentCostsToStorage(shipmentId, costs);
                setSavedAlert(true);
                setTimeout(() => setSavedAlert(false), 2500);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Save size={14} />
              <span>Lưu bảng đối chiếu</span>
            </button>
          </div>
        </div>

        {savedAlert && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Đã lưu thành công các thay đổi đối chiếu kế toán!</span>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-4 w-12 text-center">STT</th>
                <th className="p-4">Mốc phát sinh</th>
                <th className="p-4">Nội dung khoản phí</th>
                <th className="p-4">Số tiền (VNĐ)</th>
                <th className="p-4">Ngày yêu cầu</th>
                <th className="p-4">Kế toán duyệt lệnh</th>
                <th className="p-4">Đính kèm Ủy nhiệm chi (UNC)</th>
                <th className="p-4 w-16 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Chưa có khoản phí nào. Vui lòng nhập thông tin tại 5 Mốc Vận chuyển hoặc bấm "Thêm phụ phí phát sinh".
                  </td>
                </tr>
              ) : (
                costs.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* 1. STT */}
                    <td className="p-4 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* 2. Mốc phát sinh */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.isMandatoryFee ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.milestoneLabel}
                      </span>
                    </td>

                    {/* 3. Nội dung phí */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.feeName}</div>
                      {item.isMandatoryFee && (
                        <span className="text-[10px] text-blue-600">Khoản phí chuẩn (*)</span>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.notes}</div>
                      )}
                    </td>

                    {/* 4. Số tiền (VNĐ) */}
                    <td className="p-4">
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) => updateCostItem(item.id, { amount: Number(e.target.value) })}
                        className="w-36 px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{formatVND(item.amount)}</span>
                    </td>

                    {/* 5. Ngày yêu cầu */}
                    <td className="p-4">
                      <input
                        type="date"
                        value={item.requestDate || ''}
                        onChange={(e) => updateCostItem(item.id, { requestDate: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                      />
                    </td>

                    {/* 6. Kế toán duyệt lệnh */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white font-semibold"
                        >
                          <option value="PENDING">⏳ Chờ duyệt chi</option>
                          <option value="APPROVED">🛡️ Kế toán đã duyệt</option>
                          <option value="PAID">✅ Đã chi (Thanh toán)</option>
                          <option value="REJECTED">❌ Từ chối chi</option>
                        </select>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>
                    </td>

                    {/* 7. Đính kèm Ủy nhiệm chi (UNC) / Bằng chứng */}
                    <td className="p-4">
                      {item.uncAttachmentUrl ? (
                        <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <FileCheck size={16} className="text-emerald-600 shrink-0" />
                          <div className="truncate max-w-[140px]">
                            <div className="text-[11px] font-semibold text-emerald-900 truncate" title={item.uncFileName}>
                              {item.uncFileName || 'UNC_ChungTu.pdf'}
                            </div>
                            <div className="text-[9px] text-emerald-600">{item.uncUploadDate || 'Đã đính kèm'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewUNC({ url: item.uncAttachmentUrl!, name: item.uncFileName || 'Ủy nhiệm chi' })}
                            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded"
                            title="Xem bằng chứng UNC"
                          >
                            <Eye size={13} />
                          </button>
                          <label className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer" title="Đổi file khác">
                            <Upload size={13} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg text-slate-600 hover:text-blue-700 bg-white cursor-pointer transition-all shadow-xs">
                          <Upload size={13} />
                          <span>Tải lên UNC</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                        </label>
                      )}
                    </td>

                    {/* 8. Thao tác */}
                    <td className="p-4 text-center">
                      {!item.isMandatoryFee && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Xóa phụ phí phát sinh này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary of Table */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{costs.length} khoản phí</strong> ({costs.filter(c => c.isMandatoryFee).length} khoản chuẩn, {costs.filter(c => !c.isMandatoryFee).length} phát sinh thêm)
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Đã chi (Có UNC): </span>
              <span className="font-bold text-emerald-700 font-mono">{formatVND(paidTotal)}</span>
            </div>
            <div>
              <span className="text-slate-500">Tổng chi phí lô hàng: </span>
              <span className="font-bold text-blue-700 font-mono text-sm">{formatVND(grandTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Thêm phụ phí phát sinh */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                <span>Thêm Khoản Chi Phí Phát Sinh</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleAddNewFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mốc phát sinh</label>
                <select
                  value={newFee.milestoneLabel}
                  onChange={(e) => setNewFee(f => ({ ...f, milestoneLabel: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Phụ phí phát sinh">Phụ phí phát sinh chung</option>
                  <option value="1. Hàng đến cảng">1. Hàng đến cảng (Lưu bãi, cược cont...)</option>
                  <option value="2. Hải quan">2. Hải quan (Soi chiếu, kiểm hóa...)</option>
                  <option value="3. Vận chuyển">3. Vận chuyển (Lưu đêm xe, bốc xếp...)</option>
                  <option value="4. Cửa khẩu xuất">4. Cửa khẩu xuất (Sang xe, bến bãi...)</option>
                  <option value="5. Trả rỗng">5. Trả rỗng (Sửa vỏ cont, rửa cont...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên nội dung khoản phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phí phạt lưu bãi DEM quá hạn, Phí sửa chữa vỏ cont..."
                  value={newFee.feeName}
                  onChange={(e) => setNewFee(f => ({ ...f, feeName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="VD: 1,500,000"
                  value={newFee.amount}
                  onChange={(e) => setNewFee(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày yêu cầu chi</label>
                <input
                  type="date"
                  value={newFee.requestDate}
                  onChange={(e) => setNewFee(f => ({ ...f, requestDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú lý do phát sinh</label>
                <textarea
                  rows={2}
                  placeholder="Lý do phát sinh chi phí này để kế toán đối soát..."
                  value={newFee.notes}
                  onChange={(e) => setNewFee(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Tạo khoản chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview UNC */}
      {previewUNC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Bằng chứng thanh toán: {previewUNC.name}
                </h3>
              </div>
              <button onClick={() => setPreviewUNC(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-100/50">
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs text-center space-y-3 max-w-md">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mx-auto">
                  <FileText size={32} />
                </div>
                <div className="font-bold text-slate-800 text-sm">{previewUNC.name}</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chứng từ Ủy nhiệm chi (UNC) đã được kế toán ký duyệt và đính kèm thành công vào hồ sơ lô hàng.
                </p>
                <div className="pt-2">
                  <a
                    href={previewUNC.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs"
                  >
                    <Download size={14} /> Mở file đính kèm
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
