import { db } from '../db/index.js';
import { shipments, shipmentEvents } from '../db/schema/shipments.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq } from 'drizzle-orm';
import { requireAccess } from '../lib/access.js';

export async function createShipment(ctx: AppContext, data: any) {
  const companyId = data.companyId; // The UI should pass this, or infer from user's membership
  
  // Basic access check: User must belong to this company
  requireAccess(ctx, { company: { id: companyId } });

  // In a real app we'd validate data thoroughly using zod.
  const trackingNumber = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const [shipment] = await db.insert(shipments).values({
    companyId,
    trackingNumber,
    customerId: data.customerId,
    originId: data.originId,
    destinationId: data.destinationId,
    mode: data.mode,
    weightTotal: data.weightTotal,
    volumeTotal: data.volumeTotal,
    status: 'DRAFT',
    createdBy: ctx.user!.id,
  }).returning();

  // Add initial event
  await db.insert(shipmentEvents).values({
    shipmentId: shipment.id,
    status: 'DRAFT',
    description: 'Shipment created in draft state.',
    createdBy: ctx.user!.id,
  });

  return shipment;
}

export async function updateShipment(ctx: AppContext, shipmentId: string, data: any) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  requireAccess(ctx, { company: { id: shipment.companyId } });

  const [updated] = await db.update(shipments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipmentId))
    .returning();

  return updated;
}

export async function listShipments(ctx: AppContext, companyId: string) {
  requireAccess(ctx, { company: { id: companyId } });
  const list = await db.select().from(shipments).where(eq(shipments.companyId, companyId));
  return list;
}

export async function getShipmentById(ctx: AppContext, shipmentId: string) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  requireAccess(ctx, { company: { id: shipment.companyId } });
  return shipment;
}

export async function addTrackingEvent(ctx: AppContext, shipmentId: string, data: any) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  
  requireAccess(ctx, { company: { id: shipment.companyId } });

  const [event] = await db.insert(shipmentEvents).values({
    shipmentId,
    status: data.status,
    locationId: data.locationId,
    description: data.description,
    createdBy: ctx.user!.id,
  }).returning();

  // Update shipment status
  await db.update(shipments).set({ status: data.status, updatedAt: new Date() }).where(eq(shipments.id, shipmentId));

  return event;
}
