import { pgTable, uuid, timestamp, text, pgEnum, numeric, jsonb } from 'drizzle-orm/pg-core';
import { companies, users } from './system.js';
import { shipments } from './shipments.js';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const containerStatusEnum = pgEnum('container_status', [
  'EMPTY', 'LOADED', 'DEPARTED_CHINA', 'ARRIVED_CAT_LAI',
  'CUSTOMS_HOLD', 'CUSTOMS_CLEARED', 'TRANSIT_VIETNAM',
  'DEPARTED_VIETNAM', 'ARRIVED_CAMBODIA', 'DELIVERED'
]);

export const containerTypeEnum = pgEnum('container_type', [
  '20GP', '40GP', '40HC', '45HC', '20RF', '40RF', 'LCL'
]);

export const customsStatusEnum = pgEnum('customs_status', [
  'NOT_STARTED', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW',
  'CUSTOMS_HOLD', 'CLEARED', 'COMPLETED'
]);

export const customsTypeEnum = pgEnum('customs_type', [
  'VIETNAM_TRANSIT', 'CAMBODIA_IMPORT', 'CAMBODIA_TRANSIT'
]);

export const taskStatusEnum = pgEnum('task_status', [
  'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
]);

export const issueSeverityEnum = pgEnum('issue_severity', [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
]);

export const issueStatusEnum = pgEnum('issue_status', [
  'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
]);

export const expenseTypeEnum = pgEnum('expense_type', [
  'OCEAN_FREIGHT', 'TRUCKING_CHINA', 'CAT_LAI_CHARGES',
  'CUSTOMS_FEE', 'TRANSIT_FEE', 'TRUCKING_VIETNAM',
  'CAMBODIA_TRUCKING', 'WAREHOUSE', 'HANDLING',
  'DOCUMENTATION', 'OTHER'
]);

export const revenueTypeEnum = pgEnum('revenue_type', [
  'CUSTOMER_FREIGHT', 'CUSTOMS_SERVICE_FEE', 'TRUCKING_FEE',
  'DOCUMENTATION_FEE', 'HANDLING_FEE', 'OTHER'
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const transitContainers = pgTable('transit_containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  containerNumber: text('container_number').notNull(),
  type: containerTypeEnum('type').notNull().default('40HC'),
  sealNumber: text('seal_number'),
  status: containerStatusEnum('status').notNull().default('LOADED'),
  location: text('location'),
  grossWeight: text('gross_weight'),
  netWeight: text('net_weight'),
  volumeCbm: text('volume_cbm'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitCustoms = pgTable('transit_customs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  type: customsTypeEnum('type').notNull(),
  declarationNumber: text('declaration_number'),
  declarationType: text('declaration_type'),
  customsOffice: text('customs_office'),
  declarationDate: timestamp('declaration_date'),
  registrationDate: timestamp('registration_date'),
  clearanceDate: timestamp('clearance_date'),
  status: customsStatusEnum('status').notNull().default('NOT_STARTED'),
  customsBroker: text('customs_broker'),
  transitPermit: text('transit_permit'),
  guarantee: text('guarantee'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitTasks = pgTable('transit_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  title: jsonb('title').$type<{ en: string; vi: string }>().notNull(),
  description: jsonb('description').$type<{ en: string; vi: string }>(),
  status: taskStatusEnum('status').notNull().default('TODO'),
  priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitIssues = pgTable('transit_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  title: jsonb('title').$type<{ en: string; vi: string }>().notNull(),
  description: jsonb('description').$type<{ en: string; vi: string }>(),
  severity: issueSeverityEnum('severity').notNull().default('MEDIUM'),
  status: issueStatusEnum('status').notNull().default('OPEN'),
  resolution: text('resolution'),
  responsibleId: uuid('responsible_id').references(() => users.id),
  dueDate: timestamp('due_date'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitExpenses = pgTable('transit_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  type: expenseTypeEnum('type').notNull(),
  description: jsonb('description').$type<{ en: string; vi: string }>(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  vendor: text('vendor'),
  invoiceNumber: text('invoice_number'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitRevenues = pgTable('transit_revenues', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  type: revenueTypeEnum('type').notNull(),
  description: jsonb('description').$type<{ en: string; vi: string }>(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  invoiceNumber: text('invoice_number'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

export const transitActivities = pgTable('transit_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  action: text('action').notNull(),
  description: jsonb('description').$type<{ en: string; vi: string }>().notNull(),
  entityType: text('entity_type'), // 'shipment', 'container', 'customs', 'document', etc.
  entityId: text('entity_id'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});
