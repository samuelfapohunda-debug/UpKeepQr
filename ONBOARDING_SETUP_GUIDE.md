# 🚀 Complete Onboarding System - Setup Guide

## ✅ Files Created

### Backend:
- `server/migrations/*_add_home_profile_extra.sql` - Database migration
- `server/models/homeProfileExtra.ts` - Zod validation schema
- `server/storage/homeProfileExtra.ts` - Database operations
- `server/routes/homeExtra.ts` - API endpoints

### Frontend:
- `src/types/homeExtra.ts` - TypeScript types
- `src/pages/Onboarding.tsx` - Main onboarding form
- `src/components/setup/ExtendedHomeProfile.tsx` - Extended profile component
- `src/pages/SetupSuccess.tsx` - Success page with extended profile

## 🔧 Manual Steps Required

### 1. Run Database Migration

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f server/migrations/*_add_home_profile_extra.sql

# OR if using a migration tool:
npm run migrate
```

### 2. Register Backend Routes

In your `server/index.ts` or `server/app.ts`, add:

```typescript
import homeExtraRouter from './routes/homeExtra';

// After other middleware/routes:
app.use(homeExtraRouter);
```

### 3. Add Frontend Routes

In your main routing file (e.g., `src/App.tsx`), add these routes:

```tsx
import Onboarding from './pages/Onboarding';
import SetupSuccess from './pages/SetupSuccess';

// In your Routes component:
<Route path="/setup/:token" component={Onboarding} />
<Route path="/setup/success" component={SetupSuccess} />
```

### 4. Install Dependencies (if needed)

```bash
npm install zod wouter
npm install --save-dev @types/node @types/react
```

## 🎯 Flow Overview

1. **User receives setup link:** `/setup/:token`
2. **Fills out onboarding form:** ZIP, home type, optional details
3. **Submits form:** POST to `/api/setup/activate`
4. **Redirected to success page:** `/setup/success`
5. **Sees QR code and optional extended profile**
6. **Can fill extended profile or skip to dashboard**

## 📡 API Endpoints

### Existing (assumed):
- `POST /api/setup/activate` - Initial home setup

### New:
- `GET /api/home/:homeId/extra` - Fetch extended profile
- `PATCH /api/home/:homeId/extra` - Save/update extended profile

## 🧪 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Backend routes are registered
- [ ] Frontend routes are added to router
- [ ] Can access onboarding page with token
- [ ] Can submit onboarding form
- [ ] Redirects to success page
- [ ] QR code displays on success page
- [ ] Can expand extended profile section
- [ ] Can save extended profile data
- [ ] Data persists on page reload
- [ ] "Skip for now" link works
- [ ] "Go to Dashboard" button works

## 🐛 Troubleshooting

### "Cannot find module 'wouter'"
```bash
npm install wouter
```

### "Database table doesn't exist"
Make sure you ran the migration:
```bash
psql -U postgres -d upkeepqr -f server/migrations/*_add_home_profile_extra.sql
```

### "Route not found"
Verify routes are added to your router in `App.tsx`

### TypeScript errors
```bash
npm install --save-dev @types/react @types/node
```

### Server route not working
Ensure `homeExtraRouter` is imported and registered in your server file:
```typescript
import homeExtraRouter from './routes/homeExtra';
app.use(homeExtraRouter);
```

## 📝 Environment Variables

Make sure you have:
```env
NODE_ENV=development  # or production
DATABASE_URL=postgresql://user:pass@localhost:5432/upkeepqr
```

## 🎨 Customization

### Change styling:
Edit the Tailwind classes in the components. All use CSS variables:
- `bg-primary` - Primary color
- `text-primary-foreground` - Text on primary
- `bg-card` - Card background
- `border-border` - Border color

### Add more fields:
1. Update `homeProfileExtra.ts` schema
2. Add database column in migration
3. Add form field in `ExtendedHomeProfile.tsx`

### Change API base URL:
Update `API_BASE_URL` constant in each component.

## 🚀 Deployment

1. Run migration on production database
2. Deploy backend with new routes
3. Deploy frontend with new pages
4. Test complete flow end-to-end

## 📖 Additional Resources

- [Zod Documentation](https://zod.dev)
- [Wouter Documentation](https://github.com/molefrog/wouter)
- [React Hook Form](https://react-hook-form.com) (if you want to add)

Done! 🎉
