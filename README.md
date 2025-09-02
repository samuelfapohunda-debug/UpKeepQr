# AgentHub Platform

A comprehensive home maintenance management platform using physical magnets with unique tokens for customer onboarding.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn or npm

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

### Production Build & Deploy

```bash
# Build application
npm run build

# Start production server
npm start
```

## 🧪 Smoke Testing

Run the comprehensive smoke test script to validate all core functionality:

```bash
./scripts/smoke.sh [BASE_URL]
```

Example:
```bash
./scripts/smoke.sh http://localhost:5000
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

## 🌐 API Testing with cURL

### 1. Agent Authentication

```bash
# Login as agent
curl -X POST http://localhost:5000/api/agent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-agent@example.com"}'

# Response includes token for authenticated requests
```

### 2. Admin Operations

```bash
# Create magnet batch (requires admin token)
curl -X POST http://localhost:5000/api/admin/batches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"agentId":"test-agent","qty":10}'

# Download batch CSV
curl -X GET http://localhost:5000/api/download/batch/BATCH_ID \
  -o batch-magnets.csv

# Generate PDF proof sheet
curl -X GET http://localhost:5000/api/admin/batches/BATCH_ID/sheet.pdf \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o proof-sheet.pdf

# Trigger reminder processing
curl -X POST http://localhost:5000/api/admin/trigger-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Customer Onboarding

```bash
# Preview maintenance schedule
curl -X POST http://localhost:5000/api/setup/preview \
  -H "Content-Type: application/json" \
  -d '{"zip":"10001","home_type":"single_family"}'

# Activate household with token
curl -X POST http://localhost:5000/api/setup/activate \
  -H "Content-Type: application/json" \
  -d '{
    "token":"YOUR_MAGNET_TOKEN",
    "zip":"10001",
    "home_type":"single_family",
    "sqft":2500,
    "hvac_type":"central_air",
    "water_heater":"gas",
    "roof_age_years":10,
    "email":"homeowner@example.com"
  }'
```

### 4. Task Management

```bash
# Complete a maintenance task
curl -X POST http://localhost:5000/api/tasks/complete \
  -H "Content-Type: application/json" \
  -d '{"householdToken":"HOUSEHOLD_TOKEN","task_code":"HVAC_FILTER"}'
```

### 5. Professional Services

```bash
# Create service lead
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "householdToken":"HOUSEHOLD_TOKEN",
    "service":"HVAC Maintenance",
    "notes":"Customer requested quote for system tune-up"
  }'
```

### 6. E-commerce

```bash
# Create Stripe checkout session
curl -X POST http://localhost:5000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "sku":"single",
    "success_url":"http://localhost:5000/success",
    "cancel_url":"http://localhost:5000/cancel"
  }'
```

### 7. SMS Integration

```bash
# SMS opt-in
curl -X POST http://localhost:5000/api/setup/optin-sms \
  -H "Content-Type: application/json" \
  -d '{"token":"HOUSEHOLD_TOKEN","phone":"+1234567890"}'

# Verify SMS code
curl -X POST http://localhost:5000/api/setup/verify-sms \
  -H "Content-Type: application/json" \
  -d '{"token":"HOUSEHOLD_TOKEN","code":"123456"}'
```

### 8. QR Code Generation

```bash
# Get QR code for magnet token
curl -X GET http://localhost:5000/api/qr/YOUR_MAGNET_TOKEN \
  -o magnet-qr.png
```

## 🔒 Security Features

- **Rate Limiting**: All public endpoints are protected with appropriate rate limits
- **Audit Logging**: All user actions are tracked with detailed metadata
- **Input Validation**: Zod schemas validate all request data
- **Generic Error Responses**: Security-focused error handling prevents information leakage
- **Request Logging**: Comprehensive logging with Morgan for monitoring

## 🗄 Database

The application uses PostgreSQL with environment variables automatically configured in Replit.

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

## 🚢 Development

```bash
# Start development server
npm run dev

# Run smoke tests
./scripts/smoke.sh

# Check database status
npm run db:push
```

## 📱 Features

### Core Platform
- Agent management dashboard with analytics
- QR magnet batch creation and CSV export
- PDF proof sheet generation for quality control
- Climate-based maintenance scheduling
- Task completion tracking and automation

### Customer Experience
- QR code-based household onboarding
- Automated maintenance reminders via email and SMS
- Professional service booking system
- Calendar integration for scheduling

### E-commerce Integration
- Stripe-powered magnet sales
- Multiple SKU support (single, 2-pack, 100-pack, 500-pack)
- Automated batch fulfillment

### Communication Systems
- Email notifications (Postmark integration)
- SMS reminders and verification (Twilio integration)
- Calendar event generation (ICS format)