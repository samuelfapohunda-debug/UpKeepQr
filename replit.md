# Overview

This project is an Agent Management Platform (UpKeepQR) within a monorepo TypeScript application. Its core purpose is to streamline business agent operations through features like scheduling, QR code generation, comprehensive onboarding workflows, and dashboard management. The platform features a React frontend and an Express backend, with a WordPress site handling the customer-facing interface. The business vision is to automate tasks and provide a robust system for managing agents efficiently.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform utilizes React for the frontend, styled with Tailwind CSS and `shadcn/ui` for a consistent, modern design. It incorporates Radix UI for accessible headless components and Lucide React for iconography. Frontend state management is handled by TanStack Query, and Wouter is used for routing. Forms are managed with React Hook Form and Zod for validation.

## Technical Implementations
The backend is a RESTful API built with Express.js and TypeScript. It uses Drizzle ORM with PostgreSQL for data persistence and Node-cron for scheduled tasks. Zod is extensively used for API validation and ensuring schema consistency (camelCase field naming) across the client and server. The project is structured as a monorepo using Yarn workspaces, with Vite for frontend development and `tsx` for backend development.

## Feature Specifications
- **Admin & Onboarding Management**: Comprehensive admin dashboards manage homeowner setup forms, including status tracking and test notifications. Admins can create households directly via a security-hardened flow, controlled by server-side authentication and environment variables, with full access to all onboarding fields.
- **Household Setup & Activation**: A transaction-safe household activation system (`/api/setup/activate`) prevents duplicates, validates tokens, links households to originating orders, and marks setups as complete. It also creates home profiles and activates QR codes.
- **Email Notifications & QR Scan Tracking**: Integrates SendGrid for customer confirmation and admin notification emails, with all user data properly escaped to prevent injection attacks. QR code scans are automatically tracked, incrementing scan counts and updating timestamps.
- **Automated Maintenance Task Generation**: Personalized maintenance tasks are automatically generated based on home details (e.g., HVAC type, roof age, home type) with smart filtering, priority assignment, and scheduling logic. Tasks are inserted in batches within the setup transaction. **Critical filtering**: Exterior tasks (gutters, roof, pressure washing, deck, sprinklers) are ONLY assigned to single-family homes and townhouses, never to condos or apartments (managed by HOA).
- **Task Scheduling & Reminder System** (Dec 2024):
  - **32-Task Catalog**: Comprehensive maintenance task catalog with categories (HVAC, Plumbing, Exterior, Safety, Appliance, Seasonal) seeded via `server/scripts/seed-tasks.ts` with idempotency protection.
  - **Cron Jobs**: Daily jobs at 9 AM EST with concurrency guards (reentrancy flags) for overdue task processing and reminder queue dispatch.
  - **Reminder Queue**: Priority-based reminder scheduling - high priority: 7,3,1,0 days before due; medium: 7,1,0 days; low: 3,0 days. Reminders created automatically during task generation with timezone-safe date handling.
  - **Admin Household Tasks View**: `/api/admin/households/:id/tasks` endpoint with JOINs and summary statistics. HouseholdTasksView component with category filtering, priority/status badges, and summary cards accessible via SetupFormsDashboard.
- **Contact & Service Request APIs**: Dedicated APIs for contact forms (`/api/contact`) and professional service requests (`/api/pro-requests`) with rate limiting, validation, email notifications, audit logging, and database persistence.
- **Authentication & Security**: JWT-based authentication for admin access with server-side validation of roles and tokens. Implements IP-based rate limiting across public endpoints and ensures schema consistency. Admin mode is exclusively derived from server-side authentication, preventing client-side privilege escalation. Conditional token validation is applied for customer (required) vs. admin (optional) setup flows.
- **P0 Security Hardening (v2.0)**: 
  - **RBAC System** (`server/lib/security/rbac.ts`): Permission-based access control with roles (admin, agent, homeowner, system). Permissions include dashboard access, appliance management, maintenance logs, and admin functions.
  - **CSRF Protection** (`server/lib/security/csrf.ts`): Token-based CSRF validation with secure cookie settings, timing-safe comparison, and Bearer token bypass for API clients.
  - **Permission Middleware** (`server/lib/security/permission-middleware.ts`): Middleware functions for enforcing permissions on routes with structured security event logging.
  - **Enhanced Input Validation** (`server/lib/validation/schemas.ts`): Comprehensive validation schemas for email (with disposable domain blocking), phone (with E.164 normalization), address, and other inputs with sanitization utilities.
  - **Structured Logging** (`server/lib/logging/structured-logger.ts`): JSON logging with correlation IDs, request tracking, audit logging, and security event capture.
  - **Enhanced Health Checks** (`server/src/routes/health.ts`): Database connectivity checks with response time, memory usage monitoring, and Kubernetes-compatible liveness/readiness probes.
