# Overview

MaintCue is an Agent Management Platform designed to streamline business agent operations within a monorepo TypeScript application. It offers features for scheduling, QR code generation, comprehensive onboarding workflows, and dashboard management. The platform aims to automate tasks and provide a robust system for efficient agent management, utilizing a React frontend and an Express backend.

## Branding
- **Logo**: MaintCue logo image at `client/public/images/maintcue-logo.png` (referenced as `/images/maintcue-logo.png` in frontend code)
- **Brand Colors**: Green (#10B981), Navy (#1E3A5F), Dark Green (#059669)
- **Logo Text Style**: "Maint" (green/white) + "Cue" (navy)
- **Email Logo**: Text-based logo for email client compatibility, using `server/lib/emailBranding.ts` utilities
- **Favicon**: SVG at `client/public/favicon.svg` with brand colors
- **Policy**: NO EMOJI in notifications or email templates. Use text indicators ([!], [i]) instead.
- **Email Templates**: All use gradient header (#10B981 to #059669), text-based logo, and standardized footer with copyright + links

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The frontend is built with React, leveraging Tailwind CSS and `shadcn/ui` for a modern, consistent design. Radix UI provides accessible headless components, and Lucide React is used for iconography. TanStack Query manages frontend state, while Wouter handles routing. Form management utilizes React Hook Form and Zod for validation.

## Technical Implementations
The backend is a RESTful API developed with Express.js and TypeScript. It uses Drizzle ORM with PostgreSQL for data persistence and Node-cron for scheduled tasks. Zod ensures API validation and schema consistency (camelCase field naming) across client and server. The project operates as a monorepo with Yarn workspaces, using Vite for frontend development and `tsx` for backend development.

## Feature Specifications
- **Admin & Onboarding Management**: Admins can manage homeowner setup forms, track statuses, and create households with security-hardened flows.
- **Household Setup & Activation**: A transaction-safe system prevents duplicates, validates tokens, links households to orders, and activates QR codes.
- **Email Notifications & QR Scan Tracking**: Integrates SendGrid for notifications and automatically tracks QR code scans.
- **Automated Maintenance Task Generation**: Personalized maintenance tasks are generated based on home details, with critical filtering for exterior tasks based on home type.
- **Task Scheduling & Reminder System**: Features a 32-task catalog, daily cron jobs for overdue tasks and reminders, and a priority-based reminder queue.
- **Contact & Service Request APIs**: Dedicated APIs for contact and professional service requests with rate limiting, validation, and email notifications.
- **Authentication & Security**: Utilizes JWT-based authentication for admin access, IP-based rate limiting, and server-side authentication for admin mode. Includes a robust RBAC system, CSRF protection, permission middleware, enhanced input validation, and structured logging. Magic link authentication provides passwordless login for users.
- **Unified Notification System**: Supports preference-based routing (email/SMS) via Twilio and SendGrid, with TCPA compliance.
- **Stripe Webhook Integration**: Processes `checkout.session.completed` events for order creation.
- **Modular Architecture & Audit Logging**: Features modular routes and an audit event system for all household CRUD operations.
- **Appliance Tracking & Warranty Management**: Provides CRUD operations for appliances, warranty tracking with expiration alerts, and maintenance history logging. Includes automated daily notifications for expiring warranties.
- **Maintenance History & Reporting**: Detailed logs for maintenance linked to appliances and tasks, supporting various log types with cost tracking and reporting.
- **Customer Success Pages**: Welcome pages for customers post-registration.
- **Customer Dashboard**: A three-tab dashboard (`Tasks`, `Appliances`, `Details`) at `/my-home` for managing maintenance tasks, appliances, and viewing household information with session-based authentication.
- **New Multi-Step Onboarding Form**: A progressive 4-step onboarding flow with visual home type selection, a maintenance schedule preview, and auto-save functionality.
- **Animated Background System**: CSS+SVG animated shapes on homepage hero and How It Works sections. Large shapes (130-850px) at 0.28-0.45 opacity with 35-50px movement amplitude. 8 shapes per section on desktop, 3 on mobile. Uses IntersectionObserver viewport pausing, prefers-reduced-motion support, mobile optimization, and GPU acceleration. Kill switch: add `disable-animated-bg` class to `<html>`. Component at `client/src/components/AnimatedBackground.tsx`, CSS in `client/src/index.css`.
- **Address Autocomplete**: Uses Google Places API (New) `AutocompleteSuggestion` API (not deprecated `AutocompleteService`). Required for Google accounts created after March 2025. Components: `Step2Account.tsx`, `RequestPro.tsx`.

## System Design Choices
The project uses PostgreSQL with Drizzle ORM, hosted on Neon serverless. It employs a critical `order_id_counter` sequence and robust indexing for tables like `household_task_assignments`.

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