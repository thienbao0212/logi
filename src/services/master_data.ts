import { db } from '../db/index.js';
import { customers } from '../db/schema/shipments.js';
import { shippingLines, ports } from '../db/schema/master_data.js';
import { AppContext } from '../lib/context/types.js';
import { AppError } from '../lib/errors.js';
import { eq, desc, ilike, or, and } from 'drizzle-orm';
import { requireAccess } from '../lib/access.js';

// ─── Customers Services ───────────────────────────────────────────────────────

export async function listCustomers(ctx: AppContext, companyId: string, search?: string) {
  requireAccess(ctx, { company: { id: companyId } });

  let condition = eq(customers.companyId, companyId);
  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    condition = and(
      eq(customers.companyId, companyId),
      or(
        ilike(customers.name, pattern),
        ilike(customers.email, pattern),
        ilike(customers.phone, pattern),
        ilike(customers.address, pattern)
      )
    )!;
  }

  const list = await db
    .select()
    .from(customers)
    .where(condition)
    .orderBy(desc(customers.createdAt));

  return list;
}

export async function getCustomerById(ctx: AppContext, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
  requireAccess(ctx, { company: { id: customer.companyId } });
  return customer;
}

export async function createCustomer(ctx: AppContext, data: {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  requireAccess(ctx, { company: { id: data.companyId } });

  const [customer] = await db
    .insert(customers)
    .values({
      companyId: data.companyId,
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    })
    .returning();

  return customer;
}

export async function updateCustomer(ctx: AppContext, customerId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Customer not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  const [updated] = await db
    .update(customers)
    .set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId))
    .returning();

  return updated;
}

export async function deleteCustomer(ctx: AppContext, customerId: string) {
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Customer not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  await db.delete(customers).where(eq(customers.id, customerId));
  return { success: true, id: customerId };
}

// ─── Shipping Lines Services ──────────────────────────────────────────────────

export async function listShippingLines(ctx: AppContext, companyId: string, search?: string) {
  requireAccess(ctx, { company: { id: companyId } });

  let condition = eq(shippingLines.companyId, companyId);
  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    condition = and(
      eq(shippingLines.companyId, companyId),
      or(
        ilike(shippingLines.code, pattern),
        ilike(shippingLines.name, pattern),
        ilike(shippingLines.contactPerson, pattern),
        ilike(shippingLines.email, pattern),
        ilike(shippingLines.phone, pattern)
      )
    )!;
  }

  const list = await db
    .select()
    .from(shippingLines)
    .where(condition)
    .orderBy(desc(shippingLines.createdAt));

  return list;
}

export async function getShippingLineById(ctx: AppContext, shippingLineId: string) {
  const [shippingLine] = await db
    .select()
    .from(shippingLines)
    .where(eq(shippingLines.id, shippingLineId))
    .limit(1);

  if (!shippingLine) throw new AppError('NOT_FOUND', 'Shipping line not found', 404);
  requireAccess(ctx, { company: { id: shippingLine.companyId } });
  return shippingLine;
}

export async function createShippingLine(ctx: AppContext, data: {
  companyId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  trackingUrl?: string;
  notes?: string;
  isActive?: boolean;
}) {
  requireAccess(ctx, { company: { id: data.companyId } });

  const [shippingLine] = await db
    .insert(shippingLines)
    .values({
      companyId: data.companyId,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      contactPerson: data.contactPerson?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      website: data.website?.trim() || null,
      trackingUrl: data.trackingUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    })
    .returning();

  return shippingLine;
}

