export type RequestType = 'THU' | 'CHI';

export type RequestStatus = 
  | 'NHÁP' 
  | 'CHỜ DUYỆT' 
  | 'ĐÃ DUYỆT' 
  | 'CHỜ THU' 
  | 'THU MỘT PHẦN' 
  | 'ĐÃ THU' 
  | 'CHỜ CHI' 
  | 'CHI MỘT PHẦN' 
  | 'ĐÃ CHI' 
  | 'TỪ CHỐI' 
  | 'HỦY';

export interface FinancialRequest {
  id: string;
  shipmentId: string;
  type: RequestType;
  
  description: string;
  category: string; // "Nhóm chi phí" or "Loại thu"
  partyName: string; // Khách hàng or Vendor
  containerNumber?: string;
  
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  
  requestDate: string; // Ngày tạo yêu cầu
  expectedDate: string; // Hạn thu/chi (Ngày dự kiến)
  
  requester: string;
  approver?: string;
  
  status: RequestStatus;
  notes?: string;
  
  // For CHI only: billable to customer
  isBillable?: boolean;
  billableAmount?: number;

  history?: FinancialRequestHistory[];
}

export interface FinancialRequestHistory {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}
