import { z } from "zod";
import { pgTable, serial, varchar, text, integer, boolean, timestamp, json, numeric, jsonb, index } from "drizzle-orm/pg-core";
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
  country: z.enum(['US', 'CA']).optional().default('US'),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  heatPump: z.enum(['yes', 'no', 'unknown']).optional(),
  sqft: z.number().positive().optional(),
  hvacType: z.string().optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
  interestType: z.enum(['sales', 'rent', 'lease', 'maintenance']).optional(),
  needConsultation: z.boolean().optional(),
  budgetRange: z.string().optional(),
  timelineToProceed: z.string().optional(),
  notes: z.string().optional(),
  activatedAt: z.date().optional(),
  lastReminder: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type HouseholdFirebase = z.infer<typeof householdSchema>;
export type InsertHouseholdFirebase = z.infer<typeof householdSchema>;

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
  token: z.string().optional(), // Optional for admin-created households
  
  // Personal Details (REQUIRED)
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  smsOptIn: z.boolean().optional().default(false),
  
  // Home Details
  country: z.enum(['US', 'CA']).optional().default('US'),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(), // Optional - backend supports both postalCode and zip
  
  // Legacy support
  zip: z.string().optional(), // Backend uses postalCode || zip
  
  // Admin fields (server-only, not sent by client)
  skipWelcomeEmail: z.boolean().optional().default(false),
  // NOTE: adminCreated removed - server derives admin mode from auth, never trusts client
  homeType: z.string().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  sqft: z.number().positive().optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  hvacType: z.string().optional(),
  heatPump: z.enum(['yes', 'no', 'unknown']).optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
  isOwner: z.boolean().optional(),
  
  // Interest Details
  interestType: z.enum(['sales', 'rent', 'lease', 'maintenance']).optional(),
  needConsultation: z.boolean().optional(),
  budgetRange: z.string().optional(),
  timelineToProceed: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Either postalCode or zip must be provided
  return data.postalCode || data.zip;
}, {
  message: "Either postalCode or zip must be provided",
  path: ["postalCode"],
});

export const setupPreviewSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  homeType: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvacType: z.string().optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
});

export const taskCompleteSchema = z.object({
  householdToken: z.string().min(1),
  task_code: z.string().min(1),
});

export const agentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  requestId: z.string().nullable().optional(), // Foreign key to pro_requests (nullable for household events)
  householdId: z.string().nullable().optional(), // Foreign key to households
  orderId: z.string().nullable().optional(), // Foreign key to orders
  actor: z.string().default('admin'),
  type: z.enum([
    'status_change', 
    'provider_assignment', 
    'note_created',
    'qr_activated',
    'admin_household_created',
    'household_updated',
    'household_deleted'
  ]),
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
  requestId: varchar("request_id", { length: 255 }), // Nullable for household events
  householdId: varchar("household_id", { length: 255 }), // For household-related events
  orderId: varchar("order_id", { length: 255 }), // For order-related events
  actor: varchar("actor", { length: 100 }).notNull().default('admin'),
  type: varchar("type", { length: 50 }).notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
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
  orderId: varchar("order_id", { length: 50 }).unique().notNull(),
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
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('unpaid'),
  paymentProvider: varchar("payment_provider", { length: 20 }).notNull().default('stripe'),
  paymentRef: varchar("payment_ref", { length: 255 }).unique(),
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
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  activationCode: varchar("activation_code", { length: 20 }).notNull().unique(),
  qrUrl: text("qr_url").notNull(),
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
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
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

// Stripe Events table for webhook idempotency
export const stripeEventsTable = pgTable("stripe_events", {
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  orderId: varchar("order_id", { length: 50 }),
  metadata: jsonb("metadata"),
});