export async function updateShippingLine(ctx: AppContext, shippingLineId: string, data: {
  code?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  trackingUrl?: string;
  notes?: string;
  isActive?: boolean;
}) {
  const [existing] = await db
    .select()
    .from(shippingLines)
    .where(eq(shippingLines.id, shippingLineId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Shipping line not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  const [updated] = await db
    .update(shippingLines)
    .set({
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson?.trim() || null } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.website !== undefined ? { website: data.website?.trim() || null } : {}),
      ...(data.trackingUrl !== undefined ? { trackingUrl: data.trackingUrl?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(shippingLines.id, shippingLineId))
    .returning();

  return updated;
}

export async function deleteShippingLine(ctx: AppContext, shippingLineId: string) {
  const [existing] = await db
    .select()
    .from(shippingLines)
    .where(eq(shippingLines.id, shippingLineId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Shipping line not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  await db.delete(shippingLines).where(eq(shippingLines.id, shippingLineId));
  return { success: true, id: shippingLineId };
}

// ─── Ports Services ───────────────────────────────────────────────────────────

export async function listPorts(ctx: AppContext, companyId: string, filters?: { search?: string; type?: string; country?: string }) {
  requireAccess(ctx, { company: { id: companyId } });

  const conditions = [eq(ports.companyId, companyId)];

  if (filters?.type && filters.type !== 'ALL') {
    conditions.push(eq(ports.type, filters.type as any));
  }

  if (filters?.country && filters.country.trim()) {
    conditions.push(ilike(ports.country, `%${filters.country.trim()}%`));
  }

  if (filters?.search && filters.search.trim()) {
    const pattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(ports.code, pattern),
        ilike(ports.name, pattern),
        ilike(ports.city, pattern),
        ilike(ports.country, pattern),
        ilike(ports.address, pattern)
      )!
    );
  }

  const list = await db
    .select()
    .from(ports)
    .where(and(...conditions))
    .orderBy(desc(ports.createdAt));

  return list;
}

export async function getPortById(ctx: AppContext, portId: string) {
  const [port] = await db
    .select()
    .from(ports)
    .where(eq(ports.id, portId))
    .limit(1);

  if (!port) throw new AppError('NOT_FOUND', 'Port not found', 404);
  requireAccess(ctx, { company: { id: port.companyId } });
  return port;
}

export async function createPort(ctx: AppContext, data: {
  companyId: string;
  code: string;
  name: string;
  country: string;
  countryCode?: string;
  city?: string;
  type?: 'SEAPORT' | 'INLAND_PORT' | 'ICD' | 'BORDER_GATE' | 'AIRPORT';
  address?: string;
  notes?: string;
  isActive?: boolean;
}) {
  requireAccess(ctx, { company: { id: data.companyId } });

  const [port] = await db
    .insert(ports)
    .values({
      companyId: data.companyId,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      country: data.country.trim(),
      countryCode: data.countryCode?.trim().toUpperCase() || null,
      city: data.city?.trim() || null,
      type: data.type || 'SEAPORT',
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    })
    .returning();

  return port;
}

export async function updatePort(ctx: AppContext, portId: string, data: {
  code?: string;
  name?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  type?: 'SEAPORT' | 'INLAND_PORT' | 'ICD' | 'BORDER_GATE' | 'AIRPORT';
  address?: string;
  notes?: string;
  isActive?: boolean;
}) {
  const [existing] = await db
    .select()
    .from(ports)
    .where(eq(ports.id, portId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Port not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  const [updated] = await db
    .update(ports)
    .set({
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.country !== undefined ? { country: data.country.trim() } : {}),
      ...(data.countryCode !== undefined ? { countryCode: data.countryCode?.trim().toUpperCase() || null } : {}),
      ...(data.city !== undefined ? { city: data.city?.trim() || null } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(ports.id, portId))
    .returning();

  return updated;
}

export async function deletePort(ctx: AppContext, portId: string) {
  const [existing] = await db
    .select()
    .from(ports)
    .where(eq(ports.id, portId))
    .limit(1);

  if (!existing) throw new AppError('NOT_FOUND', 'Port not found', 404);
  requireAccess(ctx, { company: { id: existing.companyId } });

  await db.delete(ports).where(eq(ports.id, portId));
  return { success: true, id: portId };
}
