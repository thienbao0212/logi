import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Save, Send } from 'lucide-react';
import { FinancialRequest } from '../types.js';

interface AddRequestModalProps {
  type: 'THU' | 'CHI';
  onClose: () => void;
  onSave: (payload: Partial<FinancialRequest>, shipmentRef?: string) => Promise<void>;
  showShipmentSelect?: boolean;
}

export function AddRequestModal({ type, onClose, onSave, showShipmentSelect = false }: AddRequestModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    description: '',
    category: type === 'THU' ? 'Customer Freight' : 'Vận chuyển',
    partyName: '',
    amount: '',
    currency: 'USD',
    expectedDate: new Date().toISOString().split('T')[0],
    notes: '',
    containerNumber: '',
    isBillable: false,
    billableAmount: '',
    shipmentRef: '',
  });

  const handleSubmit = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 600));

    await onSave({
      type,
      description: form.description,
      category: form.category,
      partyName: form.partyName,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      expectedDate: form.expectedDate,
      notes: form.notes,
      containerNumber: type === 'CHI' ? form.containerNumber : undefined,
      isBillable: form.isBillable,
      billableAmount: form.isBillable ? (parseFloat(form.billableAmount) || 0) : undefined,
      status: status as any,
    }, showShipmentSelect ? form.shipmentRef : undefined);
    
    setLoading(false);
  };

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const thuCategories = ['Customer Freight', 'Customs Service Fee', 'Trucking Fee', 'Documentation Fee', 'Handling Fee', 'Khác'];
  const chiCategories = ['Vận chuyển', 'Cảng / Terminal', 'Hải quan', 'Container', 'Kho bãi', 'Chứng từ', 'Biên giới / Transit', 'Campuchia', 'Nhân công', 'Khác'];

  const categories = type === 'THU' ? thuCategories : chiCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{type === 'THU' ? t('financial.actions.createThu', 'Create Revenue Request') : t('financial.actions.createChi', 'Create Expense Request')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="add-request-form" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700">{t('financial.table.description', 'Description')} *</label>
                <input 
                  type="text"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={t('financial.modal.descPlaceholder', 'Brief description')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {showShipmentSelect && (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">Shipment Ref (Optional)</label>
                  <input 
                    type="text"
                    value={form.shipmentRef}
                    onChange={(e) => updateForm('shipmentRef', e.target.value)}
                    placeholder="e.g. SHP-2026-0001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">{type === 'THU' ? t('financial.table.thuCategory', 'Rev. Category') : t('financial.table.chiCategory', 'Exp. Category')} *</label>
                <select 
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">{type === 'THU' ? t('financial.table.customer', 'Customer') : t('financial.table.vendor', 'Vendor')} *</label>
                <input 
                  type="text"
                  value={form.partyName}
                  onChange={(e) => updateForm('partyName', e.target.value)}
                  placeholder={type === 'THU' ? 'e.g. ABC Logistics' : 'e.g. MSC Lines'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">{t('financial.table.amount', 'Amount')} *</label>
                <input 
                  type="number"
                  value={form.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">{t('financial.drawer.currency', 'Currency')} *</label>
                <select 
                  value={form.currency}
                  onChange={(e) => updateForm('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                >
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
              
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">{t('financial.table.expectedDate', 'Expected Date')} *</label>
                <input 
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) => updateForm('expectedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {type === 'CHI' && (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-slate-700">{t('financial.table.container', 'Container')}</label>
                  <input 
                    type="text"
                    value={form.containerNumber}
                    onChange={(e) => updateForm('containerNumber', e.target.value)}
                    placeholder="e.g. MSCU1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              {type === 'CHI' && (
                <div className="space-y-2 col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="isBillable"
                      checked={form.isBillable}
                      onChange={(e) => updateForm('isBillable', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isBillable" className="text-sm font-medium text-slate-700">
                      {t('financial.modal.isBillable', 'Chi phí này có thu lại khách hàng? (Billable)')}
                    </label>
                  </div>
                  
                  {form.isBillable && (
                    <div className="grid grid-cols-2 gap-4 mt-2 pl-6">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('financial.drawer.billableAmount', 'Số tiền thu khách:')}</label>
                        <input 
                          type="number"
                          value={form.billableAmount}
                          onChange={(e) => updateForm('billableAmount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('financial.drawer.margin', 'Chênh lệch (Lãi):')}</label>
                        <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm font-mono text-green-700 font-medium">
                          ${((parseFloat(form.billableAmount) || 0) - (parseFloat(form.amount) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700">{t('financial.drawer.notes', 'Ghi chú')}</label>
                <textarea 
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-20"
                />
              </div>

            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {t('financial.actions.cancel', 'Hủy')}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => handleSubmit(e, 'NHÁP')}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              {t('financial.actions.saveDraft', 'Lưu nháp')}
            </button>
            <button
              onClick={(e) => handleSubmit(e, 'CHỜ DUYỆT')}
              disabled={loading}
              className={`px-6 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 ${type === 'THU' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-100' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-100'} focus:ring-4`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {t('financial.actions.submitApproval', 'Gửi duyệt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
