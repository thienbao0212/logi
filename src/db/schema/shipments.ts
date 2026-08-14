import { pgTable, uuid, timestamp, text, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { companies, users } from './system.js';

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'DRAFT',
  'PENDING',
  'BOOKED',
  'CARGO_RECEIVED',
  'DEPARTED_CHINA',
  'IN_TRANSIT',
  'ARRIVED_CAT_LAI',
  'CUSTOMS_TRANSIT_DECLARED',
  'CUSTOMS_CLEARANCE',
  'CUSTOMS_CLEARED',
  'DEPARTED_VIETNAM',
  'ARRIVED_CAMBODIA',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
]);

export const transportationModeEnum = pgEnum('transportation_mode', [
  'SEA',
  'AIR',
  'LAND',
  'RAIL'
]);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city'),
  country: text('country'),
  type: text('type').notNull(), // WAREHOUSE, PORT, CUSTOMER
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  trackingNumber: text('tracking_number').notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  originId: uuid('origin_id').notNull().references(() => locations.id),
  destinationId: uuid('destination_id').notNull().references(() => locations.id),
  status: shipmentStatusEnum('status').notNull().default('DRAFT'),
  mode: transportationModeEnum('mode').notNull(),
  
  // Weights and Dimensions
  weightTotal: text('weight_total'),
  volumeTotal: text('volume_total'),
  
  // Key Dates
  estimatedDepartureDate: timestamp('estimated_departure_date'),
  estimatedArrivalDate: timestamp('estimated_arrival_date'),
  actualDepartureDate: timestamp('actual_departure_date'),
  actualArrivalDate: timestamp('actual_arrival_date'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const shipmentEvents = pgTable('shipment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  locationId: uuid('location_id').references(() => locations.id), // optional if event isn't tied to specific location
  status: shipmentStatusEnum('status').notNull(),
  description: text('description').notNull(),
  eventDate: timestamp('event_date').notNull().defaultNow(),
  metadata: jsonb('metadata'), // Any extra data
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  name: text('name').notNull(),
  documentType: text('document_type').notNull(), // INVOICE, BILL_OF_LADING, CUSTOMS_DECLARATION
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});
