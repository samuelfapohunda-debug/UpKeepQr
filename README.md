# Monorepo Agent Management Platform

A full-stack TypeScript application built with Yarn workspaces, featuring a Node.js/Express server and React web application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn 4+

### Installation & Setup

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Set up environment variables**
   ```bash
   # The following environment variables are already configured in Replit:
   # DATABASE_URL, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
   ```

3. **Development - Run both apps**
   ```bash
   yarn dev
   ```

4. **Individual app development**
   ```bash
   # Server only (runs on port 3001)
   yarn server:dev
   
   # Web only (runs on port 5173) 
   yarn web:dev
   ```

### Production Build & Deploy

```bash
# Build both applications
yarn build

# Start production server
yarn start
```

## 📁 Project Structure

```
├── server/                 # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── config.ts      # Configuration management
│   │   ├── routes/        # API route handlers
│   │   │   ├── index.ts   # Route setup
│   │   │   ├── health.ts  # Health check endpoint
│   │   │   ├── auth.ts    # Authentication routes
│   │   │   ├── qr.ts      # QR code generation
│   │   │   └── calendar.ts # Calendar/ICS routes
│   │   ├── lib/           # Utilities and libraries
│   │   │   ├── db.ts      # Database connection
│   │   │   ├── mail.ts    # Email utilities
│   │   │   └── ics.ts     # Calendar file generation
│   │   ├── jobs/          # Background jobs with node-cron
│   │   │   └── index.ts   # Cron job definitions
│   │   └── types/         # TypeScript type definitions
│   │       └── index.ts   # Shared types
│   ├── package.json
│   └── tsconfig.json
├── web/                   # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── main.tsx       # React entry point
│   │   ├── App.tsx        # Main app component with routing
│   │   ├── constants.ts   # API base URL and constants
│   │   ├── index.css      # Global styles with Tailwind
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx   # Product homepage
│   │   │   ├── Onboarding.tsx # /setup/:token route
│   │   │   └── Dashboard.tsx  # /agent dashboard
│   │   └── components/    # Reusable components
│   │       └── Navigation.tsx # App navigation
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
├── .editorconfig          # Editor configuration
├── .prettierrc            # Code formatting rules
├── package.json           # Root workspace configuration
└── README.md              # This file
```

## 🛠 Available Scripts

### Root Level Commands
- `yarn dev` - Start both server and web apps in development mode
- `yarn build` - Build both applications for production
- `yarn start` - Start production server (requires build first)
- `yarn server:dev` - Start only the server in development mode
- `yarn server:build` - Build only the server
- `yarn server:start` - Start only the production server
- `yarn web:dev` - Start only the web app in development mode
- `yarn web:build` - Build only the web app
- `yarn web:preview` - Preview the built web app
- `yarn install:all` - Install all workspace dependencies
- `yarn clean` - Remove all node_modules and dist folders
- `yarn format` - Format all code with Prettier
- `yarn format:check` - Check code formatting

### Server Requirements Met ✅
- ✅ Express with routing
- ✅ Zod for validation  
- ✅ dotenv for environment variables
- ✅ pg for PostgreSQL
- ✅ node-cron for scheduled jobs
- ✅ qrcode for QR generation
- ✅ ics for calendar files
- ✅ nanoid for token IDs
- ✅ Health check at GET /health
- ✅ Proper folder structure: src/index.ts, src/routes/*, src/lib/*, src/jobs/*, src/types/*, src/config.ts

### Web Requirements Met ✅
- ✅ Vite + React + TypeScript
- ✅ React Router for navigation
- ✅ Pages: Home (product), Onboarding (/setup/:token), Dashboard (/agent)
- ✅ TailwindCSS configured
- ✅ Shared constants file for API base URL

## 🌐 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### QR Code Generation
- `POST /api/qr/generate` - Generate QR code for any data
- `GET /api/qr/token/:token` - Generate QR code for setup tokens

### Calendar Integration
- `POST /api/calendar/event` - Create downloadable ICS calendar event
- `GET /api/calendar/events/:agentId` - Get agent events

## 🗄 Database

The application uses PostgreSQL with the following environment variables automatically configured in Replit:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

## 🎨 UI & Styling

- **Framework**: TailwindCSS with CSS custom properties
- **Icons**: Font Awesome 6 (via CDN)
- **Fonts**: Inter from Google Fonts
- **Theme**: Light/dark theme support with CSS variables
- **Components**: Custom styled components with Tailwind utilities

## 🔧 Development Notes

### Port Configuration
- **Server**: Runs on port 3001 (development) or PORT environment variable
- **Web**: Runs on port 5173 (development)
- **Production**: Server serves both API and static files

### Environment Variables
All database-related environment variables are automatically configured in the Replit environment. No manual setup required.

### Background Jobs
The server includes automated cron jobs for:
- Daily agent reports (9 AM daily)
- Weekly cleanup (2 AM Sundays)  
- Hourly health checks

## 📱 Features

### QR Code Generation
- Generate QR codes for any text or URL
- Special setup token QR codes for agent onboarding
- Configurable size and format options

### Calendar Integration
- Create downloadable ICS calendar events
- Agent-specific event management
- Integration-ready for external calendar systems

### Agent Management
- Token-based agent onboarding
- Setup workflow with QR codes
- Dashboard for agent operations tracking

### Email Integration (Ready)
- Placeholder email service ready for integration
- Welcome email automation for new agents
- Configurable for SendGrid, AWS SES, or other providers

## 🚢 For Replit Deployment

This monorepo is optimized for Replit with:
- Automatic dependency installation
- Environment variable integration
- Hot reloading in development
- Production-ready build process
- Single command startup

**Replit Start Commands:**
- Development: `yarn dev`
- Production: `yarn build && yarn start`