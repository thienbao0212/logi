import { db } from '../db/index.js';
import { shipments } from '../db/schema/shipments.js';
import {
  transitContainers, transitCustoms, transitTasks,
  transitIssues, transitExpenses, transitActivities
} from '../db/schema/transit.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq, desc } from 'drizzle-orm';
import { requireAccess } from '../lib/access.js';

// ── Helper: assert shipment belongs to user's company ────────────────────────
async function assertShipmentAccess(ctx: AppContext, shipmentId: string) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  requireAccess(ctx, { company: { id: shipment.companyId } });
  return shipment;
}

// ── Containers ────────────────────────────────────────────────────────────────

export async function listContainers(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitContainers).where(eq(transitContainers.shipmentId, shipmentId));
}

export async function addContainer(ctx: AppContext, shipmentId: string, data: {
  containerNumber: string; type: string; sealNumber?: string;
  grossWeight?: string; netWeight?: string; volumeCbm?: string; location?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const [container] = await db.insert(transitContainers).values({
    shipmentId,
    companyId: shipment.companyId,
    containerNumber: data.containerNumber,
    type: data.type as any,
    sealNumber: data.sealNumber,
    grossWeight: data.grossWeight,
    netWeight: data.netWeight,
    volumeCbm: data.volumeCbm,
    location: data.location,
    createdBy: ctx.user!.id,
  }).returning();

  // Audit Log
  await addActivity(ctx, shipmentId, {
    action: 'CONTAINER_ADDED',
    description: {
      vi: `Thêm mới container ${data.containerNumber} (${data.type}${data.sealNumber ? `, Seal: ${data.sealNumber}` : ''})`,
      en: `Added container ${data.containerNumber} (${data.type}${data.sealNumber ? `, Seal: ${data.sealNumber}` : ''})`,
    },
    entityType: 'CONTAINER',
    entityId: container.id,
    newValue: data.containerNumber,
  });

  return container;
}

// ── Customs ───────────────────────────────────────────────────────────────────

export async function listCustoms(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitCustoms).where(eq(transitCustoms.shipmentId, shipmentId));
}

