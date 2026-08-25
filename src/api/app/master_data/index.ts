import { Hono } from 'hono';
import { AppContext } from '../../../lib/context/types.js';
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listShippingLines,
  getShippingLineById,
  createShippingLine,
  updateShippingLine,
  deleteShippingLine,
  listPorts,
  getPortById,
  createPort,
  updatePort,
  deletePort,
} from '../../../services/master_data.js';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';

const masterDataApp = new Hono<{ Variables: { ctx: AppContext } }>();

masterDataApp.use('*', requireAuth);

// ─── Customer Schemas ─────────────────────────────────────────────────────────

const createCustomerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ─── Shipping Line Schemas ────────────────────────────────────────────────────

const createShippingLineSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  trackingUrl: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateShippingLineSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  trackingUrl: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Port Schemas ─────────────────────────────────────────────────────────────

const createPortSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  country: z.string().min(1, 'Country is required'),
  countryCode: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(['SEAPORT', 'INLAND_PORT', 'ICD', 'BORDER_GATE', 'AIRPORT']).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updatePortSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  countryCode: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(['SEAPORT', 'INLAND_PORT', 'ICD', 'BORDER_GATE', 'AIRPORT']).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Customer Routes ─────────────────────────────────────────────────────────

masterDataApp.get('/customers', async (c) => {
  const ctx = c.get('ctx');
  const companyId = c.req.query('companyId');
  const search = c.req.query('search');
  if (!companyId) return c.json({ error: 'BAD_REQUEST', message: 'Missing companyId' }, 400);

  try {
    const list = await listCustomers(ctx, companyId, search);
    return c.json({ data: list });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.get('/customers/:id', async (c) => {
  const ctx = c.get('ctx');
  const customerId = c.req.param('id');
  try {
    const customer = await getCustomerById(ctx, customerId);
    return c.json({ data: customer });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.post('/customers', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = createCustomerSchema.parse(body);
    const customer = await createCustomer(ctx, {
      ...data,
      email: data.email || undefined,
    });
    return c.json({ data: customer }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.put('/customers/:id', async (c) => {
  const ctx = c.get('ctx');
  const customerId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = updateCustomerSchema.parse(body);
    const updated = await updateCustomer(ctx, customerId, {
      ...data,
      email: data.email || undefined,
    });
    return c.json({ data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.delete('/customers/:id', async (c) => {
  const ctx = c.get('ctx');
  const customerId = c.req.param('id');
  try {
    const result = await deleteCustomer(ctx, customerId);
    return c.json({ data: result });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ─── Shipping Line Routes ───────────────────────────────────────────────────

masterDataApp.get('/shipping-lines', async (c) => {
  const ctx = c.get('ctx');
  const companyId = c.req.query('companyId');
  const search = c.req.query('search');
  if (!companyId) return c.json({ error: 'BAD_REQUEST', message: 'Missing companyId' }, 400);

  try {
    const list = await listShippingLines(ctx, companyId, search);
    return c.json({ data: list });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.get('/shipping-lines/:id', async (c) => {
  const ctx = c.get('ctx');
  const shippingLineId = c.req.param('id');
  try {
    const shippingLine = await getShippingLineById(ctx, shippingLineId);
    return c.json({ data: shippingLine });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.post('/shipping-lines', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = createShippingLineSchema.parse(body);
    const shippingLine = await createShippingLine(ctx, {
      ...data,
      email: data.email || undefined,
    });
    return c.json({ data: shippingLine }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.put('/shipping-lines/:id', async (c) => {
  const ctx = c.get('ctx');
  const shippingLineId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = updateShippingLineSchema.parse(body);
    const updated = await updateShippingLine(ctx, shippingLineId, {
      ...data,
      email: data.email || undefined,
    });
    return c.json({ data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.delete('/shipping-lines/:id', async (c) => {
  const ctx = c.get('ctx');
  const shippingLineId = c.req.param('id');
  try {
    const result = await deleteShippingLine(ctx, shippingLineId);
    return c.json({ data: result });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ─── Port Routes ────────────────────────────────────────────────────────────

masterDataApp.get('/ports', async (c) => {
  const ctx = c.get('ctx');
  const companyId = c.req.query('companyId');
  const search = c.req.query('search');
  const type = c.req.query('type');
  const country = c.req.query('country');
  if (!companyId) return c.json({ error: 'BAD_REQUEST', message: 'Missing companyId' }, 400);

  try {
    const list = await listPorts(ctx, companyId, { search, type, country });
    return c.json({ data: list });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.get('/ports/:id', async (c) => {
  const ctx = c.get('ctx');
  const portId = c.req.param('id');
  try {
    const port = await getPortById(ctx, portId);
    return c.json({ data: port });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.post('/ports', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = createPortSchema.parse(body);
    const port = await createPort(ctx, data);
    return c.json({ data: port }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.put('/ports/:id', async (c) => {
  const ctx = c.get('ctx');
  const portId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = updatePortSchema.parse(body);
    const updated = await updatePort(ctx, portId, data);
    return c.json({ data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

masterDataApp.delete('/ports/:id', async (c) => {
  const ctx = c.get('ctx');
  const portId = c.req.param('id');
  try {
    const result = await deletePort(ctx, portId);
    return c.json({ data: result });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

export default masterDataApp;
