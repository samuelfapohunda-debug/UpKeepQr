import { z } from "zod";

export const homeProfileExtraSchema = z.object({
  ownerType: z.enum(["owner", "landlord", "pm", "flipper"]).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  hvacBrand: z.string().max(50).optional(),
  hvacAgeYears: z.number().min(0).max(50).optional(),
  waterHeaterBrand: z.string().max(50).optional(),
  insuranceProvider: z.string().max(100).optional(),
  hasHoa: z.boolean().optional(),
  marketingConsent: z.boolean().default(true),
});

export type HomeProfileExtra = z.infer<typeof homeProfileExtraSchema>;
