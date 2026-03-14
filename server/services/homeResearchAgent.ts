import Anthropic from "@anthropic-ai/sdk";
import { query } from "../src/lib/db.js";
import type { HomeProfile, MaintenanceTask, MaintenanceTaskTemplate } from "../../shared/schema.js";

// -------------------------------------------------------
// Climate zone mapping by US state
// -------------------------------------------------------
const STATE_CLIMATE_MAP: Record<string, string> = {
  FL: "Hot/Humid", GA: "Hot/Humid", AL: "Hot/Humid", MS: "Hot/Humid",
  LA: "Hot/Humid", SC: "Hot/Humid", TX: "Hot/Humid",
  NC: "Mixed/Humid", TN: "Mixed/Humid", AR: "Mixed/Humid", OK: "Mixed/Humid",
  VA: "Mixed/Humid", KY: "Mixed/Humid", MO: "Mixed/Humid", MD: "Mixed/Humid",
  DE: "Mixed/Humid", NJ: "Mixed/Humid",
  NY: "Cold", PA: "Cold", OH: "Cold", IN: "Cold", IL: "Cold",
  MI: "Cold", WI: "Cold", MN: "Cold", IA: "Cold", ND: "Cold",
  SD: "Cold", NE: "Cold", KS: "Cold",
  NM: "Mixed/Dry", AZ: "Mixed/Dry", CO: "Mixed/Dry", UT: "Mixed/Dry", NV: "Mixed/Dry",
  CA: "Marine", OR: "Marine", WA: "Marine",
};

function deriveClimateZone(state: string): string {
  return STATE_CLIMATE_MAP[state?.toUpperCase()] ?? "Mixed/Humid";
}

// -------------------------------------------------------
// Types
// -------------------------------------------------------
export interface HomeProfileInput {
  householdId: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  yearBuilt?: number;
  squareFootage?: number;
  homeType?: string;
  roofType?: string;
  hvacType?: string;
  appliances?: string[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  month: number;
  frequency: "monthly" | "quarterly" | "biannual" | "annual";
  category: "hvac" | "plumbing" | "electrical" | "exterior" | "interior" | "appliances" | "seasonal";
  priority: "high" | "medium" | "low";
  estimated_cost_min: number;
  estimated_cost_max: number;
  estimated_diy_cost: number;
  estimated_pro_cost: number;
}

// -------------------------------------------------------
// Safe JSON parse with one retry
// -------------------------------------------------------
async function parseTasksWithRetry(
  client: Anthropic,
  rawText: string,
  model: string,
  originalPrompt: string,
): Promise<GeneratedTask[]> {
  const attempt = (text: string): GeneratedTask[] | null => {
    try {
      const cleaned = text
        .replace(/^```(?:json)?/m, "")
        .replace(/```$/m, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed as GeneratedTask[];
      return null;
    } catch {
      return null;
    }
  };

  const first = attempt(rawText);
  if (first) return first;

  // One automatic retry — ask Claude to fix the JSON
  const retryResponse = await client.messages.create({
    model,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `The following text should be a valid JSON array of maintenance tasks but failed to parse. Return only the corrected JSON array with no other text:\n\n${rawText}`,
      },
    ],
  });

  const retryText = retryResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const second = attempt(retryText);
  if (second) return second;

  throw new Error("Failed to parse AI response as JSON after retry");
}

// -------------------------------------------------------
// Upsert home profile row
// -------------------------------------------------------
async function upsertHomeProfile(input: HomeProfileInput, climateZone: string): Promise<HomeProfile> {
  const existing = await query(
    `SELECT * FROM home_profiles WHERE household_id = $1 ORDER BY id DESC LIMIT 1`,
    [input.householdId],
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0] as HomeProfile;
    // Update with latest data if missing fields
    await query(
      `UPDATE home_profiles SET
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        zip = COALESCE($5, zip),
        year_built = COALESCE($6, year_built),
        square_footage = COALESCE($7, square_footage),
        home_type = COALESCE($8, home_type),
        roof_type = COALESCE($9, roof_type),
        hvac_type = COALESCE($10, hvac_type),
        climate_zone = $11,
        appliances = COALESCE($12, appliances),
        updated_at = NOW()
      WHERE id = $1`,
      [
        row.id, input.address, input.city, input.state, input.zip,
        input.yearBuilt, input.squareFootage, input.homeType,
        input.roofType, input.hvacType, climateZone,
        JSON.stringify(input.appliances ?? []),
      ],
    );
    const updated = await query(`SELECT * FROM home_profiles WHERE id = $1`, [row.id]);
    return updated.rows[0] as HomeProfile;
  }

  const result = await query(
    `INSERT INTO home_profiles
      (household_id, address, city, state, zip, year_built, square_footage,
       home_type, roof_type, hvac_type, climate_zone, climate_zone_source, appliances)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'state_heuristic',$12)
     RETURNING *`,
    [
      input.householdId, input.address, input.city, input.state, input.zip,
      input.yearBuilt, input.squareFootage, input.homeType,
      input.roofType, input.hvacType, climateZone,
      JSON.stringify(input.appliances ?? []),
    ],
  );
  return result.rows[0] as HomeProfile;
}

