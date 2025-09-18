import { z } from "zod";
import { pgTable, serial, varchar, text, integer, boolean, timestamp, json, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Firebase Timestamp type
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Agent schema for Firebase
export const agentSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().optional(), // Not stored in Firestore, handled by Firebase Auth
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Agent = z.infer<typeof agentSchema>;
export type InsertAgent = z.infer<typeof agentSchema>;

// Magnet schema for Firebase
export const magnetSchema = z.object({
  id: z.string(), // UUID
  batchId: z.string(),
  agentId: z.string(),
  token: z.string(),
  isUsed: z.boolean().default(false),
  setupUrl: z.string().optional(),
  url: z.string().optional(), // Legacy support for some routes
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Magnet = z.infer<typeof magnetSchema>;
export type InsertMagnet = z.infer<typeof magnetSchema>;

// Magnet batch schema for Firebase
export const magnetBatchSchema = z.object({
  id: z.string(), // UUID
  agentId: z.string(),
  qty: z.number(),
  csvPath: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type MagnetBatch = z.infer<typeof magnetBatchSchema>;
export type InsertMagnetBatch = z.infer<typeof magnetBatchSchema>;

// Household schema for Firebase
export const householdSchema = z.object({
  id: z.string(), // UUID
  magnetToken: z.string(),
  agentId: z.string(),
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  homeType: z.enum(['single_family', 'condo', 'townhouse', 'apartment', 'mobile', 'other']),
  climateZone: z.string().optional(),
  phone: z.string().optional(),
  smsOptIn: z.boolean().optional().default(false),
  activatedAt: z.date().optional(),
  lastReminder: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Household = z.infer<typeof householdSchema>;
export type InsertHousehold = z.infer<typeof householdSchema>;

// Task schema for Firebase
export const taskSchema = z.object({
  id: z.string(), // UUID
  householdId: z.string(),
  agentId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['hvac', 'plumbing', 'electrical', 'roofing', 'gutters', 'windows', 'doors', 'flooring', 'exterior', 'interior', 'appliances', 'other']),
  frequency: z.enum(['once', 'monthly', 'quarterly', 'biannually', 'annually', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'completed', 'skipped', 'overdue']).default('pending'),
  scheduledDate: z.date(),
  completedAt: z.date().optional(),
  notes: z.string().optional(),
  reminderSent: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof taskSchema>;

// Lead schema for Firebase
export const leadSchema = z.object({
  id: z.string(), // UUID
  agentId: z.string(),
  householdId: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  homeType: z.enum(['single_family', 'condo', 'townhouse', 'apartment', 'mobile', 'other']).optional(),
  serviceInterest: z.enum(['hvac', 'plumbing', 'electrical', 'roofing', 'gutters', 'windows', 'doors', 'flooring', 'exterior', 'interior', 'appliances', 'general']).optional(),
  service: z.string().optional(), // Legacy support
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).default('new'),
  source: z.enum(['magnet_setup', 'referral', 'website', 'social', 'advertising', 'other']).default('magnet_setup'),
  notes: z.string().optional(),
  estimatedValue: z.number().optional(),
  followUpDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Lead = z.infer<typeof leadSchema>;
export type InsertLead = z.infer<typeof leadSchema>;

// Helper functions for Firebase Timestamp conversion
export function timestampToDate(timestamp: FirebaseTimestamp | Date | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}

export function dateToTimestamp(date: Date | undefined): FirebaseTimestamp | undefined {
  if (!date) return undefined;
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1000000;
  return { seconds, nanoseconds };
}

// Collection names for Firebase
export const COLLECTIONS = {
  AGENTS: 'agents',
  MAGNETS: 'magnets', 
  MAGNET_BATCHES: 'magnetBatches',
  HOUSEHOLDS: 'households',
  TASKS: 'tasks',
  LEADS: 'leads'
} as const;

// Insert schemas
export const insertAgentSchema = agentSchema.omit({ createdAt: true, updatedAt: true });
export const insertMagnetBatchSchema = magnetBatchSchema.omit({ createdAt: true, updatedAt: true });
export const insertMagnetSchema = magnetSchema.omit({ createdAt: true, updatedAt: true });
export const insertHouseholdSchema = householdSchema.omit({ createdAt: true, updatedAt: true });
export const insertTaskSchema = taskSchema.omit({ createdAt: true, updatedAt: true });
export const insertLeadSchema = leadSchema.omit({ createdAt: true, updatedAt: true });

// Batch creation schema for admin API
export const insertBatchSchema = z.object({
  agentId: z.string().min(1),
  qty: z.number().positive().max(1000),
});

// Setup and API schemas
export const setupActivateSchema = z.object({
  token: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  home_type: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.number().min(0).max(100).optional(),
  email: z.string().email().optional(),
});

export const setupPreviewSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  home_type: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.number().min(0).max(100).optional(),
});

export const taskCompleteSchema = z.object({
  householdToken: z.string().min(1),
  task_code: z.string().min(1),
});

export const agentLoginSchema = z.object({
  email: z.string().email(),
});

export const checkoutSchema = z.object({
  sku: z.enum(['100pack', '500pack', 'single', 'twopack']),
  agentId: z.string().optional(),
});

export const leadsSchema = z.object({
  householdToken: z.string().min(1),
  service: z.enum(['hvac', 'gutter', 'plumbing', 'electrical', 'roofing', 'flooring', 'painting', 'landscaping']),
  notes: z.string().optional(),
});

export const smsOptInSchema = z.object({
  token: z.string().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
});

export const smsVerifySchema = z.object({
  token: z.string().min(1),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Home Maintenance Task schema for PostgreSQL
export const homeMaintenanceTaskSchema = z.object({
  id: z.number(),
  taskCode: z.string(),
  category: z.string(),
  taskName: z.string(),
  baseFrequency: z.string(),
  monthsHotHumid: z.string().nullable(),
  monthsColdSnow: z.string().nullable(),
  monthsMixed: z.string().nullable(),
  monthsAridMountain: z.string().nullable(),
  seasonalTag: z.string().nullable(),
  howTo: z.string(),
  whyItMatters: z.string(),
  estMinutes: z.number(),
  materials: z.string().nullable(),
  safetyNote: z.string().nullable(),
  appliesIfFreeze: z.boolean(),
  appliesIfHurricane: z.boolean(),
  appliesIfWildfire: z.boolean(),
  appliesIfHardWater: z.boolean(),
  appliesIfHasSprinklers: z.boolean(),
  proServiceRecommended: z.boolean(),
  diyOk: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type HomeMaintenanceTask = z.infer<typeof homeMaintenanceTaskSchema>;

// Drizzle table definitions for PostgreSQL
export const homeMaintenanceTasksTable = pgTable("home_maintenance_tasks", {
  id: serial("id").primaryKey(),
  taskCode: varchar("task_code", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  baseFrequency: varchar("base_frequency", { length: 50 }).notNull(),
  monthsHotHumid: varchar("months_hot_humid", { length: 50 }),
  monthsColdSnow: varchar("months_cold_snow", { length: 50 }),
  monthsMixed: varchar("months_mixed", { length: 50 }),
  monthsAridMountain: varchar("months_arid_mountain", { length: 50 }),
  seasonalTag: varchar("seasonal_tag", { length: 50 }),
  howTo: text("how_to").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  estMinutes: integer("est_minutes").notNull(),
  materials: text("materials"),
  safetyNote: text("safety_note"),
  appliesIfFreeze: boolean("applies_if_freeze").notNull().default(false),
  appliesIfHurricane: boolean("applies_if_hurricane").notNull().default(false),
  appliesIfWildfire: boolean("applies_if_wildfire").notNull().default(false),
  appliesIfHardWater: boolean("applies_if_hard_water").notNull().default(false),
  appliesIfHasSprinklers: boolean("applies_if_has_sprinklers").notNull().default(false),
  proServiceRecommended: boolean("pro_service_recommended").notNull().default(false),
  diyOk: boolean("diy_ok").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schema using drizzle-zod
export const insertHomeMaintenanceTaskSchema = createInsertSchema(homeMaintenanceTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHomeMaintenanceTask = z.infer<typeof insertHomeMaintenanceTaskSchema>;

// Type exports
export type SetupActivateRequest = z.infer<typeof setupActivateSchema>;
export type SetupPreviewRequest = z.infer<typeof setupPreviewSchema>;
export type TaskCompleteRequest = z.infer<typeof taskCompleteSchema>;
export type LeadsRequest = z.infer<typeof leadsSchema>;
export type SmsOptInRequest = z.infer<typeof smsOptInSchema>;
export type SmsVerifyRequest = z.infer<typeof smsVerifySchema>;

// Pro Request schema for "Request a Pro" feature
export const proRequestSchema = z.object({
  id: z.string(), // UUID
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']),
  description: z.string().min(1).max(2000),
  photos: z.array(z.string()).max(5).default([]), // Array of URLs
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  preferredWindows: z.string().optional(),
  status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled']).default('new'),
  providerAssigned: z.string().optional(),
  publicTrackingCode: z.string(), // Short slug for public tracking
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ProRequest = z.infer<typeof proRequestSchema>;

// Provider schema for directory
export const providerSchema = z.object({
  id: z.string(), // UUID
  name: z.string().min(1),
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  coverageZips: z.array(z.string()),
  email: z.string().email(),
  phone: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Provider = z.infer<typeof providerSchema>;

// Pro Request Drizzle table definition
export const proRequestsTable = pgTable("pro_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trade: varchar("trade", { length: 50 }).notNull(),
  urgency: varchar("urgency", { length: 50 }).notNull(),
  description: text("description").notNull(),
  photos: json("photos").$type<string[]>().default([]),
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 5 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  preferredWindows: text("preferred_windows"),
  status: varchar("status", { length: 50 }).notNull().default('new'),
  providerAssigned: varchar("provider_assigned", { length: 255 }),
  publicTrackingCode: varchar("public_tracking_code", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider Drizzle table definition
export const providersTable = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  trade: varchar("trade", { length: 50 }).notNull(),
  coverageZips: json("coverage_zips").$type<string[]>().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Pro Requests
export const insertProRequestSchema = proRequestSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  publicTrackingCode: true,
  status: true 
});
export type InsertProRequest = z.infer<typeof insertProRequestSchema>;

// Insert schemas for Providers  
export const insertProviderSchema = providerSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;

// API request schemas
export const createProRequestSchema = z.object({
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']),
  description: z.string().min(1).max(2000),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  preferredWindows: z.string().optional(),
});

export const updateProRequestStatusSchema = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled']),
  providerAssigned: z.string().optional(),
});

// Type exports for API
export type CreateProRequestRequest = z.infer<typeof createProRequestSchema>;
export type UpdateProRequestStatusRequest = z.infer<typeof updateProRequestStatusSchema>;

// Audit Event schema for tracking changes
export const auditEventSchema = z.object({
  id: z.string(), // UUID
  requestId: z.string(), // Foreign key to pro_requests
  actor: z.string().default('admin'),
  type: z.enum(['status_change', 'provider_assignment', 'note_created']),
  data: z.record(z.any()), // JSON data for storing diff or payload
  createdAt: z.date().optional(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

// Note schema for internal notes
export const noteSchema = z.object({
  id: z.string(), // UUID
  requestId: z.string(), // Foreign key to pro_requests
  author: z.string().default('admin'),
  message: z.string().min(1).max(2000),
  createdAt: z.date().optional(),
});

export type Note = z.infer<typeof noteSchema>;

// Audit Event Drizzle table definition
export const auditEventsTable = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  actor: varchar("actor", { length: 100 }).notNull().default('admin'),
  type: varchar("type", { length: 50 }).notNull(),
  data: json("data").$type<Record<string, any>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note Drizzle table definition
export const notesTable = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  author: varchar("author", { length: 100 }).notNull().default('admin'),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertAuditEventSchema = auditEventSchema.omit({ 
  id: true, 
  createdAt: true 
});
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

export const insertNoteSchema = noteSchema.omit({ 
  id: true, 
  createdAt: true 
});
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Admin API request schemas
export const createNoteSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const adminProRequestFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled'])).optional(),
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']).optional(),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  providerAssigned: z.string().optional(),
  q: z.string().optional(), // Search query
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'urgency', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminProRequestFilters = z.infer<typeof adminProRequestFiltersSchema>;
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;

// =====================================================
// ORDER MAGNET SYSTEM SCHEMAS (E-COMMERCE)
// =====================================================

// Order Magnet System - Using Drizzle table definitions as source of truth

// Drizzle table definitions for Order Magnet System
export const orderMagnetOrdersTable = pgTable("order_magnet_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  shipAddressLine1: varchar("ship_address_line_1", { length: 255 }).notNull(),
  shipAddressLine2: varchar("ship_address_line_2", { length: 255 }),
  shipCity: varchar("ship_city", { length: 100 }).notNull(),
  shipState: varchar("ship_state", { length: 50 }).notNull(),
  shipZip: varchar("ship_zip", { length: 5 }).notNull(),
  shipCountry: varchar("ship_country", { length: 10 }).notNull().default('US'),
  subtotal: numeric("subtotal", { precision: 10, scale: 2, mode: 'number' }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2, mode: 'number' }).notNull().default('0'),
  discount: numeric("discount", { precision: 10, scale: 2, mode: 'number' }).notNull().default('0'),
  tax: numeric("tax", { precision: 10, scale: 2, mode: 'number' }).notNull().default('0'),
  total: numeric("total", { precision: 10, scale: 2, mode: 'number' }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('unpaid'),
  paymentProvider: varchar("payment_provider", { length: 20 }).notNull().default('stripe'),
  paymentRef: varchar("payment_ref", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default('new'),
  source: varchar("source", { length: 100 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  notes: text("notes"),
});

export const orderMagnetItemsTable = pgTable("order_magnet_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2, mode: 'number' }).notNull(),
  activationCode: varchar("activation_code", { length: 20 }).notNull().unique(),
  qrUrl: varchar("qr_url", { length: 500 }).notNull(),
  activationStatus: varchar("activation_status", { length: 20 }).notNull().default('inactive'),
  activatedAt: timestamp("activated_at"),
  activatedByEmail: varchar("activated_by_email", { length: 255 }),
  scanCount: integer("scan_count").notNull().default(0),
  lastScanAt: timestamp("last_scan_at"),
  printBatchId: varchar("print_batch_id"),
  serialNumber: varchar("serial_number", { length: 50 }),
  printFileUrl: varchar("print_file_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetBatchesTable = pgTable("order_magnet_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  printerName: varchar("printer_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default('open'),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2, mode: 'number' }),
  quantity: integer("quantity").notNull().default(0),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetShipmentsTable = pgTable("order_magnet_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  carrier: varchar("carrier", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  labelUrl: varchar("label_url", { length: 500 }),
  status: varchar("status", { length: 30 }).notNull().default('pending'),
  shippedAt: timestamp("shipped_at"),
  expectedDelivery: timestamp("expected_delivery"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetAuditEventsTable = pgTable("order_magnet_audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id"),
  itemId: varchar("item_id"),
  createdAt: timestamp("created_at").defaultNow(),
  actor: varchar("actor", { length: 100 }).notNull().default('admin'),
  type: varchar("type", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
});

// Drizzle-generated insert schemas and types for Order Magnet system
export const insertOrderMagnetOrderSchema = createInsertSchema(orderMagnetOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetOrder = z.infer<typeof insertOrderMagnetOrderSchema>;
export type OrderMagnetOrder = typeof orderMagnetOrdersTable.$inferSelect;

export const insertOrderMagnetItemSchema = createInsertSchema(orderMagnetItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetItem = z.infer<typeof insertOrderMagnetItemSchema>;
export type OrderMagnetItem = typeof orderMagnetItemsTable.$inferSelect;

export const insertOrderMagnetBatchSchema = createInsertSchema(orderMagnetBatchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetBatch = z.infer<typeof insertOrderMagnetBatchSchema>;
export type OrderMagnetBatch = typeof orderMagnetBatchesTable.$inferSelect;

export const insertOrderMagnetShipmentSchema = createInsertSchema(orderMagnetShipmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetShipment = z.infer<typeof insertOrderMagnetShipmentSchema>;
export type OrderMagnetShipment = typeof orderMagnetShipmentsTable.$inferSelect;

export const insertOrderMagnetAuditEventSchema = createInsertSchema(orderMagnetAuditEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderMagnetAuditEvent = z.infer<typeof insertOrderMagnetAuditEventSchema>;
export type OrderMagnetAuditEvent = typeof orderMagnetAuditEventsTable.$inferSelect;

// API request schemas for Order Magnet system
export const updateOrderMagnetOrderStatusSchema = z.object({
  status: z.enum(['paid', 'in_production', 'shipped', 'delivered', 'activated', 'canceled', 'refunded']),
  paymentStatus: z.enum(['paid', 'refunded', 'partial_refund']).optional(),
  paymentRef: z.string().optional(),
});

export const updateOrderMagnetShipmentSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  labelUrl: z.string().optional(),
  status: z.enum(['label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'lost']),
  shippedAt: z.string().optional(), // ISO date string
  expectedDelivery: z.string().optional(), // ISO date string
  deliveredAt: z.string().optional(), // ISO date string
});

export const createOrderMagnetBatchSchema = z.object({
  name: z.string().min(1),
  printerName: z.string().optional(),
  unitCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  itemIds: z.array(z.string()).optional(), // Items to add to batch
});

export const updateOrderMagnetBatchStatusSchema = z.object({
  status: z.enum(['submitted', 'printing', 'complete', 'canceled']),
  unitCost: z.number().min(0).optional(),
  submittedAt: z.string().optional(), // ISO date string
  completedAt: z.string().optional(), // ISO date string
});

export const activateItemSchema = z.object({
  itemId: z.string().optional(),
  activationEmail: z.string().email().optional(),
});

export const resendEmailSchema = z.object({
  type: z.enum(['confirmation', 'shipped', 'delivered', 'activation_reminder']),
});

export const adminOrderMagnetFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'paid', 'in_production', 'shipped', 'delivered', 'activated', 'canceled', 'refunded'])).optional(),
  paymentStatus: z.array(z.enum(['unpaid', 'paid', 'refunded', 'partial_refund'])).optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  sku: z.string().optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  batchId: z.string().optional(),
  carrier: z.string().optional(),
  activationStatus: z.enum(['inactive', 'activated', 'deactivated']).optional(),
  q: z.string().optional(), // Search query
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'total']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for Order Magnet API
export type UpdateOrderMagnetOrderStatusRequest = z.infer<typeof updateOrderMagnetOrderStatusSchema>;
export type UpdateOrderMagnetShipmentRequest = z.infer<typeof updateOrderMagnetShipmentSchema>;
export type CreateOrderMagnetBatchRequest = z.infer<typeof createOrderMagnetBatchSchema>;
export type UpdateOrderMagnetBatchStatusRequest = z.infer<typeof updateOrderMagnetBatchStatusSchema>;
export type ActivateItemRequest = z.infer<typeof activateItemSchema>;
export type ResendEmailRequest = z.infer<typeof resendEmailSchema>;
export type AdminOrderMagnetFilters = z.infer<typeof adminOrderMagnetFiltersSchema>;
