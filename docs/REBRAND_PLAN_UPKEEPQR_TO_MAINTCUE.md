# Comprehensive Rebrand Implementation Plan
## UpKeepQR to MaintCue

**Version:** 1.1  
**Created:** February 5, 2026  
**Updated:** February 5, 2026  
**Status:** Phase 1 COMPLETE - Code rebrand finished, awaiting deployment

---

## Table of Contents

1. [Pre-Migration Preparation](#1-pre-migration-preparation)
2. [Code Changes Inventory](#2-code-changes-inventory)
3. [Phased Implementation Plan](#3-phased-implementation-plan)
4. [Technical Implementation Details](#4-technical-implementation-details)
5. [Rollback Plan](#5-rollback-plan)
6. [Testing Checklist](#6-testing-checklist)
7. [Communication Templates](#7-communication-templates)
8. [Estimated Timeline & Effort](#8-estimated-timeline--effort)
9. [Risk Assessment](#9-risk-assessment)
10. [Success Metrics](#10-success-metrics)

---

## 1. Pre-Migration Preparation

### A. Domain Setup

| Task | Status | Notes |
|------|--------|-------|
| Verify maintcue.com DNS settings | [ ] | Check current registrar |
| Configure nameservers | [ ] | Point to hosting provider |
| Set up SSL certificate | [ ] | Let's Encrypt via Render |
| Test domain accessibility | [ ] | Verify https://maintcue.com loads |
| Configure email forwarding | [ ] | support@maintcue.com |

### B. Backup Strategy

| Task | Status | Notes |
|------|--------|-------|
| Full database backup | [ ] | `pg_dump` from Neon console |
| Code repository backup | [ ] | Git tag: `pre-rebrand-v1.0` |
| Environment variables backup | [ ] | Export from Replit/Render |
| Document current configuration | [ ] | Screenshot all settings |
| Create rollback plan | [ ] | See Section 5 |

### C. Communication Plan

| Task | Status | Notes |
|------|--------|-------|
| Draft customer announcement email | [ ] | See Section 7 |
| Prepare social media posts | [ ] | See Section 7 |
| Update support documentation | [ ] | After code changes |
| Plan timing (low-traffic period) | [ ] | Recommend weekend evening |

---

## 2. Code Changes Inventory

### A. Brand Name Changes (UpKeepQR to MaintCue)

**Total Occurrences Found: ~366 (excluding node_modules and attached_assets)**

#### Email Templates (Priority: HIGH)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `server/lib/email.ts` | Multiple | Headers, footers, subject lines |
| `server/lib/warrantyNotifications.ts` | Multiple | Email headers, footers, SMS sender name |
| `server/lib/magicLink.ts` | Multiple | Magic link emails |
| `server/lib/sms.ts` | Multiple | SMS message branding |
| `server/lib/notificationDispatcher.ts` | Multiple | Notification templates |
| `server/lib/qr.ts` | Multiple | QR email templates |
| `server/lib/calendarSync.ts` | Multiple | Calendar event descriptions |
| `server/services/notifyContact.ts` | Multiple | Contact form emails |
| `server/routes/webhooks.ts` | Multiple | Webhook emails |
| `server/src/routes/auth.ts` | Multiple | Auth emails |
| `server/src/routes/contact.ts` | Multiple | Contact route emails |

#### Frontend Components (Priority: HIGH)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `client/index.html` | 2+ | Title, meta tags, OG tags |
| `client/src/components/Navigation.tsx` | 1+ | Logo/brand text |
| `client/src/components/Footer.tsx` | 2+ | Brand name, copyright |
| `client/src/contexts/AuthContext.tsx` | 1+ | Any brand references |

#### Frontend Pages (Priority: HIGH)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `client/src/pages/Home.tsx` | Multiple | Hero, features, branding |
| `client/src/pages/Contact.tsx` | Multiple | Page content |
| `client/src/pages/Login.tsx` | Multiple | Auth page branding |
| `client/src/pages/SetupForm.tsx` | Multiple | Setup flow |
| `client/src/pages/SetupSuccess.tsx` | Multiple | Success messages |
| `client/src/pages/RegistrationSuccess.tsx` | Multiple | Success messages |
| `client/src/pages/PaymentSuccess.tsx` | Multiple | Payment confirmation |
| `client/src/pages/Onboarding.tsx` | Multiple | Onboarding flow |
| `client/src/pages/CustomerDashboard.tsx` | Multiple | Dashboard header |
| `client/src/pages/AuthError.tsx` | Multiple | Error messages |

#### Legal Pages (Priority: MEDIUM)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `client/src/pages/legal/PrivacyPolicy.tsx` | 50+ | Full document rewrite |
| `client/src/pages/legal/TermsOfService.tsx` | 50+ | Full document rewrite |
| `client/src/pages/legal/CookiePolicy.tsx` | 20+ | Full document rewrite |

#### Configuration & Documentation (Priority: LOW)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `replit.md` | Multiple | Project description |
| `RENDER_BUILD_INSTRUCTIONS.md` | Multiple | Deployment docs |
| `TESTING_GUIDE.md` | Multiple | Testing docs |
| `docs/*.md` | Multiple | All documentation |

#### Backend Files (Priority: MEDIUM)

| File | Occurrences | Changes Needed |
|------|-------------|----------------|
| `server/index.ts` | 1+ | Startup logs |
| `server/storage.ts` | 1+ | Comments/logs |
| `server/middleware/sessionAuth.ts` | 1+ | Comments |
| `server/src/routes/*.ts` | Multiple | Various routes |

### B. Domain Name Changes (upkeepqr.com to maintcue.com)

**Files containing upkeepqr.com references:**

| File | Type of Reference |
|------|-------------------|
| `server/lib/email.ts` | Email links, support email |
| `server/lib/warrantyNotifications.ts` | Dashboard links |
| `server/lib/magicLink.ts` | Magic link URLs |
| `server/lib/notificationDispatcher.ts` | Notification links |
| `server/lib/qr.ts` | QR code URLs |
| `server/services/notifyContact.ts` | Support email, links |
| `server/routes/webhooks.ts` | Webhook URLs |
| `server/src/routes/contact.ts` | Support links |
| `server/src/routes/calendar.ts` | Calendar links |
| `server/src/routes/proRequests.ts` | Pro request links |
| `server/src/routes/public.ts` | Public links |
| `client/src/pages/legal/*.tsx` | Legal page links |
| `client/src/pages/SetupSuccess.tsx` | Dashboard links |

### C. Logo/Branding Assets

| Asset Type | Current Location | Action Needed |
|------------|------------------|---------------|
| Favicon | `client/public/` | Replace with MaintCue |
| Logo files | Not found in codebase | Create new assets |
| Email header images | Inline HTML (text-based) | Update text |
| Social media images | External | Create new assets |

---

## 3. Phased Implementation Plan

### PHASE 1: Code Updates (DO NOT DEPLOY YET)
**Priority:** Low risk, no customer impact  
**Timeline:** Day 1 (4-6 hours)

#### Email Templates
- [ ] Update all email subject lines
- [ ] Update email headers (brand name in green header)
- [ ] Update email footers (copyright, links)
- [ ] Update support email addresses (support@upkeepqr.com to support@maintcue.com)
- [ ] Update dashboard/website links
- [ ] Update SMS message branding

#### Frontend Components
- [ ] Update Navigation.tsx (logo/brand text)
- [ ] Update Footer.tsx (brand name, copyright, links)
- [ ] Update all page titles

#### Frontend Pages
- [ ] Update Home.tsx (hero, features, branding)
- [ ] Update Login.tsx
- [ ] Update all setup/onboarding pages
- [ ] Update CustomerDashboard.tsx
- [ ] Update legal pages (Privacy, Terms, Cookie)

#### Meta Tags and SEO
- [ ] Update client/index.html
  - `<title>` tag
  - `<meta name="description">`
  - Open Graph tags (`og:title`, `og:site_name`, `og:url`)
  - Twitter card tags

#### Documentation
- [ ] Update replit.md
- [ ] Update README.md
- [ ] Update all docs/*.md files

#### Local Testing
- [ ] Run development server
- [ ] Search all pages for "UpKeepQR" (should find 0)
- [ ] Verify no broken links
- [ ] Test email template rendering (use test endpoints)

---

### PHASE 2: Domain Configuration
**Priority:** Critical infrastructure  
**Timeline:** Day 2-3 (2-4 hours)

#### DNS Configuration (maintcue.com)
- [ ] Add A record pointing to Render IP
- [ ] Add CNAME record for www subdomain
- [ ] Configure MX records for email (if using custom email)
- [ ] Set up SPF record for SendGrid
- [ ] Set up DKIM record for SendGrid
- [ ] Set TTL appropriately (300 seconds initially)

#### Render Deployment Settings
- [ ] Add maintcue.com as custom domain
- [ ] Add www.maintcue.com as custom domain
- [ ] Enable automatic HTTPS
- [ ] Keep upkeepqr.com active (parallel operation)

#### Environment Variables Update
```
FRONTEND_URL=https://maintcue.com
# Update any other domain-specific variables
```

#### SendGrid Configuration
- [ ] Verify sender domain: maintcue.com
- [ ] Update sender email: support@maintcue.com
- [ ] Add DNS records for domain authentication

#### Twilio Configuration
- [ ] Update any callback URLs (if applicable)
- [ ] Update webhook URLs (if applicable)

#### Testing
- [ ] Verify https://maintcue.com loads
- [ ] Verify SSL certificate works
- [ ] Test all pages load correctly
- [ ] Check API endpoints respond
- [ ] Send test emails (verify deliverability)
- [ ] Send test SMS

---

### PHASE 3: Soft Launch (Both Domains Active)
**Priority:** Gradual transition  
**Timeline:** Day 4-7 (1 week monitoring)

#### Deploy Code Updates
- [ ] Push code with all brand changes
- [ ] Both domains point to same application
- [ ] Monitor error logs closely

#### Parallel Operation
- [ ] upkeepqr.com continues working
- [ ] maintcue.com is fully functional
- [ ] Same database, same app

#### Update External Services
- [ ] Add maintcue.com to Google Search Console
- [ ] Update Google Analytics property
- [ ] Update social media profile links
- [ ] Verify SendGrid sender domain

#### Monitoring
- [ ] Check error logs (hourly for first 24 hours)
- [ ] Test all user flows
- [ ] Verify email deliverability rates
- [ ] Monitor SMS delivery

---

### PHASE 4: Customer Communication
**Priority:** User awareness  
**Timeline:** Day 7-14

#### Email Announcement
- [ ] Send announcement to all active users
- [ ] Template: See Section 7

#### Marketing Updates
- [ ] Update website copy
- [ ] Update social media bios
- [ ] Update email signatures
- [ ] Update any printed materials

#### Support Updates
- [ ] Update help documentation
- [ ] Update FAQ
- [ ] Prepare support response template

---

### PHASE 5: Full Migration
**Priority:** Complete transition  
**Timeline:** Day 14-30

#### Permanent Redirects
- [ ] Configure 301 redirect: upkeepqr.com to maintcue.com
- [ ] Update sitemap.xml
- [ ] Submit new sitemap to Google

#### External Integrations
- [ ] Update OAuth provider settings (if any)
- [ ] Update Stripe webhook URLs
- [ ] Update any third-party callbacks

#### Code Cleanup
- [ ] Remove upkeepqr.com references from code comments
- [ ] Archive old documentation
- [ ] Final grep verification

---

### PHASE 6: Post-Migration Verification
**Priority:** Quality assurance  
**Timeline:** Day 30-60

#### SEO Monitoring
- [ ] Monitor Google rankings
- [ ] Verify 301 redirects working
- [ ] Check search traffic levels
- [ ] Monitor backlink status

#### Analytics Review
- [ ] Compare traffic levels (pre/post)
- [ ] Check bounce rates
- [ ] Monitor email open rates
- [ ] Verify conversion rates

#### User Feedback
- [ ] Track support ticket themes
- [ ] Address any confusion
- [ ] Collect user feedback

#### Long-term
- [ ] Keep upkeepqr.com redirect for 12+ months
- [ ] Consider releasing domain after 12-24 months

---

## 4. Technical Implementation Details

### A. Database Changes

No direct database changes required for brand name (brand is not stored in database).

**Verification:**
```sql
-- Check if any tables contain "upkeepqr" strings
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public';

-- Check for stored brand references (unlikely)
SELECT * FROM households WHERE LOWER(notes) LIKE '%upkeepqr%';
```

### B. Search & Replace Commands

```bash
# Find all UpKeepQR references (case insensitive)
grep -ri "upkeepqr" . \
  --include="*.ts" --include="*.tsx" --include="*.html" --include="*.css" --include="*.json" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=attached_assets

# Count occurrences
grep -ri "upkeepqr" . \
  --include="*.ts" --include="*.tsx" --include="*.html" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=attached_assets | wc -l

# Find domain references specifically
grep -r "upkeepqr.com" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git

# Find email addresses
grep -r "@upkeepqr.com" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git
```

### C. Email Service Updates

#### SendGrid Configuration
1. Add maintcue.com as authenticated sender domain
2. Add DNS records to maintcue.com:
   - CNAME record for SendGrid verification
   - TXT records for SPF
   - CNAME records for DKIM
3. Update FROM_EMAIL environment variable: `support@maintcue.com`
4. Test email deliverability

#### Twilio Configuration
1. Update any hardcoded sender names (if applicable)
2. Verify SMS messages show correct branding

### D. Render Deployment

1. Go to Render Dashboard > Your Service > Settings
2. Add custom domain: maintcue.com
3. Add custom domain: www.maintcue.com
4. Configure DNS as instructed by Render:
   - A record: `@` pointing to Render IP
   - CNAME record: `www` pointing to your-service.onrender.com
5. Enable automatic HTTPS (Let's Encrypt)
6. Keep upkeepqr.com active during transition
7. After transition, set up redirect from upkeepqr.com to maintcue.com

---

## 5. Rollback Plan

### Immediate Rollback (< 24 hours)

If critical issues arise immediately after deployment:

1. **Revert Git commit**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Trigger Render redeploy**
   - Previous version with UpKeepQR branding

3. **DNS quick fix**
   - Point maintcue.com to maintenance page
   - Keep upkeepqr.com working as primary

### Partial Rollback (< 7 days)

If issues are discovered during soft launch:

1. Keep both domains active
2. Fix issues on maintcue.com branch
3. Don't force redirect until stable
4. Communicate delay if needed

### Full Rollback (if necessary)

Complete reversal to pre-rebrand state:

1. Restore database backup (if schema changed)
2. Revert all code changes
3. Remove maintcue.com from Render
4. Continue operating on upkeepqr.com
5. Send user communication about delay
6. Investigate issues thoroughly before retry

---

## 6. Testing Checklist

### Before Going Live

#### Brand Verification
- [ ] No "UpKeepQR" visible on any page
- [ ] No "upkeepqr.com" links anywhere
- [ ] All emails show "MaintCue" branding
- [ ] All SMS show "MaintCue" branding
- [ ] Legal pages updated completely

#### Functional Testing
- [ ] Homepage loads on maintcue.com
- [ ] Login flow works
- [ ] Signup flow works
- [ ] Password reset / magic link works
- [ ] QR code scanning works
- [ ] Setup form submission works
- [ ] Customer dashboard loads
- [ ] Admin dashboard loads
- [ ] Email sending works (test all templates)
- [ ] SMS sending works
- [ ] Warranty notifications send correctly
- [ ] Calendar sync generates correct events
- [ ] Stripe payments process correctly
- [ ] Contact form works

#### Technical Verification
- [ ] API endpoints respond correctly
- [ ] Database connections work
- [ ] No console errors
- [ ] No 404 errors
- [ ] Mobile responsiveness maintained
- [ ] Dark mode works correctly
- [ ] All forms submit correctly

### After Going Live

#### First 24 Hours
- [ ] Monitor error logs (every 2 hours)
- [ ] Check email deliverability rates
- [ ] Verify user registrations work
- [ ] Check Stripe webhook processing
- [ ] Monitor server performance

#### First Week
- [ ] Monitor SEO rankings
- [ ] Check Google Search Console for issues
- [ ] Review analytics for anomalies
- [ ] Track support ticket volume
- [ ] Verify all scheduled jobs run correctly

---

## 7. Communication Templates

### A. Customer Announcement Email

**Subject:** We're Now MaintCue! (Formerly UpKeepQR)

```html
Hi {firstName},

We have exciting news - UpKeepQR is now MaintCue!

WHAT'S CHANGING
- Our name: UpKeepQR is MaintCue
- Our website: maintcue.com
- Our email: support@maintcue.com

WHAT'S NOT CHANGING
- Your account and all your data
- How the service works
- Your QR magnets (they still work perfectly!)
- Your maintenance schedule
- Your login credentials

WHAT YOU NEED TO DO
- Update your bookmarks to maintcue.com
- That's it! Everything else is automatic.

The old upkeepqr.com address will continue to work and automatically redirect you to our new site.

WHY THE CHANGE?
As we've grown, we wanted a name that better reflects our mission: giving you the cues you need to maintain your home effortlessly. MaintCue captures that perfectly.

Questions? Just reply to this email or reach us at support@maintcue.com.

Thank you for being part of our journey!

The MaintCue Team
(Formerly UpKeepQR)
```

### B. Social Media Post

**Twitter/X:**
```
Big news! UpKeepQR is now MaintCue!

Same great home maintenance platform. New name. Better reflects our mission.

- New site: maintcue.com
- Same login, same features
- Your QR magnets still work!

Thanks for being part of our journey!
```

**LinkedIn:**
```
We're excited to announce that UpKeepQR is now MaintCue!

As we've grown, we wanted a name that better captures our mission: providing homeowners with the timely cues they need to maintain their homes effortlessly.

What's changing:
- Our name and website (maintcue.com)

What's staying the same:
- Everything else! Your accounts, data, and QR magnets work exactly as before.

Thank you to our customers and partners for your continued support. We're just getting started!

#rebrand #hometech #propertymaintenance
```

### C. Support Response Template

**Subject:** RE: Question About UpKeepQR / MaintCue

```
Hi {name},

Thank you for reaching out!

Yes, UpKeepQR and MaintCue are the same company - we recently rebranded to better reflect our mission of helping homeowners stay on top of home maintenance.

Here's what you need to know:
- Your account is unchanged - same login credentials
- Your QR magnets still work perfectly
- Your data and maintenance schedule are preserved
- Our new website is maintcue.com

The old upkeepqr.com address will continue to redirect to our new site, so you won't lose access to anything.

Is there anything else I can help you with?

Best regards,
{agent name}
MaintCue Support Team
```

---

## 8. Estimated Timeline & Effort

| Phase | Duration | Effort | Calendar Time |
|-------|----------|--------|---------------|
| Phase 1 - Code Updates | 4-6 hours | Active work | Day 1 |
| Phase 2 - Domain Configuration | 2-4 hours | Active work | Day 2-3 |
| Phase 3 - Soft Launch | 1-2 hours | + monitoring | Day 4-7 (1 week) |
| Phase 4 - Communication | 2-3 hours | Active work | Day 7-14 |
| Phase 5 - Full Migration | 2-3 hours | Active work | Day 14-30 |
| Phase 6 - Verification | Ongoing | Monitoring | Day 30-60 |

**Total Active Work:** 12-20 hours  
**Total Calendar Time:** 30-60 days (gradual transition)

**Recommended Schedule:**
- Complete Phase 1 over a weekend
- Phase 2 during low-traffic period (Sunday evening)
- Phase 3-4 over following two weeks
- Phase 5-6 gradual (month after launch)

---

## 9. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email deliverability issues with new domain | Users don't receive notifications | Pre-warm domain, gradual rollout, monitor rates |
| SEO ranking drops during transition | Reduced organic traffic | 301 redirects, gradual transition, sitemap updates |
| User confusion / support spike | Increased support burden | Clear communication, keep old domain redirecting |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Broken links in old documentation | User frustration | Comprehensive search/replace, testing |
| Third-party integration issues | Feature failures | Test all integrations before launch |
| Analytics tracking gaps | Data loss | Update tracking before launch |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual brand updates | Minimal | Colors already standardized |
| Code compilation | Minimal | Straightforward find/replace |
| Database changes | Minimal | No schema changes needed |

---

## 10. Success Metrics

### Week 1 Targets

| Metric | Target |
|--------|--------|
| Critical errors | 0 |
| Email deliverability | > 95% |
| User login success rate | Unchanged from baseline |
| Support tickets about rebrand | < 10 |

### Month 1 Targets

| Metric | Target |
|--------|--------|
| Traffic to maintcue.com | > 80% of total |
| Email open rates | Within 5% of baseline |
| User engagement | No significant drop |
| Positive user feedback | Qualitative assessment |

### Month 3 Targets

| Metric | Target |
|--------|--------|
| Traffic to maintcue.com | > 95% of total |
| SEO rankings | Recovered or improved |
| upkeepqr.com redirect traffic | < 5% |
| All systems stable | Confirmed |

---

## Appendix: Quick Reference

### Key URLs

| Current | New |
|---------|-----|
| upkeepqr.com | maintcue.com |
| support@upkeepqr.com | support@maintcue.com |
| https://upkeepqr.com/my-home | https://maintcue.com/my-home |

### Key Files by Priority

**Priority 1 (Must update first):**
- `server/lib/email.ts`
- `server/lib/warrantyNotifications.ts`
- `server/services/notifyContact.ts`
- `client/index.html`
- `client/src/components/Navigation.tsx`
- `client/src/components/Footer.tsx`

**Priority 2 (Update before launch):**
- All `client/src/pages/*.tsx`
- All `server/lib/*.ts`
- All `server/src/routes/*.ts`

**Priority 3 (Update after launch):**
- Documentation files (`docs/*.md`)
- `replit.md`
- Build/deploy scripts

---

*Document created for MaintCue rebrand initiative*
