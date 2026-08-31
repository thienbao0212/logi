import { db } from '../db/index.js';
import { shipments, shipmentEvents, documents, locations } from '../db/schema/shipments.js';
import { 
  transitContainers, 
  transitCustoms, 
  transitTasks, 
  transitIssues, 
  transitExpenses, 
  transitRevenues, 
  transitActivities 
} from '../db/schema/transit.js';
import { ports } from '../db/schema/master_data.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { requireAccess } from '../lib/access.js';

async function resolveLocationId(companyId: string, locationOrPortId: string): Promise<string> {
  if (!locationOrPortId) {
    const [firstLoc] = await db.select().from(locations).where(eq(locations.companyId, companyId)).limit(1);
    if (firstLoc) return firstLoc.id;
    const [created] = await db.insert(locations).values({
      companyId,
      name: 'Default Hub',
      address: 'Port Terminal',
      type: 'PORT'
    }).returning();
    return created.id;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(locationOrPortId);
  if (isUuid) {
    const [existingLoc] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.id, locationOrPortId)))
      .limit(1);
    if (existingLoc) return existingLoc.id;
  }

  // Check if it matches a port in master data (by ID or Code)
  const portCondition = isUuid
    ? and(eq(ports.companyId, companyId), or(eq(ports.id, locationOrPortId), eq(ports.code, locationOrPortId)))
    : and(eq(ports.companyId, companyId), eq(ports.code, locationOrPortId));

  const [port] = await db.select().from(ports).where(portCondition!).limit(1);
  if (port) {
    const [matchedLoc] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.name, port.name)))
      .limit(1);
    if (matchedLoc) return matchedLoc.id;

    const [newLoc] = await db
      .insert(locations)
      .values({
        companyId,
        name: port.name,
        address: port.address || port.name,
        city: port.city,
        country: port.country,
        type: 'PORT',
      })
      .returning();
    return newLoc.id;
  }

  // Fallback: check any location
  const [anyLoc] = await db.select().from(locations).where(eq(locations.companyId, companyId)).limit(1);
  if (anyLoc) return anyLoc.id;

  const [fallbackLoc] = await db
    .insert(locations)
    .values({
      companyId,
      name: locationOrPortId || 'Default Port',
      address: 'Main Terminal',
      type: 'PORT',
    })
    .returning();
  return fallbackLoc.id;
}

export async function createShipment(ctx: AppContext, data: any) {
  const companyId = data.companyId;
  requireAccess(ctx, { company: { id: companyId } });

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fallbackSeq = String(Math.floor(1 + Math.random() * 99)).padStart(2, '0');
  const trackingNumber = data.trackingNumber || `QC${yy}${mm}${dd}${fallbackSeq}`;

  const originId = await resolveLocationId(companyId, data.originId);
  const destinationId = await resolveLocationId(companyId, data.destinationId);

  const [shipment] = await db.insert(shipments).values({
    companyId,
    trackingNumber,
    customerId: data.customerId,
    originId,
    destinationId,
    mode: data.mode || 'SEA',
    weightTotal: data.weightTotal,
    volumeTotal: data.volumeTotal,
    estimatedDepartureDate: data.estimatedDepartureDate ? new Date(data.estimatedDepartureDate) : null,
    estimatedArrivalDate: data.estimatedArrivalDate ? new Date(data.estimatedArrivalDate) : null,
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

  const updateData = { ...data };
  if (data.originId) {
    updateData.originId = await resolveLocationId(shipment.companyId, data.originId);
  }
  if (data.destinationId) {
    updateData.destinationId = await resolveLocationId(shipment.companyId, data.destinationId);
  }

  const [updated] = await db.update(shipments)
    .set({
      ...updateData,
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

export async function deleteShipment(ctx: AppContext, shipmentId: string) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  requireAccess(ctx, { company: { id: shipment.companyId } });

  // Delete all dependent child rows
  await db.delete(transitActivities).where(eq(transitActivities.shipmentId, shipmentId));
  await db.delete(transitRevenues).where(eq(transitRevenues.shipmentId, shipmentId));
  await db.delete(transitExpenses).where(eq(transitExpenses.shipmentId, shipmentId));
  await db.delete(transitIssues).where(eq(transitIssues.shipmentId, shipmentId));
  await db.delete(transitTasks).where(eq(transitTasks.shipmentId, shipmentId));
  await db.delete(transitCustoms).where(eq(transitCustoms.shipmentId, shipmentId));
  await db.delete(transitContainers).where(eq(transitContainers.shipmentId, shipmentId));
  await db.delete(documents).where(eq(documents.shipmentId, shipmentId));
  await db.delete(shipmentEvents).where(eq(shipmentEvents.shipmentId, shipmentId));
  await db.delete(shipments).where(eq(shipments.id, shipmentId));

  return { success: true };
}

export async function deleteAllShipments(ctx: AppContext, companyId: string) {
  requireAccess(ctx, { company: { id: companyId } });

  const companyShipments = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.companyId, companyId));
  const ids = companyShipments.map(s => s.id);

  if (ids.length > 0) {
    await db.delete(transitActivities).where(inArray(transitActivities.shipmentId, ids));
    await db.delete(transitRevenues).where(inArray(transitRevenues.shipmentId, ids));
    await db.delete(transitExpenses).where(inArray(transitExpenses.shipmentId, ids));
    await db.delete(transitIssues).where(inArray(transitIssues.shipmentId, ids));
    await db.delete(transitTasks).where(inArray(transitTasks.shipmentId, ids));
    await db.delete(transitCustoms).where(inArray(transitCustoms.shipmentId, ids));
    await db.delete(transitContainers).where(inArray(transitContainers.shipmentId, ids));
    await db.delete(documents).where(inArray(documents.shipmentId, ids));
    await db.delete(shipmentEvents).where(inArray(shipmentEvents.shipmentId, ids));
    await db.delete(shipments).where(inArray(shipments.id, ids));
  }

  return { success: true, deletedCount: ids.length };
}
