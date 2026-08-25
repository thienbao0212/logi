import { pgTable, uuid, timestamp, text, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { companies } from './system.js';

export const shippingLines = pgTable('shipping_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  code: text('code').notNull(), // e.g. MSK, COSCO, EMC, ONE, WHL, CMA
  name: text('name').notNull(), // e.g. Maersk Line, COSCO Shipping Lines
  contactPerson: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  trackingUrl: text('tracking_url'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const portTypeEnum = pgEnum('port_type', [
  'SEAPORT',
  'INLAND_PORT',
  'ICD',
  'BORDER_GATE',
  'AIRPORT'
]);

export const ports = pgTable('ports', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  code: text('code').notNull(), // e.g. VNSGN, CNSHA, KHPNH, KHKOS
  name: text('name').notNull(), // e.g. Cat Lai Port, Shanghai Port
  country: text('country').notNull(), // e.g. Vietnam, China, Cambodia
  countryCode: text('country_code'), // e.g. VN, CN, KH
  city: text('city'), // e.g. Ho Chi Minh City, Shanghai, Phnom Penh
  type: portTypeEnum('type').notNull().default('SEAPORT'),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
