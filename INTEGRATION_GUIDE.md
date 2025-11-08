# Home Profile Extra Feature - Integration Guide

## ✅ Installation Complete!

Components have been created. Complete these manual steps:

### 1. Add Component to Setup Page

**File:** `client/src/pages/Setup.tsx` (or similar)

```tsx
import HomeProfileExtraForm from '../components/HomeProfileExtraForm';

// In your component, after the setup form:
{householdId && (
  <HomeProfileExtraForm 
    householdId={householdId}
    onSaveSuccess={() => console.log('Saved!')}
  />
)}
```

### 2. Apply Rate Limiter (if not already done)

**File:** `server/src/routes/homeExtra.ts`

```typescript
router.patch('/:id/extra', homeExtraLimiter, async (req, res) => {
  // your handler
});
```

### 3. Test the Feature

```bash
# Start dev server
npm run dev

# Navigate to setup page
# Expand "More About Your Home" card
# Fill in some fields
# Click Save
# Verify success message
# Refresh page - data should persist
```

### 4. Verify Analytics

Open browser console and check for:
- `[Analytics] intent_sell_window_selected` when changing sell window
- `[Analytics] intent_project_selected` when selecting projects
- `[Analytics] consent_marketing_toggled` when toggling consent
- `[Analytics] home_extra_saved` when saving form

## Testing Checklist

- [ ] Form appears on Setup page
- [ ] Card expands/collapses
- [ ] All fields render correctly
- [ ] Validation works (try invalid year)
- [ ] Save shows success message
- [ ] Data persists after refresh
- [ ] Analytics events fire
- [ ] No console errors

## 🎉 You're Done!

The feature is now ready for use. Users can optionally provide home details for better service targeting.
