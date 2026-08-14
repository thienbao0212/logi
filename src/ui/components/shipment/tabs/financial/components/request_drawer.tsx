import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, XCircle, CreditCard, Clock, FileText, CornerDownRight } from 'lucide-react';
import { FinancialRequest } from '../types.js';

interface RequestDrawerProps {
  request: FinancialRequest;
  onClose: () => void;
  onUpdateStatus: (id: string, status: any) => Promise<void>;
  onRecordPayment: (id: string, amount: number) => Promise<void>;
  onUpdateNote?: (id: string, note: string) => Promise<void>;
}

export function RequestDrawer({ request, onClose, onUpdateStatus, onRecordPayment, onUpdateNote }: RequestDrawerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(request.notes || '');

  const handleSaveNote = async () => {
    if (onUpdateNote) {
      setLoading(true);
      await onUpdateNote(request.id, noteText);
      setLoading(false);
    }
    setEditingNote(false);
  };

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    await onUpdateStatus(request.id, status);
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!paymentAmount) return;
    setLoading(true);
    await onRecordPayment(request.id, parseFloat(paymentAmount));
    setShowPayment(false);
    setPaymentAmount('');
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ĐÃ DUYỆT':
      case 'ĐÃ THU':
      case 'ĐÃ CHI':
        return 'bg-green-100 text-green-800';
      case 'CHỜ DUYỆT':
      case 'CHỜ THU':
      case 'CHỜ CHI':
        return 'bg-amber-100 text-amber-800';
      case 'THU MỘT PHẦN':
      case 'CHI MỘT PHẦN':
        return 'bg-blue-100 text-blue-800';
      case 'TỪ CHỐI':
      case 'HỦY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'ĐÃ DUYỆT': t('financial.status.APPROVED', 'Approved'),
      'ĐÃ THU': t('financial.status.COLLECTED', 'Collected'),
      'ĐÃ CHI': t('financial.status.PAID', 'Paid'),
      'CHỜ DUYỆT': t('financial.status.PENDING', 'Pending Approval'),
      'CHỜ THU': t('financial.status.PENDING_COLLECTION', 'Pending Collection'),
      'CHỜ CHI': t('financial.status.PENDING_PAYMENT', 'Pending Payment'),
      'THU MỘT PHẦN': t('financial.status.PARTIAL_COLLECTION', 'Partial Collection'),
      'CHI MỘT PHẦN': t('financial.status.PARTIAL_PAYMENT', 'Partial Payment'),
      'TỪ CHỐI': t('financial.status.REJECTED', 'Rejected'),
      'HỦY': t('financial.status.CANCELLED', 'Cancelled'),
      'NHÁP': t('financial.status.DRAFT', 'Draft'),
    };
    return statusMap[status] || status;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{request.id}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${request.type === 'THU' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {request.type}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{request.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Header Status */}
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">{t('financial.drawer.statusLabel', 'Trạng thái')}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">{t('financial.drawer.amountLabel', 'Số tiền')}</p>
                <p className="text-2xl font-bold font-mono text-slate-900">
                  ${request.amount.toLocaleString()}
                </p>
              </div>
            </div>
            
            {(request.paidAmount > 0 || ['ĐÃ THU', 'ĐÃ CHI', 'THU MỘT PHẦN', 'CHI MỘT PHẦN'].includes(request.status)) && (
              <div className="mt-4 flex gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="text-xs text-slate-500">{request.type === 'THU' ? t('financial.thu.collected', 'Đã thu') : t('financial.chi.paid', 'Đã chi')}</p>
                  <p className="font-mono font-medium text-slate-900">${request.paidAmount.toLocaleString()}</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">{t('financial.table.remaining', 'Còn lại')}</p>
                  <p className={`font-mono font-bold ${request.remainingAmount > 0 ? (request.type === 'THU' ? 'text-amber-600' : 'text-orange-600') : 'text-slate-400'}`}>
                    ${request.remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                {t('financial.drawer.details', 'Thông tin chi tiết')}
              </h3>
              <dl className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                <div>
                  <dt className="text-slate-500">{t('financial.drawer.category', 'Nhóm/Loại')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.category}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{request.type === 'THU' ? t('financial.table.customer', 'Khách hàng') : t('financial.table.vendor', 'Vendor')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.partyName}</dd>
                </div>
                
                {request.containerNumber && (
                  <div>
                    <dt className="text-slate-500">{t('financial.table.container', 'Container')}</dt>
                    <dd className="font-medium text-slate-900 mt-1">{request.containerNumber}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-slate-500">{t('financial.drawer.currency', 'Tiền tệ')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.currency}</dd>
                </div>

                <div>
                  <dt className="text-slate-500">{t('financial.drawer.createdDate', 'Ngày tạo')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.requestDate}</dd>
                </div>
                
                <div>
                  <dt className="text-slate-500">{t('financial.table.expectedDate', 'Ngày dự kiến')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.expectedDate}</dd>
                </div>

                <div>
                  <dt className="text-slate-500">{t('financial.table.requester', 'Người yêu cầu')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.requester}</dd>
                </div>
                
                <div>
                  <dt className="text-slate-500">{t('financial.table.approver', 'Người duyệt')}</dt>
                  <dd className="font-medium text-slate-900 mt-1">{request.approver || '-'}</dd>
                </div>
              </dl>
            </div>

            {request.isBillable && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2">
                  <CornerDownRight size={16} />
                  {t('financial.drawer.billable', 'Chi phí có thu lại khách (Billable)')}
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">{t('financial.drawer.billableAmount', 'Số tiền thu khách:')}</span>
                  <span className="font-mono font-medium text-blue-900">${request.billableAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-blue-700">{t('financial.drawer.margin', 'Chênh lệch:')}</span>
                  <span className="font-mono font-bold text-green-700">+${((request.billableAmount || 0) - request.amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <dt className="text-slate-500 text-sm font-semibold">{t('financial.drawer.notes', 'Ghi chú')}</dt>
                {!editingNote && (
                  <button onClick={() => setEditingNote(true)} className="text-xs text-blue-600 font-medium hover:underline">
                    {request.notes ? t('common.edit', 'Chỉnh sửa') : t('common.add', 'Thêm')}
                  </button>
                )}
              </div>
              
              {editingNote ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    placeholder={t('financial.drawer.notePlaceholder', 'Nhập ghi chú...')}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setEditingNote(false); setNoteText(request.notes || ''); }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                      {t('common.cancel', 'Hủy')}
                    </button>
                    <button 
                      onClick={handleSaveNote}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
                    >
                      {t('common.save', 'Lưu')}
                    </button>
                  </div>
                </div>
              ) : (
                <dd className={`text-sm p-3 rounded-lg border ${request.notes ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-transparent border-dashed border-slate-300 text-slate-400 italic'}`}>
                  {request.notes || t('financial.drawer.noNotes', 'Chưa có ghi chú nào.')}
                </dd>
              )}
            </div>
          </div>

          {/* History */}
          {request.history && request.history.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                {t('financial.drawer.history', 'Lịch sử cập nhật')}
              </h3>
              <div className="space-y-4">
                {request.history.slice().reverse().map((event, index) => (
                  <div key={event.id} className="relative pl-4">
                    {/* Timeline line */}
                    {index !== request.history!.length - 1 && (
                      <div className="absolute top-2 left-1.5 w-px h-full bg-slate-200 -z-10"></div>
                    )}
                    {/* Dot */}
                    <div className="absolute top-1.5 left-0 w-3 h-3 rounded-full bg-white border-2 border-blue-400 z-10"></div>
                    
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">{event.action}</p>
                      {event.details && <p className="text-slate-600 text-xs mt-0.5">{event.details}</p>}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>{event.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          
          {showPayment ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">{t('financial.drawer.paymentAmount', 'Số tiền thanh toán')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full pl-7 pr-12 border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.00"
                    max={request.remainingAmount}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button 
                      onClick={() => setPaymentAmount(request.remainingAmount.toString())}
                      className="text-xs text-blue-600 font-medium hover:text-blue-800"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50"
                >
                  {t('financial.actions.cancel', 'Hủy')}
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={!paymentAmount || loading}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('financial.actions.savePayment', 'Lưu thanh toán')}
                </button>
              </div>
            </div>
          ) : showReject ? (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
              <div>
                <label className="text-xs font-medium text-red-800 block mb-1">{t('financial.drawer.rejectReason', 'Lý do từ chối')}</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder={t('financial.drawer.rejectPlaceholder', 'Nhập lý do...')}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowReject(false)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50"
                >
                  {t('financial.actions.cancel', 'Hủy')}
                </button>
                <button 
                  onClick={() => { handleStatusChange('TỪ CHỐI'); setShowReject(false); }}
                  disabled={!rejectReason || loading}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {t('financial.actions.confirmReject', 'Xác nhận từ chối')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-end">
              {request.status === 'NHÁP' && (
                <>
                  <button 
                    onClick={() => handleStatusChange('CHỜ DUYỆT')}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {t('financial.actions.submitApproval', 'Gửi duyệt')}
                  </button>
                </>
              )}
              
              {request.status === 'CHỜ DUYỆT' && (
                <>
                  <button 
                    onClick={() => setShowReject(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                  >
                    <XCircle size={16} /> {t('financial.actions.reject', 'Từ chối')}
                  </button>
                  <button 
                    onClick={() => handleStatusChange(request.type === 'THU' ? 'CHỜ THU' : 'CHỜ CHI')}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check size={16} /> {t('financial.actions.approve', 'Duyệt')}
                  </button>
                </>
              )}

              {(['CHỜ THU', 'CHỜ CHI', 'THU MỘT PHẦN', 'CHI MỘT PHẦN'].includes(request.status)) && (
                <button 
                  onClick={() => setShowPayment(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 w-full justify-center"
                >
                  <CreditCard size={16} /> 
                  {request.type === 'THU' ? t('financial.actions.recordThu', 'Ghi nhận thu') : t('financial.actions.recordChi', 'Ghi nhận chi')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
