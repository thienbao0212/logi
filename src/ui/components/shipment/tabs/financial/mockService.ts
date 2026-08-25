import { FinancialRequest, RequestStatus } from './types.js';

const STORAGE_KEY = 'MOCK_FINANCIAL_REQUESTS';

const getInitialRequests = (): FinancialRequest[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return [
    // THU
    {
      id: 'THU-0001',
      shipmentId: '',
      type: 'THU',
      description: 'Ocean Freight',
      category: 'Customer Freight',
      partyName: 'ABC Logistics Cambodia',
      amount: 7500,
      paidAmount: 7500,
      remainingAmount: 0,
      currency: 'USD',
      requestDate: '2026-08-10',
      expectedDate: '2026-08-10',
      requester: 'Nguyen Van A',
      approver: 'Accounting',
      status: 'ĐÃ THU',
    },
    {
      id: 'THU-0002',
      shipmentId: '',
      type: 'THU',
      description: 'Customs Service',
      category: 'Customs Service Fee',
      partyName: 'ABC Logistics Cambodia',
      amount: 2500,
      paidAmount: 0,
      remainingAmount: 2500,
      currency: 'USD',
      requestDate: '2026-08-11',
      expectedDate: '2026-08-15',
      requester: 'Nguyen Van A',
      approver: 'Accounting',
      status: 'CHỜ THU',
    },
    {
      id: 'THU-0003',
      shipmentId: '',
      type: 'THU',
      description: 'Trucking Fee',
      category: 'Trucking',
      partyName: 'ABC Logistics Cambodia',
      amount: 1800,
      paidAmount: 0,
      remainingAmount: 1800,
      currency: 'USD',
      requestDate: '2026-08-11',
      expectedDate: '2026-08-16',
      requester: 'Nguyen Van B',
      status: 'CHỜ DUYỆT',
    },
    // CHI
    {
      id: 'CHI-0001',
      shipmentId: '',
      type: 'CHI',
      description: 'Ocean Freight',
      category: 'Vận chuyển',
      partyName: 'Carrier ABC',
      containerNumber: 'CONT-001',
      amount: 4200,
      paidAmount: 4200,
      remainingAmount: 0,
      currency: 'USD',
      requestDate: '2026-08-09',
      expectedDate: '2026-08-09',
      requester: 'Operator 1',
      approver: 'Manager',
      status: 'ĐÃ CHI',
    },
    {
      id: 'CHI-0002',
      shipmentId: '',
      type: 'CHI',
      description: 'Vietnam Trucking',
      category: 'Trucking',
      partyName: 'XYZ Transport',
      containerNumber: 'CONT-001',
      amount: 900,
      paidAmount: 0,
      remainingAmount: 900,
      currency: 'USD',
      requestDate: '2026-08-11',
      expectedDate: '2026-08-15',
      requester: 'Operator 1',
      status: 'CHỜ DUYỆT',
    },
    {
      id: 'CHI-0003',
      shipmentId: '',
      type: 'CHI',
      description: 'Cat Lai Charges',
      category: 'Cảng / Terminal',
      partyName: 'Saigon Newport',
      amount: 850,
      paidAmount: 850,
      remainingAmount: 0,
      currency: 'USD',
      requestDate: '2026-08-12',
      expectedDate: '2026-08-15',
      requester: 'Operator 2',
      approver: 'Manager',
      status: 'ĐÃ CHI',
    },
  ];
};

let MOCK_REQUESTS: FinancialRequest[] = getInitialRequests();

const saveRequests = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_REQUESTS));
};

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.name || user.email || 'System User';
    }
  } catch (e) {}
  return 'System User';
};