export async function addCustoms(ctx: AppContext, shipmentId: string, data: {
  type: string; declarationNumber?: string; customsOffice?: string;
  status?: string; customsBroker?: string; notes?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const [record] = await db.insert(transitCustoms).values({
    shipmentId,
    companyId: shipment.companyId,
    type: data.type as any,
    declarationNumber: data.declarationNumber,
    customsOffice: data.customsOffice,
    status: (data.status as any) ?? 'NOT_STARTED',
    customsBroker: data.customsBroker,
    notes: data.notes,
    createdBy: ctx.user!.id,
  }).returning();

  // Audit Log
  await addActivity(ctx, shipmentId, {
    action: 'CUSTOMS_DECLARED',
    description: {
      vi: `Khai báo hải quan loại "${data.type}"${data.declarationNumber ? ` (Số tờ khai: ${data.declarationNumber})` : ''}`,
      en: `Customs declaration type "${data.type}"${data.declarationNumber ? ` (Declaration: ${data.declarationNumber})` : ''}`,
    },
    entityType: 'CUSTOMS',
    entityId: record.id,
    newValue: data.declarationNumber || data.type,
  });

  return record;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function listTasks(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitTasks).where(eq(transitTasks.shipmentId, shipmentId));
}

export async function addTask(ctx: AppContext, shipmentId: string, data: {
  title: string; description?: string; priority?: string; dueDate?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const titleText = typeof data.title === 'string' ? data.title : (data.title as any)?.vi || 'Công việc';
  const [task] = await db.insert(transitTasks).values({
    shipmentId,
    companyId: shipment.companyId,
    title: typeof data.title === 'string' ? { en: data.title, vi: data.title } : data.title,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    priority: (data.priority as any) ?? 'MEDIUM',
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    createdBy: ctx.user!.id,
  }).returning();

  // Audit Log
  await addActivity(ctx, shipmentId, {
    action: 'TASK_CREATED',
    description: {
      vi: `Tạo công việc mới: "${titleText}" (Ưu tiên: ${data.priority || 'MEDIUM'})`,
      en: `Created new task: "${titleText}" (Priority: ${data.priority || 'MEDIUM'})`,
    },
    entityType: 'TASK',
    entityId: task.id,
    newValue: titleText,
  });

  return task;
}

// ── Issues ────────────────────────────────────────────────────────────────────

export async function listIssues(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitIssues).where(eq(transitIssues.shipmentId, shipmentId));
}

export async function addIssue(ctx: AppContext, shipmentId: string, data: {
  title: string; description?: string; severity?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const titleText = typeof data.title === 'string' ? data.title : (data.title as any)?.vi || 'Sự cố';
  const [issue] = await db.insert(transitIssues).values({
    shipmentId,
    companyId: shipment.companyId,
    title: typeof data.title === 'string' ? { en: data.title, vi: data.title } : data.title,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    severity: (data.severity as any) ?? 'MEDIUM',
    createdBy: ctx.user!.id,
  }).returning();

  // Audit Log
  await addActivity(ctx, shipmentId, {
    action: 'ISSUE_REPORTED',
    description: {
      vi: `Ghi nhận sự cố: "${titleText}" (Mức độ: ${data.severity || 'MEDIUM'})`,
      en: `Reported issue: "${titleText}" (Severity: ${data.severity || 'MEDIUM'})`,
    },
    entityType: 'ISSUE',
    entityId: issue.id,
    newValue: titleText,
  });

  return issue;
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function listExpenses(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitExpenses).where(eq(transitExpenses.shipmentId, shipmentId));
}

export async function addExpense(ctx: AppContext, shipmentId: string, data: {
  type: string; amount: string; currency?: string; description?: string; vendor?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const [expense] = await db.insert(transitExpenses).values({
    shipmentId,
    companyId: shipment.companyId,
    type: data.type as any,
    amount: data.amount,
    currency: data.currency ?? 'USD',
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    vendor: data.vendor,
    createdBy: ctx.user!.id,
  }).returning();

  // Audit Log
  await addActivity(ctx, shipmentId, {
    action: 'EXPENSE_ADDED',
    description: {
      vi: `Phát sinh chi phí ${data.type}: ${data.amount} ${data.currency || 'USD'}${data.vendor ? ` (Nhà cung cấp: ${data.vendor})` : ''}`,
      en: `Expense recorded ${data.type}: ${data.amount} ${data.currency || 'USD'}${data.vendor ? ` (Vendor: ${data.vendor})` : ''}`,
    },
    entityType: 'EXPENSE',
    entityId: expense.id,
    newValue: `${data.amount} ${data.currency || 'USD'}`,
  });

  return expense;
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function listActivities(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitActivities)
    .where(eq(transitActivities.shipmentId, shipmentId))
    .orderBy(desc(transitActivities.createdAt));
}

export async function addActivity(ctx: AppContext, shipmentId: string, data: {
  action: string;
  description: string | { en: string; vi: string };
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const [activity] = await db.insert(transitActivities).values({
    shipmentId,
    companyId: shipment.companyId,
    action: data.action,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    entityType: data.entityType,
    entityId: data.entityId,
    oldValue: data.oldValue,
    newValue: data.newValue,
    createdBy: ctx.user!.id,
  }).returning();
  return activity;
}

// ── Diff & Field-Level Audit Logger Helper ────────────────────────────────────

const FIELD_LABELS: Record<string, { vi: string; en: string }> = {
  status: { vi: 'Trạng thái lô hàng', en: 'Shipment status' },
  mode: { vi: 'Phương thức vận chuyển', en: 'Transport mode' },
  estimatedDepartureDate: { vi: 'Ngày khởi hành dự kiến (ETD)', en: 'Estimated departure date (ETD)' },
  estimatedArrivalDate: { vi: 'Ngày đến dự kiến (ETA)', en: 'Estimated arrival date (ETA)' },
  actualDepartureDate: { vi: 'Ngày khởi hành thực tế (ATD)', en: 'Actual departure date (ATD)' },
  actualArrivalDate: { vi: 'Ngày đến thực tế (ATA)', en: 'Actual arrival date (ATA)' },
  weightTotal: { vi: 'Tổng trọng lượng', en: 'Total weight' },
  volumeTotal: { vi: 'Tổng thể tích', en: 'Total volume' },
  trackingNumber: { vi: 'Mã vận đơn', en: 'Tracking number' },
  originId: { vi: 'Điểm khởi hành', en: 'Origin location' },
  destinationId: { vi: 'Điểm đến', en: 'Destination location' },
  customerId: { vi: 'Khách hàng', en: 'Customer' },
};

export async function logShipmentFieldChanges(ctx: AppContext, shipmentId: string, oldShipment: any, updateData: any) {
  for (const [key, val] of Object.entries(updateData)) {
    if (val === undefined) continue;
    
    // Normalize date strings or nullish values for comparison
    const rawOld = oldShipment[key];
    const oldStr = rawOld instanceof Date ? rawOld.toISOString().slice(0, 10) : (rawOld !== null && rawOld !== undefined ? String(rawOld) : '');
    const newStr = val instanceof Date ? val.toISOString().slice(0, 10) : (val !== null && val !== undefined ? String(val) : '');

    if (oldStr !== newStr) {
      const fieldMeta = FIELD_LABELS[key] || { vi: key, en: key };
      const action = key === 'status' ? 'STATUS_UPDATED' : 'FIELD_UPDATED';
      const entityType = key === 'status' ? 'STATUS' : 'SHIPMENT';

      await addActivity(ctx, shipmentId, {
        action,
        description: {
          vi: `Cập nhật ${fieldMeta.vi}: "${oldStr || 'trống'}" ➔ "${newStr}"`,
          en: `Updated ${fieldMeta.en}: "${oldStr || 'empty'}" ➔ "${newStr}"`,
        },
        entityType,
        entityId: shipmentId,
        oldValue: oldStr || undefined,
        newValue: newStr,
      });
    }
  }
}

