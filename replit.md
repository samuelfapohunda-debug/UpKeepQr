# Overview

This is an UpKeepQR Agent Management Platform built as a monorepo TypeScript application. The platform provides tools for managing business agents with features including scheduling, QR code generation, onboarding workflows, and dashboard management. The application is structured as a full-stack solution with a React frontend and Express backend, designed to streamline agent operations and automate common workflows. The customer-facing website has been moved to WordPress hosting instead of the previous Astro/Firebase setup.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and utilizes modern development patterns:
- **UI Framework**: React 18 with functional components and hooks
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized builds
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture
The backend follows a RESTful API design with Express.js:
- **Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **Validation**: Zod schemas for runtime type checking and API validation
- **Session Management**: In-memory storage pattern with extensible storage interface
- **Background Jobs**: Node-cron for scheduled tasks like reporting and cleanup
- **File Structure**: Modular route organization with separate concerns

## Database Design
Uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **ORM**: Drizzle for schema definition and query building
- **Connection**: Neon serverless PostgreSQL connection with WebSocket support
- **Schema**: Centralized schema definitions in shared directory for both client and server
- **Migrations**: Drizzle Kit for database migrations and schema management

## Development Environment
The project is configured for both development and production environments:
- **Monorepo Structure**: Yarn workspaces for dependency management
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend development
- **Build Process**: Separate build processes for client (Vite) and server (esbuild)
- **Type Checking**: Shared TypeScript configuration across the monorepo

## Authentication & Security
Implements token-based authentication for agent management:
- **Token Generation**: Nanoid for secure token generation
- **Setup Flow**: QR code-based agent onboarding with expiring tokens
- **Session Handling**: Express session management with configurable storage
- **Validation**: Zod schemas for input validation and type safety

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries

## UI Libraries
- **Radix UI**: Headless UI primitives for accessibility and consistent behavior
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **TanStack Query**: Data fetching and state management for React

## Utility Libraries
- **QRCode**: QR code generation for agent setup and workflows
- **ICS**: Calendar event generation for scheduling integration
- **Node-cron**: Background job scheduling for automated tasks
- **Zod**: Runtime type validation and schema definition

## Communication Services
- **Email Integration**: Placeholder implementation for agent notifications and onboarding emails (ready for services like SendGrid or AWS SES)