// Households table for PostgreSQL (notification preferences and contact info)
export const householdsTable = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }), // E.164 format: +14155552671
  
  // Address fields
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipcode: varchar("zipcode", { length: 10 }),
  
  // Notification preferences
  notificationPreference: varchar("notification_preference", { length: 20 }).notNull().default('both'), // 'email_only', 'sms_only', 'both'
  smsOptIn: boolean("sms_opt_in").default(false),
  preferredContact: varchar("preferred_contact", { length: 20 }), // 'email', 'phone', 'text'
  
  // Setup tracking
  setupStatus: varchar("setup_status", { length: 20 }).notNull().default('not_started'), // 'not_started', 'in_progress', 'completed'
  setupCompletedAt: timestamp("setup_completed_at"),
  setupStartedAt: timestamp("setup_started_at"),
  setupNotes: text("setup_notes"), // Public setup notes visible to homeowner
  setupIssues: text("setup_issues"), // Setup issues/blockers
  
  // Calendar integration
  calendarSyncPreference: varchar("calendar_sync_preference", { length: 20 }).default('not_configured'), // 'enabled', 'disabled', 'not_configured'
  
  // Relationships and audit
  magnetCode: varchar("magnet_code", { length: 50 }), // QR code identifier
  magnetToken: varchar("magnet_token", { length: 50 }), // Activation token (nullable for admin-created)
  orderId: varchar("order_id", { length: 50 }), // Links to order_magnet_orders.order_id
  lastModifiedBy: varchar("last_modified_by"), // UUID of admin user who last edited
  
  // Security and tracking fields
  createdBy: varchar("created_by", { length: 20 }).notNull().default('customer'), // 'customer', 'admin', 'api'
  createdByUserId: varchar("created_by_user_id", { length: 255 }), // UUID of admin who created (if admin-created)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for search and filtering
  setupStatusIdx: index("idx_households_setup_status").on(table.setupStatus),
  completedDateIdx: index("idx_households_completed_date").on(table.setupCompletedAt),
  orderIdIdx: index("idx_households_order_id").on(table.orderId),
  // Composite index for location filtering
  locationIdx: index("idx_households_location").on(table.state, table.zipcode),
}));

// Setup Form Notes table for admin comments
export const setupFormNotesTable = pgTable("setup_form_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull(), // Links to households.id
  createdBy: varchar("created_by"), // Email of admin user who created note
  content: text("content").notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for fetching notes by household (exclude soft-deleted)
  householdIdx: index("idx_setup_notes_household").on(table.householdId),
  authorIdx: index("idx_setup_notes_author").on(table.createdBy),
  createdIdx: index("idx_setup_notes_created").on(table.createdAt),
}));

// Contact Messages table
export const contactMessagesTable = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  message: text("message").notNull(),
  sourceIp: varchar("source_ip", { length: 45 }), // IPv6 can be up to 45 chars
  status: varchar("status", { length: 20 }).notNull().default('new'),
  ticketId: varchar("ticket_id", { length: 20 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
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

// Households schemas and types (PostgreSQL)
export const insertHouseholdDbSchema = createInsertSchema(householdsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHouseholdDb = z.infer<typeof insertHouseholdDbSchema>;
export type HouseholdDb = typeof householdsTable.$inferSelect;
export type Household = typeof householdsTable.$inferSelect; // Alias for frontend

// Setup Form Notes schemas and types
export const insertSetupFormNoteSchema = createInsertSchema(setupFormNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSetupFormNote = z.infer<typeof insertSetupFormNoteSchema>;
export type SetupFormNote = typeof setupFormNotesTable.$inferSelect;

// Contact Message schemas and types
export const insertContactMessageSchema = createInsertSchema(contactMessagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ticketId: true, // Generated by API
  sourceIp: true, // Set by API
  status: true, // Defaults to 'new'
});
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessagesTable.$inferSelect;

// Contact form validation schema (for API endpoint)
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name must be 120 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required").max(160, "Subject must be 160 characters or less"),
  message: z.string().min(1, "Message is required").max(5000, "Message must be 5000 characters or less"),
});
export type ContactFormData = z.infer<typeof contactFormSchema>;

// Admin contact message filters
export const adminContactMessageFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'read', 'replied'])).optional(),
  q: z.string().optional(), // Search query
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type AdminContactMessageFilters = z.infer<typeof adminContactMessageFiltersSchema>;

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

