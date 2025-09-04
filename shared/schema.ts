import { z } from "zod";

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

// Type exports
export type SetupActivateRequest = z.infer<typeof setupActivateSchema>;
export type SetupPreviewRequest = z.infer<typeof setupPreviewSchema>;
export type TaskCompleteRequest = z.infer<typeof taskCompleteSchema>;
export type LeadsRequest = z.infer<typeof leadsSchema>;
export type SmsOptInRequest = z.infer<typeof smsOptInSchema>;
export type SmsVerifyRequest = z.infer<typeof smsVerifySchema>;