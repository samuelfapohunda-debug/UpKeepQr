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
- **Contact & Service Request APIs**: Dedicated APIs for contact forms (`/api/contact`) and professional service requests (`/api/pro-requests`) with rate limiting, validation, email notifications, audit logging, and database persistence.
- **Authentication & Security**: JWT-based authentication for admin access with server-side validation of roles and tokens. Implements IP-based rate limiting across public endpoints and ensures schema consistency. Admin mode is exclusively derived from server-side authentication, preventing client-side privilege escalation. Conditional token validation is applied for customer (required) vs. admin (optional) setup flows.
- **Unified Notification System**: Designed for preference-based routing (email/SMS/both) using Twilio for SMS and planned SendGrid integration for email, with TCPA compliance.
- **Stripe Webhook Integration**: Processes `checkout.session.completed` events to create orders with a sequential ID format.
- **Modular Architecture & Audit Logging**: Routes are modularized for maintainability. All household CRUD operations are tracked via an audit event system, recording actor type, ID, email, timestamp, and metadata for compliance.

## System Design Choices
The database uses PostgreSQL with Drizzle ORM, connected via Neon serverless. A critical `order_id_counter` sequence is used for unique order IDs. The `household_task_assignments` table manages links between households and maintenance tasks, with robust indexing and foreign key constraints.

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