- **Unified Notification System**: Designed for preference-based routing (email/SMS/both) using Twilio for SMS and planned SendGrid integration for email, with TCPA compliance.
- **Stripe Webhook Integration**: Processes `checkout.session.completed` events to create orders with a sequential ID format.
- **Modular Architecture & Audit Logging**: Routes are modularized for maintainability. All household CRUD operations are tracked via an audit event system, recording actor type, ID, email, timestamp, and metadata for compliance.
- **Appliance Tracking & Warranty Management**: Comprehensive appliance management with CRUD operations, warranty tracking with expiration alerts (14-day threshold), and maintenance history logging. Features include: common appliances catalog (seeded with 15 typical home appliances), household-specific appliance registration with serial number uniqueness, warranty status reports, and automatic cost tracking. All endpoints require authentication.
- **Maintenance History & Reporting**: Detailed maintenance logs linked to appliances and scheduled tasks. Supports manual, scheduled, and emergency log types with cost tracking, service provider recording, and on-time completion metrics. Reports include maintenance history with cost trends and warranty status summaries.
- **Customer Success Pages** (Dec 2024):
  - **Registration Success Page** (`/registration/success`): Customer-facing welcome page after completing home registration with personalized next steps, email check reminder, and dashboard access link.
- **Customer Dashboard** (Jan 2026):
  - **Three-Tab Structure**: Tasks, Appliances, and Details tabs at `/my-home`
  - **Tasks Tab**: Maintenance tasks with category filtering, completion buttons with confirmation dialog, task statistics (total, completed, pending, overdue), priority badges, due dates, and professional service request link
  - **Appliances Tab**: Full CRUD appliance management integrated as a tab (not dialog), warranty tracking with expiration alerts
  - **Details Tab**: Household information display (owner info, home type, location, subscription status) with edit placeholder
  - **Task Completion API**: `PATCH /api/customer/tasks/:taskId` endpoint with session auth, double-completion prevention, and optimistic UI updates
  - **Tab Persistence**: Selected tab saved to localStorage via `useTabState` hook
  - **Type Definitions**: `client/src/types/dashboard.ts` for Task, Household, TasksResponse types
  - **Components**: HouseholdDetails component at `client/src/components/HouseholdDetails.tsx`
  - **Performance**: useMemo for derived data (stats, categories, filtered tasks), useCallback for handlers
  - Uses session-based authentication with HTTP-only cookies
- **New Multi-Step Onboarding Form** (Dec 2024):
  - **Routes**: `/new-setup` and `/new-setup/:token` for new customer onboarding flow
  - **Progressive Disclosure**: 4-step flow (Home Profile, Account Setup, Refine Schedule, Notifications) with optional steps clearly marked
  - **Visual Home Type Selection**: Card-based UI with icons for Single Family, Condo, Townhouse, Apartment with task count estimates
  - **Instant Gratification**: After step 2, shows preview of generated maintenance schedule before asking for optional details
  - **Auto-save**: Debounced localStorage persistence (500ms) to preserve progress across page reloads
  - **Components**: `client/src/components/onboarding/` contains ProgressIndicator, Step1HomeProfile, Step2Account, GratificationPreview, Step3RefineSchedule, Step4Notifications
  - **Mobile-Responsive**: Full dark mode support with responsive grid layouts
