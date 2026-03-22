# MaintCue QA Test Script

**Version:** 1.0
**Date:** March 2026
**Environment:** Production — https://maintcue.com
**Prepared for:** QA Tester

---

## Before You Start

### Test Environment Setup

| Item | Value |
|------|-------|
| Primary browser | Chrome (latest version) |
| Mobile simulation | Chrome DevTools → iPhone 14 Pro Max (430×932) |
| Stripe test card | `4242 4242 4242 4242` |
| Stripe expiry | Any future date (e.g. `12/29`) |
| Stripe CVC | Any 3 digits (e.g. `123`) |
| Stripe ZIP | Any 5 digits (e.g. `30001`) |
| Test emails | Use real email addresses you can access — you will receive actual emails |
| Session hygiene | Open a **new Incognito window** for each new test flow |

### How to Read This Document

Each test case follows this format:

```
TEST ID   | Short identifier (e.g. HOME-001)
Name      | What is being tested
Pre       | What must be true before you start
Steps     | Numbered actions to perform
Expected  | What should happen
[ ]       | Checkbox — tick when PASS, write FAIL + notes if not
```

### Reporting Failures

If a test fails, note:
1. Test ID
2. Step number where it failed
3. What you expected vs. what actually happened
4. Screenshot (press `Cmd+Shift+4` on Mac or `Win+Shift+S` on Windows)

---

## Module 1: Homepage & Navigation

---

### HOME-001 — Homepage Loads

**Preconditions:** None

**Steps:**
1. Open a new Incognito window in Chrome
2. Navigate to `https://maintcue.com`
3. Wait for the page to fully load (spinner disappears)
4. Observe the hero section at the top of the page

**Expected Result:**
- Page loads without errors
- Hero headline is visible (e.g. "Never Miss Home Maintenance Again")
- MaintCue logo is visible in the navigation bar
- Page does not show any error messages or blank sections

**[ ] PASS / FAIL**

---

### HOME-002 — Navigation Links Work

**Preconditions:** HOME-001 passes

**Steps:**
1. From the homepage, locate the navigation bar at the top
2. Click **"Order Magnet"** — verify it opens the correct page or section
3. Click **Back** to return to homepage
4. Click **"Request a Pro"** — verify it navigates to the Request a Pro page
5. Click **Back**
6. Click **"Contact Us"** — verify it navigates to a contact page
7. Click **Back**
8. Click **"Log In"** — verify it navigates to a login page or prompts for email
9. Click **Back**
10. Scroll to the footer and click **"Terms of Service"** — verify it loads `/terms-of-service`
11. Click **Back**
12. Click **"Privacy Policy"** — verify it loads `/privacy-policy`
13. Click **Back**
14. Click **"Cookie Policy"** — verify it loads `/cookie-policy`

**Expected Result:**
- Every link navigates to the correct destination
- No links show 404 errors
- Back navigation returns to homepage successfully

**[ ] PASS / FAIL**

---

### HOME-003 — "Get Started" Buttons Redirect to Pricing

**Preconditions:** HOME-001 passes

**Steps:**
1. From the homepage, find the primary "Get Started" button in the hero section
2. Click it
3. Verify the URL changes to `https://maintcue.com/pricing`
4. Click **Back**
5. Scroll down the homepage and find any secondary "Get Started" or "View Plans" buttons
6. Click each one and verify they also navigate to `/pricing`

**Expected Result:**
- All "Get Started" / "View Plans" / CTA buttons navigate to `/pricing`
- Pricing page loads correctly

**[ ] PASS / FAIL**

---

### HOME-004 — How It Works Section Displays

**Preconditions:** HOME-001 passes

**Steps:**
1. From the homepage, scroll down past the hero section
2. Find the "How MaintCue Works" section
3. Verify it shows 3 numbered steps
4. Verify each step has an icon, title, and description
5. Scroll further to find the "Built for Homeowners" or feature section
6. Verify feature cards/columns display without overlap

**Expected Result:**
- All sections are visible and readable
- No text is cut off or overlapping
- Images/icons load correctly

**[ ] PASS / FAIL**

---

### HOME-005 — FAQ Section

**Preconditions:** HOME-001 passes

**Steps:**
1. Scroll to the bottom of the homepage to find the FAQ section
2. Click on the first FAQ question
3. Verify the answer expands below the question
4. Click the same question again
5. Verify the answer collapses
6. Click through 3 more FAQ items to verify they all expand/collapse

**Expected Result:**
- FAQ items toggle open and closed smoothly
- Only the clicked item expands (others do not auto-expand unless designed to)
- Text is fully readable when expanded

**[ ] PASS / FAIL**

---

## Module 2: Pricing Page

---

### PRICE-001 — Four Plan Cards Display

**Preconditions:** None

**Steps:**
1. Navigate to `https://maintcue.com/pricing`
2. Verify you can see 4 distinct plan cards
3. Confirm the plan names are exactly:
   - **Homeowner Basic**
   - **Homeowner Plus**
   - **Realtor / Agent**
   - **Property Manager**
4. Take a screenshot of all 4 cards

**Expected Result:**
- All 4 plan cards are visible
- Each card has a name, price, features list, and a "Start Free Trial" button
- No cards are blank or missing content

**[ ] PASS / FAIL**

---

### PRICE-002 — Monthly Prices Correct

**Preconditions:** PRICE-001 passes

**Steps:**
1. On the pricing page, ensure the **Monthly** toggle is selected (it should be default)
2. Verify the prices shown on each card:
   - Homeowner Basic: **$9.99/month**
   - Homeowner Plus: **$16.99/month**
   - Realtor / Agent: **$49/month**
   - Property Manager: **$199/month**

**Expected Result:**
- All 4 prices match exactly as listed above

**[ ] PASS / FAIL**

---

### PRICE-003 — Annual Prices Correct

**Preconditions:** PRICE-001 passes

**Steps:**
1. On the pricing page, click the **Annual** toggle (or "Yearly" button)
2. Verify the prices update to:
   - Homeowner Basic: **$83.88/year** (or equivalent per-month breakdown like **$6.99/mo**)
   - Homeowner Plus: **$155.88/year** (or **$12.99/mo**)
   - Realtor / Agent: **$468/year** (or **$39/mo**)
   - Property Manager: **$1,788/year** (or **$149/mo**)
3. Verify "Save X%" or similar discount badges appear on cards

**Expected Result:**
- Prices update when switching to Annual
- Discount badges are visible
- The toggle visually indicates Annual is selected

**[ ] PASS / FAIL**

---

### PRICE-004 — "30-Day Free Trial" Shown

**Preconditions:** PRICE-001 passes

**Steps:**
1. On the pricing page (monthly toggle selected)
2. Inspect each of the 4 plan cards
3. Verify each card shows text about a free trial (e.g. "30-day free trial included" or "No charge today")

**Expected Result:**
- All 4 plan cards show free trial messaging
- No card is missing the trial notice

**[ ] PASS / FAIL**

---

### PRICE-005 — Stripe Checkout Initiates

**Preconditions:** PRICE-001 passes; use a real email you can access

**Steps:**
1. On the pricing page, click **"Start Free Trial"** on the **Homeowner Basic** card
2. Observe what happens — either:
   - A modal/form appears asking for name, email, card details, OR
   - You are redirected to a Stripe-hosted checkout page
