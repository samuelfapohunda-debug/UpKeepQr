# Notification Templates Audit

**Generated:** February 3, 2026  
**Platform:** UpKeepQR Home Maintenance Management  
**Purpose:** Comprehensive audit of all customer-facing notification templates

---

## Table of Contents

1. [Email Templates](#email-templates)
2. [SMS Templates](#sms-templates)
3. [Template Source Files](#template-source-files)
4. [Consistency Analysis](#consistency-analysis)
5. [Standardization Recommendations](#standardization-recommendations)

---

## Email Templates

### 1. Magic Link Authentication Email

**File:** `server/lib/email.ts` (lines 1274-1362)  
**Function:** `sendMagicLinkEmail()`

| Property | Value |
|----------|-------|
| **Subject (First Time)** | Welcome to UpKeepQR! Access Your Dashboard |
| **Subject (Return)** | Access Your UpKeepQR Dashboard |
| **From** | `FROM_EMAIL` (support@upkeepqr.com) |
| **Variables** | `email`, `name`, `magicLink`, `isFirstTime` |

**Styling:**
- Primary Color: `#10b981` (green)
- Background: `#ffffff`
- Text Color: `#333333`, `#6b7280`
- Border Radius: `12px`, `8px`
- Note Box: `#f0fdf4` background with `#bbf7d0` border

---

### 2. Warranty Expiration Alert Email

**File:** `server/lib/warrantyNotifications.ts` (lines 207-349)  
**Function:** `sendWarrantyEmail()`

| Property | Value |
|----------|-------|
| **Subject (3-day)** | URGENT: Your {applianceType} Warranty Expires in 3 Days |
| **Subject (7-day)** | Your {applianceType} Warranty Expires in 7 Days |
| **From** | `FROM_EMAIL` (support@upkeepqr.com) |
| **Variables** | `household`, `appliance`, `daysUntilExpiration`, `notificationType` |

**Styling:**
- Header: Blue gradient (`#1e40af` to `#3b82f6`)
- Urgency Colors: `#dc2626` (3-day/high), `#f59e0b` (7-day/medium)
- CTA Button: `#1e40af` (blue)
- Alert Icons: Text indicators `[!]` (urgent) and `[i]` (medium) - NO EMOJI
- Border Radius: `12px`, `8px`

---

### 3. Setup Confirmation Email

**File:** `server/lib/email.ts` (lines 575-734)  
**Function:** `sendSetupConfirmationEmail()`

| Property | Value |
|----------|-------|
| **Subject** | Your Home Profile is Ready! - UpKeepQR |
| **From** | `FROM_EMAIL` (noreply@upkeepqr.com) |
| **Reply-To** | support@upkeepqr.com |
| **Variables** | `customerEmail`, `customerName`, `householdId`, `homeDetails` |

**Styling:**
- Header: Purple gradient (`#667eea` to `#764ba2`)
- Primary Color: `#667eea`
- Background: `#f4f4f4`, `#ffffff`
- Border Radius: `8px`, `6px`

---

### 4. Payment Confirmation Email

**File:** `server/lib/email.ts` (lines 139-194)  
**Function:** `sendPaymentConfirmationEmail()`

| Property | Value |
|----------|-------|
| **Subject** | Payment Confirmed - Order ${orderId} |
| **From** | `FROM_EMAIL` |
| **Variables** | `customerEmail`, `customerName`, `orderId`, `amountPaid`, `quantity` |

**Styling:**
- Header: `#A6E22E` (lime green)
- Footer: `#272822` (dark)
- Accent: `#A6E22E` border-left

---

### 5. Welcome Email with QR Codes

**File:** `server/lib/email.ts` (lines 200-455)  
**Function:** `sendWelcomeEmailWithQR()`

| Property | Value |
|----------|-------|
| **Subject** | Welcome to UpKeepQR! Your QR Magnet{s Are/Is} Ready |
| **From** | `FROM_EMAIL` |
| **Variables** | `email`, `customerName`, `orderId`, `items[]`, `quantity`, `sku` |

**Styling:**
- Header: `#A6E22E` (lime green)
- QR Code Border: `#A6E22E`
- CTA Buttons: `#A6E22E` (green), `#272822` (dark)
- Uses CID attachments for inline QR images

---

### 6. Subscription Welcome Email

**File:** `server/lib/email.ts` (lines 990-1221)  
**Function:** `sendSubscriptionWelcomeEmail()`

| Property | Value |
|----------|-------|
| **Subject** | Welcome to UpKeepQR - ${planName} Subscription Activated |
| **From** | `FROM_EMAIL` |
| **Variables** | `customerEmail`, `customerName`, `planName`, `amountPaid`, `orderId?`, `qrCodes?[]` |

**Styling:**
- Header: Green gradient (`#10b981` to `#059669`)
- Primary Color: `#10b981`
- Feature List Background: `#f0fdf4`
- Footer: `#f9fafb`

---

### 7. Contact Us Acknowledgment Email

**File:** `server/services/notifyContact.ts` (lines 40-108)  
**Function:** `sendContactAckEmail()`

| Property | Value |
|----------|-------|
| **Subject** | Thanks for reaching out to UpKeepQR (Ticket ${ticketId}) |
| **From** | UpKeepQR Support <Support@UpKeepQr.Com> |
| **Variables** | `name`, `email`, `subject`, `message`, `ticketId` |

**Styling:**
- Simple, minimal styling
- No header/footer container
- Link color: default blue

---

### 8. Admin Setup Notification Email

**File:** `server/lib/email.ts` (lines 740-985)  
**Function:** `sendAdminSetupNotification()`

| Property | Value |
|----------|-------|
| **Subject** | New Home Setup Completed - ${householdName} |
| **From** | `FROM_EMAIL` |
| **To** | `ADMIN_EMAIL` (support@upkeepqr.com) |

**Styling:**
- Header: `#10b981` (green)
- CTA Button: `#10b981`
- Professional admin layout

---

## SMS Templates

### 1. Warranty Expiration SMS

**File:** `server/lib/warrantyNotifications.ts` (lines 351-368)  
**Function:** `sendWarrantySMS()`

| Property | Value |
|----------|-------|
| **Urgency Prefix (3-day)** | URGENT: |
| **Urgency Prefix (7-day)** | (none) |

**Message Template:**
```
URGENT: UpKeepQR: Your ${appliance.applianceType} warranty expires in ${daysUntilExpiration} days. Review details & schedule repairs at ${APP_URL}/my-home

Reply STOP to opt-out
```

**Character Count:** ~150-180 characters

---

### 2. Maintenance Reminder SMS

**File:** `server/lib/sms.ts` (lines 222-236)  
**Function:** `sendReminderSMS()`

**Message Template:**
```
[House icon emoji] UpKeepQR Reminder: ${taskName} is due ${dueDateFormatted}. Complete this task to keep your home in great condition.

Reply STOP to opt-out
```

**ISSUE:** Uses house emoji - INCONSISTENT with warranty notifications that use text indicators

---

### 3. Verification Code SMS

**File:** `server/lib/sms.ts` (lines 111-145)  
**Function:** `sendVerificationCode()`

**Message Template:**
```
Your UpKeepQR verification code is: ${code}. This code expires in 10 minutes.
```

**Note:** No TCPA opt-out text (transactional message, exempt)

---

### 4. Generic SMS (Base Function)

**File:** `server/lib/sms.ts` (lines 176-216)  
**Function:** `sendSMS()`

**TCPA Compliance:**
- Auto-appends `\n\nReply STOP to opt-out` if not present
- Only supports US/Canada numbers (+1 prefix)
- Respects `smsOptIn` household preference

---

## Template Source Files

| File | Email Templates | SMS Templates |
|------|-----------------|---------------|
| `server/lib/email.ts` | 10+ templates | 0 |
| `server/lib/warrantyNotifications.ts` | 1 template | 1 template |
| `server/lib/sms.ts` | 0 | 3 templates |
| `server/services/notifyContact.ts` | 2 templates | 0 |
| `server/lib/notificationDispatcher.ts` | Routing only | Routing only |
| `server/lib/cron.ts` | Scheduling only | Scheduling only |

---

## Consistency Analysis

### Color Scheme Inconsistencies

| Template Type | Primary Color | Header Style |
|---------------|---------------|--------------|
| Magic Link | `#10b981` (green) | Text logo |
| Warranty Alert | `#1e40af` (blue) | Gradient header |
| Setup Confirmation | `#667eea` (purple) | Gradient header |
| Payment Confirmation | `#A6E22E` (lime) | Solid header |
| QR Welcome | `#A6E22E` (lime) | Solid header |
| Subscription Welcome | `#10b981` (green) | Gradient header |
| Contact Ack | None (minimal) | No header |

**Issue:** 4 different primary colors used across templates

### Header/Footer Inconsistencies

| Template | Has Header | Has Footer | Footer Style |
|----------|------------|------------|--------------|
| Magic Link | Yes | Yes | Simple text |
| Warranty Alert | Yes | Yes | Gray box |
| Setup Confirmation | Yes | Yes | Gray box |
| Payment Confirmation | Yes | Yes | Dark (#272822) |
| Contact Ack | No | No | N/A |

### SMS Emoji Usage

| Template | Uses Emoji |
|----------|------------|
| Warranty SMS | No (uses `[!]` text indicators) |
| Reminder SMS | Yes (house emoji) |
| Verification SMS | No |

**Issue:** Inconsistent emoji usage - repository policy says NO EMOJI

### TCPA Compliance

| Template | Opt-out Text |
|----------|--------------|
| Warranty SMS | Yes (auto-added by sendSMS) |
| Reminder SMS | Yes (auto-added by sendSMS) |
| Verification SMS | No (transactional, exempt) |

---

## Standardization Recommendations

### 1. Unified Color Palette

Adopt a single primary color across all templates:

```css
--primary: #10b981;          /* Green - main brand color */
--primary-dark: #059669;     /* Darker green for gradients */
--secondary: #1e40af;        /* Blue - for alerts/CTAs */
--destructive: #dc2626;      /* Red - urgent only */
--warning: #f59e0b;          /* Amber - medium urgency */
--background: #ffffff;
--muted: #f9fafb;
--border: #e5e7eb;
--text: #333333;
--text-muted: #6b7280;
```

### 2. Consistent Header Component

```html
<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
  <h1 style="color: white; margin: 0; font-size: 24px;">UpKeepQR</h1>
  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">{Subtitle}</p>
</div>
```

### 3. Consistent Footer Component

```html
<div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
  <p style="margin: 0; color: #6b7280; font-size: 12px;">
    &copy; {year} UpKeepQR. All rights reserved.<br>
    <a href="https://upkeepqr.com" style="color: #10b981;">upkeepqr.com</a>
  </p>
</div>
```

### 4. Remove Emoji from SMS (HIGH PRIORITY)

Update `sendReminderSMS()` in `server/lib/sms.ts`:

```typescript
// BEFORE (has emoji - VIOLATES POLICY)
const message = `[house emoji] UpKeepQR Reminder: ${taskName} is due ${dueDateFormatted}.`;

// AFTER (no emoji - COMPLIANT)
const message = `UpKeepQR Reminder: ${taskName} is due ${dueDateFormatted}. Complete this task to keep your home in great condition.`;
```

### 5. Standardize CTA Button Styling

```html
<a href="{url}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
  {Button Text}
</a>
```

### 6. Add Consistent Urgency Indicators

Use text indicators instead of emoji for all urgency:

| Urgency | Indicator | Color |
|---------|-----------|-------|
| High | `[!]` | `#dc2626` |
| Medium | `[i]` | `#f59e0b` |
| Low | None | Standard |

### 7. Create Shared Template Library

Consider creating a shared template library at `server/lib/emailTemplates.ts`:

```typescript
export const emailComponents = {
  header: (subtitle: string) => `...`,
  footer: () => `...`,
  ctaButton: (url: string, text: string) => `...`,
  alertBox: (type: 'urgent' | 'warning' | 'info', message: string) => `...`,
};
```

---

## Priority Actions

1. **HIGH:** Remove emoji from `sendReminderSMS()` to match warranty SMS (line 222-236 in sms.ts)
2. **MEDIUM:** Standardize primary color to `#10b981` across all templates
3. **MEDIUM:** Add consistent header/footer to Contact Ack email
4. **LOW:** Create shared template component library
5. **LOW:** Consolidate email functions into unified notification service

---

*End of Audit*