- **Magic Link Authentication** (Jan 2026):
  - **Passwordless Login**: Secure magic link-based authentication for QR code activation and dashboard access
  - **Database Tables**: `magic_links` (24-hour expiry, single-use tokens) and `sessions` (30-day expiry, HTTP-only cookies, role field)
  - **Security Features**:
    - HTTP-only session cookies (not accessible to JavaScript)
    - Code exchange pattern to prevent programmatic token harvesting (GET returns HTML form that POSTs to set cookie)
    - Server-side authorization middleware (`server/middleware/sessionAuth.ts`) derives householdId from session, not client input
    - 60-second one-time exchange codes for magic link completion
    - Cryptographically secure tokens (nanoid/32)
    - **Explicit Admin Mode Flag**: Admin-created households require explicit `adminMode: true` in request body to prevent accidental admin mode when token extraction fails (Jan 2026 security fix)
  - **Flow**: Scan QR → Check status → Complete setup → Magic link sent → Click link → Exchange code → Session cookie set → Dashboard access
  - **Endpoints**:
    - `GET /api/setup/check/:code` - Check QR activation status, send magic link if already activated
    - `POST /api/setup/activate` - Complete setup, create household, send magic link
    - `GET /api/auth/magic` - Verify magic link, return exchange form
    - `POST /api/auth/magic/complete` - Exchange code for session cookie
    - `GET /api/auth/session/verify` - Verify session from HTTP-only cookie (includes role and expiry)
    - `GET /api/customer/household` - Get household data (session-based auth)
    - `GET /api/customer/tasks` - Get tasks (session-based auth)
  - **Pages**: `/check-email` (magic link sent confirmation), `/auth/error` (error handling for expired/used links)
  - **Customer Dashboard**: Session-based authentication with logout functionality, no client-side household ID exposure
- **Admin Authentication System** (Jan 2026):
  - **Role-Based Sessions**: Sessions include role field (customer, admin, pro) with unified session verification
  - **Database Tables**: `admin_users` table with bcrypt password hashing, `sessions` updated with role column and indexes
  - **Security Features**:
    - Rate limiting: 5 attempts per 15 minutes (adminRateLimit middleware)
    - Account lockout: 15-minute lock after 5 failed attempts
    - Bcrypt password hashing (12 rounds)
    - HTTP-only session cookies (session_token)
    - Structured logging for security events
  - **Frontend**: AdminLogin page at `/admin/login`, useAuth hook with 5-minute cache and expiry awareness
  - **Endpoints**:
    - `POST /api/auth/admin/login` - Admin login with rate limiting and account lockout
    - `GET /api/auth/admin/verify` - Admin session verification
    - `POST /api/auth/admin/logout` - Clear admin session
    - `GET /api/auth/session/verify` - Unified session verify (both customer and admin)
  - **Middleware**: requireAdmin middleware for protected admin routes

## System Design Choices
The database uses PostgreSQL with Drizzle ORM, connected via Neon serverless. A critical `order_id_counter` sequence is used for unique order IDs. The `household_task_assignments` table manages links between households and maintenance tasks, with robust indexing and foreign key constraints.

## Database Migration Status
- **Firebase Migration**: COMPLETE (Dec 19, 2024)
- **Phase 1**: Households CRUD migrated to PostgreSQL
- **Phase 2A**: Created 4 new PostgreSQL tables (agents, schedules, task_completions, reminder_queue)
- **Phase 2B**: All 28 functions migrated (agents, schedules, task_completions, reminder_queue, leads, events, audit_logs, magnet_batches, magnets, tasks)
- **Phase 3**: Firebase completely removed from codebase (firebase.ts deleted, packages uninstalled)
- **Database**: Single PostgreSQL database with 26 tables
- **Documentation**: See `docs/MIGRATION_COMPLETE.md` for full details

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database toolkit.

## UI Libraries
- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Component library.
- **Lucide React**: Icon library.

## Development Tools
- **Vite**: Build tool.
- **TypeScript**: Type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Data fetching and state management.

## Utility Libraries
- **QRCode**: QR code generation.
- **ICS**: Calendar event generation.
- **Node-cron**: Background job scheduling.
- **Zod**: Runtime type validation.

## Communication Services
- **Twilio**: SMS integration.
- **SendGrid**: Email integration.

## Payment Integration
- **Stripe**: Payment processing.