import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey(),
  
  // Basic Identification
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  preferredContact: text("preferred_contact"),
  hearAboutUs: text("hear_about_us"),
  
  // Address & Location
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type"),
  numberOfLocations: integer("number_of_locations"),
  locationNickname: text("location_nickname"),
  
  // Property & Asset Information
  homeType: text("home_type"),
  squareFootage: integer("square_footage"),
  roofAge: integer("roof_age"),
  hvacSystemType: text("hvac_system_type"),
  waterHeaterType: text("water_heater_type"),
  numberOfAssets: integer("number_of_assets"),
  assetCategories: text("asset_categories"),
  
  // Business/Agent Details
  companyName: text("company_name"),
  industryType: text("industry_type"),
  numberOfEmployees: integer("number_of_employees"),
  businessWebsite: text("business_website"),
  preferredServiceType: text("preferred_service_type"),
  estimatedQRLabels: text("estimated_qr_labels"),
  
  // Lead Capture Specific (Residential)
  interestType: text("interest_type"), // Sales, Rent, Lease
  needConsultation: boolean("need_consultation"),
  isOwner: boolean("is_owner"),
  budgetRange: text("budget_range"),
  timelineToProceed: text("timeline_to_proceed"),
  preferredContactTime: text("preferred_contact_time"),
  notes: text("notes"),
  
  // Metadata
  activationCode: text("activation_code"), // Link to magnet
  createdAt: timestamp("created_at").defaultNow(),
});
