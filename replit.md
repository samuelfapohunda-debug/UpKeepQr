# Overview

This is an UpKeepQR Agent Management Platform, a monorepo TypeScript application designed to manage business agents. It provides features like scheduling, QR code generation, onboarding workflows, and dashboard management. The platform aims to streamline agent operations and automate common tasks, utilizing a React frontend and an Express backend. The customer-facing website is hosted on WordPress.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses React 18 with TypeScript, functional components, and hooks. It employs Tailwind CSS with shadcn/ui for styling, Wouter for routing, TanStack Query for server state management, Vite for building, and React Hook Form with Zod for form handling.

## Backend Architecture
The backend is a RESTful API built with Express.js and TypeScript. It uses Drizzle ORM with PostgreSQL for data persistence, Zod for API validation, and Node-cron for scheduled tasks. The file structure is modular, organizing routes into dedicated modules for authentication, webhooks, and magnets, with shared utilities for audit logging and error handling.

## Database Design
The project utilizes PostgreSQL with Drizzle ORM for type-safe operations. It connects via Neon serverless PostgreSQL, defines schemas in a shared directory, and manages migrations with Drizzle Kit.

**Database Sequences**: The `order_id_counter` sequence is required for generating unique order IDs in format `{counter}-{year}`. This sequence is created automatically via the migration script at `server/migrations/create_order_id_counter.ts`. If the sequence is missing, Stripe webhook order creation will fail.

## Development Environment
The project is set up as a monorepo using Yarn workspaces. It uses Vite for frontend development with HMR and tsx for backend development. Separate build processes are configured for the client (Vite) and server (esbuild), with shared TypeScript configuration across the monorepo.

## Authentication & Security
The platform uses JWT-based authentication for admin access, with signed tokens expiring in 24 hours. Admin login is handled at `/api/auth/agent/login` with email/password validation. Tokens are stored client-side, and React route guards protect routes. Login attempts are rate-limited, and environment secrets are stored securely. A separate token-based system is used for homeowner QR setup. Zod schemas provide input validation.

**Admin Mode Verification**: Admin privileges are derived exclusively from server-side authentication. The backend checks JWT tokens and validates admin role before enabling admin-only features. Client payloads can never control admin mode, preventing privilege escalation attacks.

**Rate Limiting**: IP-based rate limiting is enforced using express-rate-limit across all public endpoints. The Express server is configured with `trust proxy: 1` for Replit's single-hop proxy architecture, ensuring accurate client IP detection without enabling IP spoofing vulnerabilities. Never set `validate: false` on rate limiters, as this disables critical security protections.

**Schema Consistency**: All API validation schemas use camelCase field naming (homeType, hvacType, waterHeater, roofAgeYears) for consistency between client and server. Both admin and customer activation flows send matching camelCase payloads.

**Zod Validation Pattern**: For optional fields in shared schemas, use `.optional()` without chaining `.min()` constraints. Pattern `.string().min(1).optional()` incorrectly validates min constraint on undefined values. Correct pattern: `.string().optional()`.

**Conditional Token Validation**: The `token` field uses conditional validation based on authentication:
- **Customers (via QR code)**: Token is **required** - must scan QR code with embedded token
- **Admins (via `/setup/new`)**: Token is **optional** - can create households manually without QR codes
- Implementation: `server/src/routes/setup.ts` checks authentication status and enforces token requirement for non-admin users
- Security: Admin mode requires JWT authentication (`role === 'admin'`) AND `ALLOW_ADMIN_SETUP_CREATION=true` environment variable

## UI/UX Decisions
The platform uses shadcn/ui and Tailwind CSS for a consistent and modern design. It leverages Radix UI for accessible headless components and Lucide React for iconography.

