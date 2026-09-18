import { describe, it, expect, beforeEach } from 'vitest';

class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

if (!globalThis.localStorage) {
  (globalThis as any).localStorage = new LocalStorageMock();
}

import {
  recordShipmentActivity,
  saveMilestonesToStorage,
  loadMilestonesFromStorage,
  saveShipmentCostsToStorage,
  saveShipmentPnl,
  TransitMilestonesData,
} from './ui/components/shipment/transit_types.js';

describe('LogiFlow Shipment Audit Logging & Activity Trail', () => {
  const shipmentId = 'test-shipment-audit-001';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should record an activity in local storage with author and timestamp', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Nguyễn Văn Kiểm Thử' }));

    recordShipmentActivity(shipmentId, {
      action: 'STATUS_UPDATED',
      description: 'Cập nhật trạng thái lô hàng sang IN_TRANSIT',
      entityType: 'STATUS',
      oldValue: 'BOOKED',
      newValue: 'IN_TRANSIT',
    });

    const key = `logiflow_activities_${shipmentId}`;
    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();

    const list = JSON.parse(raw!);
    expect(list.length).toBe(1);
    expect(list[0].action).toBe('STATUS_UPDATED');
    expect(list[0].oldValue).toBe('BOOKED');
    expect(list[0].newValue).toBe('IN_TRANSIT');
    expect(list[0].createdBy).toBe('Nguyễn Văn Kiểm Thử');
  });

  it('should automatically detect milestone field changes and record audit logs', () => {
    const initial = loadMilestonesFromStorage(shipmentId);
    expect(initial).toBeTruthy();

    // Now update milestone 1 arrival date and free DEM days
    const updated: TransitMilestonesData = {
      ...initial,
      m1: {
        ...initial.m1,
        arrivalDate: '2026-09-15',
        freeDemDays: 14,
        shippingLine: 'Maersk Line',
      },
    };

    saveMilestonesToStorage(shipmentId, updated);

    const key = `logiflow_activities_${shipmentId}`;
    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();

    const list = JSON.parse(raw!);
    expect(list.length).toBeGreaterThanOrEqual(2);

    const arrivalLog = list.find((a: any) => a.description?.vi?.includes('ngày hàng đến'));
    expect(arrivalLog).toBeTruthy();
    expect(arrivalLog.newValue).toBe('2026-09-15');

    const demLog = list.find((a: any) => a.description?.vi?.includes('miễn lưu bãi (DEM)'));
    expect(demLog).toBeTruthy();
    expect(demLog.newValue).toBe('14 ngày');
  });

  it('should log audit trail when P&L management cost or revenue changes', () => {
    saveShipmentPnl(shipmentId, { managementCost: 500000, revenue: 3000000 });
    saveShipmentPnl(shipmentId, { managementCost: 800000, revenue: 3500000 });

    const key = `logiflow_activities_${shipmentId}`;
    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();

    const list = JSON.parse(raw!);
    expect(list.length).toBe(1);
    expect(list[0].action).toBe('PNL_UPDATED');
    expect(list[0].entityType).toBe('FINANCIAL');
    expect(list[0].description.vi).toContain('800.000');
  });

  it('should log audit trail when direct shipment costs are updated', () => {
    const initialCosts = [
      {
        id: 'cost-1',
        shipmentId,
        milestoneKey: 'm1' as const,
        milestoneLabel: 'Mốc 1',
        feeName: 'Local Charge',
        amount: 1200000,
        requestDate: '2026-09-08',
        status: 'PENDING' as const,
        isMandatoryFee: true,
      },
    ];
    saveShipmentCostsToStorage(shipmentId, initialCosts);

    const nextCosts = [
      ...initialCosts,
      {
        id: 'cost-2',
        shipmentId,
        milestoneKey: 'm2' as const,
        milestoneLabel: 'Mốc 2',
        feeName: 'Lệ phí HQ',
        amount: 800000,
        requestDate: '2026-09-08',
        status: 'PENDING' as const,
        isMandatoryFee: true,
      },
    ];
    saveShipmentCostsToStorage(shipmentId, nextCosts);

    const key = `logiflow_activities_${shipmentId}`;
    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();

    const list = JSON.parse(raw!);
    expect(list.length).toBe(1);
    expect(list[0].action).toBe('COSTS_UPDATED');
    expect(list[0].newValue).toContain('2.000.000');
  });
});
