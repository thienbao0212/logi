import { describe, it, expect } from 'vitest';
import {
  validateMilestone4,
  validateMilestone5,
  scanShipmentTimeline,
  MilestoneBorderGate,
  MilestoneEmptyReturn,
  TransitMilestonesData,
} from './ui/components/shipment/transit_types.js';

describe('LogiFlow Transit Milestones & Timeline Scanner', () => {
  it('should validate milestone 4 (Cửa khẩu xuất) correctly', () => {
    const incompleteM4: MilestoneBorderGate = {
      borderGateName: '',
      customsBorderFee: 0,
      serviceFee: 0,
      borderFee: 0,
    };

    const resIncomplete = validateMilestone4(incompleteM4);
    expect(resIncomplete.isCompleted).toBe(false);
    expect(resIncomplete.missingFields.length).toBe(4);
    expect(resIncomplete.completionPercentage).toBe(0);

    const completeM4: MilestoneBorderGate = {
      borderGateName: 'Cửa khẩu Mộc Bài',
      customsBorderFee: 500000,
      serviceFee: 300000,
      borderFee: 200000,
    };

    const resComplete = validateMilestone4(completeM4);
    expect(resComplete.isCompleted).toBe(true);
    expect(resComplete.missingFields.length).toBe(0);
    expect(resComplete.completionPercentage).toBe(100);
  });

  it('should validate milestone 5 (Trả rỗng depot) correctly', () => {
    const incompleteM5: MilestoneEmptyReturn = {
      depotName: '',
      returnFee: 0,
      actualReturnDate: '',
    };

    const res = validateMilestone5(incompleteM5);
    expect(res.isCompleted).toBe(false);
    expect(res.missingFields.length).toBe(3);

    const completeM5: MilestoneEmptyReturn = {
      depotName: 'Depot Tân Cảng Sóng Thần',
      returnFee: 450000,
      actualReturnDate: '2026-09-08',
    };

    const resComplete = validateMilestone5(completeM5);
    expect(resComplete.isCompleted).toBe(true);
    expect(resComplete.missingFields.length).toBe(0);
    expect(resComplete.completionPercentage).toBe(100);
  });

  it('should detect timeline inconsistency when departure date is earlier than arrival date', () => {
    const invalidData: TransitMilestonesData = {
      updatedAt: '2026-09-10T00:00:00.000Z',
      m1: {
        arrivalDate: '2026-09-10',
        arrivalPort: 'Cảng Cát Lái',
        customsOffice: 'Chi cục Hải quan KV1',
        shippingLine: 'Maersk',
        billOfLading: 'MSK123456',
        localChargeFee: 1200000,
        containers: [],
        declarationNumber: 'TK-1001',
        declarationDate: '2026-09-10',
        declarationChannel: 'GREEN',
        freeDemDays: 5,
        freeDetDays: 7,
        freeStoDays: 5,
      },
      m2: {
        customsFee: 500000,
        sealTrackingFee: 200000,
        portFee: 300000,
        clearanceDate: '2026-09-11',
      },
      m3: {
        carrierName: 'Vận tải Á Châu',
        departureDate: '2026-09-08', // Invalid: Before arrival 2026-09-10!
        route: 'Cát Lái - Phnom Penh',
        destinationArrivalDate: '2026-09-09',
        truckPlate: '51C-12345',
        driverName: 'Nguyễn Văn A',
        driverPhone: '0901234567',
        transportFee: 4000000,
      },
      m4: {
        borderGateName: 'Mộc Bài',
        customsBorderFee: 500000,
        serviceFee: 300000,
        borderFee: 200000,
      },
      m5: {
        depotName: 'Depot Tân Cảng',
        returnFee: 400000,
        actualReturnDate: '2026-09-12',
      },
    };

    const issues = scanShipmentTimeline(invalidData);
    expect(issues.length).toBeGreaterThan(0);
    const hasDepartureIssue = issues.some(
      (i) => i.id === 'ERR_M3_BEFORE_M1' || i.type === 'ERROR'
    );
    expect(hasDepartureIssue).toBe(true);
  });
});