// Home Profile Extra Data Table
export const homeProfileExtras = pgTable("home_profile_extras", {
  id: serial("id").primaryKey(),
  householdId: text("household_id").notNull().unique(),
  ownerType: text("owner_type"),
  sellWindow: text("sell_window"),
  
  // Property Details (Phase 1 fields)
  homeType: text("home_type"), // single_family, condo, townhouse, apartment, mobile, other
  yearBuilt: integer("year_built"),
  squareFootage: integer("square_footage"), // House square footage (different from lot)
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  
  // Roof
  roofMaterial: text("roof_material"),
  roofAgeYears: integer("roof_age_years"),
  
  // HVAC
  hvacType: text("hvac_type"),
  hvacAgeYears: integer("hvac_age_years"),
  hvacLastServiceMonth: text("hvac_last_service_month"),
  
  // Water Heater
  waterHeaterType: text("water_heater_type"),
  waterHeaterAgeYears: integer("water_heater_age_years"),
  waterHeaterCapacityGal: integer("water_heater_capacity_gal"),
  
  // Exterior and Lot
  exteriorType: text("exterior_type"),
  lotSqFt: integer("lot_sq_ft"),
  
  // Insurance and Utilities
  insuranceProvider: text("insurance_provider"),
  insuranceRenewalMonth: integer("insurance_renewal_month"),
  electricProvider: text("electric_provider"),
  gasProvider: text("gas_provider"),
  
  // HOA
  hasHoa: boolean("has_hoa").default(false),
  hoaName: text("hoa_name"),
  
  // Planning and Preferences
  plannedProjects: text("planned_projects").array(),
  smartHomeGear: text("smart_home_gear").array(),
  budgetBand: text("budget_band"),
  contactPrefChannel: text("contact_pref_channel"),
  contactPrefCadence: text("contact_pref_cadence"),
  marketingConsent: boolean("marketing_consent").default(true),
  appliances: jsonb("appliances"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type HomeProfileExtra = typeof homeProfileExtras.$inferSelect;
export type InsertHomeProfileExtra = typeof homeProfileExtras.$inferInsert;

// Household Task Assignments Table
export const householdTaskAssignmentsTable = pgTable("household_task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()::text`),
  householdId: varchar("household_id").notNull(),
  taskId: integer("task_id").notNull(),
  
  // Scheduling
  dueDate: timestamp("due_date", { mode: 'date' }).notNull(),
  frequency: varchar("frequency", { length: 50 }),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  skippedAt: timestamp("skipped_at"),
  skippedReason: text("skipped_reason"),
  
  // Additional info
  priority: varchar("priority", { length: 20 }).default('medium'),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  householdIdx: index("idx_household_task_assignments_household").on(table.householdId),
  dueDateIdx: index("idx_household_task_assignments_due_date").on(table.dueDate),
  statusIdx: index("idx_household_task_assignments_status").on(table.status),
  taskIdx: index("idx_household_task_assignments_task").on(table.taskId),
  householdStatusIdx: index("idx_household_task_assignments_household_status").on(table.householdId, table.status),
  householdDueIdx: index("idx_household_task_assignments_household_due").on(table.householdId, table.dueDate),
}));

export type HouseholdTaskAssignment = typeof householdTaskAssignmentsTable.$inferSelect;
export type InsertHouseholdTaskAssignment = typeof householdTaskAssignmentsTable.$inferInsert;

// Admin Setup Forms API Schemas
export const adminSetupFormFiltersSchema = z.object({
  status: z.string().optional(), // 'not_started', 'in_progress', 'completed'
  city: z.string().optional(),
  state: z.string().optional(), // Two-letter state code
  zipcode: z.string().optional(), // 5 or 9-digit ZIP
  q: z.string().optional(), // Search query (name, email, address)
  dateFrom: z.string().optional(), // ISO date string for setup_completed_at
  dateTo: z.string().optional(), // ISO date string for setup_completed_at
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'setupCompletedAt', 'createdAt', 'city', 'zipcode']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type AdminSetupFormFilters = z.infer<typeof adminSetupFormFiltersSchema>;

export const updateSetupFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(), // E.164 format
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zipcode: z.string().max(10).optional(),
  notificationPreference: z.enum(['email_only', 'sms_only', 'both']).optional(),
  smsOptIn: z.boolean().optional(),
  preferredContact: z.string().max(20).optional(),
  setupStatus: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  setupNotes: z.string().max(10000).optional(),
  setupIssues: z.string().max(10000).optional(),
  magnetCode: z.string().max(50).optional(),
  orderId: z.string().max(50).optional(),
});
export type UpdateSetupFormData = z.infer<typeof updateSetupFormSchema>;

export const createSetupFormNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(10000, "Note must be 10,000 characters or less"),
});
export type CreateSetupFormNoteData = z.infer<typeof createSetupFormNoteSchema>;

export const testNotificationSchema = z.object({
  channel: z.enum(['email', 'sms', 'both']),
});
export type TestNotificationData = z.infer<typeof testNotificationSchema>;

// =====================================================
// GOOGLE CALENDAR INTEGRATION SCHEMAS
// =====================================================