// -------------------------------------------------------
// Main agent function
// -------------------------------------------------------
export async function generateMaintenanceSchedule(
  input: HomeProfileInput,
): Promise<MaintenanceTask[]> {
  const climateZone = deriveClimateZone(input.state ?? "");

  // Upsert home profile
  const profile = await upsertHomeProfile(input, climateZone);

  // Return existing tasks if schedule already generated
  if (profile.scheduleGeneratedAt) {
    const existing = await query(
      `SELECT * FROM maintenance_tasks WHERE home_profile_id = $1 ORDER BY month, id`,
      [profile.id],
    );
    if (existing.rows.length > 0) {
      return existing.rows as MaintenanceTask[];
    }
  }

  // Fetch task templates as reference
  const templatesResult = await query(
    `SELECT * FROM maintenance_task_templates ORDER BY category, frequency`,
    [],
  );
  const templates = templatesResult.rows as MaintenanceTaskTemplate[];

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const model = "claude-sonnet-4-0";
  const currentYear = new Date().getFullYear();
  const homeAge = input.yearBuilt ? currentYear - input.yearBuilt : null;
  const applianceList = (input.appliances ?? []).join(", ") || "standard appliances";

  const systemPrompt =
    "You are an expert home maintenance advisor. You generate detailed, accurate maintenance schedules based on home characteristics and climate. Use the provided maintenance standards as a reference. Always respond with strictly valid JSON only. Do not include commentary. Do not include markdown. Do not include code fences. If unsure about a task, omit it.";

  const userPrompt = `Generate a complete 12-month home maintenance schedule for this home:

Location: ${input.city ?? "Unknown"}, ${input.state ?? "Unknown"}
Climate Zone: ${climateZone}
Year Built: ${input.yearBuilt ?? "Unknown"}${homeAge !== null ? ` (Age: ${homeAge} years)` : ""}
Home Type: ${input.homeType ?? "single_family"}
Square Footage: ${input.squareFootage ?? "Unknown"}
Roof Type: ${input.roofType ?? "Unknown"}
HVAC Type: ${input.hvacType ?? "Unknown"}
Appliances: ${applianceList}

Known maintenance standards to reference:
${JSON.stringify(templates, null, 2)}

Return a JSON array of maintenance tasks. Each task must follow this exact structure:
{
  "title": string,
  "description": string (2-3 sentences explaining why this matters for their specific home and climate),
  "month": number (1-12),
  "frequency": "monthly" | "quarterly" | "biannual" | "annual",
  "category": "hvac" | "plumbing" | "electrical" | "exterior" | "interior" | "appliances" | "seasonal",
  "priority": "high" | "medium" | "low",
  "estimated_cost_min": number,
  "estimated_cost_max": number,
  "estimated_diy_cost": number,
  "estimated_pro_cost": number
}

Example task:
{
  "title": "Replace HVAC air filter",
  "description": "Your central air system in a hot/humid climate runs heavily from April through October. Replacing filters quarterly prevents airflow restriction and reduces energy costs by up to 15%.",
  "month": 3,
  "frequency": "quarterly",
  "category": "hvac",
  "priority": "high",
  "estimated_cost_min": 10,
  "estimated_cost_max": 30,
  "estimated_diy_cost": 15,
  "estimated_pro_cost": 75
}

Generate 20-30 tasks spread across all 12 months. For homes older than 30 years, add electrical panel inspection and plumbing inspection tasks. Prioritize tasks based on the climate zone and home age.`;

  let rawResponse = "";
  let tokensUsed = 0;
  let success = false;
  let errorMessage: string | undefined;
  let tasks: GeneratedTask[] = [];

  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const message = await stream.finalMessage();
    tokensUsed = (message.usage.input_tokens ?? 0) + (message.usage.output_tokens ?? 0);
    rawResponse = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    tasks = await parseTasksWithRetry(client, rawResponse, model, userPrompt);
    success = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  } finally {
    // Log the AI generation attempt
    await query(
      `INSERT INTO ai_generation_logs
        (household_id, home_profile_id, model, prompt, response, tokens_used, success, error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        input.householdId, profile.id, model, userPrompt,
        rawResponse, tokensUsed, success, errorMessage ?? null,
      ],
    );
  }

  if (!success) {
    throw new Error(`AI generation failed: ${errorMessage}`);
  }

  // Save generated tasks to DB
  const insertedTasks: MaintenanceTask[] = [];
  for (const task of tasks) {
    const res = await query(
      `INSERT INTO maintenance_tasks
        (household_id, home_profile_id, title, description, month, frequency,
         category, priority, estimated_cost_min, estimated_cost_max,
         estimated_diy_cost, estimated_pro_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        input.householdId, profile.id, task.title, task.description,
        task.month, task.frequency, task.category, task.priority,
        task.estimated_cost_min, task.estimated_cost_max,
        task.estimated_diy_cost, task.estimated_pro_cost,
      ],
    );
    insertedTasks.push(res.rows[0] as MaintenanceTask);
  }

  // Mark schedule as generated
  await query(
    `UPDATE home_profiles SET schedule_generated_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [profile.id],
  );

  return insertedTasks;
}