3. If a form appears, fill in:
   - Name: `QA Tester`
   - Email: your test email address
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/29`
   - CVC: `123`
   - ZIP: `30001`
4. Submit the form
5. Verify a success message, confirmation page, or redirect occurs

**Expected Result:**
- Checkout initiates without errors
- Form validation works (try submitting empty — should show errors)
- After successful entry, you are redirected to a success/dashboard page
- You receive a welcome email within 5 minutes

**[ ] PASS / FAIL**

---

### PRICE-006 — Plan Cards Mobile Layout

**Preconditions:** PRICE-001 passes

**Steps:**
1. On the pricing page in Chrome, press `F12` to open DevTools
2. Click the phone icon (Toggle device toolbar) at the top of DevTools
3. Select **iPhone 14 Pro Max** from the device dropdown
4. Reload the page (`Ctrl+R` / `Cmd+R`)
5. Verify the 4 plan cards stack vertically (one per row) on mobile
6. Scroll through all 4 cards
7. Verify text is readable and buttons are tappable (not overlapping)
8. Verify no content is cut off horizontally

**Expected Result:**
- Cards stack vertically on mobile
- All text is readable (not tiny or overflowing)
- "Start Free Trial" buttons are fully visible on each card

**[ ] PASS / FAIL**

---

## Module 3: Homeowner Basic Flow

---

### HB-001 — Signup via Pricing Page

**Preconditions:** Fresh Incognito window; real email address ready

**Steps:**
1. Navigate to `https://maintcue.com/pricing`
2. Click **"Start Free Trial"** on the **Homeowner Basic** card
3. Complete checkout with:
   - Name: `QA Homeowner`
   - Email: your test email
   - Card: `4242 4242 4242 4242` / `12/29` / `123` / ZIP `30001`
4. Submit and wait for redirect

**Expected Result:**
- Redirected to a subscription success page or dashboard
- URL changes (not stuck on pricing page)
- No error messages shown

**[ ] PASS / FAIL**

---

### HB-002 — Welcome Email Received

**Preconditions:** HB-001 completes successfully

**Steps:**
1. Open the email inbox for the address used in HB-001
2. Wait up to 5 minutes
3. Look for an email from MaintCue with subject containing "Welcome" or "trial"
4. Open the email
5. Verify it contains:
   - Your name
   - Plan name (Homeowner Basic)
   - Order ID or reference number
   - A button or link to access your dashboard

**Expected Result:**
- Welcome email arrives within 5 minutes
- Email content is correct and personalized
- No broken formatting or placeholder text (e.g. no `[NAME]` or `undefined`)

**[ ] PASS / FAIL**

---

### HB-003 — Trial Welcome Email Received

**Preconditions:** HB-001 completes successfully

**Steps:**
1. Check your email inbox for a second email from MaintCue
2. Look for subject: "Your MaintCue free trial has started"
3. Open the email
4. Verify it mentions the 30-day trial end date
5. Verify it lists getting-started steps

**Expected Result:**
- Trial email arrives within 5 minutes of signup
- Trial end date is approximately 30 days from today
- Getting-started steps are relevant (not "Add your first client" for a homeowner)

**[ ] PASS / FAIL**

---

### HB-004 — Magic Link Login

**Preconditions:** HB-001 completes successfully; access to signup email

**Steps:**
1. Open the welcome email from HB-002
2. Click the dashboard access button/link
3. Observe: you should be automatically logged in (magic link)
4. Verify the URL changes to `/my-home` or similar dashboard URL
5. Verify you are shown a dashboard — not a login screen

**Expected Result:**
- Clicking the link logs you in without needing a password
- Dashboard loads and shows your account name
- You are NOT redirected back to login

**[ ] PASS / FAIL**

---

### HB-005 — Customer Dashboard Loads

**Preconditions:** HB-004 completes (logged in)

**Steps:**
1. After clicking the magic link, you should be on `/my-home`
2. Verify the dashboard shows:
   - Your name or email in a header/greeting
   - A maintenance tasks section (may say "No tasks yet" or show a spinner)
   - Navigation tabs or sections (e.g. Tasks, Appliances, Details)
3. Verify no error messages or blank white screens

**Expected Result:**
- Dashboard loads completely
- UI is structured and readable
- No "undefined" or raw JSON visible on screen

**[ ] PASS / FAIL**

---

### HB-006 — Onboarding / Home Setup

**Preconditions:** HB-005 passes (logged in to dashboard)

**Steps:**
1. Look for a prompt to set up your home, or navigate to `https://maintcue.com/onboarding`
2. If an onboarding wizard appears, complete Step 1:
   - Enter home address: `123 Main Street`
   - City: `Atlanta`
   - State: `GA`
   - ZIP: `30301`
3. Complete Step 2 (home details):
   - Year built: `2005`
   - Square footage: `2000`
   - Property type: Single Family
4. Complete Step 3 (any remaining fields)
5. Submit the form

**Expected Result:**
- Each step of the wizard is clearly labeled
- Form validates required fields (try clicking Next with empty fields)
- Submission does not show an error
- You are redirected to the dashboard or a "setup complete" confirmation

**[ ] PASS / FAIL**

---

### HB-007 — AI Schedule Generation

**Preconditions:** HB-006 completes (home set up)

**Steps:**
1. After completing onboarding, navigate to your dashboard at `/my-home`
2. Look for an AI schedule generation indicator (spinner, progress message, or "Generating your schedule...")
3. Wait up to 3 minutes for schedule generation to complete
4. Once complete, verify maintenance tasks appear in the Tasks tab
5. Click on one task to see its details

**Expected Result:**
- AI generates a maintenance schedule automatically after onboarding
- At least 5–10 tasks are created
- Tasks have names, due dates, and cost estimates
- Tasks are sorted by month or priority

**[ ] PASS / FAIL**

---

### HB-008 — Task Complete Button

**Preconditions:** HB-007 passes (tasks visible)

**Steps:**
1. On the dashboard, find a maintenance task in the task list
2. Click the **"Complete"** or checkmark button on any task
3. Observe the task status change
4. Verify the task is marked as completed (strikethrough, green badge, or moved to completed section)
5. Refresh the page
6. Verify the completed task still shows as completed after refresh

**Expected Result:**
- Task can be marked complete with one click
- Visual feedback is immediate (color change, badge, etc.)
- Completed state persists after page refresh

**[ ] PASS / FAIL**

---

### HB-009 — Appliances Tab

**Preconditions:** HB-005 passes (logged in to dashboard)

**Steps:**
1. On the dashboard, click the **"Appliances"** tab
2. Verify the tab content loads
3. Click **"Add Appliance"** or the `+` button
4. Fill in appliance details:
   - Name: `HVAC System`
   - Brand: `Carrier`
   - Model: `optional`
   - Year installed: `2018`
5. Save the appliance
6. Verify it appears in the appliances list

**Expected Result:**
- Appliances tab loads without error
- New appliance can be added and saved
- Appliance appears in list immediately after saving

**[ ] PASS / FAIL**

---

### HB-010 — Billing Settings Page

**Preconditions:** HB-004 passes (logged in)

**Steps:**
1. Navigate to `https://maintcue.com/settings/billing`
2. Verify the page loads and shows subscription information:
   - Current plan (Homeowner Basic)
   - Trial status or next billing date
   - A "Manage Subscription" or "Cancel" button