## Feature Specifications
- **Admin Setup Forms**: Comprehensive admin dashboard for managing homeowner setup forms, including status tracking, multi-author notes, and test notification capabilities.
- **Security-Hardened Setup Form Creation**: Admins can create households directly without QR codes. Features role-based authentication (JWT + ADMIN_EMAIL verification), audit event tracking for all CRUD operations, and optional welcome email control. Controlled by `ALLOW_ADMIN_SETUP_CREATION` environment variable. **Critical security fix (Nov 2025)**: Admin mode is now derived exclusively from server-side authentication, never from client input. The backend validates JWT tokens and checks admin role before enabling admin privileges.
- **Admin Setup Form Field Visibility**: Admins can access the full onboarding form (all 32 fields) via `/setup/new` route for comprehensive household creation. Features admin-specific UI badge, field count indicator, and direct submission to `/api/setup/activate`. The form displays all fields including Personal Detail (11 fields), Home Detail (11 fields), and Interests & Needs (10 fields), allowing admins complete control over household data entry. Admin mode is server-verified, not client-controlled.
- **Phase 1: Household Setup Completion** (Nov 24, 2025): Production-ready transaction-safe household activation system at `/api/setup/activate`. Features include:
  - **Transaction Safety**: All database operations wrapped in `db.transaction()` for atomicity with automatic rollback on errors
  - **Duplicate Prevention**: Validates activation codes haven't been used (checks both households table and order_magnet_items activation status)
  - **Token Validation**: Rejects invalid tokens (404), already-activated tokens (409), and duplicate household tokens (409)
  - **Order Linking**: Automatically links households to originating orders via order_magnet_items lookup
  - **Setup Completion**: Marks households as 'completed' with setupStartedAt and setupCompletedAt timestamps
  - **Home Profile Creation**: Establishes home_profile_extras relationship, persisting yearBuilt, roofAgeYears, hvacType, waterHeaterType, and contactPrefChannel fields
  - **QR Code Activation**: Updates order_magnet_items status to 'active' with activation timestamp and activator email
  - **Schema Validation**: Uses comprehensive setupActivateSchema with required fullName/email fields
  - **Security**: Admin mode derived exclusively from server-side JWT authentication, never from client input
  - **Field Scope**: Phase 1 captures core contact and basic home data. Additional fields (appliances array, roofMaterial, HOA info, smart home gear, planned projects) are deferred to Phase 2 when frontend forms are updated to collect them.
- **Contact Form API** (Nov 23, 2025): Fully functional contact form endpoint at `/api/contact` with rate limiting, email validation, and SendGrid integration. Features include: POST endpoint accepting name, email, phone (optional), subject, and message; validation for required fields and email format; rate limiting (5 requests per 15 minutes per IP); SendGrid email delivery to admin with HTML and text formats; structured JSON responses for success/error states. Architect reviewed with no security issues.
- **Professional Service Requests API** (Nov 23, 2025): Fully functional professional service request endpoint at `/api/pro-requests` with modular architecture, rate limiting, and dual email notifications. Features include: POST endpoint accepting trade (roofing/plumbing/electrical/hvac/general), urgency (emergency/24h/3days/flexible), description, address, and contact details; Zod validation for all fields including 5-digit ZIP regex; rate limiting (10 requests per 10 minutes per IP); best-effort audit logging (wrapped in try/catch to prevent failures from aborting requests); dual SendGrid email delivery (user confirmation + admin alert with urgency indicators); public tracking code generation; database persistence; structured JSON responses. Migrated from monolithic routes.ts to modular `server/src/routes/proRequests.ts`. Architect reviewed and approved with no security issues.
- **Unified Notification System**: Implemented with preference-based routing (email/SMS/both) using Twilio for SMS and SendGrid for email (planned). Includes TCPA compliance and graceful degradation for failures.
- **CID Attachments**: For email client compatibility, enabling inline QR code display in welcome emails.
- **Stripe Webhook Integration**: Handles `checkout.session.completed` events, creating orders with a sequential ID format (`{counter}-{year}`).
- **Modular Route Architecture**: All routes are being migrated to a modular system for better organization and maintainability.
- **Audit Event System**: All household CRUD operations are tracked with actor type (admin/customer/system), actor ID, email, timestamp, and contextual metadata for compliance and debugging.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database toolkit.

## UI Libraries
- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Component library built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.

## Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Data fetching and state management for React.

## Utility Libraries
- **QRCode**: QR code generation.
- **ICS**: Calendar event generation.
- **Node-cron**: Background job scheduling.
- **Zod**: Runtime type validation.

## Communication Services
- **Twilio**: SMS integration for notifications.
- **SendGrid**: Email integration (placeholder implemented, ready for full integration).

## Payment Integration
- **Stripe**: Payment processing.