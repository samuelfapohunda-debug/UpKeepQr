# MaintCue Demo Walkthrough
### Presenter Guide — Live Demo Script

> **How to use this document:** Each subsection includes a **What to show** block (the screen/interaction to navigate to) and a **What to say** block (the spoken narrative). Route and component names are noted in `code` format for engineering context.

---

## 1. Marketing & Entry Points

### 1.1 Landing Page — `Home.tsx`

**What to show:** Navigate to `maintcue.com` (or `localhost:5173/`). The hero section loads with a bold headline, a right-side video demo panel, and a gradient CTA button.

**What to say:**
> "The headline is 'Never Miss Home Maintenance Again.' Directly below that, the value prop: smart QR codes that track service history and send climate-aware reminders — so your home stays protected without the guesswork. The primary CTA takes you into a 30-day free trial. Trusted by 5,000+ homeowners across the US and Canada."

**Key UI details:**
- Hero right column: "See MaintCue in Action" panel with three bullets — Setup in under 2 minutes / 30 days free / Works anywhere in the U.S. & Canada
- Problem/Solution section headline: "Maintenance Is Easy to Forget — Until It's Expensive"
- WITHOUT MaintCue: Paper lists that get lost / Forgotten filter changes / Surprise $3,000+ repair bills / No service history when selling
- WITH MaintCue: One scan, instant setup / Automatic climate-smart reminders / Prevent costly repairs / Complete maintenance history
- "How It Works" three-step section: Order & Attach QR → Scan to Activate → Get Smart Reminders (micro-copy: "Setup takes under 5 minutes. No app required.")
- Benefits section: "37+ Tasks Covered" and "Sell Your Home Faster" (exportable maintenance history)

---

### 1.2 Pricing Page — `Pricing.tsx`

**What to show:** Click "Start Free (30 Days Free)" or navigate to `/pricing`. Show the monthly/annual billing toggle. Toggle between intervals to show the 30% savings callout.

**What to say:**
> "Four tiers covering every customer type — individual homeowners, multi-property owners, property managers, and realtors. All plans start with a 30-day free trial. Card is required but not charged until the trial ends."

**Tier breakdown (from `PRICING_PLANS` array):**

| Plan | Monthly | Annual | QR Magnets | Key Limit |
|---|---|---|---|---|
| **Homeowner Basic** | $9.99/mo | $6.99/mo | 1 | 1 property |
| **Homeowner Plus** | $16.99/mo | $12.99/mo | Up to 10 | 3 properties |
| **Realtor / Agent** | $49/mo | $39/mo | 25/year | 25 clients |
| **Property Manager** | $199/mo | $149/mo | Bulk | 200 units |

**Homeowner Basic includes:** Smart maintenance task list / Climate-based scheduling / Email reminders / Up to 3 SMS/month / Task completion history

**Homeowner Plus includes:** Everything in Basic + 3 properties / Appliance-level tracking / Priority reminders / Exportable maintenance history

**Realtor / Agent includes:** 25 branded QR magnets per year / Agent dashboard / Client activation tracking / Co-branded QR experience

**Property Manager includes:** 200 units / Appliance & unit-level tracking / Audit & compliance reports / Bulk branded magnets / SMS limits per unit

**What to say:**
> "Click 'Start Free Trial' on any plan. An auth modal collects first name, last name, and email — or the user can sign in with Google. This creates a Stripe Checkout session with a 30-day trial period. The card is not charged until day 31."

**"All Plans Include" section:** Physical QR magnets shipped / Secure cloud access / No ads / Easy cancellation

**FAQ highlight:**
> "If a payment fails after trial, there's a 3-day grace period to fix the payment method before access is paused."

---

### 1.3 One-Time Magnet Purchase (Order Flow)

**What to say:**
> "Beyond subscriptions, agents and homeowners can purchase physical QR magnets directly. SKUs: single magnet at $19, two-pack at $35, 100-pack (agent) at $899, 500-pack at $3,999. Each purchase goes through the same Stripe Checkout flow and triggers the `checkout.session.completed` webhook."

