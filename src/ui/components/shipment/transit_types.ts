// Types and helpers for 5 Transit Milestones & Cost Reconciliation
import { apiFetch } from '@/lib/fetch.js';

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

// ── Timeline Logic & Inconsistency Scanner ───────────────────────────────────

export interface TimelineIssue {
  id: string;
  type: 'ERROR' | 'WARNING'; // ERROR: logic bất hợp lý; WARNING: trễ hạn hoặc nguy cơ phát sinh phí
  milestones: ('m1' | 'm2' | 'm3' | 'm4' | 'm5')[];
  fieldKeys: string[];
  title: string;
  message: string;
  suggestion?: string;
}

/**
 * Quét toàn bộ dòng thời gian của lô hàng qua 5 mốc vận chuyển
 * để phát hiện các lỗi logic ngày tháng, vi phạm quy trình logistics hoặc trễ hạn DEM/DET.
 */
export function scanShipmentTimeline(data: TransitMilestonesData): TimelineIssue[] {
  const issues: TimelineIssue[] = [];

  const parseDate = (d?: string) => {
    if (!d) return null;
    const parts = d.split('-');
    if (parts.length !== 3) return null;
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  const m1Arrival = parseDate(data.m1?.arrivalDate);
  const m1Dem = parseDate(data.m1?.demExpiryDate);
  const m2Clearance = parseDate(data.m2?.clearanceDate);
  const m3Departure = parseDate(data.m3?.departureDate);
  const m3Arrival = parseDate(data.m3?.destinationArrivalDate);
  const m3Det = parseDate(data.m3?.detExpiryDate);
  const m4BorderPass = parseDate(data.m4?.borderPassDate);
  const m5Return = parseDate(data.m5?.actualReturnDate);

  // 1. Mốc 2 vs Mốc 1: Ngày thông quan trước ngày hàng đến
  if (m1Arrival && m2Clearance && m2Clearance < m1Arrival) {
    issues.push({
      id: 'clearance_before_arrival',
      type: 'ERROR',
      milestones: ['m1', 'm2'],
      fieldKeys: ['clearanceDate', 'arrivalDate'],
      title: 'Ngày thông quan trước ngày hàng đến cảng',
      message: `Ngày thông quan (${data.m2.clearanceDate}) không thể diễn ra trước khi tàu cập cảng (${data.m1.arrivalDate}).`,
      suggestion: 'Điều chỉnh ngày thông quan bằng hoặc sau ngày hàng đến cảng.',
    });
  }

  // 2. Mốc 2 vs Mốc 1: Thông quan quá hạn DEM (Lưu bãi cảng)
  if (m1Dem && m2Clearance && m2Clearance > m1Dem) {
    issues.push({
      id: 'clearance_after_dem',
      type: 'WARNING',
      milestones: ['m1', 'm2'],
      fieldKeys: ['clearanceDate', 'demExpiryDate'],
      title: 'Thông quan trễ hơn hạn DEM',
      message: `Ngày thông quan (${data.m2.clearanceDate}) vượt quá hạn lưu bãi DEM (${data.m1.demExpiryDate}). Lô hàng sẽ phát sinh phí phạt lưu bãi tại cảng.`,
      suggestion: 'Kiểm tra và bổ sung phụ phí lưu bãi cảng phát sinh vào bảng đối chiếu tài chính.',
    });
  }

  // 3. Mốc 3 vs Mốc 2: Xe rời cảng trước khi thông quan
  if (m2Clearance && m3Departure && m3Departure < m2Clearance) {
    issues.push({
      id: 'departure_before_clearance',
      type: 'ERROR',
      milestones: ['m2', 'm3'],
      fieldKeys: ['departureDate', 'clearanceDate'],
      title: 'Xe rời cảng trước ngày thông quan',
      message: `Xe vận chuyển rời cảng (${data.m3.departureDate}) trước khi tờ khai hải quan được thông quan (${data.m2.clearanceDate}).`,
      suggestion: 'Chỉ xuất bãi vận chuyển sau khi hải quan đã cấp phép thông quan.',
    });
  }

  // 4. Mốc 3 vs Mốc 1: Xe rời cảng trước ngày hàng đến
  if (m1Arrival && m3Departure && m3Departure < m1Arrival) {
    issues.push({
      id: 'departure_before_arrival',
      type: 'ERROR',
      milestones: ['m1', 'm3'],
      fieldKeys: ['departureDate', 'arrivalDate'],
      title: 'Xe rời cảng trước ngày tàu đến',
      message: `Ngày xe rời cảng (${data.m3.departureDate}) không thể trước ngày tàu cập cảng (${data.m1.arrivalDate}).`,
      suggestion: 'Kiểm tra lại ngày xuất bãi xe container.',
    });
  }

  // 5. Mốc 3 vs Mốc 1: Xe rời cảng sau hạn DEM
  if (m1Dem && m3Departure && m3Departure > m1Dem) {
    issues.push({
      id: 'departure_after_dem',
      type: 'WARNING',
      milestones: ['m1', 'm3'],
      fieldKeys: ['departureDate', 'demExpiryDate'],
      title: 'Xe lấy cont trễ hơn hạn DEM',
      message: `Xe lấy container rời cảng (${data.m3.departureDate}) sau hạn lưu bãi DEM (${data.m1.demExpiryDate}).`,
      suggestion: 'Lô hàng có nguy cơ bị cảng / hãng tàu truy thu phí lưu bãi DEM.',
    });
  }

  // 6. Mốc 3: Ngày đến đích trước ngày rời cảng
  if (m3Departure && m3Arrival && m3Arrival < m3Departure) {
    issues.push({
      id: 'arrival_before_departure',
      type: 'ERROR',
      milestones: ['m3'],
      fieldKeys: ['destinationArrivalDate', 'departureDate'],
      title: 'Ngày xe tới đích trước ngày rời cảng',
      message: `Ngày xe tới cảng đích (${data.m3.destinationArrivalDate}) không thể trước ngày xe rời cảng xuất phát (${data.m3.departureDate}).`,
      suggestion: 'Cập nhật lại ngày xe đến điểm giao hàng đích.',
    });
  }

  // 7. Mốc 4 vs Mốc 3: Hàng qua cửa khẩu trước khi rời cảng
  if (m3Departure && m4BorderPass && m4BorderPass < m3Departure) {
    issues.push({
      id: 'border_before_departure',
      type: 'ERROR',
      milestones: ['m3', 'm4'],
      fieldKeys: ['borderPassDate', 'departureDate'],
      title: 'Hàng qua cửa khẩu trước khi xe rời cảng',
      message: `Ngày qua cửa khẩu (${data.m4.borderPassDate}) trước ngày xe chở container rời cảng (${data.m3.departureDate}).`,
      suggestion: 'Kiểm tra lại ngày qua cửa khẩu biên giới.',
    });
  }

  // 8. Mốc 4 vs Mốc 3: Hàng qua cửa khẩu sau khi đã tới đích
  if (m3Arrival && m4BorderPass && m4BorderPass > m3Arrival) {
    issues.push({
      id: 'border_after_destination',
      type: 'ERROR',
      milestones: ['m3', 'm4'],
      fieldKeys: ['borderPassDate', 'destinationArrivalDate'],
      title: 'Hàng qua cửa khẩu sau ngày tới đích',
      message: `Ngày qua cửa khẩu (${data.m4.borderPassDate}) diễn ra sau ngày xe tới cảng đích (${data.m3.destinationArrivalDate}).`,
      suggestion: 'Kiểm tra lại thứ tự ngày qua biên giới và ngày giao hàng.',
    });
  }

  // 9. Mốc 5 vs Mốc 3: Trả rỗng trước ngày xe tới đích
  if (m3Arrival && m5Return && m5Return < m3Arrival) {
    issues.push({
      id: 'return_before_destination',
      type: 'ERROR',
      milestones: ['m3', 'm5'],
      fieldKeys: ['actualReturnDate', 'destinationArrivalDate'],
      title: 'Trả rỗng trước ngày giao hàng tới đích',
      message: `Ngày trả vỏ cont rỗng (${data.m5.actualReturnDate}) trước ngày xe giao hàng tới điểm đích (${data.m3.destinationArrivalDate}).`,
      suggestion: 'Container chỉ được trả rỗng về depot sau khi đã rút ruột giao hàng tại điểm đích.',
    });
  }

  // 10. Mốc 5 vs Mốc 3: Trả rỗng trễ hơn hạn DET của hãng tàu (Phạt DET)
  if (m3Det && m5Return && m5Return > m3Det) {
    issues.push({
      id: 'return_after_det',
      type: 'WARNING',
      milestones: ['m3', 'm5'],
      fieldKeys: ['actualReturnDate', 'detExpiryDate'],
      title: 'Trả rỗng trễ hạn DET (Phát sinh phạt lưu vỏ)',
      message: `Ngày trả rỗng thực tế (${data.m5.actualReturnDate}) trễ hơn hạn DET miễn phí (${data.m3.detExpiryDate}). Hãng tàu sẽ tính phí phạt DET!`,
      suggestion: 'Đính kèm chứng từ phạt DET vào bảng đối chiếu chi phí để quyết toán.',
    });
  }

  // 11. Kiểm tra năm bất thường (gõ nhầm năm)
  const allDates = [
    { label: 'Ngày hàng đến', val: m1Arrival, str: data.m1?.arrivalDate },
    { label: 'Ngày thông quan', val: m2Clearance, str: data.m2?.clearanceDate },
    { label: 'Ngày xe rời cảng', val: m3Departure, str: data.m3?.departureDate },
    { label: 'Ngày tới đích', val: m3Arrival, str: data.m3?.destinationArrivalDate },
    { label: 'Ngày qua cửa khẩu', val: m4BorderPass, str: data.m4?.borderPassDate },
    { label: 'Ngày trả rỗng', val: m5Return, str: data.m5?.actualReturnDate },
  ];

  const currentYear = new Date().getFullYear();
  allDates.forEach((item) => {
    if (item.val) {
      const year = item.val.getFullYear();
      if (year < currentYear - 2 || year > currentYear + 2) {
        issues.push({
          id: `unusual_year_${item.label}`,
          type: 'WARNING',
          milestones: ['m1'],
          fieldKeys: [],
          title: `Năm bất thường tại ${item.label}`,
          message: `${item.label} đang để năm ${year} (${item.str}), vui lòng kiểm tra lại.`,
          suggestion: 'Kiểm tra lại định dạng YYYY-MM-DD.',
        });
      }
    }
  });

  return issues;
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

export interface ShipmentActivityPayload {
  id?: string;
  action: string;
  description: string | { vi: string; en: string };
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdAt?: string;
  createdBy?: string;
}

export function recordShipmentActivity(shipmentId: string, activity: ShipmentActivityPayload): void {
  try {
    const actId = activity.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const authorName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'You';

    const newActivity = {
      id: actId,
      shipmentId,
      action: activity.action,
      description: typeof activity.description === 'string' ? { vi: activity.description, en: activity.description } : activity.description,
      entityType: activity.entityType || 'SHIPMENT',
      entityId: activity.entityId,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      createdAt: activity.createdAt || nowIso,
      createdBy: authorName,
    };

    // 1. Save to LocalStorage for instant reactive UI updates
    const key = `logiflow_activities_${shipmentId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem(key, JSON.stringify([newActivity, ...list].slice(0, 200)));

    // 2. Sync to Backend API in background
    apiFetch(`/api/shipments/${shipmentId}/activities`, {
      method: 'POST',
      body: JSON.stringify({
        action: newActivity.action,
        description: newActivity.description.vi || newActivity.description.en,
        entityType: newActivity.entityType,
        entityId: newActivity.entityId,
        oldValue: newActivity.oldValue,
        newValue: newActivity.newValue,
      }),
    }).catch(() => {
      // Backend may be offline or in mock mode; local store guarantees persistence
    });
  } catch (e) {
    console.error('Failed to record activity:', e);
  }
}

function diffAndLogMilestoneChanges(shipmentId: string, oldData: TransitMilestonesData, newData: TransitMilestonesData): void {
  // Milestone 1 diffs
  if (oldData.m1?.arrivalDate !== newData.m1?.arrivalDate && newData.m1?.arrivalDate) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_UPDATED',
      description: { vi: `Mốc 1 (Cảng đến): Cập nhật ngày hàng đến: "${newData.m1.arrivalDate}" (cũ: "${oldData.m1?.arrivalDate || 'trống'}")`, en: `Milestone 1: Updated arrival date to "${newData.m1.arrivalDate}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m1?.arrivalDate,
      newValue: newData.m1.arrivalDate,
    });
  }
  if (oldData.m1?.shippingLine !== newData.m1?.shippingLine && newData.m1?.shippingLine) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_UPDATED',
      description: { vi: `Mốc 1: Cập nhật hãng tàu: "${newData.m1.shippingLine}"`, en: `Milestone 1: Updated shipping line "${newData.m1.shippingLine}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m1?.shippingLine,
      newValue: newData.m1.shippingLine,
    });
  }
  if (oldData.m1?.billOfLading !== newData.m1?.billOfLading && newData.m1?.billOfLading) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_UPDATED',
      description: { vi: `Mốc 1: Cập nhật số vận đơn (BL): "${newData.m1.billOfLading}"`, en: `Milestone 1: Updated Bill of Lading "${newData.m1.billOfLading}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m1?.billOfLading,
      newValue: newData.m1.billOfLading,
    });
  }
  if (oldData.m1?.freeDemDays !== newData.m1?.freeDemDays && newData.m1?.freeDemDays !== undefined) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_UPDATED',
      description: { vi: `Mốc 1: Cập nhật số ngày miễn lưu bãi (DEM): ${newData.m1.freeDemDays} ngày (Hạn: ${newData.m1.demExpiryDate || '—'})`, en: `Milestone 1: Updated free DEM days to ${newData.m1.freeDemDays}` },
      entityType: 'MILESTONE',
      oldValue: `${oldData.m1?.freeDemDays} ngày`,
      newValue: `${newData.m1.freeDemDays} ngày`,
    });
  }
  if (oldData.m1?.freeDetDays !== newData.m1?.freeDetDays && newData.m1?.freeDetDays !== undefined) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_UPDATED',
      description: { vi: `Mốc 1: Cập nhật số ngày miễn lưu vỏ (DET): ${newData.m1.freeDetDays} ngày`, en: `Milestone 1: Updated free DET days to ${newData.m1.freeDetDays}` },
      entityType: 'MILESTONE',
      oldValue: `${oldData.m1?.freeDetDays} ngày`,
      newValue: `${newData.m1.freeDetDays} ngày`,
    });
  }
  if (oldData.m1?.declarationNumber !== newData.m1?.declarationNumber && newData.m1?.declarationNumber) {
    recordShipmentActivity(shipmentId, {
      action: 'CUSTOMS_UPDATED',
      description: { vi: `Mốc 1: Cập nhật số tờ khai HQ: "${newData.m1.declarationNumber}"`, en: `Milestone 1: Updated customs declaration "${newData.m1.declarationNumber}"` },
      entityType: 'CUSTOMS',
      oldValue: oldData.m1?.declarationNumber,
      newValue: newData.m1.declarationNumber,
    });
  }
  if (!oldData.m1?.isCompleted && newData.m1?.isCompleted) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_COMPLETED',
      description: { vi: 'Mốc 1: Đã hoàn thành thủ tục tại Cảng đến Cát Lái', en: 'Milestone 1: Port arrival completed' },
      entityType: 'MILESTONE',
      newValue: 'ĐÃ HOÀN THÀNH',
    });
  }

  // Milestone 2 diffs (Hải quan)
  if (oldData.m2?.clearanceDate !== newData.m2?.clearanceDate && newData.m2?.clearanceDate) {
    recordShipmentActivity(shipmentId, {
      action: 'CUSTOMS_UPDATED',
      description: { vi: `Mốc 2 (Hải quan): Cập nhật ngày thông quan: "${newData.m2.clearanceDate}"`, en: `Milestone 2: Updated customs clearance date "${newData.m2.clearanceDate}"` },
      entityType: 'CUSTOMS',
      oldValue: oldData.m2?.clearanceDate,
      newValue: newData.m2.clearanceDate,
    });
  }
  if (oldData.m2?.transitPermitNo !== newData.m2?.transitPermitNo && newData.m2?.transitPermitNo) {
    recordShipmentActivity(shipmentId, {
      action: 'CUSTOMS_UPDATED',
      description: { vi: `Mốc 2: Cập nhật giấy phép quá cảnh: "${newData.m2.transitPermitNo}"`, en: `Milestone 2: Updated transit permit "${newData.m2.transitPermitNo}"` },
      entityType: 'CUSTOMS',
      oldValue: oldData.m2?.transitPermitNo,
      newValue: newData.m2.transitPermitNo,
    });
  }
  if (oldData.m2?.brokerName !== newData.m2?.brokerName && newData.m2?.brokerName) {
    recordShipmentActivity(shipmentId, {
      action: 'CUSTOMS_UPDATED',
      description: { vi: `Mốc 2: Cập nhật đại lý hải quan: "${newData.m2.brokerName}"`, en: `Milestone 2: Updated customs broker "${newData.m2.brokerName}"` },
      entityType: 'CUSTOMS',
      oldValue: oldData.m2?.brokerName,
      newValue: newData.m2.brokerName,
    });
  }
  if (!oldData.m2?.isCompleted && newData.m2?.isCompleted) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_COMPLETED',
      description: { vi: 'Mốc 2: Đã hoàn thành thủ tục Hải quan quá cảnh', en: 'Milestone 2: Customs clearance completed' },
      entityType: 'CUSTOMS',
      newValue: 'ĐÃ HOÀN THÀNH',
    });
  }

  // Milestone 3 diffs (Vận chuyển đường bộ)
  if (oldData.m3?.truckPlate !== newData.m3?.truckPlate && newData.m3?.truckPlate) {
    recordShipmentActivity(shipmentId, {
      action: 'TRUCKING_UPDATED',
      description: { vi: `Mốc 3 (Vận chuyển): Cập nhật biển số xe vận chuyển: "${newData.m3.truckPlate}" (Tài xế: ${newData.m3.driverName || '—'})`, en: `Milestone 3: Updated truck plate "${newData.m3.truckPlate}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m3?.truckPlate,
      newValue: newData.m3.truckPlate,
    });
  }
  if (oldData.m3?.departureDate !== newData.m3?.departureDate && newData.m3?.departureDate) {
    recordShipmentActivity(shipmentId, {
      action: 'TRUCKING_UPDATED',
      description: { vi: `Mốc 3: Xe bắt đầu lăn bánh rời cảng: "${newData.m3.departureDate}"`, en: `Milestone 3: Truck departed on "${newData.m3.departureDate}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m3?.departureDate,
      newValue: newData.m3.departureDate,
    });
  }
  if (!oldData.m3?.isCompleted && newData.m3?.isCompleted) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_COMPLETED',
      description: { vi: 'Mốc 3: Đã hoàn thành khâu vận chuyển đường bộ đến biên giới', en: 'Milestone 3: Road trucking completed' },
      entityType: 'MILESTONE',
      newValue: 'ĐÃ HOÀN THÀNH',
    });
  }

  // Milestone 4 diffs (Cửa khẩu xuất)
  if (oldData.m4?.borderGateName !== newData.m4?.borderGateName && newData.m4?.borderGateName) {
    recordShipmentActivity(shipmentId, {
      action: 'BORDER_UPDATED',
      description: { vi: `Mốc 4 (Cửa khẩu): Cập nhật cửa khẩu xuất: "${newData.m4.borderGateName}"`, en: `Milestone 4: Updated border gate "${newData.m4.borderGateName}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m4?.borderGateName,
      newValue: newData.m4.borderGateName,
    });
  }
  if (!oldData.m4?.isCompleted && newData.m4?.isCompleted) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_COMPLETED',
      description: { vi: `Mốc 4: Đã hoàn tất thủ tục xuất cảnh qua cửa khẩu ${newData.m4.borderGateName || 'Mộc Bài'}`, en: 'Milestone 4: Border gate exit clearance completed' },
      entityType: 'MILESTONE',
      newValue: 'ĐÃ HOÀN THÀNH',
    });
  }

  // Milestone 5 diffs (Đích đến & Trả rỗng)
  if (oldData.m5?.depotName !== newData.m5?.depotName && newData.m5?.depotName) {
    recordShipmentActivity(shipmentId, {
      action: 'DEPOT_UPDATED',
      description: { vi: `Mốc 5 (Đích đến): Cập nhật bãi trả rỗng Depot: "${newData.m5.depotName}"`, en: `Milestone 5: Updated empty return depot "${newData.m5.depotName}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m5?.depotName,
      newValue: newData.m5.depotName,
    });
  }
  if (oldData.m5?.actualReturnDate !== newData.m5?.actualReturnDate && newData.m5?.actualReturnDate) {
    recordShipmentActivity(shipmentId, {
      action: 'DELIVERY_UPDATED',
      description: { vi: `Mốc 5: Cập nhật ngày trả rỗng vỏ container thực tế: "${newData.m5.actualReturnDate}"`, en: `Milestone 5: Return date "${newData.m5.actualReturnDate}"` },
      entityType: 'MILESTONE',
      oldValue: oldData.m5?.actualReturnDate,
      newValue: newData.m5.actualReturnDate,
    });
  }
  if (!oldData.m5?.isCompleted && newData.m5?.isCompleted) {
    recordShipmentActivity(shipmentId, {
      action: 'MILESTONE_COMPLETED',
      description: { vi: 'Mốc 5: Đã hoàn thành giao hàng thành công & trả vỏ container rỗng tại Depot', en: 'Milestone 5: Delivery and empty container return completed' },
      entityType: 'MILESTONE',
      newValue: 'ĐÃ HOÀN THÀNH',
    });
  }
}

