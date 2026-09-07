export type ChargeCategory = 'FREIGHT' | 'LOCAL_CHARGE' | 'CUSTOMS' | 'TRUCKING' | 'WAREHOUSE' | 'OTHER';

export type ChargeType = 'RECEIVABLE' | 'PAYABLE' | 'BOTH';

export type ChargeUnit = 'CONT' | 'CBM' | 'TON' | 'TRIP' | 'SET' | 'PACKAGE' | 'SHIPMENT';

export interface ChargeItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  category: ChargeCategory;
  type: ChargeType;
  unit: ChargeUnit;
  defaultVat: number; // 0, 5, 8, 10
  defaultCurrency: 'USD' | 'VND';
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CHARGE_CATEGORIES: { id: ChargeCategory; labelVi: string; labelEn: string; color: string }[] = [
  { id: 'FREIGHT', labelVi: 'Cước vận chuyển (Freight)', labelEn: 'Freight', color: 'blue' },
  { id: 'LOCAL_CHARGE', labelVi: 'Phụ phí cảng (Local Charge)', labelEn: 'Local Charges', color: 'indigo' },
  { id: 'CUSTOMS', labelVi: 'Hải quan & Thủ tục', labelEn: 'Customs & Formalities', color: 'emerald' },
  { id: 'TRUCKING', labelVi: 'Kéo xe & Vận tải bộ', labelEn: 'Trucking & Inland', color: 'amber' },
  { id: 'WAREHOUSE', labelVi: 'Kho bãi & CFS', labelEn: 'Warehouse & CFS', color: 'purple' },
  { id: 'OTHER', labelVi: 'Chi phí khác', labelEn: 'Other Surcharges', color: 'zinc' },
];

export const CHARGE_UNITS: ChargeUnit[] = ['CONT', 'CBM', 'TON', 'TRIP', 'SET', 'PACKAGE', 'SHIPMENT'];

const DEFAULT_CHARGES: ChargeItem[] = [
  {
    id: 'chg-001',
    code: 'O/F',
    nameVi: 'Cước biển quốc tế (Ocean Freight)',
    nameEn: 'Ocean Freight',
    category: 'FREIGHT',
    type: 'BOTH',
    unit: 'CONT',
    defaultVat: 0,
    defaultCurrency: 'USD',
    description: 'Cước vận chuyển đường biển quốc tế',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-002',
    code: 'A/F',
    nameVi: 'Cước hàng không (Air Freight)',
    nameEn: 'Air Freight',
    category: 'FREIGHT',
    type: 'BOTH',
    unit: 'TON',
    defaultVat: 0,
    defaultCurrency: 'USD',
    description: 'Cước vận tải hàng không quốc tế',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-003',
    code: 'THC',
    nameVi: 'Phí xếp dỡ tại cảng (Terminal Handling)',
    nameEn: 'Terminal Handling Charge',
    category: 'LOCAL_CHARGE',
    type: 'BOTH',
    unit: 'CONT',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí bốc xếp container tại cảng biển/ICD',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-004',
    code: 'D/O',
    nameVi: 'Lệnh giao hàng (Delivery Order)',
    nameEn: 'Delivery Order Fee',
    category: 'LOCAL_CHARGE',
    type: 'BOTH',
    unit: 'SET',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí phát hành/tiếp nhận lệnh D/O',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-005',
    code: 'B/L',
    nameVi: 'Phí phát hành vận đơn (Bill of Lading)',
    nameEn: 'Bill of Lading Issuing Fee',
    category: 'LOCAL_CHARGE',
    type: 'RECEIVABLE',
    unit: 'SET',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí phát hành HBL / MBL',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-006',
    code: 'SEAL',
    nameVi: 'Phí kẹp chì niêm phong (Seal Fee)',
    nameEn: 'Container Seal Fee',
    category: 'LOCAL_CHARGE',
    type: 'BOTH',
    unit: 'CONT',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí mua chì niêm phong container hãng tàu',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-007',
    code: 'CFS',
    nameVi: 'Phí kho bãi lẻ (CFS Charge)',
    nameEn: 'Container Freight Station Charge',
    category: 'WAREHOUSE',
    type: 'BOTH',
    unit: 'CBM',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí bốc xếp, lưu kho hàng lẻ LCL tại CFS',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-008',
    code: 'DEM/DET',
    nameVi: 'Phí lưu container/bãi (Demurrage & Detention)',
    nameEn: 'Demurrage & Detention Fee',
    category: 'LOCAL_CHARGE',
    type: 'BOTH',
    unit: 'CONT',
    defaultVat: 0,
    defaultCurrency: 'USD',
    description: 'Phí quá hạn lưu bãi cảng hoặc giữ container rỗng',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-009',
    code: 'TRUCK',
    nameVi: 'Vận chuyển nội địa đường bộ (Inland Trucking)',
    nameEn: 'Inland Trucking Fee',
    category: 'TRUCKING',
    type: 'BOTH',
    unit: 'TRIP',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Vận chuyển container/hàng tải từ kho đến cảng hoặc ngược lại',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-010',
    code: 'CUS_CLEAR',
    nameVi: 'Dịch vụ khai hải quan trọn gói',
    nameEn: 'Customs Clearance Brokerage',
    category: 'CUSTOMS',
    type: 'BOTH',
    unit: 'SET',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Dịch vụ lên tờ khai, truyền tờ khai và thông quan tại chi cục',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-011',
    code: 'INSPECT',
    nameVi: 'Kiểm tra chuyên ngành / Kiểm dịch',
    nameEn: 'Special Inspection / Quarantine',
    category: 'CUSTOMS',
    type: 'BOTH',
    unit: 'SET',
    defaultVat: 5,
    defaultCurrency: 'VND',
    description: 'Phí kiểm dịch thực vật, động vật, hợp quy, kiểm tra chất lượng',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'chg-012',
    code: 'LIFT',
    nameVi: 'Phí nâng/hạ vỏ container (Lift on/off)',
    nameEn: 'Lift On / Lift Off Fee',
    category: 'LOCAL_CHARGE',
    type: 'PAYABLE',
    unit: 'CONT',
    defaultVat: 8,
    defaultCurrency: 'VND',
    description: 'Phí nâng hạ container tại bãi rỗng hoặc cảng',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const STORAGE_KEY = 'logiflow_master_charges';

export function getCharges(): ChargeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHARGES));
      return DEFAULT_CHARGES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CHARGES;
  }
}

export function saveCharge(item: Partial<ChargeItem> & { code: string; nameVi: string }): ChargeItem {
  const list = getCharges();
  const now = new Date().toISOString().split('T')[0];

  if (item.id) {
    const idx = list.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      const updated: ChargeItem = {
        ...list[idx],
        ...item,
        updatedAt: now,
      };
      list[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return updated;
    }
  }

  const newItem: ChargeItem = {
    id: `chg-${Date.now()}`,
    code: item.code.toUpperCase().trim(),
    nameVi: item.nameVi.trim(),
    nameEn: item.nameEn?.trim() || item.nameVi.trim(),
    category: item.category || 'LOCAL_CHARGE',
    type: item.type || 'BOTH',
    unit: item.unit || 'CONT',
    defaultVat: item.defaultVat ?? 8,
    defaultCurrency: item.defaultCurrency || 'VND',
    description: item.description?.trim() || '',
    isActive: item.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newItem;
}

export function deleteCharge(id: string): void {
  const list = getCharges().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function resetCharges(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHARGES));
}
