# UpKeepQR - Replit Testing Instructions
## Complete Functionality Testing Guide Before GitHub Commit

**Document Version:** 1.0.0  
**Date:** December 10, 2024  
**Purpose:** Validate all specification requirements are working in Replit before committing to GitHub

---

## Table of Contents

1. [Pre-Testing Setup](#1-pre-testing-setup)
2. [Environment Verification](#2-environment-verification)
3. [Database Testing](#3-database-testing)
4. [Authentication Testing](#4-authentication-testing)
5. [QR Code Purchase Flow Testing](#5-qr-code-purchase-flow-testing)
6. [Setup Form Testing](#6-setup-form-testing)
7. [Email System Testing](#7-email-system-testing)
8. [SMS System Testing](#8-sms-system-testing)
9. [Security Testing](#9-security-testing)
10. [Performance Testing](#10-performance-testing)
11. [Error Handling Testing](#11-error-handling-testing)
12. [Pre-Commit Checklist](#12-pre-commit-checklist)
13. [GitHub Commit Instructions](#13-github-commit-instructions)

---

## 1. Pre-Testing Setup

### 1.1 Verify Replit Environment

**Step 1: Open Replit Console**
```bash
# Verify Node.js version (should be 20.x)
node --version

# Verify npm version
npm --version

# Verify dependencies installed
npm list --depth=0
```

**Expected Output:**
```
v20.x.x
10.x.x
upkeepqr@1.0.0
├── @stripe/stripe-js@X.X.X
├── drizzle-orm@X.X.X
├── next@14.x.x
└── ... (all dependencies listed)
```

**Step 2: Check Environment Variables**
```bash
# In Replit Secrets tab, verify all required variables exist:
# Run this command to check which are set
node -e "
const required = [
  'DATABASE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_STORAGE_BUCKET'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.log('❌ MISSING:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All environment variables set');
}
"
```

**Action if Failed:**
- Add missing environment variables in Replit Secrets
- Restart the Repl after adding secrets

---

## 2. Environment Verification

### 2.1 Database Connection Test

**Create Test Script:**
```bash
# Create test file
cat > test-database.js << 'EOF'
import { db } from './server/db/client.js';
import { sql } from 'drizzle-orm';

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connected successfully');
    
    // Test table access
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
    // Test qr_codes table
    const qrCount = await db.execute(sql`SELECT COUNT(*) FROM qr_codes`);
    console.log('✅ QR Codes in database:', qrCount.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
EOF

# Run test
node test-database.js
```

**Expected Output:**
```
🔍 Testing database connection...
✅ Database connected successfully
✅ Tables found: qr_codes, agents, homeowners, maintenance_tasks, ...
✅ QR Codes in database: X
```

**Action if Failed:**
- Check DATABASE_URL is correct
- Verify Neon Postgres database is active
- Run migrations: `npm run db:migrate`

### 2.2 Redis Connection Test

**Create Test Script:**
```bash
cat > test-redis.js << 'EOF'
import { Redis } from '@upstash/redis';

async function testRedis() {
  console.log('🔍 Testing Redis connection...');
  
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Test set/get
    await redis.set('test:connection', 'working');
    const result = await redis.get('test:connection');
    
    if (result === 'working') {
      console.log('✅ Redis connected successfully');
      await redis.del('test:connection');
      process.exit(0);
    } else {
      throw new Error('Redis set/get failed');
    }
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();
EOF

node test-redis.js
```

**Expected Output:**
```
🔍 Testing Redis connection...
✅ Redis connected successfully
```

**Action if Failed:**
- Verify UPSTASH_REDIS_REST_URL and TOKEN are correct
- Check Upstash dashboard for Redis instance status

### 2.3 Stripe Connection Test

**Create Test Script:**
```bash
cat > test-stripe.js << 'EOF'
import Stripe from 'stripe';

async function testStripe() {
  console.log('🔍 Testing Stripe connection...');
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Test API connection
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe connected successfully');
    console.log('   Available balance:', balance.available[0]?.amount || 0, balance.available[0]?.currency || 'usd');
    
    // Test webhook secret exists
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ Webhook secret configured');
    } else {
      console.log('⚠️  Webhook secret missing (required for production)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    process.exit(1);
  }
}

testStripe();
EOF

node test-stripe.js
```

**Expected Output:**
```
🔍 Testing Stripe connection...
✅ Stripe connected successfully
   Available balance: 0 usd
✅ Webhook secret configured
```

---

## 3. Database Testing

### 3.1 Test QR Code Generation

**Manual Test in Replit Shell:**
```bash
cat > test-qr-generation.js << 'EOF'
import { db } from './server/db/client.js';
import { qrCodes } from './server/db/schema.js';
import { v4 as uuidv4 } from 'uuid';

async function testQRGeneration() {
  console.log('🔍 Testing QR code generation...');
  
  try {
    const testAgentId = 'test-agent-' + Date.now();
    const testCode = uuidv4();
    
    // Insert test QR code
    const result = await db.insert(qrCodes).values({
      id: uuidv4(),
      code: testCode,
      agentId: testAgentId,
      status: 'unused',
      tier: 'starter',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ QR code created:', result[0].code);
    
    // Verify retrieval
    const retrieved = await db.query.qrCodes.findFirst({
      where: (qr, { eq }) => eq(qr.code, testCode),
    });
    
    if (retrieved) {
      console.log('✅ QR code retrieved successfully');
      console.log('   ID:', retrieved.id);
      console.log('   Code:', retrieved.code);
      console.log('   Status:', retrieved.status);
    } else {
      throw new Error('QR code retrieval failed');
    }
    
    // Cleanup
    await db.delete(qrCodes).where(eq(qrCodes.agentId, testAgentId));
    console.log('✅ Cleanup completed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ QR generation test failed:', error.message);
    process.exit(1);
  }
}

testQRGeneration();
EOF

node test-qr-generation.js
```

**Expected Output:**
```
🔍 Testing QR code generation...
✅ QR code created: 12345678-1234-4123-8123-123456789012
✅ QR code retrieved successfully
   ID: abcd1234-...
   Code: 12345678-1234-4123-8123-123456789012
   Status: unused
✅ Cleanup completed
```

### 3.2 Test Database Relationships

**Test Script:**
```bash
cat > test-relationships.js << 'EOF'
import { db } from './server/db/client.js';
import { qrCodes, homeowners, maintenanceTasks } from './server/db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

async function testRelationships() {
  console.log('🔍 Testing database relationships...');
  
  const testId = 'test-' + Date.now();
  
  try {
    // 1. Create QR code
    const qrCode = await db.insert(qrCodes).values({
      id: uuidv4(),
      code: uuidv4(),
      agentId: testId,
      status: 'unused',
      tier: 'starter',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✅ Step 1: QR code created');
    
    // 2. Create homeowner linked to QR code
    const homeowner = await db.insert(homeowners).values({
      id: uuidv4(),
      qrCodeId: qrCode[0].id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-${testId}@example.com`,
      phone: '+12025551234',
      street: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      smsConsent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✅ Step 2: Homeowner created');
    
    // 3. Create maintenance task linked to homeowner
    const task = await db.insert(maintenanceTasks).values({
      id: uuidv4(),
      homeownerId: homeowner[0].id,
      title: 'Test Task',
      description: 'Test Description',
      category: 'hvac',
      frequency: 'annual',
      priority: 'medium',
      status: 'active',
      nextReminder: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✅ Step 3: Maintenance task created');
    
    // 4. Test relationship queries
    const homeownerWithQR = await db.query.homeowners.findFirst({
      where: eq(homeowners.id, homeowner[0].id),
      with: {
        qrCode: true,
      },
    });
    
    if (homeownerWithQR?.qrCode) {
      console.log('✅ Step 4: Homeowner → QR Code relationship works');
    }
    
    const homeownerWithTasks = await db.query.homeowners.findFirst({
      where: eq(homeowners.id, homeowner[0].id),
      with: {
        maintenanceTasks: true,
      },
    });
    
    if (homeownerWithTasks?.maintenanceTasks?.length > 0) {
      console.log('✅ Step 5: Homeowner → Tasks relationship works');
    }
    
    // Cleanup
    await db.delete(maintenanceTasks).where(eq(maintenanceTasks.homeownerId, homeowner[0].id));
    await db.delete(homeowners).where(eq(homeowners.id, homeowner[0].id));
    await db.delete(qrCodes).where(eq(qrCodes.agentId, testId));
    console.log('✅ Cleanup completed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Relationship test failed:', error.message);
    // Attempt cleanup
    await db.delete(qrCodes).where(eq(qrCodes.agentId, testId));
    process.exit(1);
  }
}

testRelationships();
EOF

node test-relationships.js
```

---

## 4. Authentication Testing

### 4.1 Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000

 ✓ Ready in 2.5s
```

### 4.2 Test Session Creation (Browser)

**Manual Test Steps:**

1. **Open Replit Webview** (or copy the URL and open in browser)
   - URL should be: `https://your-repl-name.your-username.repl.co`

2. **Navigate to Login Page**
   - Go to: `/login` or `/api/auth/login`

3. **Test Valid Login**
   ```
   Email: test-agent@example.com
   Password: Test123!@#
   ```
   
   **Expected Results:**
   - ✅ Redirect to `/dashboard`
   - ✅ Session cookie set (check DevTools → Application → Cookies)
   - ✅ CSRF token cookie set
   - ✅ User information displayed on dashboard

4. **Verify Session Cookie**
   - Open Browser DevTools (F12)
   - Go to Application → Cookies
   - Find cookie named `session`
   - Verify: `HttpOnly: true`, `Secure: true` (if HTTPS), `SameSite: lax`

5. **Test Invalid Login**
   ```
   Email: test@example.com
   Password: WrongPassword
   ```
   
   **Expected Results:**
   - ✅ Error message displayed
   - ✅ No redirect
   - ✅ No session cookie set
   - ✅ Rate limit counter incremented

### 4.3 Test Session Verification (API)

**Using Replit Shell:**
```bash
# Get session token from browser DevTools → Application → Cookies → session
# Replace YOUR_SESSION_TOKEN with actual value

curl -X GET "http://localhost:3000/api/protected-endpoint" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "userId": "...",
    "email": "...",
    "role": "agent"
  }
}
```

### 4.4 Test Session Expiration

**Manual Test:**
1. Log in successfully
2. Note the session expiration time (24 hours from login)
3. Modify the JWT token (change 1 character)
4. Try to access protected route

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ Redirect to login page
- ✅ Error message: "Session expired or invalid"

---

## 5. QR Code Purchase Flow Testing

### 5.1 Test Stripe Checkout Creation

**Browser Test:**

1. **Navigate to Purchase Page**
   ```
   URL: http://localhost:3000/purchase
   ```

2. **Select Tier**
   - Click on "Starter" tier (10 QR codes - $49)
   - Verify tier selection highlights

3. **Enter Agent Email**
   ```
   Email: test-purchase@example.com
   ```

4. **Click Purchase Button**
   
   **Expected Results:**
   - ✅ Loading spinner appears
   - ✅ Redirects to Stripe Checkout
   - ✅ Stripe checkout URL contains `checkout.stripe.com`
   - ✅ Checkout displays correct amount ($49.00)
   - ✅ Checkout displays correct description (10 QR codes)

### 5.2 Test Stripe Test Payment

**In Stripe Checkout:**

1. **Use Test Card Details**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   Email: test-purchase@example.com
   ```

2. **Submit Payment**

   **Expected Results:**
   - ✅ Payment processes successfully
   - ✅ Redirects to success page
   - ✅ Success page shows "Payment Successful"
   - ✅ QR codes are displayed (10 codes)
   - ✅ Each QR code has:
     - Valid UUID format
     - QR code image
     - Download button

### 5.3 Verify Database After Purchase

**Replit Shell:**
```bash
cat > verify-purchase.js << 'EOF'
import { db } from './server/db/client.js';
import { qrCodes } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function verifyPurchase() {
  const agentEmail = 'test-purchase@example.com';
  
  const codes = await db.query.qrCodes.findMany({
    where: eq(qrCodes.agentEmail, agentEmail),
    orderBy: (qr, { desc }) => [desc(qr.createdAt)],
    limit: 10,
  });
  
  console.log('QR Codes found:', codes.length);
  codes.forEach((code, i) => {
    console.log(`${i + 1}. ${code.code} - Status: ${code.status} - Tier: ${code.tier}`);
  });
  
  if (codes.length === 10) {
    console.log('✅ All 10 QR codes created');
  } else {
    console.log('❌ Expected 10 codes, found', codes.length);
  }
  
  process.exit(0);
}

verifyPurchase();
EOF

node verify-purchase.js
```

**Expected Output:**
```
QR Codes found: 10
1. 12345678-1234-4123-8123-123456789012 - Status: unused - Tier: starter
2. 23456789-2345-4234-8234-234567890123 - Status: unused - Tier: starter
...
10. ...
✅ All 10 QR codes created
```

### 5.4 Test Payment Failure Handling

**Browser Test:**

1. Navigate to purchase page
2. Select tier and enter email
3. Click Purchase
4. In Stripe Checkout, use **declined card**:
   ```
   Card Number: 4000 0000 0000 0002
   Expiry: 12/34
   CVC: 123
   ```

**Expected Results:**
- ✅ Card is declined
- ✅ Error message displayed in Stripe Checkout
- ✅ No QR codes created in database
- ✅ No redirect to success page
- ✅ User can retry with different card

---

## 6. Setup Form Testing

### 6.1 Test QR Code Validation

**Get a Valid QR Code:**
```bash
# From previous purchase test, copy one QR code UUID
# Or query database:
cat > get-test-qr.js << 'EOF'
import { db } from './server/db/client.js';
import { qrCodes } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function getTestQR() {
  const code = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.status, 'unused'),
  });
  
  if (code) {
    console.log('Test QR Code:', code.code);
    console.log('Copy this for setup form testing');
  } else {
    console.log('No unused QR codes available');
    console.log('Run purchase flow first');
  }
  
  process.exit(0);
}

getTestQR();
EOF

node get-test-qr.js
```

### 6.2 Test Setup Form Submission (Browser)

**Manual Test:**

1. **Navigate to Setup Page**
   ```
   URL: http://localhost:3000/setup?qr=YOUR_QR_CODE
   ```
   OR (for second access method)
   ```
   URL: http://localhost:3000/setup
   Then enter QR code in form field
   ```

2. **Fill Out Setup Form**
   ```
   First Name: John
   Last Name: Doe
   Email: john.doe@example.com
   Phone: +12025551234
   Street: 123 Main Street
   City: Springfield
   State: IL
   Zip: 62701
   ☑ SMS Consent: Checked
   Agent Email: test-purchase@example.com
   ```

3. **Submit Form**

   **Expected Results:**
   - ✅ Form validates all fields
   - ✅ Loading spinner appears
   - ✅ Success message displays
   - ✅ Redirect to homeowner dashboard
   - ✅ Welcome email sent (check email)
   - ✅ Agent notification email sent

### 6.3 Verify Setup in Database

```bash
cat > verify-setup.js << 'EOF'
import { db } from './server/db/client.js';
import { homeowners, qrCodes } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function verifySetup() {
  const email = 'john.doe@example.com';
  
  // Check homeowner record
  const homeowner = await db.query.homeowners.findFirst({
    where: eq(homeowners.email, email),
    with: {
      qrCode: true,
    },
  });
  
  if (!homeowner) {
    console.log('❌ Homeowner record not found');
    process.exit(1);
  }
  
  console.log('✅ Homeowner created:');
  console.log('   Name:', homeowner.firstName, homeowner.lastName);
  console.log('   Email:', homeowner.email);
  console.log('   Phone:', homeowner.phone);
  console.log('   Address:', homeowner.street, homeowner.city, homeowner.state);
  console.log('   SMS Consent:', homeowner.smsConsent);
  
  // Check QR code status
  if (homeowner.qrCode?.status === 'active') {
    console.log('✅ QR code activated');
  } else {
    console.log('❌ QR code not activated. Status:', homeowner.qrCode?.status);
  }
  
  process.exit(0);
}

verifySetup();
EOF

node verify-setup.js
```

**Expected Output:**
```
✅ Homeowner created:
   Name: John Doe
   Email: john.doe@example.com
   Phone: +12025551234
   Address: 123 Main Street Springfield IL
   SMS Consent: true
✅ QR code activated
```

### 6.4 Test Setup Form Validation

**Browser Tests:**

**Test 1: Invalid Phone Number**
```
Phone: 555-1234 (missing country code)
```
**Expected:** ✅ Error message: "Must be valid US phone number in format +1XXXXXXXXXX"

**Test 2: Invalid Email**
```
Email: not-an-email
```
**Expected:** ✅ Error message: "Invalid email address"

**Test 3: Disposable Email**
```
Email: test@tempmail.com
```
**Expected:** ✅ Error message: "Disposable email addresses not allowed"

**Test 4: Missing SMS Consent**
```
Uncheck SMS consent checkbox
```
**Expected:** ✅ Form submission blocked, error message displayed

**Test 5: Invalid State Code**
```
State: Illinois (should be IL)
```
**Expected:** ✅ Error message: "State must be 2-letter code"

**Test 6: Used QR Code**
```
Use a QR code that's already been activated
```
**Expected:** ✅ Error message: "This QR code has already been activated"

---

## 7. Email System Testing

### 7.1 Test Welcome Email

**After successful setup form submission:**

1. **Check Email Inbox** (john.doe@example.com)
   
   **Expected Email:**
   ```
   From: UpKeepQR <noreply@upkeepqr.com>
   To: john.doe@example.com
   Subject: Welcome to UpKeepQR - Your Home Maintenance Companion
   
   Content should include:
   ✅ Personalized greeting with first name
   ✅ QR code image (inline display)
   ✅ Link to homeowner dashboard
   ✅ Brief explanation of features
   ✅ Contact information
   ```

2. **Verify Email Deliverability**
   - Check Resend dashboard for delivery status
   - Verify no bounce or complaint

### 7.2 Test Agent Notification Email

**Check Agent Email Inbox** (test-purchase@example.com)

**Expected Email:**
```
From: UpKeepQR <noreply@upkeepqr.com>
To: test-purchase@example.com
Subject: New Homeowner Registered - John Doe

Content should include:
✅ Homeowner name
✅ Property address
✅ Registration date
✅ QR code ID
✅ Link to agent dashboard
```

### 7.3 Test Email Failure Handling

**Replit Shell Test:**
```bash
cat > test-email-failure.js << 'EOF'
import { sendWelcomeEmail } from './server/lib/email/welcome-email.js';

async function testEmailFailure() {
  try {
    // Test with invalid email
    await sendWelcomeEmail({
      to: 'invalid-email',
      homeownerName: 'Test User',
      qrCode: '12345678-1234-4123-8123-123456789012',
    });
    
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Email failure handled correctly');
    console.log('   Error:', error.message);
  }
  
  process.exit(0);
}

testEmailFailure();
EOF

node test-email-failure.js
```

**Expected Output:**
```
✅ Email failure handled correctly
   Error: Invalid email address
```

---

## 8. SMS System Testing

### 8.1 Test SMS Sending

**Replit Shell:**
```bash
cat > test-sms.js << 'EOF'
import { sendSMS } from './server/lib/sms/twilio-client.js';

async function testSMS() {
  try {
    // Use YOUR phone number for testing
    const result = await sendSMS({
      to: '+1YOUR_PHONE_NUMBER',
      body: 'Test SMS from UpKeepQR - Maintenance reminder test'
    });
    
    console.log('✅ SMS sent successfully');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Check your phone for the message');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
    process.exit(1);
  }
}

testSMS();
EOF

node test-sms.js
```

**Expected Output:**
```
✅ SMS sent successfully
   Message SID: SM...
   Status: queued
   Check your phone for the message
```

**Verify on Phone:**
- ✅ SMS received within 10 seconds
- ✅ Message text is correct
- ✅ Sender shows Twilio phone number

### 8.2 Test SMS Consent Validation

**Test without consent:**
```bash
cat > test-sms-consent.js << 'EOF'
import { db } from './server/db/client.js';
import { homeowners } from './server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sendMaintenanceReminder } from './server/lib/sms/reminders.js';

async function testSMSConsent() {
  // Get homeowner without SMS consent
  const homeowner = await db.query.homeowners.findFirst({
    where: eq(homeowners.smsConsent, false),
  });
  
  if (!homeowner) {
    console.log('⚠️  No homeowner without SMS consent found');
    console.log('   Test skipped');
    process.exit(0);
  }
  
  try {
    await sendMaintenanceReminder({
      homeownerId: homeowner.id,
      message: 'Test reminder',
    });
    
    console.log('❌ Should have blocked SMS without consent');
  } catch (error) {
    console.log('✅ SMS blocked correctly without consent');
    console.log('   Error:', error.message);
  }
  
  process.exit(0);
}

testSMSConsent();
EOF

node test-sms-consent.js
```

**Expected Output:**
```
✅ SMS blocked correctly without consent
   Error: SMS consent required
```

---

## 9. Security Testing

### 9.1 Test Rate Limiting

**Using curl in Replit Shell:**
```bash
# Test login rate limit (5 attempts in 15 minutes)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST "http://localhost:3000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword"
    }'
  echo ""
done
```

**Expected Output:**
```
Attempt 1: {"error": "Invalid credentials"}
Attempt 2: {"error": "Invalid credentials"}
Attempt 3: {"error": "Invalid credentials"}
Attempt 4: {"error": "Invalid credentials"}
Attempt 5: {"error": "Invalid credentials"}
Attempt 6: {"error": "Rate limit exceeded. Try again at 2024-12-10T15:30:00Z"}
```

**Verify Rate Limit Headers:**
```bash
curl -i -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}'
```

**Expected Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2024-12-10T15:15:00Z
```

### 9.2 Test CSRF Protection

**Browser DevTools Console:**
```javascript
// Get CSRF token
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1];

console.log('CSRF Token:', csrfToken);

// Test with valid CSRF token
fetch('/api/protected-action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ data: 'test' })
})
.then(r => r.json())
.then(console.log);
// Expected: Success response

// Test without CSRF token
fetch('/api/protected-action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: 'test' })
})
.then(r => r.json())
.then(console.log);
// Expected: 403 Forbidden
```

### 9.3 Test SQL Injection Prevention

**Browser Form Test:**
```
Enter in any text field:
'; DROP TABLE users; --
```

**Expected Results:**
- ✅ Input is sanitized
- ✅ No SQL commands executed
- ✅ Error message or form validation prevents submission
- ✅ Database remains intact

**Verify Database:**
```bash
cat > verify-tables.js << 'EOF'
import { db } from './server/db/client.js';
import { sql } from 'drizzle-orm';

async function verifyTables() {
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  const tableNames = tables.rows.map(r => r.table_name);
  
  console.log('Database tables:', tableNames.join(', '));
  
  const requiredTables = ['qr_codes', 'homeowners', 'agents', 'maintenance_tasks'];
  const allPresent = requiredTables.every(t => tableNames.includes(t));
  
  if (allPresent) {
    console.log('✅ All required tables present - SQL injection prevented');
  } else {
    console.log('❌ Some tables missing');
  }
  
  process.exit(0);
}

verifyTables();
EOF

node verify-tables.js
```

### 9.4 Test XSS Prevention

**Browser Test:**
```
Enter in any text field:
<script>alert('XSS')</script>
```

**Expected Results:**
- ✅ Script tags are escaped
- ✅ No alert popup appears
- ✅ Content displays as plain text: `<script>alert('XSS')</script>`
- ✅ View page source shows escaped HTML: `&lt;script&gt;`

---

## 10. Performance Testing

### 10.1 Test Page Load Times

**Browser DevTools Network Tab:**

1. Open DevTools → Network tab
2. Hard refresh page (Ctrl+Shift+R)
3. Check "DOMContentLoaded" and "Load" times

**Expected Performance:**
```
/ (Home): < 1.5 seconds
/dashboard: < 2 seconds
/setup: < 1.5 seconds
/purchase: < 1.5 seconds
```

### 10.2 Test API Response Times

**Replit Shell:**
```bash
cat > test-performance.js << 'EOF'
async function testAPIPerformance() {
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3000/api/health' },
    { name: 'QR Validation', url: 'http://localhost:3000/api/validate-qr?code=test' },
  ];
  
  for (const endpoint of endpoints) {
    const start = Date.now();
    
    try {
      const response = await fetch(endpoint.url);
      const duration = Date.now() - start;
      
      console.log(`${endpoint.name}:`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Status: ${response.status}`);
      
      if (duration < 200) {
        console.log(`  ✅ Within target (< 200ms)`);
      } else {
        console.log(`  ⚠️  Slower than target (${duration}ms > 200ms)`);
      }
      console.log('');
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }
}

testAPIPerformance();
EOF

node test-performance.js
```

**Expected Output:**
```
Health Check:
  Duration: 45ms
  Status: 200
  ✅ Within target (< 200ms)

QR Validation:
  Duration: 120ms
  Status: 200
  ✅ Within target (< 200ms)
```

### 10.3 Test Database Query Performance

```bash
cat > test-query-performance.js << 'EOF'
import { db } from './server/db/client.js';
import { qrCodes } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function testQueryPerformance() {
  const iterations = 10;
  const times = [];
  
  console.log('Running 10 test queries...');
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    await db.query.qrCodes.findMany({
      where: eq(qrCodes.status, 'unused'),
      limit: 50,
    });
    
    const duration = Date.now() - start;
    times.push(duration);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  console.log('Results:');
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min}ms`);
  console.log(`  Max: ${max}ms`);
  
  if (avg < 100) {
    console.log('  ✅ Performance within target (< 100ms p95)');
  } else {
    console.log('  ⚠️  Performance slower than target');
  }
  
  process.exit(0);
}

testQueryPerformance();
EOF

node test-query-performance.js
```

**Expected Output:**
```
Running 10 test queries...
Results:
  Average: 42.50ms
  Min: 38ms
  Max: 65ms
  ✅ Performance within target (< 100ms p95)
```

---

## 11. Error Handling Testing

### 11.1 Test 404 Error Pages

**Browser Test:**
```
Navigate to: http://localhost:3000/nonexistent-page
```

**Expected Results:**
- ✅ Custom 404 page displays
- ✅ Error message is user-friendly
- ✅ Navigation links work
- ✅ Status code is 404

### 11.2 Test 500 Error Handling

**Force a server error:**
```bash
cat > test-error-handling.js << 'EOF'
// Temporarily modify an API route to throw error
import fs from 'fs';

const routePath = './app/api/test-error/route.ts';

const errorRoute = `
export async function GET() {
  throw new Error('Intentional test error');
}
`;

fs.writeFileSync(routePath, errorRoute);

console.log('✅ Error route created: /api/test-error');
console.log('Test by visiting: http://localhost:3000/api/test-error');
console.log('Expected: 500 error with error message in JSON');
console.log('');
console.log('Delete the route when done testing:');
console.log('rm ./app/api/test-error/route.ts');

process.exit(0);
EOF

node test-error-handling.js
```

**Browser Test:**
```
Navigate to: http://localhost:3000/api/test-error
```

**Expected Response:**
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_SERVER_ERROR"
  }
}
```

**Cleanup:**
```bash
rm -rf ./app/api/test-error
```

### 11.3 Test Database Connection Failure

**Replit Shell:**
```bash
# Temporarily set invalid DATABASE_URL
cat > test-db-failure.js << 'EOF'
process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid/invalid';

import('./server/db/client.js')
  .then(module => module.checkDatabaseHealth())
  .then(healthy => {
    if (healthy) {
      console.log('❌ Should have failed with invalid connection');
    } else {
      console.log('✅ Database failure handled correctly');
    }
    process.exit(0);
  })
  .catch(error => {
    console.log('✅ Database error caught:');
    console.log('   ', error.message);
    process.exit(0);
  });
EOF

node test-db-failure.js
```

---

## 12. Pre-Commit Checklist

### 12.1 Code Quality Checks

**Run all checks:**
```bash
# 1. TypeScript compilation
echo "1/5 Checking TypeScript..."
npm run type-check

# 2. Linting
echo "2/5 Running linter..."
npm run lint

# 3. Unit tests (if configured)
echo "3/5 Running tests..."
npm run test || echo "⚠️  No tests configured yet"

# 4. Build check
echo "4/5 Testing production build..."
npm run build

# 5. Dependencies audit
echo "5/5 Checking dependencies..."
npm audit --production
```

**Expected Output:**
```
1/5 Checking TypeScript...
✓ No type errors found

2/5 Running linter...
✓ No linting errors found

3/5 Running tests...
✓ All tests passed (or warning if not configured)

4/5 Testing production build...
✓ Build completed successfully

5/5 Checking dependencies...
found 0 vulnerabilities
```

### 12.2 Environment Variables Check

**Verify all required variables:**
```bash
cat > check-env.js << 'EOF'
const required = [
  'DATABASE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length === 0) {
  console.log('✅ All required environment variables are set');
  process.exit(0);
} else {
  console.log('❌ Missing environment variables:');
  missing.forEach(key => console.log('   -', key));
  console.log('\nAdd these to Replit Secrets before committing');
  process.exit(1);
}
EOF

node check-env.js
```

### 12.3 Database Schema Verification

**Check migrations are applied:**
```bash
cat > check-schema.js << 'EOF'
import { db } from './server/db/client.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  const requiredTables = [
    'qr_codes',
    'agents', 
    'homeowners',
    'maintenance_tasks',
  ];
  
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  const tableNames = tables.rows.map(r => r.table_name);
  const missing = requiredTables.filter(t => !tableNames.includes(t));
  
  if (missing.length === 0) {
    console.log('✅ All required tables exist');
    
    // Check for any pending migrations
    const migrations = await db.execute(sql`
      SELECT * FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    console.log('   Last migration:', migrations.rows[0]?.hash || 'None');
    process.exit(0);
  } else {
    console.log('❌ Missing tables:', missing.join(', '));
    console.log('   Run: npm run db:migrate');
    process.exit(1);
  }
}

checkSchema();
EOF

node check-schema.js
```

### 12.4 Security Checklist

**Manual Review:**
- [ ] No API keys or secrets in code
- [ ] All secrets in Replit Secrets (not .env file)
- [ ] No console.log statements with sensitive data
- [ ] All user inputs validated
- [ ] SQL injection prevention in place
- [ ] XSS prevention in place
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Session tokens are HttpOnly and Secure

### 12.5 Functionality Checklist

**Verify all features work:**
- [ ] QR code purchase flow completes
- [ ] Stripe payment processes
- [ ] Setup form validates and saves
- [ ] Welcome email sends
- [ ] Agent notification email sends
- [ ] SMS test successful
- [ ] Dashboard loads correctly
- [ ] Authentication works
- [ ] Session persists across requests
- [ ] Rate limiting triggers at limits
- [ ] Error pages display correctly

---

## 13. GitHub Commit Instructions

### 13.1 Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized:
git init
git branch -M main
```

### 13.2 Configure Git

```bash
# Set your name and email
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 13.3 Create .gitignore

**Verify .gitignore exists and contains:**
```bash
cat .gitignore
```

**Expected contents:**
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.log

# Next.js
.next/
out/
build/
dist/

# Environment files (CRITICAL - never commit these)
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Replit
.replit
replit.nix
```

**If missing, create it:**
```bash
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
.env.production
.DS_Store
*.log
.replit
replit.nix
EOF
```

### 13.4 Review Changes

```bash
# See what will be committed
git status

# See specific changes
git diff
```

### 13.5 Stage Files for Commit

```bash
# Stage all files
git add .

# Or stage specific files
git add app/
git add server/
git add package.json
git add package-lock.json

# Verify what's staged
git status
```

### 13.6 Create Commit

```bash
# Create meaningful commit message
git commit -m "feat: Complete UpKeepQR MVP implementation

- Implement QR code purchase flow with Stripe integration
- Add setup form with dual access methods
- Configure email system with Resend
- Set up SMS reminders with Twilio
- Implement session authentication with JWT
- Add rate limiting and security measures
- Configure database with Drizzle ORM
- Set up Redis caching layer

Tested in Replit:
- All purchase flows working
- Setup form validation complete
- Email delivery verified
- SMS sending functional
- Security measures in place
- Performance within targets"
```

### 13.7 Connect to GitHub Repository

**If new repository:**
```bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/upkeepqr.git

# Verify remote
git remote -v
```

**If existing repository:**
```bash
# Check existing remote
git remote -v

# Update if needed
git remote set-url origin https://github.com/YOUR_USERNAME/upkeepqr.git
```

### 13.8 Push to GitHub

```bash
# First push (creates main branch on GitHub)
git push -u origin main

# Subsequent pushes
git push
```

**If you get authentication error:**
```bash
# Use Personal Access Token (PAT)
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate new token with 'repo' scope
# 3. Use token as password when prompted
```

### 13.9 Verify Push on GitHub

1. Go to your GitHub repository
2. Verify files are present
3. Check commit message is correct
4. Verify .env files are NOT in repository (check .gitignore worked)

### 13.10 Create GitHub Actions (Optional)

**Create workflow file:**
```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run lint
    - run: npm run type-check
    - run: npm run build
EOF

# Commit and push workflow
git add .github/workflows/ci.yml
git commit -m "ci: Add GitHub Actions workflow"
git push
```

---

## 14. Post-Commit Verification

### 14.1 Clone Fresh Copy

**Test in new Replit or local machine:**
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/upkeepqr.git
cd upkeepqr

# Install dependencies
npm install

# Set up environment variables
# (Copy from Replit Secrets to .env.local)

# Run migrations
npm run db:migrate

# Start server
npm run dev

# Verify application works
```

### 14.2 Documentation Check

**Ensure these files exist in repository:**
- [ ] README.md (with setup instructions)
- [ ] package.json (with correct scripts)
- [ ] .gitignore (with proper exclusions)
- [ ] Main specification document
- [ ] Technical addendum
- [ ] This testing guide

### 14.3 Create README.md

**If missing:**
```bash
cat > README.md << 'EOF'
# UpKeepQR

Home maintenance management system with QR-powered property tracking.

## Features

- QR code purchase via Stripe
- Property setup with dual access
- Email notifications (Resend)
- SMS reminders (Twilio)
- Maintenance scheduling
- Agent and homeowner dashboards

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run migrations: `npm run db:migrate`
5. Start development server: `npm run dev`

## Environment Variables

See `.env.example` for required variables:
- Database (Neon Postgres)
- Redis (Upstash)
- Stripe
- Resend
- Twilio
- Firebase

## Testing

Run testing suite: `npm run test`
See `TESTING.md` for detailed testing procedures.

## Deployment

Deploy to Vercel: `vercel --prod`

## Documentation

- `SPECIFICATION.md` - Complete technical specification
- `ADDENDUM.md` - Enhanced implementation details
- `TESTING.md` - Testing procedures

## License

Proprietary - All rights reserved
EOF

git add README.md
git commit -m "docs: Add comprehensive README"
git push
```

---

## Summary Checklist

**Before committing to GitHub, ensure ALL items are checked:**

### Pre-Commit Tests
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] Stripe connection verified
- [ ] QR code generation working
- [ ] Purchase flow completes successfully
- [ ] Setup form validates and saves
- [ ] Welcome email sends
- [ ] Agent notification email sends
- [ ] SMS test successful
- [ ] Authentication working
- [ ] Session persistence verified
- [ ] Rate limiting triggers correctly
- [ ] CSRF protection working
- [ ] XSS prevention verified
- [ ] SQL injection prevented
- [ ] Error pages display correctly
- [ ] Performance within targets

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] Production build succeeds
- [ ] No dependency vulnerabilities
- [ ] All environment variables set
- [ ] Database schema up to date

### Security
- [ ] No secrets in code
- [ ] .gitignore configured correctly
- [ ] .env files not committed
- [ ] API keys in Replit Secrets only
- [ ] Security measures tested

### Documentation
- [ ] README.md exists
- [ ] Specification documented
- [ ] Testing guide available
- [ ] Setup instructions clear

### Git
- [ ] Git initialized
- [ ] .gitignore correct
- [ ] Meaningful commit message
- [ ] Remote configured
- [ ] Pushed successfully
- [ ] Verified on GitHub

---

## Troubleshooting

### Common Issues

**Issue: npm install fails**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue: Database connection fails**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:5432/database

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Issue: Git push rejected**
```bash
# Pull latest changes first
git pull origin main --rebase

# Resolve conflicts if any
# Then push again
git push
```

**Issue: Environment variables not loading**
```bash
# Restart Repl
# Or manually load
export $(cat .env | xargs)
```

**Issue: Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review specification documents
3. Check Replit console logs
4. Verify all environment variables are set
5. Contact development team

---

**End of Testing Instructions**

**Last Updated:** December 10, 2024  
**Version:** 1.0.0
