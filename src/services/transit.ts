import { db } from '../db/index.js';
import { shipments } from '../db/schema/shipments.js';
import {
  transitContainers, transitCustoms, transitTasks,
  transitIssues, transitExpenses, transitActivities
} from '../db/schema/transit.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq } from 'drizzle-orm';
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
  const [task] = await db.insert(transitTasks).values({
    shipmentId,
    companyId: shipment.companyId,
    title: typeof data.title === 'string' ? { en: data.title, vi: data.title } : data.title,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    priority: (data.priority as any) ?? 'MEDIUM',
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    createdBy: ctx.user!.id,
  }).returning();
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
  const [issue] = await db.insert(transitIssues).values({
    shipmentId,
    companyId: shipment.companyId,
    title: typeof data.title === 'string' ? { en: data.title, vi: data.title } : data.title,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    severity: (data.severity as any) ?? 'MEDIUM',
    createdBy: ctx.user!.id,
  }).returning();
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
  return expense;
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function listActivities(ctx: AppContext, shipmentId: string) {
  await assertShipmentAccess(ctx, shipmentId);
  return db.select().from(transitActivities).where(eq(transitActivities.shipmentId, shipmentId));
}

export async function addActivity(ctx: AppContext, shipmentId: string, data: {
  action: string; description: string; entityType?: string;
}) {
  const shipment = await assertShipmentAccess(ctx, shipmentId);
  const [activity] = await db.insert(transitActivities).values({
    shipmentId,
    companyId: shipment.companyId,
    action: data.action,
    description: typeof data.description === 'string' ? { en: data.description, vi: data.description } : data.description,
    entityType: data.entityType,
    createdBy: ctx.user!.id,
  }).returning();
  return activity;
}
