import { db } from '../db/index.js';
import { shipments, shipmentEvents, locations } from '../db/schema/shipments.js';
import { ports } from '../db/schema/master_data.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq, and, or } from 'drizzle-orm';
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

  const trackingNumber = data.trackingNumber || `TRK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

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