export const FinancialService = {
  getRequests: async (_shipmentId: string) => {
    return MOCK_REQUESTS;
  },
  
  addRequest: async (shipmentId: string, payload: Partial<FinancialRequest>) => {
    const isThu = payload.type === 'THU';
    const idPrefix = isThu ? 'THU' : 'CHI';
    
    const newReq: FinancialRequest = {
      id: `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      shipmentId,
      type: payload.type || 'CHI',
      description: payload.description || '',
      category: payload.category || 'Khác',
      partyName: payload.partyName || 'Unknown',
      containerNumber: payload.containerNumber,
      amount: payload.amount || 0,
      paidAmount: 0,
      remainingAmount: payload.amount || 0,
      currency: payload.currency || 'USD',
      requestDate: new Date().toISOString().split('T')[0],
      expectedDate: payload.expectedDate || new Date().toISOString().split('T')[0],
      requester: getCurrentUser(),
      status: payload.status || 'CHỜ DUYỆT',
      notes: payload.notes,
      isBillable: payload.isBillable,
      billableAmount: payload.billableAmount,
      history: [
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          action: 'TẠO MỚI',
          user: getCurrentUser(),
          details: `Tạo yêu cầu ${isThu ? 'thu' : 'chi'}`
        }
      ]
    };
    
    MOCK_REQUESTS = [newReq, ...MOCK_REQUESTS];
    saveRequests();
    return newReq;
  },
  
  updateRequestStatus: async (reqId: string, status: RequestStatus, updateFields?: Partial<FinancialRequest>) => {
    MOCK_REQUESTS = MOCK_REQUESTS.map(req => {
      if (req.id === reqId) {
        const history = [...(req.history || [])];
        const currentUser = getCurrentUser();
        let newApprover = req.approver;
        
        let actionDesc = '';
        if (req.status !== status) {
          actionDesc = `Đổi trạng thái: ${req.status} -> ${status}`;
          history.push({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action: 'CẬP NHẬT TRẠNG THÁI',
            user: currentUser,
            details: actionDesc
          });

          // If status changes to an approved state or rejected, set approver
          if (['CHỜ THU', 'CHỜ CHI', 'ĐÃ DUYỆT', 'TỪ CHỐI'].includes(status) && req.status === 'CHỜ DUYỆT') {
            newApprover = currentUser;
          }
        }
        
        if (updateFields?.notes && updateFields.notes !== req.notes) {
          history.push({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action: 'CẬP NHẬT GHI CHÚ',
            user: currentUser,
            details: updateFields.notes
          });
        }

        return { ...req, status, approver: newApprover, ...updateFields, history };
      }
      return req;
    });
    saveRequests();
  },
  
  recordPayment: async (reqId: string, paidAmount: number) => {
    MOCK_REQUESTS = MOCK_REQUESTS.map(req => {
      if (req.id === reqId) {
        const newPaid = req.paidAmount + paidAmount;
        const newRemaining = req.amount - newPaid;
        
        let newStatus = req.status;
        if (newRemaining <= 0) {
          newStatus = req.type === 'THU' ? 'ĐÃ THU' : 'ĐÃ CHI';
        } else if (newPaid > 0) {
          newStatus = req.type === 'THU' ? 'THU MỘT PHẦN' : 'CHI MỘT PHẦN';
        }
        
        const history = [...(req.history || [])];
        history.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          action: 'THANH TOÁN',
          user: getCurrentUser(),
          details: `Ghi nhận ${req.type === 'THU' ? 'thu' : 'chi'}: $${paidAmount.toLocaleString()}`
        });

        if (newStatus !== req.status) {
          history.push({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action: 'CẬP NHẬT TRẠNG THÁI',
            user: getCurrentUser(),
            details: `Đổi trạng thái: ${req.status} -> ${newStatus}`
          });
        }
        
        return { ...req, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, history };
      }
      return req;
    });
    saveRequests();
  },

  initializeDefaultFeesForShipment: (shipmentId: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem('shipment_settings') || '{}');
      const defaultFees: any[] = saved.fees || [
        { name: 'Phí khai báo hải quan', category: 'Hải quan', type: 'CHI', amount: 1000000, currency: 'VND', isBillable: true, active: true },
        { name: 'Phí hiện trường kiểm hóa', category: 'Hiện trường', type: 'CHI', amount: 500000, currency: 'VND', isBillable: true, active: true },
        { name: 'Phí vận chuyển nội địa', category: 'Vận chuyển', type: 'CHI', amount: 8000000, currency: 'VND', isBillable: true, active: true },
        { name: 'Phí cảng & Nâng hạ', category: 'Cảng / Terminal', type: 'CHI', amount: 3000000, currency: 'VND', isBillable: true, active: true },
        { name: 'Phí lệnh giao hàng (D/O)', category: 'Chứng từ', type: 'CHI', amount: 500000, currency: 'VND', isBillable: true, active: true },
        { name: 'Phí khác / Phát sinh', category: 'Khác', type: 'CHI', amount: 500000, currency: 'VND', isBillable: false, active: true },
      ];

      const activeFees = defaultFees.filter((f) => f.active !== false);
      const newItems: FinancialRequest[] = activeFees.map((fee, idx) => ({
        id: `CHI-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`,
        shipmentId,
        type: (fee.type || 'CHI') as 'CHI' | 'THU',
        description: fee.name,
        category: fee.category || 'Vận hành',
        partyName: 'Đơn vị dịch vụ / Cảng vụ',
        amount: fee.amount || 0,
        paidAmount: 0,
        remainingAmount: fee.amount || 0,
        currency: fee.currency || 'VND',
        requestDate: new Date().toISOString().split('T')[0],
        expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        requester: getCurrentUser(),
        status: 'CHỜ DUYỆT',
        notes: fee.notes || 'Định mức phí mặc định khởi tạo tự động từ hệ thống',
        isBillable: fee.isBillable !== false,
        billableAmount: fee.isBillable ? fee.amount : undefined,
        history: [
          {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action: 'TẠO MỚI TỰ ĐỘNG',
            user: 'Hệ thống',
            details: 'Khởi tạo theo bảng định mức phí mặc định'
          }
        ]
      }));

      MOCK_REQUESTS = [...newItems, ...MOCK_REQUESTS];
      saveRequests();
    } catch (e) {
      console.error('Failed to init default fees:', e);
    }
  }
};
