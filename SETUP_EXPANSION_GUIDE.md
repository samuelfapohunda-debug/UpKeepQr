# ✅ Setup Expansion - Integration Guide

## Files Created

### Backend
- ✅ `shared/schema.ts` - Added homeProfileExtras table
- ✅ `server/validators/homeProfileExtra.ts` - Zod validation
- ✅ `server/storage.ts` - CRUD methods
- ✅ `server/src/routes/homeExtra.ts` - API endpoints

### Frontend
- ✅ `client/src/types/homeProfile.ts` - TypeScript types
- ✅ `client/src/components/setup/MoreAboutHome.tsx` - React component

## 🔧 Required Manual Steps

### 1. Run Database Migration

```bash
npm run db:generate
npm run db:push
```

### 2. Register the Route

Edit `server/src/routes/index.ts` and add:

```typescript
import homeExtraRoutes from './homeExtra.js';

export function setupRoutes() {
  const app = express();
  
  // ... existing routes ...
  
  app.use('/api', homeExtraRoutes);  // Add this line
  
  return app;
}
```

### 3. Add Component to Setup Page

Find your setup page (likely `client/src/pages/Setup.tsx` or similar) and add:

```typescript
import MoreAboutHome from "../components/setup/MoreAboutHome";

// Inside your component JSX:
<MoreAboutHome 
  householdId={yourHouseholdId}
  onSave={(data) => console.log("Saved:", data)}
/>
```

### 4. Test the Feature

```bash
# Start the dev server
npm run dev

# Test the API endpoint
curl -X PATCH http://localhost:5000/api/home-extra/TEST_ID \
  -H "Content-Type: application/json" \
  -d '{"yearBuilt": 1985, "ownerType": "owner"}'
```

## 📝 Notes

- The route uses `authenticateAdmin` middleware - adjust if needed
- Household ownership verification is commented out - implement before production
- All fields are optional except householdId
- Data persists in Neon PostgreSQL database

## 🐛 Troubleshooting

**Route not found**: Make sure you registered the route in step 2
**Type errors**: Run `npm install` to ensure dependencies are up to date
**Database errors**: Run the migration commands in step 1
