import { z } from "zod";

export const homeProfileExtraSchema = z.object({
  householdId: z.string().min(1, "Household ID required"),
  ownerType: z.enum(["owner", "landlord", "pm", "flipper"]).optional(),
  sellWindow: z.enum(["none", "lt12", "12to24", "gt24"]).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  roofMaterial: z.enum(["asphalt", "metal", "tile", "other"]).optional(),
  roofAgeYears: z.number().min(0).max(50).optional(),
  hvacType: z.enum(["gas", "electric", "heat_pump"]).optional(),
  hvacAgeYears: z.number().min(0).max(50).optional(),
  hvacLastServiceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  waterHeaterType: z.enum(["tank", "tankless"]).optional(),
  waterHeaterAgeYears: z.number().min(0).max(50).optional(),
  waterHeaterCapacityGal: z.number().optional(),
  exteriorType: z.enum(["siding", "brick", "stucco", "other"]).optional(),
  lotSqFt: z.number().optional(),
  insuranceProvider: z.string().optional(),
  insuranceRenewalMonth: z.number().min(1).max(12).optional(),
  electricProvider: z.string().optional(),
  gasProvider: z.string().optional(),
  hasHoa: z.boolean().optional(),
  hoaName: z.string().optional(),
  plannedProjects: z.array(z.string()).optional(),
  smartHomeGear: z.array(z.string()).optional(),
  budgetBand: z.enum(["lt2k", "2to10k", "gt10k"]).optional(),
  contactPrefChannel: z.enum(["email", "sms"]).optional(),
  contactPrefCadence: z.enum(["monthly", "quarterly", "urgent_only"]).optional(),
  marketingConsent: z.boolean().default(true),
  appliances: z.array(z.object({
    name: z.string(),
    brand: z.string().optional(),
    year: z.number().optional()
  })).optional(),
});

export const updateHomeProfileExtraSchema = homeProfileExtraSchema.partial().omit({ householdId: true });

export type HomeProfileExtraInput = z.infer<typeof homeProfileExtraSchema>;
export type UpdateHomeProfileExtraInput = z.infer<typeof updateHomeProfileExtraSchema>;
