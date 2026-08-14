import { db } from '../db/index.js';
import { documents, shipments } from '../db/schema/shipments.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq } from 'drizzle-orm';
import { requireAccess } from '../lib/access.js';

export async function addDocumentToShipment(ctx: AppContext, shipmentId: string, data: { name: string; documentType: string; fileUrl: string }) {
  // Check if shipment exists
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  
  // Require access to the company owning this shipment
  requireAccess(ctx, { company: { id: shipment.companyId } });

  const [document] = await db.insert(documents).values({
    shipmentId,
    name: data.name,
    documentType: data.documentType,
    fileUrl: data.fileUrl,
    createdBy: ctx.user!.id,
  }).returning();

  return document;
}

export async function listShipmentDocuments(ctx: AppContext, shipmentId: string) {
  // Check if shipment exists
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
  
  // Require access to the company owning this shipment
  requireAccess(ctx, { company: { id: shipment.companyId } });

  const list = await db.select().from(documents).where(eq(documents.shipmentId, shipmentId));
  return list;
}
