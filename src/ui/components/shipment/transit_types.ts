// Types and helpers for 5 Transit Milestones & Cost Reconciliation

export interface ContainerItem {
  id: string;
  containerNumber: string;
  sealNumber: string;
  containerType: string; // 20GP, 40GP, 40HC, 45HC, 20RF, 40RF, LCL
  grossWeight?: string;
  notes?: string;
}

export interface MilestonePortArrival {
  // Required fields (*)
  arrivalDate: string; // 1. Ngày hàng đến *
  arrivalPort: string; // 2. Cảng đến *
  customsOffice: string; // 3. Chi cục hải quan *
  shippingLine: string; // 4. Hãng tàu *
  billOfLading: string; // 5. Số BL *
  localChargeFee: number; // 6. Phí local charge (VNĐ) *
  containers: ContainerItem[]; // 7 & 8. Danh sách cont & seal song song *
  declarationNumber: string; // Số tờ khai *
  declarationDate: string; // Ngày tờ khai *
  declarationChannel: 'GREEN' | 'YELLOW' | 'RED' | ''; // Luồng tờ khai *
  // DEM / DET / STO
  freeDemDays: number; // Số ngày DEM miễn phí
  freeDetDays: number; // Số ngày DET miễn phí
  freeStoDays: number; // Số ngày STO miễn phí
  demExpiryDate?: string; // Tự động tính = arrivalDate + (freeDemDays - 1)
  stoExpiryDate?: string; // Tự động tính = arrivalDate + (freeStoDays - 1)

  // Optional fields (Không gắn sao)
  commodityName?: string; // Tên hàng (Không bắt buộc)
  hsCode?: string; // Mã HS Code (Không bắt buộc)
  containerDepositFee?: number; // Phí cược cont (VNĐ)
  declarationServiceFee?: number; // Phí khai báo (VNĐ)
  vesselName?: string; // Tên tàu / chuyến
  notes?: string;
  isCompleted?: boolean;
}

export interface MilestoneCustoms {
  // Required fields (*)
  customsFee: number; // 1. Phí hải quan (VNĐ) *
  sealTrackingFee: number; // 2. Phí gắn seal định vị (VNĐ) *
  portFee: number; // 3. Phí cảng (VNĐ) *
  clearanceDate: string; // 4. Ngày thông quan *

  // Optional fields
  inspectionScanFee?: number; // Phí soi chiếu (VNĐ)
  physicalCheckFee?: number; // Phí kiểm hóa (VNĐ)
  brokerName?: string; // Đại lý hải quan
  transitPermitNo?: string; // Giấy phép quá cảnh
  notes?: string;
  isCompleted?: boolean;
}

export interface MilestoneTransport {
  // Required fields (*)
  carrierName: string; // 1. Tên đơn vị vận chuyển *
  departureDate: string; // 2. Ngày xe rời cảng * -> Kích hoạt hạn DET
  route: string; // 3. Tuyến đường đi *
  destinationArrivalDate: string; // 4. Ngày xe tới cảng đích *
  truckPlate: string; // 5. Biển số xe *
  driverName: string; // 6. Tên tài xế *
  driverPhone: string; // 7. SĐT tài xế *
  transportFee: number; // 8. Phí vận chuyển (VNĐ) *

  // DET expiry date auto-calculated from departureDate + (freeDetDays - 1)
  detExpiryDate?: string;

  // Optional fields
  extraFees?: number; // Phụ phí phát sinh (VNĐ)
  extraFeeDescription?: string; // Mô tả phụ phí phát sinh (VD: Lưu đêm xe, phụ phí bốc dỡ...)
  notes?: string;
  isCompleted?: boolean;
}

export interface MilestoneBorderGate {
  // Required fields (*)
  borderGateName: string; // 1. Tên cửa khẩu xuất (Mộc Bài, Hoa Lư, Xa Mát...) *
  customsBorderFee: number; // 2. Phí hải quan CK (VNĐ) *
  serviceFee: number; // 3. Phí dịch vụ (VNĐ) *
  borderFee: number; // 4. Phí cửa khẩu (VNĐ) *