---

## 2. Onboarding Flow

> There are two distinct onboarding paths: (A) **QR Activation** — triggered when a homeowner scans a physical magnet; (B) **In-App Onboarding** — for signed-in subscribers setting up their home profile. Both ultimately generate the same AI maintenance schedule.

---

### 2.1 Path A — QR Activation Flow (`SetupForm.tsx`)

**What to show:** Navigate to `/setup/:token` or `/new-setup/:token`. The form shows a 4-step progress indicator.

**Steps:** Your Home → Account Setup → Refine Schedule → Notifications

**What to say:**
> "When a homeowner scans the magnet, we first call `GET /api/setup/check/:token` to verify the code. If already activated, we show a masked email and a 'Check Your Email' message. If new, the onboarding form opens."

**Step 1 — Home Type (`Step1HomeProfile.tsx`):**
- Title: "What type of home do you have?"
- Options: Single Family / Condo / Townhouse / Apartment
- Dynamic feedback: Condo/Apartment shows "We'll skip exterior tasks like gutter cleaning and roof maintenance since your HOA typically handles those."
- Optional: Square footage field with "I don't know" toggle

**Step 2 — Account Setup (`Step2Account.tsx`):**
- Email, Full Name, Street Address (Google Places autocomplete — US & Canada), ZIP code
- Address autocomplete uses `AutocompleteSuggestion.fetchAutocompleteSuggestions` (debounced 300ms). City and State auto-fill as read-only once an address is selected.
- Submit button: "Generate My Schedule"

**Gratification Preview (`GratificationPreview.tsx`):**
> "After Step 2, before Step 3, we show a preview of the generated schedule — 37 tasks for single-family homes, 28 for condos/apartments. Preview tasks include: Replace HVAC Filters (high priority), Test Smoke Detectors (high priority), Clean Kitchen Exhaust Hood (medium). This moment of delight is intentional — the user sees value before they're asked for more info."

**Step 3 — Refine Schedule (`Step3RefineSchedule.tsx`):**
- Optional enrichment: HVAC System Type / Water Heater Type / Year Built (decade selector)
- Info banner: "These details help us customize maintenance intervals and remind you about model-specific tasks."
- Can be skipped: "Skip — I'll add these later"

