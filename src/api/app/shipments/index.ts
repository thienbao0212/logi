import { Hono } from 'hono';
import { AppContext } from '../../../lib/context/types.js';
import { createShipment, listShipments, addTrackingEvent, getShipmentById, updateShipment } from '../../../services/shipment.js';
import { addDocumentToShipment, listShipmentDocuments } from '../../../services/documents.js';
import {
  listContainers, addContainer, listCustoms, addCustoms,
  listTasks, addTask, listIssues, addIssue, listActivities
} from '../../../services/transit.js';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';

const shipmentsApp = new Hono<{ Variables: { ctx: AppContext } }>();

// All routes require auth
shipmentsApp.use('*', requireAuth);

const createShipmentSchema = z.object({
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  originId: z.string().uuid(),
  destinationId: z.string().uuid(),
  mode: z.enum(['SEA', 'AIR', 'LAND', 'RAIL']),
  weightTotal: z.string().optional(),
  volumeTotal: z.string().optional(),
});

const STATUSES = ['DRAFT', 'PENDING', 'BOOKED', 'CARGO_RECEIVED', 'DEPARTED_CHINA', 'IN_TRANSIT', 'ARRIVED_CAT_LAI', 'CUSTOMS_TRANSIT_DECLARED', 'CUSTOMS_CLEARANCE', 'CUSTOMS_CLEARED', 'DEPARTED_VIETNAM', 'ARRIVED_CAMBODIA', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const;

const updateShipmentSchema = z.object({
  customerId: z.string().uuid().optional(),
  originId: z.string().uuid().optional(),
  destinationId: z.string().uuid().optional(),
  mode: z.enum(['SEA', 'AIR', 'LAND', 'RAIL']).optional(),
  weightTotal: z.string().optional(),
  volumeTotal: z.string().optional(),
  status: z.enum(STATUSES).optional(),
});

const createEventSchema = z.object({
  status: z.enum(STATUSES),
  description: z.string().min(1),
  locationId: z.string().uuid().optional(),
});

const createDocumentSchema = z.object({
  name: z.string().min(1),
  documentType: z.string().min(1),
  fileUrl: z.string().url(),
});

shipmentsApp.get('/', async (c) => {
  const ctx = c.get('ctx');
  const companyId = c.req.query('companyId');
  if (!companyId) return c.json({ error: 'BAD_REQUEST', message: 'Missing companyId' }, 400);

  try {
    const list = await listShipments(ctx, companyId);
    return c.json({ data: list });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = createShipmentSchema.parse(body);
    const shipment = await createShipment(ctx, data);
    return c.json({ data: shipment }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/events', async (c) => {
  const ctx = c.get('ctx');
  const shipmentId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = createEventSchema.parse(body);
    const event = await addTrackingEvent(ctx, shipmentId, data);
    return c.json({ data: event }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.get('/:id/documents', async (c) => {
  const ctx = c.get('ctx');
  const shipmentId = c.req.param('id');
  try {
    const docs = await listShipmentDocuments(ctx, shipmentId);
    return c.json({ data: docs });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/documents', async (c) => {
  const ctx = c.get('ctx');
  const shipmentId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = createDocumentSchema.parse(body);
    const doc = await addDocumentToShipment(ctx, shipmentId, data);
    return c.json({ data: doc }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── GET /api/shipments/:id — full detail ─────────────────────────────────────
shipmentsApp.get('/:id', async (c) => {
  const ctx = c.get('ctx');
  const shipmentId = c.req.param('id');
  try {
    const shipment = await getShipmentById(ctx, shipmentId);
    return c.json({ data: shipment });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── PUT /api/shipments/:id — update shipment ─────────────────────────────────
shipmentsApp.put('/:id', async (c) => {
  const ctx = c.get('ctx');
  const shipmentId = c.req.param('id');
  try {
    const body = await c.req.json();
    const data = updateShipmentSchema.parse(body);
    const shipment = await updateShipment(ctx, shipmentId, data);
    return c.json({ data: shipment });
  } catch (err: any) {
    if (err.name === 'ZodError') return c.json({ error: 'BAD_REQUEST', details: err.errors }, 400);
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── Containers ────────────────────────────────────────────────────────────────
shipmentsApp.get('/:id/containers', async (c) => {
  const ctx = c.get('ctx');
  try {
    const data = await listContainers(ctx, c.req.param('id'));
    return c.json({ data });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/containers', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = await addContainer(ctx, c.req.param('id'), body);
    return c.json({ data }, 201);
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── Customs ───────────────────────────────────────────────────────────────────
shipmentsApp.get('/:id/customs', async (c) => {
  const ctx = c.get('ctx');
  try {
    const data = await listCustoms(ctx, c.req.param('id'));
    return c.json({ data });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/customs', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = await addCustoms(ctx, c.req.param('id'), body);
    return c.json({ data }, 201);
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
shipmentsApp.get('/:id/tasks', async (c) => {
  const ctx = c.get('ctx');
  try {
    const data = await listTasks(ctx, c.req.param('id'));
    return c.json({ data });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/tasks', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = await addTask(ctx, c.req.param('id'), body);
    return c.json({ data }, 201);
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── Issues ────────────────────────────────────────────────────────────────────
shipmentsApp.get('/:id/issues', async (c) => {
  const ctx = c.get('ctx');
  try {
    const data = await listIssues(ctx, c.req.param('id'));
    return c.json({ data });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/issues', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = await addIssue(ctx, c.req.param('id'), body);
    return c.json({ data }, 201);
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

// ── Activities ────────────────────────────────────────────────────────────────
shipmentsApp.get('/:id/activities', async (c) => {
  const ctx = c.get('ctx');
  try {
    const data = await listActivities(ctx, c.req.param('id'));
    return c.json({ data });
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

shipmentsApp.post('/:id/activities', async (c) => {
  const ctx = c.get('ctx');
  try {
    const body = await c.req.json();
    const data = await import('../../../services/transit.js').then(m => m.addActivity(ctx, c.req.param('id'), body));
    return c.json({ data }, 201);
  } catch (err: any) {
    if (err.code) return c.json({ error: err.code, message: err.message }, err.status || 400);
    throw err;
  }
});

export default shipmentsApp;

