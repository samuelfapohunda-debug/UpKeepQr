# UpkeepQR Website

A modern Astro + TailwindCSS website for UpkeepQR - Simple scans. Smart reminders.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy to Firebase:**
   ```bash
   npm run firebase:deploy
   ```

## 🏗️ Architecture

- **Framework:** Astro v4 with static site generation
- **Styling:** TailwindCSS with custom brand colors
- **Forms:** Client-side forms with Firebase Functions backend
- **Deployment:** Firebase Hosting + Functions
- **Analytics:** Google Analytics 4 integration

## 📄 Pages

- **Home** (`/`) - Hero section, features, testimonials
- **Order Magnets** (`/order`) - Stripe payment integration
- **Contact** (`/contact`) - Contact form with Postmark email
- **Request a Pro** (`/request-pro`) - Professional service requests
- **Fee Listing** (`/fee-listing`) - Property listing submissions
- **FAQ** (`/faq`) - Dynamic accordion FAQs
- **Privacy** (`/privacy`) - Privacy policy
- **Terms** (`/terms`) - Terms of service

## 🎨 Branding

- **Navy Blue:** `#1E2A38` (backgrounds)
- **Bright Green:** `#A6E22E` (CTAs)
- **Fonts:** Poppins (headings), Inter (body)

## 🔧 Environment Variables

Create `.env` file:
```
PUBLIC_GA_ID=G-XXXXXXXXXX
POSTMARK_API_TOKEN=your-postmark-token
FIREBASE_PROJECT_ID=georgia-top-roofer
```

## 📧 Email Integration

Forms submit to Firebase Functions which handle:
- Auto-reply emails to customers
- Notifications to support@upkeepqr.com
- Powered by Postmark API

## 💳 Payment Integration

- **Single Magnet:** https://buy.stripe.com/test_8x29AV0Q0cQB0KJbu5gIo00
- **100 Pack & 300 Pack:** Configured in order page

## 📊 Analytics Tracking

Google Analytics 4 events:
- `page_view` - Page views
- `cta_click` - CTA button clicks
- `purchase` - Stripe checkout events  
- `form_submit` - Form submissions

## 🚀 Deployment

1. Configure Firebase project:
   ```bash
   firebase use georgia-top-roofer
   ```

2. Deploy hosting:
   ```bash
   firebase deploy --only hosting
   ```

3. Deploy functions (optional):
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```

## 📞 Support

- Email: support@upkeepqr.com
- Domain: www.upkeepqr.com