  // Optional fields
  borderPassDate?: string; // Ngày hàng qua cửa khẩu
  extraFees?: number; // Phụ phí phát sinh (VNĐ) (VD: Phí sang xe, bốc xếp biên giới...)
  extraFeeDescription?: string;
  cambodiaPartner?: string; // Đơn vị tiếp nhận tại Campuchia
  notes?: string;
  isCompleted?: boolean;
}

export interface MilestoneEmptyReturn {
  // Required fields (*)
  depotName: string; // 1. Tên depot trả rỗng *
  returnFee: number; // 2. Phí trả rỗng (VNĐ) *
  actualReturnDate: string; // 3. Ngày trả rỗng thực tế *

  // Optional fields
  extraFees?: number; // Phụ phí phát sinh (VNĐ) (VD: Phí sửa chữa hư vỏ, phí vệ sinh...)
  extraFeeDescription?: string;
  containerCondition?: string; // Tình trạng vỏ cont (Nguyên vẹn / Hư hỏng)
  notes?: string;
  isCompleted?: boolean;
}

export interface TransitMilestonesData {
  m1: MilestonePortArrival;
  m2: MilestoneCustoms;
  m3: MilestoneTransport;
  m4: MilestoneBorderGate;
  m5: MilestoneEmptyReturn;
  updatedAt: string;
}

export interface FinancialCostItem {
  id: string;
  shipmentId: string;
  milestoneKey: 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'extra';
  milestoneLabel: string;
  feeName: string; // Tên khoản phí (VD: Phí local charge, Phí hải quan...)
  amount: number; // Số tiền (VNĐ)
  requestDate: string; // Ngày yêu cầu
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'; // Chờ duyệt | Đã duyệt | Đã chi | Từ chối
  uncAttachmentUrl?: string; // Link đính kèm UNC / file bằng chứng thanh toán
  uncFileName?: string; // Tên file UNC
  uncUploadDate?: string; // Ngày tải lên UNC
  isMandatoryFee: boolean; // Khoản phí từ trường có dấu sao (*) hay phụ phí phát sinh
  notes?: string;
}

export interface MilestoneValidationResult {
  isCompleted: boolean;
  missingFields: { key: string; label: string }[];
  completionPercentage: number;
}

// ── Date calculation helpers ──────────────────────────────────────────────────

/**
 * Tính ngày hết hạn DEM/STO:
 * Ngày bắt đầu tính là 1 ngày, nên cộng thêm (freeDays - 1) ngày.
 * Ví dụ: Ngày 24/08 + 3 ngày DEM -> Hạn DEM là 26/08.
 */