// Calendar Connections table - stores OAuth tokens and sync preferences
export const calendarConnectionsTable = pgTable("calendar_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull(), // Links to households.id
  provider: varchar("provider", { length: 20 }).notNull().default('google'), // 'google', 'apple', 'outlook'
  
  // Encrypted tokens (AES-256-GCM with IV:authTag:encrypted format)
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry"),
  
  // Calendar metadata
  calendarId: text("calendar_id").notNull(),
  calendarName: text("calendar_name"),
  calendarTimezone: varchar("calendar_timezone", { length: 100 }).notNull().default('America/New_York'),
  
  // Sync settings
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  lastSync: timestamp("last_sync"),
  lastSyncStatus: varchar("last_sync_status", { length: 20 }), // 'success', 'failed', 'pending'
  lastSyncError: text("last_sync_error"),
  
  // Event preferences
  defaultEventDuration: varchar("default_event_duration", { length: 10 }).notNull().default('01:00'), // HH:MM format
  defaultEventTime: varchar("default_event_time", { length: 5 }).notNull().default('09:00'), // HH:MM 24-hour format
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("idx_calendar_connections_household").on(table.householdId),
  providerIdx: index("idx_calendar_connections_provider").on(table.provider),
  syncEnabledIdx: index("idx_calendar_connections_sync_enabled").on(table.householdId, table.syncEnabled),
}));

// Calendar Sync Events table - tracks individual calendar events
export const calendarSyncEventsTable = pgTable("calendar_sync_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(), // Links to calendar_connections.id
  householdId: varchar("household_id").notNull(), // Links to households.id
  
  // Task reference
  taskAssignmentId: varchar("task_assignment_id"), // Links to household_task_assignments.id
  taskCode: varchar("task_code", { length: 100 }),
  taskTitle: text("task_title").notNull(),
  propertyAddress: text("property_address"),
  
  // Google Calendar event details
  googleEventId: text("google_event_id").notNull(),
  eventStart: timestamp("event_start").notNull(),
  eventEnd: timestamp("event_end").notNull(),
  eventStatus: varchar("event_status", { length: 20 }).notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled'
  
  // Sync tracking
  syncStatus: varchar("sync_status", { length: 20 }).notNull().default('synced'), // 'synced', 'failed', 'pending_update'
  lastSyncAttempt: timestamp("last_sync_attempt"),
  syncErrorMessage: text("sync_error_message"),
  
  // Lightweight event metadata
  eventMetadata: jsonb("event_metadata").$type<{
    htmlLink?: string;
    iCalUID?: string;
    colorId?: string;
    updated?: string;
  }>(),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  connectionIdx: index("idx_calendar_sync_events_connection").on(table.connectionId),
  householdIdx: index("idx_calendar_sync_events_household").on(table.householdId),
  googleIdIdx: index("idx_calendar_sync_events_google_id").on(table.googleEventId),
  statusIdx: index("idx_calendar_sync_events_status").on(table.syncStatus, table.eventStatus),
  taskIdx: index("idx_calendar_sync_events_task").on(table.taskAssignmentId),
  startDateIdx: index("idx_calendar_sync_events_start_date").on(table.eventStart),
  // Unique constraint to prevent duplicate events
  uniqueTaskEventIdx: index("idx_calendar_sync_events_unique_task").on(table.connectionId, table.taskAssignmentId, table.eventStart),
}));

// Insert schemas and types for Calendar Integration
export const insertCalendarConnectionSchema = createInsertSchema(calendarConnectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCalendarConnection = z.infer<typeof insertCalendarConnectionSchema>;
export type CalendarConnection = typeof calendarConnectionsTable.$inferSelect;

export const insertCalendarSyncEventSchema = createInsertSchema(calendarSyncEventsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCalendarSyncEvent = z.infer<typeof insertCalendarSyncEventSchema>;
export type CalendarSyncEvent = typeof calendarSyncEventsTable.$inferSelect;

// Calendar API request/response schemas
export const calendarConnectionStatusSchema = z.object({
  connected: z.boolean(),
  provider: z.string().optional(),
  calendarName: z.string().optional(),
  calendarTimezone: z.string().optional(),
  syncEnabled: z.boolean(),
  lastSync: z.string().nullable().optional(),
  lastSyncStatus: z.string().nullable().optional(),
  totalEventsSynced: z.number().optional(),
});
export type CalendarConnectionStatus = z.infer<typeof calendarConnectionStatusSchema>;

export const calendarSyncResultSchema = z.object({
  eventsCreated: z.number(),
  eventsUpdated: z.number(),
  eventsFailed: z.number(),
  syncTimestamp: z.string(),
});
export type CalendarSyncResult = z.infer<typeof calendarSyncResultSchema>;

export const toggleCalendarSyncSchema = z.object({
  syncEnabled: z.boolean(),
});
export type ToggleCalendarSyncRequest = z.infer<typeof toggleCalendarSyncSchema>;

export const disconnectCalendarSchema = z.object({
  deleteEvents: z.boolean().optional().default(true),
});
export type DisconnectCalendarRequest = z.infer<typeof disconnectCalendarSchema>;

// Lead Capture
export * from "./lead-schema";