**Step 4 — Notifications (`Step4Notifications.tsx`):**
- Email reminders: Always On (shown with user's email)
- SMS toggle: When enabled, phone field with `(555) 123-4567` format. Compliance copy shown.
- "What you'll receive": Weekly Monday digest / Urgent reminders 3 days before high-priority tasks / Seasonal tips
- Final submit: "Complete Setup"

**After submit:** Navigates to `/check-email?name=...&email=...`. Progress saved to `localStorage.onboarding_progress`.

---

### 2.2 Path B — In-App Onboarding (`Onboarding.tsx`)

**What to show:** For a signed-in subscriber without a home set up, navigate to `/onboarding`.

**What to say:**
> "For subscribers who signed up directly without scanning a QR code, we run a 3-step in-app onboarding. Step 1 collects address — with live ATTOM Data enrichment happening as they type. Step 2 collects home details. Step 3 collects contact information."

**Step 1 — Address (with live ATTOM enrichment):**
- Google Places autocomplete for address entry
- Once a valid US address is entered and debounced, calls `GET /api/onboarding/attom-lookup?address=...&city=...&state=...`
- When ATTOM returns data: home type, square footage, year built auto-populate Step 2 fields
- Graceful fallback: if ATTOM returns 401/404, user fills manually — no error shown

**Step 2 — Home Details:**
- Fields: home type, sq ft, year built, bedrooms, bathrooms, HVAC type, heat pump, water heater, roof age, pool (checkbox), garage (checkbox)

**Step 3 — Account Setup + Post-Submission Processing Panel:**
- Fields: Full name, phone (E.164), email, preferred contact method, SMS consent
- On submit: form and Back/Submit buttons are hidden and replaced with the processing panel

**Post-submission panel:**
- Animated teal spinner (`#1D9E75`)
- Heading: "Setting up your account…"
- Body: "We're generating your personalized home maintenance profile. This only takes a moment."
- Secondary: "You'll be redirected automatically when it's ready."
- Step progress bar stays visible at top; Back navigation is disabled during processing
- Redirect fires to `/my-home` once backend returns success

**Special modes:**
- `?mode=add-property` — Shows only Steps 1+2, skips account creation, POSTs to `POST /api/portfolio/properties`
- `?realtorClient=ID` — Pre-fills client data from realtor invitation; shows "Invitation from [realtorName]" banner

---

## 3. Authentication

### 3.1 Customer Login (`CustomerLogin.tsx`)

**What to show:** Navigate to `/login` (customer-facing).

**What to say:**
> "Customers authenticate with email + password, or via Google OAuth. After login, the session middleware resolves the household tier and routes accordingly: property managers go to `/property-manager`, all homeowner tiers go to `/my-home`."

**Fields:** Email / Password / "Forgot password?" link
**Google Sign-In:** Redirects to `GET /api/auth/google`
**OAuth edge case:** If a Google account has no password set (`errorCode === 'oauth_no_password'`), a "Set a password →" link to `/forgot-password` is shown.

**Session:** Cookie-based (`maintcue_session`) via `requireSessionAuth` middleware. Cookie verified server-side on every protected API call.

**Tier-aware post-login redirect:**
- `property_manager` → `/property-manager`
- `realtor`, `homeowner_basic`, `homeowner_plus` → `/my-home`

---

### 3.2 Admin Login (`Login.tsx`)

**What to show:** Navigate to `/login` (admin route — distinct from customer login).

**What to say:**
> "Admins log in separately. JWT-based auth. Supports 'Remember me for 24 hours.' Successful login redirects to the admin requests dashboard. Access is credential-gated — no self-serve registration."

---

### 3.3 Agent Login (`AgentLogin.tsx`)

**What to show:** Navigate to `/agent/login`.

**What to say:**
> "Legacy agents log in with just their email address. The system returns a JWT token which is stored in localStorage. This is the agent distribution flow — agents manage magnet batches, not individual homeowner subscriptions."

**APIs:** `POST /api/agent/login` → stores `agentToken`, `agentEmail`, `agentId` in localStorage

---

## 4. Customer Dashboard — Homeowner Basic & Plus

**What to show:** Log in as a homeowner and navigate to `/my-home` (`CustomerDashboard.tsx`).

---

### 4.1 Header & Home Context

**What to show:** The blue-to-indigo gradient header at the top of the dashboard.

**What to say:**
> "The header immediately personalizes the experience — 'Welcome, [firstName]!' with the home type and city/state pulled from the household record. If this property was set up through a realtor, 'Provided by [realtorName]' appears as a co-branding line."

---

### 4.2 Multi-Property Bar

**What to show:** The pill-style property selector below the header.

**What to say:**
> "Basic users see only their primary home. Plus users see up to 3 properties. The primary home shows a house icon with the city name. Additional properties show a building icon with the property nickname. The '+ Add Property' button is always visible regardless of tier."

**Tier enforcement on click:**
- If `totalPropertyCount >= tierLimit` → property limit modal appears
- Modal text: "You've reached the [N]-property limit for your [Plan Name] plan. Upgrade to add more properties."
- CTA: "View Upgrade Options" → `/pricing`
- Limits: Basic=1, Plus=3, Property Manager=200, Realtor=200

---

### 4.3 AI-Generated Maintenance Task List

**What to show:** The Tasks tab (default). Show the 4 stat cards, then scroll through the task list.

**What to say:**
> "The task list is AI-generated by Claude Sonnet — 20 to 30 tasks, each with a title, description, category, priority, frequency, estimated cost range, and due date. The AI knows the climate zone from the state, the home's age, HVAC type, and water heater type. For homes over 30 years old, it automatically adds electrical panel and plumbing inspections."

**Stats cards:** Total Tasks / Completed (green) / Pending (blue) / Overdue (red)

**Task fields displayed:** taskName / priority badge (high=red, medium=yellow, default=gray) / description (2-line clamp) / category / frequency (e.g. "Every 3 months") / due date / status badge / "Complete" button

**Category filter chips:** Dynamic — generated from actual task categories in the dataset.

**Empty state:** "Your maintenance schedule is being prepared... This usually takes under a minute. Refresh to check for updates."

---

### 4.4 Completing a Task

**What to show:** Click "Complete" on any pending task. The `CompleteTaskModal` opens.

**What to say:**
> "When a homeowner completes a task, they log: completion date, cost, service provider name, parts replaced, and notes. This builds a documented service history — exportable later for home sales or insurance purposes."

**API:** `PATCH /api/customer/tasks/:id`

---

### 4.5 Calendar Sync

**What to show:** The "Sync to Calendar" button above the task list.

**What to say:**
> "One click downloads a `.ics` file named `MaintCue_Tasks.ics`. Homeowners can import this into Google Calendar, Outlook, or Apple Calendar — all their maintenance tasks appear as calendar events."

**API:** `GET /api/calendar/household/:id/tasks.ics`

---

### 4.6 Appliances Tab

**What to show:** Click the "Appliances" tab.

**What to say:**
> "The appliances tab surfaces the `ApplianceManager` component — homeowners can catalog individual appliances (HVAC unit, water heater, refrigerator, etc.) and track model/serial numbers, purchase dates, and warranties."

---

### 4.7 Details Tab — Push Notification Setup

**What to show:** Click "Details" tab, scroll to the Maintenance Alerts section with `PushNotificationSetup`.

**What to say:**
> "From the Details tab, homeowners enable browser push notifications. The flow: request permission → subscribe via the Web Push API with a VAPID key → POST the subscription to `POST /api/push/subscribe`. They can send a test notification immediately. The Preventive Alert Agent then runs daily at 9 AM EST, analyzing upcoming and overdue tasks and pushing 1–3 AI-generated alerts to each subscribed household."

**States:** unsupported / denied / default / subscribed. When blocked: "Notifications are blocked. Open browser settings and allow notifications for this site."

---

### 4.8 Subscription Banner (`SubscriptionBanner.tsx`)

**What to show:** If in trial, show the top banner.

**What to say:**
> "The subscription banner polls the subscription status endpoint every 60 seconds. Five days before trial end, it shows a blue banner: 'Your trial ends in N day(s).' Payment failures show amber. Canceled/unpaid accounts show red with a 'Resubscribe' CTA. If the user has scheduled a cancellation, a slate banner appears."

---

## 5. Property Manager Dashboard

**What to show:** Log in as a property manager account and navigate to `/property-manager` (`PropertyManagerDashboard.tsx`).

---

### 5.1 Portfolio Overview

**What to show:** The header stats row and property list.

**What to say:**
> "Property managers see a portfolio view of up to 200 properties. The header shows 'Property Manager · [N]/200 properties'. Four stat cards: Total, Active (green), Pending (blue), and AI Scheduled (purple — indicating the schedule has been generated for that unit)."

---

### 5.2 Add a Property

**What to show:** Click "Add Property" button (top-right and empty state). The internal `AddPropertyModal` opens.

**What to say:**
> "The Add Property modal has three sections. Section 1: property name, type, and address (Google Places autocomplete). Section 2: year built, square footage, bedrooms, bathrooms. Section 3: purchase date, purchase price, and notes. On save, we POST to `POST /api/portfolio/properties` and trigger an AI maintenance schedule in the background. Toast: 'AI maintenance schedule is generating in the background.'"

**Limit enforcement:** At 200 properties, clicking "Add Property" shows: "You've reached the 200-property limit for your Property Manager plan. Upgrade to add more properties."

---

### 5.3 Bulk Upload Flow

**What to show:** Click "Bulk Upload" button. Show the `BulkUploadModal`.

**What to say:**
> "For managers onboarding dozens of units at once, the bulk upload accepts a CSV. Required columns: `property_name, address, city, state, zip`. Optional: `unit_number`, `property_type`. We provide a downloadable CSV template. On upload, a background job processes properties and a progress banner shows: 'Bulk upload in progress — [processed]/[total] properties (N%).'"

**Polling:** `GET /api/portfolio/bulk-upload/:jobId` every 2 seconds until status completes.

---

### 5.4 Per-Property Drill-Down

**What to show:** Click any property row → navigates to `/property-manager/:id`.

**What to say:**
> "Each property has its own task list, just like the homeowner dashboard. The AI generates a schedule specific to that unit's type, age, and details."

---

## 6. Realtor / Agent Dashboard

**What to show:** Log in as a realtor and navigate to `/my-home` (which renders `RealtorDashboard` via tier routing in `CustomerDashboard.tsx`).

---

### 6.1 Client Portfolio Overview

**What to show:** The header and 5 stats cards.

**What to say:**
> "Realtors see a client-centric dashboard. Header: 'Realtor / Agent · [N]/25 clients.' Five stats: Total Clients / Active (green) / Pending (amber) / Email Sent (blue) / Remaining slots (purple). When 25 clients are reached, an amber warning bar appears: 'Client limit of 25 reached.'"

---

### 6.2 Adding a Client

**What to show:** Click "Add Client." The 3-section modal opens.

**What to say:**
> "The Add Client modal collects: client name and contact info, property address (Google Places autocomplete), transaction type (Buying/Selling/Renting), estimated value, expected close date, and optional notes. On save, the system automatically sends a co-branded invitation email to the client. `POST /api/realtor/clients`"

---

### 6.3 Client Status Lifecycle

**What to show:** The client list rows with status badges.

**What to say:**
> "Clients move through: Pending → Email Sent → Activated. Active clients appear green. Realtors can resend the invitation for any non-activated client via `POST /api/realtor/clients/:id/resend-email`."

---

### 6.4 Co-Branding

**What to say:**
> "When a client activates via a realtor invitation — hitting `GET /api/realtor/activate/:clientId` — their CustomerDashboard shows 'Provided by [realtorName]' in the header. This is the realtor's brand appearing inside the homeowner's maintenance dashboard."

---

## 7. Legacy Agent Dashboard (`AgentDashboard.tsx`)

**What to show:** Log in via `/agent/login` and navigate to `/agent/dashboard`.

**What to say:**
> "Legacy agents are the field distributors — the people physically placing QR magnets on homes. Their dashboard shows 4 KPIs: Total Magnets Distributed / Scans (households that scanned) / Activations (completed setups) / 30-Day Active households."

**Tables:** Active Households (city/zip, home type, email, last reminder date) / Magnet Batches (qty, batch ID, created date)

**Auth:** JWT token in localStorage. All API calls include `Authorization: Bearer [token]` header.

---

## 8. AI Agents

### 8.1 Home Research Agent (`homeResearchAgent.ts`)

**What to say:**
> "The Home Research Agent runs immediately after setup completes — either QR activation or in-app onboarding. It calls Claude Sonnet and generates a 20–30 task, 12-month maintenance schedule personalized to the property."

**Model:** `claude-sonnet-4-0`

**Input data fed to Claude:**
- Address, city, state, ZIP
- Home type (single family / condo / townhouse / apartment / mobile)
- Year built, square footage, HVAC type, water heater type, appliances
- Climate zone (derived from state via `STATE_CLIMATE_MAP`):
  - Hot/Humid (Southeast/Gulf Coast)
  - Mixed/Humid (Mid-Atlantic/Midwest)
  - Cold (Northern states/Canada)
  - Mixed/Dry (Southwest)
  - Marine (Pacific Coast)

**Task schema each generated task has:** title / description / month (1–12) / frequency (monthly/quarterly/biannual/annual) / category (hvac/plumbing/electrical/exterior/interior/appliances/seasonal) / priority (high/medium/low) / estimated_cost_min / estimated_cost_max / estimated_diy_cost / estimated_pro_cost

**Age-based logic:** Homes >30 years old automatically receive electrical panel inspection + plumbing inspection added to the schedule.

**Caching:** If `schedule_generated_at` is already set on the `home_profiles` row, returns the cached tasks — no re-generation.

**Resilience:** JSON parse retry — if Claude's response doesn't parse, a correction prompt is sent. All attempts logged to `ai_generation_logs` table.

---

### 8.2 Preventive Alert Agent (`preventiveAlertAgent.ts`)

**What to say:**
> "The Preventive Alert Agent runs every day at 9 AM EST via cron. For every household with an active push subscription, Claude Sonnet 4.6 analyzes the next 60 days of tasks plus any overdue tasks and generates 1–3 high-priority maintenance alerts."

**Model:** `claude-sonnet-4-6`

**Alert output schema:** title (max 60 chars) / body (max 120 chars) / urgency (critical/high/medium) / category / estimatedCostIfIgnored / taskIds

**Send cadence logic:**
- `critical` or `high` urgency → pushed every day
- `medium` urgency → pushed on Mondays only

**Delivery:** `webpush.sendNotification()` using VAPID keys configured via `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

**Stale subscription cleanup:** HTTP 410 responses from push endpoints mark the subscription `isActive = false` in the `pushSubscriptions` table.

**Logging:** All sent alerts written to `alerts_sent` table.

---

### 8.3 Cron Schedule Summary (`cron.ts`)

| Time (EST) | Job |
|---|---|
| 7:00 AM | Grace period expirations + trial pre-charge reminders |
| 8:00 AM | Warranty expiration notifications |
| 9:00 AM | Mark overdue tasks + process reminder queue + run Preventive Alert Agent |

**Reminder queue logic:** For each pending reminder, checks `notificationPreference` (`email_only` / `sms_only` / `both`) → sends email (with `.ics` attachment) via Resend and/or SMS via Twilio.

---

## 9. ATTOM Property Data Integration

### 9.1 What Is Fetched

**What to say:**
> "When a user enters their address in Step 1 of onboarding, we hit the ATTOM Data API at `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail`. We get: year built, square footage, home type, HVAC type (derived from cooling and heating type fields), bedrooms, bathrooms, lot size, pool presence, garage presence, and county."

**Field mappings from ATTOM response:**
- `building.size.livingsize` → square footage
- `summary.yearbuilt` → year built
- `utilities.coolingtype` + `heatingtype` → HVAC type (mapped to: central_air / heat_pump / window_unit / none)

**Home type mapping:** ATTOM's property use codes → single_family / condo / townhouse / mobile / null

---

### 9.2 How It Enriches the Schedule

**What to say:**
> "All ATTOM data flows directly into the AI agent's prompt. So when a user at address X with a 1978 home and a heat pump enters their address, the generated schedule automatically includes heat pump-specific maintenance intervals and 1970s-era plumbing inspection tasks — without the user having to know any of that."

---

### 9.3 Graceful Fallback

**What to say:**
> "If ATTOM returns a 401 (API key invalid) or 404 (property not found), `attomFound` is set to `false` and the form silently stays in manual-entry mode. No error message is shown to the user. They fill in the home details themselves. The AI agent still runs with whatever data is available."

---

## 10. Stripe Billing

### 10.1 Checkout Session Creation

**What to show:** Click "Start Free Trial" on any pricing plan.

**What to say:**
> "The auth modal collects name and email, then calls `POST /api/subscription/create-checkout`. This creates a Stripe Checkout session with a 30-day trial. The session includes metadata: `plan_id`, `billing_interval`, `customer_name`. Stripe handles card collection and returns the user to `/subscription-success?session_id=...`."

---

### 10.2 Webhook Handling

**What to say:**
> "Stripe sends `checkout.session.completed`, `customer.subscription.created`, and `invoice.payment_succeeded` events to our webhook endpoint. Each event is idempotency-checked against the `stripe_events` table — duplicate webhook deliveries are silently acknowledged."

**`checkout.session.completed` (subscription mode) steps:**
1. Idempotency check — insert event ID into `stripe_events`. 409 = already processed, return `{alreadyProcessed: true}`.
2. Generate N activation codes via `nanoid(12)` and QR codes (1 for Basic, 10 for Plus, 25 for Realtor, 200 for Property Manager).
3. Insert `order_magnet_orders` + N rows into `order_magnet_items` in a single transaction.
4. **Upsert household** on email conflict — on duplicate email, only `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, and `updatedAt` are overwritten. Name, address, and onboarding data are preserved.
5. Resolve subscription tier from plan name metadata → update `subscriptionTier`.
6. If new account (no password hash): generate 32-byte hex setup token (24h expiry), store in `households.resetToken`.
7. Send welcome email with QR codes + setup URL.
8. Send admin notification email.

---

### 10.3 Upgrade Flow — No Duplicate Household

**What to say:**
> "This was a real production bug: existing users who upgraded via Stripe Checkout triggered a duplicate key error on the households table because `getHouseholdByStripeCustomerId` returned null for households created outside Stripe. The fix: a pre-check by email before the INSERT, and an `onConflictDoUpdate` upsert — so upgrades safely update only the Stripe and tier fields and never blow away home or contact data."

---

### 10.4 Subscription Success Page (`SubscriptionSuccess.tsx`)

**What to show:** After a test checkout, the user lands on `/subscription-success?session_id=...`.

**What to say:**
> "The page calls `GET /api/auth/setup-token?session_id=...`. For a brand-new user, this returns a token → the page shows 'Welcome to MaintCue!' and a 'Set Up My Account' button linking to `/set-password?token=...`. For an existing user who just upgraded, the endpoint returns 404 — which the frontend now detects explicitly. Instead of a confusing redirect to login, it shows 'Plan Upgraded!' and a 'Go to Dashboard' button pointing to `/my-home`."

---

## 11. QR Code & Order Magnet

### 11.1 What the QR Code Links To

**What to say:**
> "Each QR code encodes a unique activation URL: `[baseUrl]/setup/[activationCode]`. The activation code is a 12-character nanoid — cryptographically random, single-use. When scanned, it opens the SetupForm flow. One code = one household. Once activated, rescanning shows 'This QR code is already activated' with the masked email."

---

### 11.2 Physical Magnet Product

**What to say:**
> "MaintCue is fundamentally a physical product business. Agents receive weatherproof QR magnets — one per homeowner for Basic subscribers, up to 10 for Plus, 25 per year for Realtors, bulk orders for Property Managers. The magnet attaches to the refrigerator or appliance panel. Homeowners scan it with their phone camera — no app required."

**Order fulfillment:** Each purchase creates a record in `order_magnet_orders` with ship address. Admin processes shipment from the admin panel.

---

## 12. Admin Panel

### 12.1 Pro Request Management (`AdminDashboard.tsx`)

**What to show:** Log in as admin, navigate to `/admin/requests`.

**What to say:**
> "The admin dashboard is the operational hub for pro service requests — when homeowners need a professional for a task beyond DIY. Admins see a filterable table with KPI cards: New / Assigned / In Progress / Completed (last 7 days)."

**Filters:** Free-text search, trade (roofing/plumbing/electrical/HVAC/general), urgency (emergency/24h/3days/flexible), ZIP code, provider name, status

**Table columns:** Submitted date / Tracking Code (copy-to-clipboard) / Trade / Urgency / ZIP / Requester / Phone (copy-to-clipboard) / Status / Provider / View action

**Detail drawer actions:**
- Update status (dropdown)
- Assign provider (picker filtered by trade + ZIP coverage — shows name, trade, email, phone, coverage ZIPs)
- Add internal note (logged to audit trail)
- View full history & notes

**Assigning a provider** automatically sets status to "assigned" and updates the record.

---

### 12.2 Magnet Order Fulfillment

**What to say:**
> "All magnet orders are tracked in the admin panel. Each order shows the ship address, SKU, QR code count, and payment status. Admins mark orders as shipped after physical fulfillment."

---

## 13. Notifications & Reminders

### 13.1 PWA Web Push Opt-In

**What to show:** Go to Details tab in customer dashboard. Scroll to Maintenance Alerts section.

**What to say:**
> "Push notifications are browser-native — no app download required. The user clicks 'Enable maintenance alerts,' the browser permission prompt appears, and on approval we subscribe via `navigator.serviceWorker.ready.pushManager.subscribe()` with the VAPID public key. The subscription object (endpoint + keys) is POSTed to `POST /api/push/subscribe`."

---

### 13.2 VAPID Push Notification Delivery

**What to say:**
> "The Preventive Alert Agent sends push payloads via `webpush.sendNotification()` using VAPID credentials. The notification title is max 60 characters, body max 120 characters — optimized for mobile lock screen display. Stale endpoints (410 responses) are automatically deactivated in the database."

**Test flow:** "Send test" button in the Details tab → `POST /api/push/test` delivers an immediate test notification.

---

### 13.3 Email via Resend

**What to say:**
> "All transactional email goes through Resend, sent from `noreply@maintcue.com`. Email types include: trial welcome, pre-charge reminder (5 days before trial ends), payment failed, subscription active, subscription welcome with QR codes, pro request confirmation, warranty expiration alerts, and weekly maintenance digest."

---

### 13.4 SMS via Twilio

**What to say:**
> "SMS reminders are opt-in. When enabled in onboarding or the Details tab, phone numbers are stored in E.164 format. The reminder cron runs at 9 AM EST and checks each household's `notificationPreference` — `email_only`, `sms_only`, or `both`. Twilio credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`."

**Rate limit:** `smsApiLimiter` — 3 requests per minute per IP (server-side protection).

---

## 14. Unique Differentiators

### What makes MaintCue different from generic home maintenance apps:

1. **Physical QR magnet anchored to the home** — Not an app. Homeowners scan a weatherproof magnet with their phone camera. The QR code persists even if the homeowner changes phones or forgets their login. The magnet ships with every subscription.

2. **AI-generated, climate-aware schedules** — Claude Sonnet generates the maintenance schedule using the property's address, age, construction type, HVAC, water heater, and climate zone. A 1978 home in Minnesota gets a fundamentally different schedule than a 2015 condo in Phoenix.

3. **ATTOM Property Data pre-enrichment** — Home details (year built, sq ft, HVAC type, home type) auto-populate from ATTOM's property database before the AI even runs. Homeowners don't need to know their home's specs.

4. **Documented service history as a product** — Task completion logs with cost, service provider, and parts replaced create an exportable maintenance record. This directly increases resale value and simplifies home disclosures.

5. **Realtor co-branding as a distribution channel** — Realtors give MaintCue to homebuyer clients. The homeowner's dashboard permanently displays "Provided by [RealtorName]" — giving agents ongoing brand presence inside the homeowner's daily tool.

6. **Multi-tier user model in a single platform** — The same platform serves: individual homeowners (1 property), Plus users (3 properties), Realtors (25 client activations), and Property Managers (200 units with bulk CSV upload). Each tier has its own dashboard, property limits, QR code allotment, and email flows.

7. **AI-pushed preventive alerts, not passive task lists** — The Preventive Alert Agent runs daily and actively pushes notifications based on what's coming up in the next 60 days and what's overdue — with Claude estimating the cost of ignoring each task. This is proactive, not reactive.

8. **Calendar-native integration** — One click exports all maintenance tasks as a `.ics` file compatible with Google Calendar, Outlook, and Apple Calendar. Tasks live alongside meetings, not in a separate app silo.

9. **No app required** — Everything works through the phone camera (QR scan) and a mobile-responsive web app. This dramatically lowers onboarding friction vs. apps requiring downloads, logins, and setup.

10. **Agent/field distribution network** — Physical agents place QR magnets on homes in the field. The legacy Agent Dashboard tracks scan rates, activation rates, and 30-day active households per agent — a B2B2C distribution model built into the platform architecture.

---

*Document generated from source at `client/src/pages/`, `server/routes/`, `server/src/routes/`, `server/lib/`, and `shared/schema.ts`. Component names and route paths reflect the live codebase.*