export function calculateExpiryDate(startDateStr?: string, freeDays?: number): string | undefined {
  if (!startDateStr || !freeDays || freeDays < 1) return undefined;
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return undefined;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return undefined;
  
  // Cộng thêm (freeDays - 1) ngày
  d.setDate(d.getDate() + (freeDays - 1));
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Tính số ngày còn lại hoặc quá hạn:
 * Trả về: số ngày (dương: còn X ngày, 0: hôm nay hết hạn, âm: quá hạn |X| ngày)
 */
export function getDaysDiffFromToday(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return null;
  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = target.getTime() - todayNormalized.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ── Validation Helpers for Each Milestone ─────────────────────────────────────

export function validateMilestone1(m1: MilestonePortArrival): MilestoneValidationResult {
  const missing: { key: string; label: string }[] = [];
  let totalRequired = 7;
  let filledRequired = 0;

  if (!m1.arrivalDate) missing.push({ key: 'arrivalDate', label: 'Ngày hàng đến' });
  else filledRequired++;

  if (!m1.arrivalPort) missing.push({ key: 'arrivalPort', label: 'Cảng đến' });
  else filledRequired++;

  if (!m1.customsOffice) missing.push({ key: 'customsOffice', label: 'Chi cục hải quan' });
  else filledRequired++;

  if (!m1.shippingLine) missing.push({ key: 'shippingLine', label: 'Hãng tàu' });
  else filledRequired++;

  if (!m1.billOfLading) missing.push({ key: 'billOfLading', label: 'Số BL' });
  else filledRequired++;

  if (m1.localChargeFee === undefined || m1.localChargeFee === null || m1.localChargeFee <= 0) {
    missing.push({ key: 'localChargeFee', label: 'Phí local charge' });
  } else {
    filledRequired++;
  }

  // Check containers: phải có ít nhất 1 cont với đầy đủ số cont và số seal
  const validContainers = m1.containers?.filter(c => c.containerNumber?.trim() && c.sealNumber?.trim());
  if (!validContainers || validContainers.length === 0) {
    missing.push({ key: 'containers', label: 'Danh sách Số cont & Số seal' });
  } else {
    filledRequired++;
  }

  if (!m1.declarationNumber) missing.push({ key: 'declarationNumber', label: 'Số tờ khai' });
  else { totalRequired++; filledRequired++; }

  if (!m1.declarationDate) missing.push({ key: 'declarationDate', label: 'Ngày tờ khai' });
  else { totalRequired++; filledRequired++; }

  if (!m1.declarationChannel) missing.push({ key: 'declarationChannel', label: 'Luồng tờ khai' });
  else { totalRequired++; filledRequired++; }

  const completionPercentage = Math.round((filledRequired / totalRequired) * 100);
  return {
    isCompleted: missing.length === 0,
    missingFields: missing,
    completionPercentage,
  };
}

export function validateMilestone2(m2: MilestoneCustoms): MilestoneValidationResult {
  const missing: { key: string; label: string }[] = [];
  const totalRequired = 4;
  let filledRequired = 0;

  if (m2.customsFee === undefined || m2.customsFee === null || m2.customsFee <= 0) {
    missing.push({ key: 'customsFee', label: 'Phí hải quan' });
  } else filledRequired++;

  if (m2.sealTrackingFee === undefined || m2.sealTrackingFee === null || m2.sealTrackingFee <= 0) {
    missing.push({ key: 'sealTrackingFee', label: 'Phí gắn seal định vị' });
  } else filledRequired++;

  if (m2.portFee === undefined || m2.portFee === null || m2.portFee <= 0) {
    missing.push({ key: 'portFee', label: 'Phí cảng' });
  } else filledRequired++;

  if (!m2.clearanceDate) {
    missing.push({ key: 'clearanceDate', label: 'Ngày thông quan' });
  } else filledRequired++;

  const completionPercentage = Math.round((filledRequired / totalRequired) * 100);
  return {
    isCompleted: missing.length === 0,
    missingFields: missing,
    completionPercentage,
  };
}

export function validateMilestone3(m3: MilestoneTransport): MilestoneValidationResult {
  const missing: { key: string; label: string }[] = [];
  const totalRequired = 8;
  let filledRequired = 0;

  if (!m3.carrierName) missing.push({ key: 'carrierName', label: 'Tên đơn vị vận chuyển' });
  else filledRequired++;

  if (!m3.departureDate) missing.push({ key: 'departureDate', label: 'Ngày xe rời cảng' });
  else filledRequired++;

  if (!m3.route) missing.push({ key: 'route', label: 'Tuyến đường đi' });
  else filledRequired++;

  if (!m3.destinationArrivalDate) missing.push({ key: 'destinationArrivalDate', label: 'Ngày xe tới cảng đích' });
  else filledRequired++;

  if (!m3.truckPlate) missing.push({ key: 'truckPlate', label: 'Biển số xe' });
  else filledRequired++;

  if (!m3.driverName) missing.push({ key: 'driverName', label: 'Tên tài xế' });
  else filledRequired++;

  if (!m3.driverPhone) missing.push({ key: 'driverPhone', label: 'SĐT tài xế' });
  else filledRequired++;

  if (m3.transportFee === undefined || m3.transportFee === null || m3.transportFee <= 0) {
    missing.push({ key: 'transportFee', label: 'Phí vận chuyển' });
  } else filledRequired++;

  const completionPercentage = Math.round((filledRequired / totalRequired) * 100);
  return {
    isCompleted: missing.length === 0,
    missingFields: missing,
    completionPercentage,
  };
}

export function validateMilestone4(m4: MilestoneBorderGate): MilestoneValidationResult {
  const missing: { key: string; label: string }[] = [];
  const totalRequired = 4;
  let filledRequired = 0;

  if (!m4.borderGateName) missing.push({ key: 'borderGateName', label: 'Tên cửa khẩu xuất' });
  else filledRequired++;

  if (m4.customsBorderFee === undefined || m4.customsBorderFee === null || m4.customsBorderFee <= 0) {
    missing.push({ key: 'customsBorderFee', label: 'Phí hải quan CK' });
  } else filledRequired++;

  if (m4.serviceFee === undefined || m4.serviceFee === null || m4.serviceFee <= 0) {
    missing.push({ key: 'serviceFee', label: 'Phí dịch vụ' });
  } else filledRequired++;

  if (m4.borderFee === undefined || m4.borderFee === null || m4.borderFee <= 0) {
    missing.push({ key: 'borderFee', label: 'Phí cửa khẩu' });
  } else filledRequired++;

  const completionPercentage = Math.round((filledRequired / totalRequired) * 100);
  return {
    isCompleted: missing.length === 0,
    missingFields: missing,
    completionPercentage,
  };
}

export function validateMilestone5(m5: MilestoneEmptyReturn): MilestoneValidationResult {
  const missing: { key: string; label: string }[] = [];
  const totalRequired = 3;
  let filledRequired = 0;

  if (!m5.depotName) missing.push({ key: 'depotName', label: 'Tên depot' });
  else filledRequired++;

  if (m5.returnFee === undefined || m5.returnFee === null || m5.returnFee <= 0) {
    missing.push({ key: 'returnFee', label: 'Phí trả rỗng' });
  } else filledRequired++;

  if (!m5.actualReturnDate) missing.push({ key: 'actualReturnDate', label: 'Ngày trả rỗng thực tế' });
  else filledRequired++;

  const completionPercentage = Math.round((filledRequired / totalRequired) * 100);
  return {
    isCompleted: missing.length === 0,
    missingFields: missing,
    completionPercentage,
  };
}

// ── Default Mock Factory ──────────────────────────────────────────────────────

export function getDefaultMilestones(_shipmentId: string, initialData?: any): TransitMilestonesData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    m1: {
      arrivalDate: initialData?.actualArrivalDate?.slice(0, 10) || initialData?.estimatedArrivalDate?.slice(0, 10) || today,
      arrivalPort: initialData?.transitPort || initialData?.destinationId || 'Cảng Cát Lái (VNSGN)',
      customsOffice: 'Chi cục HQ Cát Lái',
      shippingLine: initialData?.shippingLine || 'SITC Logistics',
      billOfLading: initialData?.billOfLading || '',
      localChargeFee: 2850000,
      containers: [
        { id: '1', containerNumber: '', sealNumber: '', containerType: '40HC' },
      ],
      declarationNumber: '',
      declarationDate: today,
      declarationChannel: 'YELLOW',
      freeDemDays: 3,
      freeDetDays: 4,
      freeStoDays: 2,
      demExpiryDate: calculateExpiryDate(today, 3),
      stoExpiryDate: calculateExpiryDate(today, 2),
      commodityName: initialData?.commodityName || '',
      hsCode: initialData?.hsCode || '',
      containerDepositFee: 0,
      declarationServiceFee: 0,
      vesselName: '',
      notes: '',
      isCompleted: false,
    },
    m2: {
      customsFee: 0,
      sealTrackingFee: 0,
      portFee: 0,
      clearanceDate: '',
      inspectionScanFee: 0,
      physicalCheckFee: 0,
      brokerName: '',
      transitPermitNo: '',
      notes: '',
      isCompleted: false,
    },
    m3: {
      carrierName: '',
      departureDate: '',
      route: '',
      destinationArrivalDate: '',
      truckPlate: '',
      driverName: '',
      driverPhone: '',
      transportFee: 0,
      detExpiryDate: undefined,
      extraFees: 0,
      extraFeeDescription: '',
      notes: '',
      isCompleted: false,
    },
    m4: {
      borderGateName: initialData?.borderGateName || 'Cửa khẩu Quốc tế Mộc Bài (Tây Ninh)',
      customsBorderFee: 0,
      serviceFee: 0,
      borderFee: 0,
      borderPassDate: '',
      extraFees: 0,
      extraFeeDescription: '',
      cambodiaPartner: '',
      notes: '',
      isCompleted: false,
    },
    m5: {
      depotName: '',
      returnFee: 0,
      actualReturnDate: '',
      extraFees: 0,
      extraFeeDescription: '',
      containerCondition: '',
      notes: '',
      isCompleted: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

// ── Local Storage Helper ──────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'logiflow_transit_milestones_';
const FINANCIAL_KEY_PREFIX = 'logiflow_shipment_costs_';

export function loadMilestonesFromStorage(shipmentId: string, initialShipment?: any): TransitMilestonesData {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${shipmentId}`);
    if (raw) {
      const parsed: TransitMilestonesData = JSON.parse(raw);
      // Auto-recalculate dates if needed
      if (parsed.m1?.arrivalDate && parsed.m1?.freeDemDays) {
        parsed.m1.demExpiryDate = calculateExpiryDate(parsed.m1.arrivalDate, parsed.m1.freeDemDays);
      }
      if (parsed.m1?.arrivalDate && parsed.m1?.freeStoDays) {
        parsed.m1.stoExpiryDate = calculateExpiryDate(parsed.m1.arrivalDate, parsed.m1.freeStoDays);
      }
      if (parsed.m3?.departureDate && parsed.m1?.freeDetDays) {
        parsed.m3.detExpiryDate = calculateExpiryDate(parsed.m3.departureDate, parsed.m1.freeDetDays);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load milestones from storage:', e);
  }
  const defaultData = getDefaultMilestones(shipmentId, initialShipment);
  saveMilestonesToStorage(shipmentId, defaultData);
  return defaultData;
}

export function saveMilestonesToStorage(shipmentId: string, data: TransitMilestonesData): void {
  try {
    data.updatedAt = new Date().toISOString();
    // Validate and update isCompleted for each milestone
    data.m1.isCompleted = validateMilestone1(data.m1).isCompleted;
    data.m2.isCompleted = validateMilestone2(data.m2).isCompleted;
    data.m3.isCompleted = validateMilestone3(data.m3).isCompleted;
    data.m4.isCompleted = validateMilestone4(data.m4).isCompleted;
    data.m5.isCompleted = validateMilestone5(data.m5).isCompleted;

    localStorage.setItem(`${STORAGE_KEY_PREFIX}${shipmentId}`, JSON.stringify(data));
    
    // Auto-sync financial items
    syncMilestonesToFinancialStorage(shipmentId, data);
  } catch (e) {
    console.error('Failed to save milestones to storage:', e);
  }
}

// ── Financial Sync Helper ─────────────────────────────────────────────────────

export function loadShipmentCostsFromStorage(shipmentId: string): FinancialCostItem[] {
  try {
    const raw = localStorage.getItem(`${FINANCIAL_KEY_PREFIX}${shipmentId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load financial costs:', e);
  }
  return [];
}

export function saveShipmentCostsToStorage(shipmentId: string, costs: FinancialCostItem[]): void {
  try {
    localStorage.setItem(`${FINANCIAL_KEY_PREFIX}${shipmentId}`, JSON.stringify(costs));
  } catch (e) {
    console.error('Failed to save financial costs:', e);
  }
}

export function syncMilestonesToFinancialStorage(shipmentId: string, milestones: TransitMilestonesData): FinancialCostItem[] {
  const existing = loadShipmentCostsFromStorage(shipmentId);
  const existingMap = new Map(existing.map(item => [item.id, item]));

  const autoFeeDefinitions: Array<{
    id: string;
    milestoneKey: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
    milestoneLabel: string;
    feeName: string;
    amount: number;
    isMandatoryFee: boolean;
    date: string;
  }> = [
    // Mốc 1
    { id: `${shipmentId}_m1_local`, milestoneKey: 'm1', milestoneLabel: '1. Hàng đến cảng', feeName: 'Phí local charge', amount: milestones.m1.localChargeFee || 0, isMandatoryFee: true, date: milestones.m1.arrivalDate },
    { id: `${shipmentId}_m1_deposit`, milestoneKey: 'm1', milestoneLabel: '1. Hàng đến cảng', feeName: 'Phí cược container', amount: milestones.m1.containerDepositFee || 0, isMandatoryFee: false, date: milestones.m1.arrivalDate },
    { id: `${shipmentId}_m1_decl_service`, milestoneKey: 'm1', milestoneLabel: '1. Hàng đến cảng', feeName: 'Phí khai báo hải quan', amount: milestones.m1.declarationServiceFee || 0, isMandatoryFee: false, date: milestones.m1.declarationDate || milestones.m1.arrivalDate },

    // Mốc 2
    { id: `${shipmentId}_m2_customs`, milestoneKey: 'm2', milestoneLabel: '2. Hải quan', feeName: 'Phí hải quan', amount: milestones.m2.customsFee || 0, isMandatoryFee: true, date: milestones.m2.clearanceDate },
    { id: `${shipmentId}_m2_seal`, milestoneKey: 'm2', milestoneLabel: '2. Hải quan', feeName: 'Phí gắn seal định vị', amount: milestones.m2.sealTrackingFee || 0, isMandatoryFee: true, date: milestones.m2.clearanceDate },
    { id: `${shipmentId}_m2_port`, milestoneKey: 'm2', milestoneLabel: '2. Hải quan', feeName: 'Phí cảng', amount: milestones.m2.portFee || 0, isMandatoryFee: true, date: milestones.m2.clearanceDate },
    { id: `${shipmentId}_m2_scan`, milestoneKey: 'm2', milestoneLabel: '2. Hải quan', feeName: 'Phí soi chiếu hải quan', amount: milestones.m2.inspectionScanFee || 0, isMandatoryFee: false, date: milestones.m2.clearanceDate },
    { id: `${shipmentId}_m2_check`, milestoneKey: 'm2', milestoneLabel: '2. Hải quan', feeName: 'Phí kiểm hóa hải quan', amount: milestones.m2.physicalCheckFee || 0, isMandatoryFee: false, date: milestones.m2.clearanceDate },

    // Mốc 3
    { id: `${shipmentId}_m3_transport`, milestoneKey: 'm3', milestoneLabel: '3. Vận chuyển', feeName: 'Phí vận chuyển', amount: milestones.m3.transportFee || 0, isMandatoryFee: true, date: milestones.m3.departureDate },
    { id: `${shipmentId}_m3_extra`, milestoneKey: 'm3', milestoneLabel: '3. Vận chuyển', feeName: milestones.m3.extraFeeDescription || 'Phụ phí phát sinh vận chuyển', amount: milestones.m3.extraFees || 0, isMandatoryFee: false, date: milestones.m3.departureDate },

    // Mốc 4
    { id: `${shipmentId}_m4_customs_border`, milestoneKey: 'm4', milestoneLabel: '4. Cửa khẩu xuất', feeName: 'Phí hải quan cửa khẩu', amount: milestones.m4.customsBorderFee || 0, isMandatoryFee: true, date: milestones.m4.borderPassDate || milestones.m3.departureDate },
    { id: `${shipmentId}_m4_service`, milestoneKey: 'm4', milestoneLabel: '4. Cửa khẩu xuất', feeName: 'Phí dịch vụ cửa khẩu', amount: milestones.m4.serviceFee || 0, isMandatoryFee: true, date: milestones.m4.borderPassDate || milestones.m3.departureDate },
    { id: `${shipmentId}_m4_border`, milestoneKey: 'm4', milestoneLabel: '4. Cửa khẩu xuất', feeName: 'Phí cửa khẩu', amount: milestones.m4.borderFee || 0, isMandatoryFee: true, date: milestones.m4.borderPassDate || milestones.m3.departureDate },
    { id: `${shipmentId}_m4_extra`, milestoneKey: 'm4', milestoneLabel: '4. Cửa khẩu xuất', feeName: milestones.m4.extraFeeDescription || 'Phụ phí phát sinh tại cửa khẩu', amount: milestones.m4.extraFees || 0, isMandatoryFee: false, date: milestones.m4.borderPassDate || milestones.m3.departureDate },

    // Mốc 5
    { id: `${shipmentId}_m5_return`, milestoneKey: 'm5', milestoneLabel: '5. Trả rỗng', feeName: 'Phí trả rỗng', amount: milestones.m5.returnFee || 0, isMandatoryFee: true, date: milestones.m5.actualReturnDate },
    { id: `${shipmentId}_m5_extra`, milestoneKey: 'm5', milestoneLabel: '5. Trả rỗng', feeName: milestones.m5.extraFeeDescription || 'Phụ phí phát sinh trả rỗng', amount: milestones.m5.extraFees || 0, isMandatoryFee: false, date: milestones.m5.actualReturnDate },
  ];

  const updatedCosts: FinancialCostItem[] = [];

  // 1. Process standard milestone fees
  for (const def of autoFeeDefinitions) {
    if (def.amount > 0 || def.isMandatoryFee) {
      const prev = existingMap.get(def.id);
      updatedCosts.push({
        id: def.id,
        shipmentId,
        milestoneKey: def.milestoneKey,
        milestoneLabel: def.milestoneLabel,
        feeName: def.feeName,
        amount: def.amount,
        requestDate: prev?.requestDate || def.date || new Date().toISOString().slice(0, 10),
        status: prev?.status || 'PENDING',
        uncAttachmentUrl: prev?.uncAttachmentUrl,
        uncFileName: prev?.uncFileName,
        uncUploadDate: prev?.uncUploadDate,
        isMandatoryFee: def.isMandatoryFee,
        notes: prev?.notes,
      });
      existingMap.delete(def.id);
    }
  }

  // 2. Retain user-added manual extra fees
  for (const extraItem of existingMap.values()) {
    if (extraItem.milestoneKey === 'extra' || !autoFeeDefinitions.some(d => d.id === extraItem.id)) {
      updatedCosts.push(extraItem);
    }
  }

  saveShipmentCostsToStorage(shipmentId, updatedCosts);
  return updatedCosts;
}

// ── Check if shipment has completed all 5 milestones ──────────────────────────
export function checkAllMilestonesCompleted(milestones: TransitMilestonesData): boolean {
  const v1 = validateMilestone1(milestones.m1);
  const v2 = validateMilestone2(milestones.m2);
  const v3 = validateMilestone3(milestones.m3);
  const v4 = validateMilestone4(milestones.m4);
  const v5 = validateMilestone5(milestones.m5);

  return v1.isCompleted && v2.isCompleted && v3.isCompleted && v4.isCompleted && v5.isCompleted;
}

// ── Shipment P&L (Doanh thu - Chi phí - Lợi nhuận) ───────────────────────────

const PNL_KEY_PREFIX = 'logiflow_shipment_pnl_';

export interface ShipmentPnlData {
  shipmentId: string;
  trackingNumber: string;
  customerName?: string;
  directCost: number; // Tổng chi phí trực tiếp (tự động đồng bộ từ Tab Tài chính / 5 mốc)
  managementCost: number; // Chi phí quản lý (nhập vào cuối tháng hoặc áp dụng hàng loạt)
  totalCost: number; // directCost + managementCost (tự động cộng)
  revenue: number; // Doanh thu lô (nhập vào)
  netProfit: number; // revenue - totalCost (tự động tính)
  notes?: string;
  createdAt?: string;
}

export function getShipmentDirectCost(shipmentId: string): number {
  try {
    const costs = loadShipmentCostsFromStorage(shipmentId);
    if (costs.length > 0) {
      return costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    }
    // Fallback: check if milestones exist and sync
    const rawMilestones = localStorage.getItem(`logiflow_transit_milestones_${shipmentId}`);
    if (rawMilestones) {
      const parsed = JSON.parse(rawMilestones);
      const synced = syncMilestonesToFinancialStorage(shipmentId, parsed);
      return synced.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    }
  } catch (e) {
    console.error(e);
  }
  return 0;
}

export function loadShipmentPnl(shipmentId: string): { managementCost: number; revenue: number; notes?: string } {
  try {
    const raw = localStorage.getItem(`${PNL_KEY_PREFIX}${shipmentId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return { managementCost: 800000, revenue: 3400000 };
}

export function saveShipmentPnl(shipmentId: string, data: { managementCost: number; revenue: number; notes?: string }): void {
  try {
    localStorage.setItem(`${PNL_KEY_PREFIX}${shipmentId}`, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Format currency in Vietnamese accounting standard:
 * > 0: "100,000"
 * = 0: "-"
 * < 0: "(100,000)"
 */
export function formatAccountingCurrency(amount: number): string {
  if (amount === 0) return '-';
  if (amount < 0) {
    return `(${Math.abs(amount).toLocaleString('vi-VN')})`;
  }
  return amount.toLocaleString('vi-VN');
}