3. Click "Manage Subscription" (this opens Stripe's billing portal)
4. Verify Stripe portal loads (it's a stripe.com hosted page)
5. Close the Stripe portal tab and return to MaintCue

**Expected Result:**
- Billing settings page loads correctly
- Subscription information is accurate
- Stripe billing portal opens successfully when clicked

**[ ] PASS / FAIL**

---

### HB-011 — Push Notification Prompt

**Preconditions:** HB-005 passes (logged in to dashboard); using Chrome on desktop

**Steps:**
1. On the dashboard, look for a notification permission prompt or banner
2. If prompted by browser, click **"Allow"** notifications
3. Verify the UI updates to confirm notifications are enabled
4. If there is a "Send Test Notification" button, click it
5. Verify a browser notification appears within 10 seconds

**Expected Result:**
- Browser notification permission is requested
- After allowing, the UI confirms notifications are enabled
- Test notification (if available) appears as a browser notification

**[ ] PASS / FAIL**

---

### HB-012 — Log Out

**Preconditions:** HB-004 passes (logged in)

**Steps:**
1. Look for a profile menu, user icon, or "Log Out" option in the navigation
2. Click Log Out (or look for it in a dropdown menu)
3. Verify you are redirected to the homepage or login page
4. Try navigating to `https://maintcue.com/my-home` manually
5. Verify you are redirected away (not shown the dashboard)

**Expected Result:**
- Logout clears the session
- After logout, protected pages redirect away or show login prompts
- No dashboard content is accessible without being logged in

**[ ] PASS / FAIL**

---

### HB-013 — Magic Link Re-Login

**Preconditions:** HB-012 passes (logged out)

**Steps:**
1. Navigate to `https://maintcue.com/login` or look for a "Log In" link
2. Enter the email address used for signup
3. Submit the form
4. Check your email inbox for a new magic link email
5. Click the link in the email
6. Verify you are logged back in to the dashboard

**Expected Result:**
- Magic link email arrives within 2 minutes
- Clicking the link logs you in without a password
- Dashboard loads with your previous data intact

**[ ] PASS / FAIL**

---

### HB-014 — Dashboard Mobile View

**Preconditions:** HB-007 passes (tasks generated)

**Steps:**
1. While logged in, press `F12` in Chrome to open DevTools
2. Click the phone icon (Toggle device toolbar)
3. Select **iPhone 14 Pro Max**
4. Reload the dashboard (`/my-home`)
5. Verify:
   - Stat cards stack vertically (not side by side in 4 columns)
   - Task cards are full-width and readable
   - Tab buttons (Tasks, Appliances, Details) are visible and tappable
   - No horizontal scrolling is required
6. Tap the **"Appliances"** tab and verify it loads on mobile

**Expected Result:**
- Dashboard is fully usable on mobile screen size
- No content is cut off or requires horizontal scroll
- Buttons are large enough to tap comfortably

**[ ] PASS / FAIL**

---

### HB-015 — Cancel Subscription

**Preconditions:** HB-010 passes (billing settings accessible); **complete this test last**

**Steps:**
1. Navigate to `https://maintcue.com/settings/billing`
2. Click **"Manage Subscription"** to open the Stripe billing portal
3. In the Stripe portal, find the **"Cancel plan"** or **"Cancel subscription"** option
4. Follow the cancellation steps in Stripe
5. Return to MaintCue
6. Check your email for a cancellation confirmation email
7. Navigate to `/settings/billing` and verify the plan shows as "Cancels at period end" or similar

**Expected Result:**
- Stripe portal allows cancellation
- Cancellation confirmation email arrives within 5 minutes
- Dashboard still accessible (not immediately cut off — trial/period end applies)

**[ ] PASS / FAIL**

---

## Module 4: Homeowner Plus Flow

---

### HP-001 — Signup via Plus Plan

**Preconditions:** Fresh Incognito window; different email from HB tests

**Steps:**
1. Navigate to `https://maintcue.com/pricing`
2. Click **"Start Free Trial"** on the **Homeowner Plus** card
3. Complete checkout with your test email and Stripe test card
4. Verify redirect to success/dashboard page

**Expected Result:**
- Checkout completes without error
- Redirected to dashboard or success page

**[ ] PASS / FAIL**

---

### HP-002 — Plus Welcome Email

**Preconditions:** HP-001 passes

**Steps:**
1. Check email inbox for welcome email
2. Verify subject references the **Homeowner Plus** plan (not Basic)
3. Verify pricing shown is correct for Plus plan

**Expected Result:**
- Email arrives within 5 minutes
- Plan name is "Homeowner Plus" — not another plan name

**[ ] PASS / FAIL**

---

### HP-003 — Plus Dashboard Access

**Preconditions:** HP-001 passes

**Steps:**
1. Click the magic link from the welcome email
2. Verify you are taken to `/my-home` (same dashboard as Basic)
3. Verify plan information shows "Plus" or the correct tier if shown anywhere in the UI

**Expected Result:**
- Magic link logs you in successfully
- Dashboard loads with correct plan context

**[ ] PASS / FAIL**

---

### HP-004 through HP-010

Repeat tests HB-006 through HB-014 using the Plus plan account.

**Key differences to verify:**
- AI schedule generates correctly
- QR code or activation flow (if different for Plus)
- Trial email shows correct plan name

**[ ] PASS / FAIL (for each repeated test)**

---

## Module 5: Realtor / Agent Flow

---

### RA-001 — Realtor Signup via Pricing Page

**Preconditions:** Fresh Incognito window; real email you can access

**Steps:**
1. Navigate to `https://maintcue.com/pricing`
2. Click **"Start Free Trial"** on the **Realtor / Agent** card
3. Complete checkout:
   - Name: `QA Realtor`
   - Email: your test email
   - Card: `4242 4242 4242 4242` / `12/29` / `123` / `30001`
4. Submit and wait for redirect

**Expected Result:**
- Checkout completes
- Redirected to a success or dashboard page

**[ ] PASS / FAIL**

---

### RA-002 — Realtor Welcome Email with Magic Link

**Preconditions:** RA-001 passes

**Steps:**
1. Open your email inbox
2. Find the email with subject: **"Welcome to MaintCue — Your Realtor Dashboard is Ready"**
3. Verify the email contains:
   - Your name (QA Realtor)
   - Plan: Realtor / Agent
   - Client Slots: 25 homeowners
   - Billing: $468/year
   - A green "🏠 Start Adding Your Clients" section
   - An **"Access Your Dashboard →"** button
4. Click **"Access Your Dashboard →"**

**Expected Result:**
- Email arrives within 5 minutes
- All content fields are filled (no "undefined" or missing values)
- Clicking the button logs you into the Realtor Dashboard directly

**[ ] PASS / FAIL**

---

### RA-003 — Trial Email Content for Realtor

**Preconditions:** RA-001 passes

**Steps:**
1. Check inbox for the trial welcome email (subject: "Your MaintCue free trial has started")
2. Open the email
3. Verify the getting-started steps say:
   - "Add your first client" (NOT "Scan your first QR code")
   - "Set up your agent dashboard" (NOT "Log your first maintenance task")
   - "Invite your first homeowner" (NOT "Enable SMS reminders")

**Expected Result:**
- Trial email uses Realtor-specific language, not generic homeowner language

**[ ] PASS / FAIL**

---

### RA-004 — Realtor Dashboard Loads

**Preconditions:** RA-002 passes (logged in via magic link)

**Steps:**
1. After clicking the magic link from RA-002, verify you land on the **Realtor Dashboard** (URL should be `/realtor`)
2. Verify the dashboard shows:
   - A header greeting with your name
   - Badge showing "Realtor / Agent"
   - Client slot count (e.g. "0/25 clients")
   - 5 stat cards (Total, Active, Pending, Email Sent, Remaining)
   - An **"Add Client"** button
   - An empty client list (or message saying no clients yet)

**Expected Result:**
- Realtor dashboard loads at `/realtor`
- All stat cards show 0 initially
- "Add Client" button is visible

**[ ] PASS / FAIL**

---

### RA-005 — Add First Client

**Preconditions:** RA-004 passes (on Realtor Dashboard)

**Steps:**
1. Click **"Add Client"** button
2. A modal/form should appear
3. Fill in the form:
   - Client Name: `Jane Homeowner`
   - Client Email: a **different** real email address you can access (this client will receive an email)
   - Phone: `555-000-0001` (optional)
   - Property Address: start typing `123 Oak Street` and select a suggestion if Google autocomplete appears, or type manually
   - City: `Atlanta`
   - State: `GA`
   - ZIP: `30301`
   - Property Type: `Single Family`
4. Click **"Add Client & Send Invitation"**

**Expected Result:**
- Form submits without error
- Modal closes
- Client appears in the client list with status "Email Sent" or "Pending"
- Stat cards update (Total: 1, Email Sent: 1)

**[ ] PASS / FAIL**

---

### RA-006 — Client Receives Invitation Email

**Preconditions:** RA-005 passes; access to the client email inbox

**Steps:**
1. Open the email inbox for the client email used in RA-005
2. Look for subject: **"Your Home Maintenance Schedule is Ready — from QA Realtor"**
3. Verify the email contains:
   - Client's name (Jane Homeowner)
   - Property address (123 Oak Street)
   - Realtor's name (QA Realtor)
   - A **"Set Up Your Account →"** button
   - A feature list (AI-generated 12-month plan, etc.)
4. Do NOT click the button yet — proceed to RA-007 first

**Expected Result:**
- Invitation email arrives within 5 minutes
- All content is personalized correctly
- No placeholder text visible

**[ ] PASS / FAIL**

---

### RA-007 — Client Activation Flow

**Preconditions:** RA-006 passes; using the client email inbox

**Steps:**
1. Open the client invitation email from RA-006
2. Click **"Set Up Your Account →"**
3. Verify you are taken to the MaintCue onboarding page (URL should contain `/onboarding?realtorClient=...`)
4. Verify the page shows a banner indicating this was set up by "QA Realtor"
5. Verify the home address is pre-filled with the property address (123 Oak Street, Atlanta GA 30301)
6. Fill in any remaining required fields (name if not pre-filled)
7. Complete the onboarding form and submit
8. Verify you see a "Check your email" or confirmation message

**Expected Result:**
- Onboarding page loads with pre-filled property information
- Realtor branding/banner is visible
- Form submits successfully
- Confirmation shown after submission

**[ ] PASS / FAIL**

---

### RA-008 — Client Welcome Email After Activation

**Preconditions:** RA-007 passes

**Steps:**
1. Check the client email inbox (used in RA-005/RA-007)
2. Look for an email with subject: **"Your MaintCue account is ready — access your maintenance dashboard"**
3. Verify the email contains:
   - Client's name
   - Property address
   - Realtor's name at the bottom ("Powered by MaintCue · Provided by QA Realtor")
   - A **"Go to My Dashboard →"** button (this is a magic link)
   - A note that the link expires in 24 hours
4. Click **"Go to My Dashboard →"**

**Expected Result:**
- Welcome email arrives within 5 minutes of completing RA-007
- Magic link logs the client into their dashboard at `/my-home`
- Dashboard shows correct property and begins AI schedule generation

**[ ] PASS / FAIL**

---

### RA-009 — "Provided By" Shows on Client Dashboard

**Preconditions:** RA-008 passes (client is logged in at `/my-home`)

**Steps:**
1. On the client's dashboard at `/my-home`
2. Look for a "Provided by [Realtor Name]" or similar attribution in the header or footer of the dashboard
3. Verify it shows "Provided by QA Realtor" (or the realtor name used in RA-001)

**Expected Result:**
- Realtor attribution is visible on the client's dashboard
- The name matches the realtor who added the client

**[ ] PASS / FAIL**

---

### RA-010 — Client Appears as Active in Realtor Dashboard

**Preconditions:** RA-007 passes; switch back to the Realtor account

**Steps:**
1. Open a new Incognito window
2. Navigate to `https://maintcue.com/login`
3. Enter the realtor email (from RA-001)
4. Receive the magic link and log in
5. Navigate to `/realtor`
6. Verify the client list shows **Jane Homeowner** with status **"Active"**
7. Verify the stat cards updated (Active: 1, Total: 1)

**Expected Result:**
- Client status changed from "Pending"/"Email Sent" to "Active" after completing onboarding
- Realtor dashboard reflects the correct counts

**[ ] PASS / FAIL**

---

### RA-011 — Resend Invitation Email

**Preconditions:** RA-004 passes (on Realtor Dashboard with at least one pending client)

**Steps:**
1. Add a second client (repeat steps from RA-005 with a different name/email — use an email address you do NOT plan to activate)
2. In the client list, find the new pending client
3. Click the **"Resend"** button next to that client
4. Verify a success toast or confirmation message appears
5. Check the client's email inbox for the resent invitation

**Expected Result:**
- Resend button works without error
- Confirmation message shown to realtor
- Client receives a second invitation email

**[ ] PASS / FAIL**

---

### RA-012 — Delete Client

**Preconditions:** RA-011 passes (second pending client exists)

**Steps:**
1. On the Realtor Dashboard, find the second pending client (from RA-011)
2. Click the **Delete** or trash icon button next to that client
3. If a confirmation dialog appears, confirm deletion
4. Verify the client is removed from the list
5. Verify the Total client count decreases by 1

**Expected Result:**
- Client is removed from the list after deletion
- Stat card counts update correctly

**[ ] PASS / FAIL**

---

### RA-013 — Realtor Dashboard Mobile View

**Preconditions:** RA-004 passes (Realtor Dashboard accessible)

**Steps:**
1. While on the Realtor Dashboard, open Chrome DevTools (`F12`)
2. Enable iPhone 14 Pro Max simulation
3. Reload the page
4. Verify:
   - Stat cards stack (1 per row or 2 per row — no overflow)
   - Client list entries are readable
   - "Add Client" button is visible and tappable
5. Click "Add Client" on mobile
6. Verify the form modal appears and all fields are accessible (not hidden behind keyboard)
7. Verify form fields stack vertically (City/State/ZIP not cramped side-by-side)

**Expected Result:**
- Dashboard is usable on mobile
- Add Client modal is fully usable on mobile
- All form fields are full-width on mobile screen

**[ ] PASS / FAIL**

---

### RA-014 through RA-020 — Additional Realtor Checks

**RA-014** — Verify slot limit messaging (25 max). Add enough clients to approach the limit and confirm UI shows remaining slots.

**RA-015** — Verify magic link redirect: log out, click a welcome email magic link, verify you land on `/realtor` not `/my-home`.

**RA-016** — Verify realtor subscription success page redirects to `/realtor` not `/my-home`.

**RA-017** — Verify client AI schedule generates (check client's dashboard after activation — should show tasks within 3 minutes).

**RA-018** — Verify client's tasks appear on their dashboard with cost estimates and due dates.

**RA-019** — Test realtor summary API: confirm dashboard stat cards are accurate after adding/activating multiple clients.

**RA-020** — Verify realtor trial email does NOT contain QR code instructions (should be agent-specific).

**[ ] PASS / FAIL** (for each)

---

## Module 6: Property Manager Flow

---

### PM-001 — Property Manager Signup

**Preconditions:** Fresh Incognito window; real email you can access

**Steps:**
1. Navigate to `https://maintcue.com/pricing`
2. Click **"Start Free Trial"** on the **Property Manager** card
3. Complete checkout with test card and your email
4. Wait for redirect

**Expected Result:**
- Checkout completes successfully
- Redirected to success or dashboard

**[ ] PASS / FAIL**

---

### PM-002 — PM Welcome Email

**Preconditions:** PM-001 passes

**Steps:**
1. Check email for subject: **"Welcome to MaintCue — Your Property Manager Portfolio is Ready"**
2. Verify email contains:
   - Plan: Property Manager
   - Portfolio capacity: 200 properties
   - An **"Activate Your Portfolio"** button linking to `/property-manager`
   - Getting-started steps (Add property, Bulk upload, AI schedule)
3. Click **"Activate Your Portfolio"**

**Expected Result:**
- Email arrives within 5 minutes
- Content is correct and all values are filled in
- Button navigates to the PM dashboard

**[ ] PASS / FAIL**

---

### PM-003 — Property Manager Dashboard Loads

**Preconditions:** PM-002 passes (logged in via welcome email)

**Steps:**
1. Verify URL is `/property-manager`
2. Verify the dashboard shows:
   - Header with your name
   - 4 stat cards (Total Properties, Active, Pending, Schedule Generated)
   - An **"Add Property"** button
   - An empty property list (or "No properties yet" message)
   - Remaining slots count (e.g. "200 remaining")

**Expected Result:**
- Dashboard loads at `/property-manager`
- All stat cards visible and show 0
- Add Property button is visible

**[ ] PASS / FAIL**

---

### PM-004 — Add First Property

**Preconditions:** PM-003 passes

**Steps:**
1. Click **"Add Property"**
2. Fill in the form:
   - Property Name: `123 Oak Test Property`
   - Address: `123 Oak Street`
   - City: `Atlanta`
   - State: `GA`
   - ZIP: `30301`
   - Property Type: `Single Family`
   - Year Built: `2005`
   - Square Footage: `1800`
3. Click **"Add Property"** or **"Save"**

**Expected Result:**
- Property is added to the list
- Stat cards update (Total: 1, Pending: 1)
- Property shows with status "Pending" and "Schedule: Generating..."

**[ ] PASS / FAIL**

---

### PM-005 — AI Schedule Generates for Property

**Preconditions:** PM-004 passes

**Steps:**
1. In the property list, find the property added in PM-004
2. Wait up to 3 minutes — the "Schedule" status should change from "Generating" to "Generated" or a checkmark
3. Click on the property to open the property detail view
4. Verify maintenance tasks are listed in the Tasks tab
5. Verify tasks have priority labels (High/Medium/Low), cost estimates, and due months

**Expected Result:**
- AI schedule generates within 3 minutes
- Property detail view shows tasks
- Each task has a priority, estimated cost range, and month

**[ ] PASS / FAIL**

---

### PM-006 — Property Detail View

**Preconditions:** PM-005 passes (schedule generated)

**Steps:**
1. From the property list, click on the property name or **"View →"** button
2. Verify the detail page loads at `/property-manager/[id]`
3. Verify 4 stat cards: Total Tasks, Completed, Pending, Overdue
4. Verify a category filter tabs row exists (e.g. All, HVAC, Plumbing, etc.)
5. Click a category filter — verify only tasks in that category show
6. Click on a task's **"Complete"** button
7. Verify the task is marked complete and stat cards update

**Expected Result:**
- Detail page loads with tasks
- Category filters work correctly
- Completing a task updates the stat cards immediately

**[ ] PASS / FAIL**

---

### PM-007 — Edit Property

**Preconditions:** PM-006 passes

**Steps:**
1. On the property detail page, find and click the **"Edit"** button
2. An edit modal should appear with current property details pre-filled
3. Change the Property Name to `123 Oak Test Property — Updated`
4. Change Year Built to `2010`
5. Click **"Save"**
6. Verify the property name updates in the header/breadcrumb

**Expected Result:**
- Edit modal opens with pre-filled values
- Changes save successfully
- Updated values display on the page

**[ ] PASS / FAIL**

---

### PM-008 — Regenerate Schedule

**Preconditions:** PM-007 passes

**Steps:**
1. On the property detail page, find the **"Regenerate Schedule"** button
2. Click it
3. Verify a confirmation message or spinner appears indicating regeneration started
4. Wait up to 3 minutes
5. Verify new tasks appear (the count may change slightly)

**Expected Result:**
- Regenerate button triggers a new AI schedule
- Page shows generation progress
- New tasks appear after regeneration completes

**[ ] PASS / FAIL**

---

### PM-009 — Annual Budget Display

**Preconditions:** PM-005 passes (tasks visible)

**Steps:**
1. On the property detail page, scroll or look for an **"Annual Budget"** or **"Estimated Annual Cost"** figure
2. Verify a dollar amount is shown (calculated from all task cost estimates)
3. The amount should be a reasonable range for home maintenance (e.g. $1,000 – $10,000/year)

**Expected Result:**
- Annual budget figure is displayed
- Amount is a positive number
- Amount reflects the task estimates visible in the list

**[ ] PASS / FAIL**

---

### PM-010 — Navigate Back to Portfolio

**Preconditions:** PM-006 passes (on property detail page)

**Steps:**
1. On the property detail page, find a **"Back"** button or breadcrumb link to the portfolio
2. Click it
3. Verify you return to `/property-manager`
4. Verify the portfolio list still shows your property

**Expected Result:**
- Back navigation returns to the portfolio dashboard
- Property is still listed

**[ ] PASS / FAIL**

---

### PM-011 — Delete Property

**Preconditions:** PM-004 passes (at least one property exists)

**Steps:**
1. On the portfolio dashboard (`/property-manager`), find a property in the list
2. Click the **Delete** or trash icon button
3. If a confirmation dialog appears, confirm
4. Verify the property is removed from the list
5. Verify the Total Properties stat card decreases by 1

**Expected Result:**
- Property is deleted from the list
- Stat cards update correctly

**[ ] PASS / FAIL**

---

### PM-012 — Bulk Upload CSV

**Preconditions:** PM-003 passes (PM dashboard accessible)

**Steps:**
1. On the portfolio dashboard, find the **"Bulk Upload"** or **"Upload CSV"** button
2. Create a test CSV file on your computer with the following content (save as `test_properties.csv`):
   ```
   property_name,address,city,state,zip
   Bulk Test 1,456 Pine Avenue,Atlanta,GA,30302
   Bulk Test 2,789 Maple Drive,Decatur,GA,30030
   ```
3. Click the Bulk Upload button and select your CSV file
4. Click **"Upload"**
5. Wait for the upload to process (a progress indicator may appear)
6. Verify both properties appear in the portfolio list

**Expected Result:**
- CSV upload is accepted
- Both properties are imported and appear in the list
- Total Properties stat updates to reflect the upload

**[ ] PASS / FAIL**

---

### PM-013 — PM Dashboard Mobile View

**Preconditions:** PM-003 passes

**Steps:**
1. Open Chrome DevTools and enable iPhone 14 Pro Max simulation
2. Navigate to `/property-manager`
3. Verify:
   - Stat cards stack (1 or 2 per row — not 4 across)
   - Property list entries are readable
   - "Add Property" button is visible
4. Click "Add Property" on mobile
5. Verify the modal form stacks all fields vertically (City/State/ZIP not cramped)

**Expected Result:**
- Dashboard usable on mobile
- Add Property form is fully usable with stacked fields
- No horizontal overflow or cramped inputs

**[ ] PASS / FAIL**

---

### PM-014 through PM-020 — Additional PM Checks

**PM-014** — Magic link redirect: log out, click PM welcome email magic link, verify you land on `/property-manager` not `/my-home`.

**PM-015** — Subscription success page: verify "Go to My Dashboard" on `/subscription/success` routes to `/property-manager` for PM plan.

**PM-016** — Verify slot limit: confirm UI shows "200 remaining" slots and counts down as properties are added.

**PM-017** — Property detail shows tasks after AI generation completes (not before).

**PM-018** — Category filter tabs: verify each filter shows only relevant tasks.

**PM-019** — Overdue tasks: tasks past their due date with no completion should show in the Overdue stat.

**PM-020** — Verify portfolio summary API: confirm stat cards on dashboard match actual property data.

**[ ] PASS / FAIL** (for each)

---

## Module 7: AI Features

---

### AI-001 — Schedule Generation Triggers After Onboarding

**Preconditions:** Any completed onboarding (HB-006, PM-004, or RA-007)

**Steps:**
1. Complete the onboarding/property setup for any account type
2. Navigate to the relevant dashboard immediately after
3. Observe any loading indicator (spinner, "Generating your maintenance schedule..." message)
4. Note the time generation starts
5. Wait for completion

**Expected Result:**
- Generation begins automatically without manual trigger
- A visual loading state is shown (not a blank screen)
- Generation completes within 3 minutes

**[ ] PASS / FAIL**

---

### AI-002 — Tasks Are Climate-Specific

**Preconditions:** AI-001 passes (tasks generated for Atlanta, GA)

**Steps:**
1. Open the generated maintenance tasks for an Atlanta, GA property
2. Review task descriptions and names
3. Look for tasks that make sense for the Southeast US climate:
   - HVAC maintenance (hot summers)
   - Gutters/drainage (high rainfall)
   - Hurricane/storm prep may not be present but general weatherproofing should be
4. Verify you do NOT see tasks inappropriate for Georgia (e.g. heavy snow removal, extreme cold insulation)

**Expected Result:**
- Tasks are relevant to the property's geographic location
- Task descriptions reference seasonal timing appropriate for Georgia
- No obviously irrelevant tasks (heavy snow, etc.)

**[ ] PASS / FAIL**

---

### AI-003 — Tasks Have Cost Estimates

**Preconditions:** AI-001 passes

**Steps:**
1. Open the task list for any AI-generated property
2. Click on any task or look at the task cards
3. Verify each task shows an estimated cost range (e.g. "$150 – $350")
4. Verify at least 80% of tasks have cost estimates (some may have N/A)

**Expected Result:**
- Cost ranges are displayed on task cards
- Amounts are realistic (not $0 or extremely high values like $999,999)
- Ranges have a min and max value

**[ ] PASS / FAIL**

---

### AI-004 — Tasks Have Priority Levels

**Preconditions:** AI-001 passes

**Steps:**
1. Open the task list
2. Verify tasks show priority badges: **High**, **Medium**, or **Low**
3. Verify High priority tasks appear first in the default sort order
4. Verify the priority badges have distinct colors (e.g. red for High, yellow for Medium, green/gray for Low)

**Expected Result:**
- All tasks have a priority label
- Tasks are sorted by priority by default
- Priority colors are visually distinct

**[ ] PASS / FAIL**

---

### AI-005 — Tasks Have Month Assignments

**Preconditions:** AI-001 passes

**Steps:**
1. Open the task list
2. Verify each task shows a month assignment (e.g. "Due: March" or "Month: 3")
3. Verify tasks span multiple months (not all assigned to the same month)
4. Verify the months make seasonal sense (e.g. HVAC filter change in Spring/Fall, gutter cleaning in Autumn)

**Expected Result:**
- Each task has a month assignment
- Tasks are distributed across multiple months of the year
- Seasonal logic is sensible

**[ ] PASS / FAIL**

---

### AI-006 — Regenerate Schedule Creates New Tasks

**Preconditions:** PM-008 passes (regeneration tested in PM flow)

**Steps:**
1. On a property detail page with an existing schedule, note the current task count
2. Click **"Regenerate Schedule"**
3. Wait for completion
4. Note the new task count
5. Verify tasks were regenerated (may be same count ±3, or may vary)

**Expected Result:**
- New tasks are generated
- The page does not show zero tasks after regeneration
- Task list refreshes automatically or after a page reload

**[ ] PASS / FAIL**

---

### AI-007 — Homeowner Dashboard AI Schedule

**Preconditions:** HB-007 passes

**Steps:**
1. On the homeowner dashboard (`/my-home`), verify the task list has AI-generated tasks
2. Verify tasks match the property address from onboarding (climate-appropriate)
3. Count the tasks — there should be at least 8–15 tasks for a typical year

**Expected Result:**
- At least 8 tasks generated for the homeowner account
- Tasks are relevant to the property

**[ ] PASS / FAIL**

---

### AI-008 — ATTOM Data Enrichment (if address found)

**Preconditions:** Any property with an address ATTOM can find

**Steps:**
1. Add a property with a real, existing US address (try `123 Peachtree Street NE, Atlanta, GA 30303`)
2. After the property is added, wait 1 minute
3. Open the property detail or edit modal
4. Verify the Year Built and/or Square Footage fields have been auto-populated (if ATTOM has the data)

**Expected Result:**
- ATTOM enrichment fills in Year Built and/or Square Footage automatically
- If ATTOM has no data for the address, fields remain as entered (not an error)
- No error message shown to user even if ATTOM returns no data

**[ ] PASS / FAIL**

---

### AI-009 — Tasks Visible After Client Activation (Realtor Flow)

**Preconditions:** RA-008 passes (client logged into their dashboard)

**Steps:**
1. Log in as the activated client (from RA-008)
2. Wait up to 3 minutes after logging in
3. Navigate to `/my-home`
4. Verify maintenance tasks appear for the property
5. Verify tasks are specific to the client's property address

**Expected Result:**
- Client's dashboard shows AI-generated tasks
- Tasks are property-specific
- Client can mark tasks complete

**[ ] PASS / FAIL**

---

### AI-010 — Error Handling if AI Fails

**Preconditions:** Access to any account with a property

**Steps:**
1. Add a property with a clearly invalid address: `zzz invalid zzz, ZZ, 00000`
2. Wait 3 minutes
3. Observe the property status on the dashboard

**Expected Result:**
- The app does not crash or show a blank screen
- Property row shows a status (even if "Schedule: Pending" remains or shows an error gracefully)
- No server error (500) shown to the user

**[ ] PASS / FAIL**

---

## Module 8: Push Notifications

---

### PUSH-001 — Notification Permission Prompt

**Preconditions:** Logged in to any dashboard (HB-005 passes); Chrome desktop browser

**Steps:**
1. Log in to the homeowner dashboard (`/my-home`)
2. Wait for any notification permission banner to appear, OR navigate to a page that triggers it
3. When the browser permission dialog appears ("MaintCue wants to send notifications"), click **"Allow"**
4. Observe the UI for a confirmation that notifications are enabled

**Expected Result:**
- Browser permission dialog appears
- After clicking Allow, the UI shows notifications are active
- No error messages shown

**[ ] PASS / FAIL**

---

### PUSH-002 — Decline Notifications

**Preconditions:** Fresh browser (notifications not yet decided for maintcue.com)

**Steps:**
1. Open a fresh profile or clear notification settings for maintcue.com in Chrome
2. Log in to the dashboard
3. When the notification prompt appears, click **"Block"** or **"Don't allow"**
4. Verify the app continues to work normally
5. Verify no error messages are shown

**Expected Result:**
- Declining notifications does not break the app
- Dashboard still loads and functions
- No persistent error about notifications

**[ ] PASS / FAIL**

---

### PUSH-003 — Notification Preferences in UI

**Preconditions:** PUSH-001 passes (notifications allowed)

**Steps:**
1. On the dashboard, look for a notification settings section (may be in account settings or on the dashboard itself)
2. Verify a toggle or button to enable/disable notifications is present
3. Toggle notifications off
4. Verify the UI confirms they are disabled
5. Toggle notifications back on

**Expected Result:**
- UI allows enabling/disabling push notifications
- State is reflected immediately in the UI

**[ ] PASS / FAIL**

---

### PUSH-004 — Notification API Returns 401 Without Auth

**Preconditions:** None

**Steps:**
1. Open Chrome DevTools (`F12`)
2. Go to the **Console** tab
3. Paste and run:
   ```javascript
   fetch('/api/push/subscribe', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({subscription: {}})
   }).then(r => console.log('Status:', r.status))
   ```
4. Verify the console shows `Status: 401`

**Expected Result:**
- Unauthenticated push subscribe request returns 401
- Route is properly protected

**[ ] PASS / FAIL**

---

### PUSH-005 — Mobile Notification on PWA

**Preconditions:** PUSH-001 passes; Chrome on Android or iPhone (physical device)

**Steps:**
1. Open `https://maintcue.com` in Chrome on a mobile device
2. Add to Home Screen (browser menu → "Add to Home Screen")
3. Open the app from the Home Screen (PWA mode)
4. Log in
5. Allow notifications when prompted
6. Verify the PWA can receive notifications

**Expected Result:**
- App can be installed as PWA
- Notifications work in PWA mode on mobile
- No errors in the install/notification flow

**[ ] PASS / FAIL**

---

## Module 9: Mobile Responsiveness

---

### MOB-001 — Homepage Mobile

**Preconditions:** None

**Steps:**
1. Open Chrome DevTools (`F12`) → Toggle device toolbar → iPhone 14 Pro Max
2. Navigate to `https://maintcue.com`
3. Verify:
   - Hero headline is readable (not too large, not cut off)
   - CTA buttons are stacked vertically (not side by side)
   - Navigation does not overflow horizontally
   - All sections stack properly
4. Scroll the entire page — verify no horizontal scroll bar appears

**Expected Result:**
- Homepage is fully responsive on mobile
- No horizontal overflow
- All text is readable at mobile size

**[ ] PASS / FAIL**

---

### MOB-002 — Pricing Page Mobile

**Preconditions:** None

**Steps:**
1. Enable iPhone 14 Pro Max simulation in DevTools
2. Navigate to `https://maintcue.com/pricing`
3. Verify 4 plan cards stack vertically (one per row)
4. Verify the monthly/annual toggle is usable
5. Click the toggle — verify prices update
6. Click "Start Free Trial" — verify the checkout form/modal is usable on mobile (fields not cramped)

**Expected Result:**
- All 4 plan cards visible with vertical stacking
- Checkout modal fields stack vertically (no side-by-side inputs)
- All form inputs are tappable (large enough touch targets)

**[ ] PASS / FAIL**

---

### MOB-003 — Onboarding Mobile

**Preconditions:** None

**Steps:**
1. Enable mobile simulation
2. Navigate to `https://maintcue.com/onboarding`
3. Fill in Step 1 (address fields)
4. Verify City, State, ZIP inputs are NOT side-by-side (they should stack on mobile)
5. Verify the "Continue" button is full-width or easily tappable
6. Progress through all steps

**Expected Result:**
- All form fields stack vertically on mobile
- Buttons are full-width and easy to tap
- Step indicators (1 / 2 / 3) are visible

**[ ] PASS / FAIL**

---

### MOB-004 — Customer Dashboard Mobile

**Preconditions:** Logged in to homeowner account (HB-007 passes)

**Steps:**
1. Enable mobile simulation
2. Navigate to `/my-home`
3. Verify stat cards stack (2×2 grid or 1 column — not 4 in a row)
4. Verify tab buttons (Tasks, Appliances, Details) fit across the screen
5. Scroll through the task list — verify task cards are full-width
6. Tap the **Complete** button on a task — verify it works on mobile

**Expected Result:**
- Dashboard is fully usable on mobile
- Stat cards do not overflow
- Task list is scrollable and tappable

**[ ] PASS / FAIL**

---

### MOB-005 — Property Manager Dashboard Mobile

**Preconditions:** Logged in to PM account (PM-003 passes)

**Steps:**
1. Enable mobile simulation
2. Navigate to `/property-manager`
3. Verify stat cards stack (not all in one row)
4. Verify property list entries are full-width
5. Click "Add Property" — verify the modal opens
6. In the form, verify City/State inputs are NOT side-by-side (they should be stacked on mobile)
7. Verify ZIP and Unit Number inputs are NOT side-by-side

**Expected Result:**
- Portfolio dashboard is usable on mobile
- Add Property form has single-column layout on mobile
- All inputs are properly sized for touch

**[ ] PASS / FAIL**

---

### MOB-006 — Realtor Dashboard Mobile

**Preconditions:** Logged in to Realtor account (RA-004 passes)

**Steps:**
1. Enable mobile simulation
2. Navigate to `/realtor`
3. Verify stat cards stack (not 5 in a row)
4. Click "Add Client"
5. In the form modal, verify:
   - Client Name, Email, Phone stack vertically on mobile
   - Email and Phone are NOT side-by-side
   - City/State are NOT side-by-side
   - ZIP and Property Type are NOT side-by-side

**Expected Result:**
- Realtor dashboard usable on mobile
- Add Client form uses single-column layout on mobile

**[ ] PASS / FAIL**

---

### MOB-007 — Property Detail Mobile

**Preconditions:** PM-005 passes (property with tasks)

**Steps:**
1. Enable mobile simulation
2. Navigate to a property detail page (`/property-manager/[id]`)
3. Verify:
   - Stat cards (Total/Completed/Pending/Overdue) stack correctly
   - Category filter tabs are horizontally scrollable or wrap
   - Task cards are full-width
   - "Complete" button is tappable on mobile
4. Scroll through the task list

**Expected Result:**
- Detail page is usable on mobile
- Task completion works on mobile

**[ ] PASS / FAIL**

---

### MOB-008 — Contact Form Mobile

**Preconditions:** None

**Steps:**
1. Enable mobile simulation
2. Navigate to the Contact page
3. Fill in the form (Name, Email, Subject, Message)
4. Verify all fields are full-width and usable
5. Submit the form

**Expected Result:**
- Contact form is fully usable on mobile
- Submission works correctly
- Success message is displayed

**[ ] PASS / FAIL**

---

### MOB-009 — Legal Pages Mobile

**Preconditions:** None

**Steps:**
1. Enable mobile simulation
2. Navigate to `/terms-of-service`
3. Verify the page is readable (text is not too small)
4. Verify no horizontal overflow
5. Navigate to `/privacy-policy` and repeat

**Expected Result:**
- Legal pages are readable on mobile
- No horizontal scroll required

**[ ] PASS / FAIL**

---

### MOB-010 — Navigation Mobile

**Preconditions:** None

**Steps:**
1. Enable mobile simulation
2. Navigate to `https://maintcue.com`
3. Look for a hamburger menu icon (☰) or mobile navigation
4. If present, tap it — verify the navigation menu opens
5. Tap a navigation link — verify it works
6. Tap outside the menu (or an X button) — verify the menu closes

**Expected Result:**
- Mobile navigation is accessible and functional
- Menu opens and closes without issues
- All nav links work on mobile

**[ ] PASS / FAIL**

---

## Module 10: Email Notifications

---

### EMAIL-001 — Trial Welcome Email (Homeowner)

**Preconditions:** HB-001 passes
**Reference:** HB-003

**Checklist:**
- [ ] Email arrives within 5 minutes
- [ ] Subject: "Your MaintCue free trial has started"
- [ ] Recipient name is correct
- [ ] Trial end date is ~30 days from today
- [ ] Getting-started steps mention: "Scan your first QR code", "Log your first maintenance task", "Enable SMS reminders"
- [ ] Email renders correctly in Gmail / Apple Mail
- [ ] No broken images or raw HTML visible
- [ ] Unsubscribe or footer links present

**[ ] PASS / FAIL**

---

### EMAIL-002 — Trial Welcome Email (Realtor)

**Preconditions:** RA-001 passes
**Reference:** RA-003

**Checklist:**
- [ ] Email arrives within 5 minutes
- [ ] Subject: "Your MaintCue free trial has started"
- [ ] Getting-started steps say: "Add your first client", "Set up your agent dashboard", "Invite your first homeowner" — NOT the homeowner versions
- [ ] Trial end date is correct

**[ ] PASS / FAIL**

---

### EMAIL-003 — Realtor Welcome Email with Magic Link

**Preconditions:** RA-001 passes
**Reference:** RA-002

**Checklist:**
- [ ] Subject: "Welcome to MaintCue — Your Realtor Dashboard is Ready"
- [ ] Your name is correct
- [ ] Plan: Realtor / Agent
- [ ] Client Slots: 25 homeowners
- [ ] Billing: $468/year
- [ ] Green "Start Adding Your Clients" box present
- [ ] "Access Your Dashboard →" button present and working
- [ ] Magic link logs you into `/realtor` (not `/my-home`)
- [ ] Magic link expires after 24 hours (note time received)

**[ ] PASS / FAIL**

---

### EMAIL-004 — Property Manager Welcome Email

**Preconditions:** PM-001 passes
**Reference:** PM-002

**Checklist:**
- [ ] Subject: "Welcome to MaintCue — Your Property Manager Portfolio is Ready"
- [ ] Plan: Property Manager
- [ ] Portfolio capacity: 200 properties
- [ ] Billing: $1,788/year
- [ ] "Activate Your Portfolio" button links to `/property-manager`
- [ ] Getting-started steps are property-manager specific
- [ ] No broken content

**[ ] PASS / FAIL**

---

### EMAIL-005 — Realtor Client Invitation Email

**Preconditions:** RA-005 passes
**Reference:** RA-006

**Checklist:**
- [ ] Subject: "Your Home Maintenance Schedule is Ready — from [Realtor Name]"
- [ ] Client name is correct (Jane Homeowner)
- [ ] Property address is correct (123 Oak Street)
- [ ] Realtor name is correct (QA Realtor)
- [ ] "Set Up Your Account →" button is present
- [ ] Feature list (AI plan, climate tasks, cost estimates, alerts) is present
- [ ] Footer says "Powered by MaintCue · Provided by QA Realtor"
- [ ] Activation link navigates to `/onboarding?realtorClient=...`

**[ ] PASS / FAIL**

---

### EMAIL-006 — Client Welcome Email After Activation

**Preconditions:** RA-007 passes
**Reference:** RA-008

**Checklist:**
- [ ] Subject: "Your MaintCue account is ready — access your maintenance dashboard"
- [ ] Client name correct
- [ ] Property address correct
- [ ] "Go to My Dashboard →" button present (magic link)
- [ ] Note about 24-hour link expiry present
- [ ] Footer: "Powered by MaintCue · Provided by [Realtor Name]"
- [ ] Magic link logs client into `/my-home`

**[ ] PASS / FAIL**

---

### EMAIL-007 — Magic Link Login Email

**Preconditions:** Any account logged out; HB-013 passes

**Checklist:**
- [ ] Magic link email arrives within 2 minutes of request
- [ ] Link is clickable and logs you in
- [ ] After using the link, trying to use it again fails gracefully (links are single-use)
- [ ] Email does not arrive if a non-registered email is entered (verify no error leaks account existence)

**[ ] PASS / FAIL**

---

### EMAIL-008 — Pre-Charge Reminder Email (3 Days Before Trial Ends)

**Note:** This email is sent automatically 3 days before the trial ends. You cannot easily trigger it manually. Verify by checking the email logs or waiting until 27 days into the trial.

**Checklist (review template only):**
- [ ] Subject includes trial end date and charge amount
- [ ] Amount shown is correct for the plan
- [ ] "Manage My Subscription" button links to `/settings/billing`
- [ ] Email is clear that NO charge happens today

**[ ] PASS / FAIL** *(mark as SKIP if cannot test timing)*

---

### EMAIL-009 — Payment Failed Email

**Note:** Trigger by updating Stripe test card to a failing card (`4000 0000 0000 0341`) after trial ends.

**Checklist:**
- [ ] Subject: "[!] MaintCue - Payment issue needs your attention"
- [ ] Grace period end date shown
- [ ] "Update Payment Method" button links to billing settings
- [ ] Email clearly explains what action is needed

**[ ] PASS / FAIL** *(mark as SKIP if cannot test)*

---

### EMAIL-010 — Cancellation Confirmation Email

**Preconditions:** HB-015 passes (subscription cancelled via Stripe portal)

**Checklist:**
- [ ] Subject: "Your MaintCue subscription has been canceled"
- [ ] Your name is correct
- [ ] "Resubscribe" button links to `/pricing`
- [ ] Email has support contact info
- [ ] Email arrives within 5 minutes of cancellation

**[ ] PASS / FAIL**

---

## Final Sign-Off Checklist

Before marking QA as complete, confirm all of the following:

| Area | Status |
|------|--------|
| Homepage loads and all nav links work | [ ] |
| All 4 pricing plans show correct prices | [ ] |
| Homeowner Basic full flow works end-to-end | [ ] |
| Homeowner Plus signup works | [ ] |
| Realtor/Agent full flow works end-to-end | [ ] |
| Property Manager full flow works end-to-end | [ ] |
| AI schedules generate for all account types | [ ] |
| All transactional emails deliver and are correct | [ ] |
| Mobile layouts are usable on all key pages | [ ] |
| Magic links log in correctly to the right dashboard | [ ] |
| Push notifications can be enabled | [ ] |
| Stripe billing portal accessible | [ ] |
| Logout clears session correctly | [ ] |

---

**QA Tester:** ________________________
**Date Completed:** ________________________
**Environment:** Production — https://maintcue.com
**Overall Result:** PASS / FAIL

**Notes / Issues Found:**

```
[space for tester notes]
```