export function saveMilestonesToStorage(shipmentId: string, data: TransitMilestonesData): void {
  try {
    const rawOld = localStorage.getItem(`${STORAGE_KEY_PREFIX}${shipmentId}`);
    const oldData: TransitMilestonesData | null = rawOld ? JSON.parse(rawOld) : null;

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

    // Audit log: diff old and new milestone fields
    if (oldData) {
      diffAndLogMilestoneChanges(shipmentId, oldData, data);
    }
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
    const rawOld = localStorage.getItem(`${FINANCIAL_KEY_PREFIX}${shipmentId}`);
    const oldCosts: FinancialCostItem[] = rawOld ? JSON.parse(rawOld) : [];

    localStorage.setItem(`${FINANCIAL_KEY_PREFIX}${shipmentId}`, JSON.stringify(costs));

    const oldTotal = oldCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const newTotal = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    if (rawOld && oldTotal !== newTotal) {
      recordShipmentActivity(shipmentId, {
        action: 'COSTS_UPDATED',
        description: {
          vi: `Cập nhật chi phí trực tiếp lô hàng: ${newTotal.toLocaleString('vi-VN')} đ (cũ: ${oldTotal.toLocaleString('vi-VN')} đ)`,
          en: `Updated direct costs: ${newTotal.toLocaleString('vi-VN')} đ (old: ${oldTotal.toLocaleString('vi-VN')} đ)`,
        },
        entityType: 'FINANCIAL',
        oldValue: `${oldTotal.toLocaleString('vi-VN')} đ`,
        newValue: `${newTotal.toLocaleString('vi-VN')} đ`,
      });
    }
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
    const rawOld = localStorage.getItem(`${PNL_KEY_PREFIX}${shipmentId}`);
    const oldPnl = rawOld ? JSON.parse(rawOld) : null;

    localStorage.setItem(`${PNL_KEY_PREFIX}${shipmentId}`, JSON.stringify(data));

    if (oldPnl && (oldPnl.managementCost !== data.managementCost || oldPnl.revenue !== data.revenue)) {
      recordShipmentActivity(shipmentId, {
        action: 'PNL_UPDATED',
        description: {
          vi: `Cập nhật tài chính P&L: CP quản lý ${data.managementCost.toLocaleString('vi-VN')} đ (cũ: ${oldPnl.managementCost.toLocaleString('vi-VN')} đ), Doanh thu ${data.revenue.toLocaleString('vi-VN')} đ (cũ: ${oldPnl.revenue.toLocaleString('vi-VN')} đ)`,
          en: `Updated P&L: Management cost ${data.managementCost} (old: ${oldPnl.managementCost}), Revenue ${data.revenue} (old: ${oldPnl.revenue})`,
        },
        entityType: 'FINANCIAL',
        oldValue: `CP: ${oldPnl.managementCost.toLocaleString('vi-VN')} đ, DT: ${oldPnl.revenue.toLocaleString('vi-VN')} đ`,
        newValue: `CP: ${data.managementCost.toLocaleString('vi-VN')} đ, DT: ${data.revenue.toLocaleString('vi-VN')} đ`,
      });
    }
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

