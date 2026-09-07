export type VendorType = 
  | 'TRUCKING' 
  | 'CUSTOMS' 
  | 'AIRLINE' 
  | 'SHIPPING_LINE' 
  | 'WAREHOUSE' 
  | 'OVERSEAS_AGENT' 
  | 'OTHER';

export type PaymentTerm = 'COD' | 'NET15' | 'NET30' | 'NET45' | 'NET60';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  type: VendorType;
  taxCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerm: PaymentTerm;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  TRUCKING: 'Đội xe / Vận tải nội địa',
  CUSTOMS: 'Đại lý Hải quan',
  AIRLINE: 'Hãng hàng không',
  SHIPPING_LINE: 'Hãng tàu / Đại lý hãng tàu',
  WAREHOUSE: 'Kho bãi / Cảng cạn ICD',
  OVERSEAS_AGENT: 'Đại lý quốc tế (Overseas)',
  OTHER: 'Đối tác dịch vụ khác',
};

export const VENDOR_TYPE_COLORS: Record<VendorType, { container: string; badge: string }> = {
  TRUCKING: { container: 'bg-amber-50 text-amber-800 border-amber-200', badge: 'warning' },
  CUSTOMS: { container: 'bg-blue-50 text-blue-800 border-blue-200', badge: 'info' },
  AIRLINE: { container: 'bg-purple-50 text-purple-800 border-purple-200', badge: 'purple' },
  SHIPPING_LINE: { container: 'bg-cyan-50 text-cyan-800 border-cyan-200', badge: 'info' },
  WAREHOUSE: { container: 'bg-emerald-50 text-emerald-800 border-emerald-200', badge: 'success' },
  OVERSEAS_AGENT: { container: 'bg-indigo-50 text-indigo-800 border-indigo-200', badge: 'purple' },
  OTHER: { container: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'neutral' },
};

export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  COD: 'Thanh toán ngay (COD)',
  NET15: 'Gối đầu 15 ngày (Net 15)',
  NET30: 'Gối đầu 30 ngày (Net 30)',
  NET45: 'Gối đầu 45 ngày (Net 45)',
  NET60: 'Gối đầu 60 ngày (Net 60)',
};

const STORAGE_KEY = 'master_data_vendors_v1';

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'VND-001',
    code: 'TRK-TCG',
    name: 'Công ty CP Vận tải & Xếp dỡ Tân Cảng',
    type: 'TRUCKING',
    taxCode: '0301445678',
    contactPerson: 'Nguyễn Văn Hùng',
    email: 'dispatch@tancangtrans.vn',
    phone: '0903 123 456',
    address: 'Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức, TP.HCM',
    paymentTerm: 'NET30',
    bankAccount: '0071001234567',
    bankName: 'Vietcombank - CN Tân Cảng',
    notes: 'Đội xe kéo cont 20ft/40ft chuyên tuyến Cát Lái - Sóng Thần - Bình Dương',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-08-20T10:30:00Z',
  },
  {
    id: 'VND-002',
    code: 'CUS-HGL',
    name: 'Đại lý Khai thuê Hải quan Hoàng Gia',
    type: 'CUSTOMS',
    taxCode: '0312567890',
    contactPerson: 'Trần Thị Mai',
    email: 'customs@hoanggialogistics.com',
    phone: '0918 654 321',
    address: '12 Hoàng Diệu, Phường 12, Quận 4, TP.HCM',
    paymentTerm: 'NET15',
    bankAccount: '19034567890123',
    bankName: 'Techcombank - CN Sài Gòn',
    notes: 'Chuyên làm tờ khai luồng vàng, luồng đỏ cảng Cát Lái và sân bay TSN',
    isActive: true,
    createdAt: '2026-02-10T09:15:00Z',
    updatedAt: '2026-08-15T14:00:00Z',
  },
  {
    id: 'VND-003',
    code: 'AIR-VNC',
    name: 'Vietnam Airlines Cargo Service JSC',
    type: 'AIRLINE',
    taxCode: '0100107518',
    contactPerson: 'Phạm Quang Minh',
    email: 'cargo-booking@vietnamairlines.com',
    phone: '028 3844 6688',
    address: 'Sân bay Quốc tế Tân Sơn Nhất, Quận Tân Bình, TP.HCM',
    paymentTerm: 'NET30',
    bankAccount: '110000012345',
    bankName: 'VietinBank - CN Quang Trung',
    notes: 'Hợp đồng cước bay cố định tuyến SGN - NRT, SGN - ICN, SGN - FRA',
    isActive: true,
    createdAt: '2026-02-28T11:00:00Z',
    updatedAt: '2026-08-18T16:20:00Z',
  },
  {
    id: 'VND-004',
    code: 'WHS-STH',
    name: 'Công ty CP Kho vận ICD Sóng Thần',
    type: 'WAREHOUSE',
    taxCode: '3700234567',
    contactPerson: 'Lê Hoàng Nam',
    email: 'operations@icdsongthan.com.vn',
    phone: '0274 379 1234',
    address: 'KCN Sóng Thần 1, Dĩ An, Bình Dương',
    paymentTerm: 'NET30',
    bankAccount: '0441000888999',
    bankName: 'Vietcombank - CN Sóng Thần',
    notes: 'Kho bãi trung chuyển hàng lẻ CFS và bãi hạ rỗng container rỗng',
    isActive: true,
    createdAt: '2026-03-05T07:45:00Z',
    updatedAt: '2026-08-25T09:00:00Z',
  },
  {
    id: 'VND-005',
    code: 'AGT-SIN',
    name: 'Apex Global Logistics Pte Ltd (Singapore)',
    type: 'OVERSEAS_AGENT',
    taxCode: 'SG201829341K',
    contactPerson: 'David Chen',
    email: 'pricing@apex-sin.com.sg',
    phone: '+65 6789 0123',
    address: '10 Anson Road #14-08 International Plaza, Singapore 079903',
    paymentTerm: 'NET45',
    bankAccount: '012-345678-9',
    bankName: 'DBS Bank Singapore',
    notes: 'Đại lý độc quyền phân phối và phát hành D/O tại cảng Singapore & Port Klang',
    isActive: true,
    createdAt: '2026-03-12T14:30:00Z',
    updatedAt: '2026-08-30T17:10:00Z',
  },
];

export const VendorService = {
  getAll: (): Vendor[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VENDORS));
        return DEFAULT_VENDORS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_VENDORS;
    }
  },

  getById: (id: string): Vendor | undefined => {
    const list = VendorService.getAll();
    return list.find(v => v.id === id);
  },

  save: (vendor: Vendor): void => {
    const list = VendorService.getAll();
    const idx = list.findIndex(v => v.id === vendor.id);
    if (idx >= 0) {
      list[idx] = { ...vendor, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...vendor, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  delete: (id: string): void => {
    const list = VendorService.getAll().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  nextCode: (type: VendorType): string => {
    const list = VendorService.getAll().filter(v => v.type === type);
    const prefixMap: Record<VendorType, string> = {
      TRUCKING: 'TRK',
      CUSTOMS: 'CUS',
      AIRLINE: 'AIR',
      SHIPPING_LINE: 'SHP',
      WAREHOUSE: 'WHS',
      OVERSEAS_AGENT: 'AGT',
      OTHER: 'VND',
    };
    const prefix = prefixMap[type] || 'VND';
    const num = (list.length + 1).toString().padStart(3, '0');
    return `${prefix}-${num}`;
  },
};
