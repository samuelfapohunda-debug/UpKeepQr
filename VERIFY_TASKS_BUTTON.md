# Tasks Button Verification Guide

**Status:** ✅ Code is deployed (commit 2aa42ca)  
**Bundle:** index-Cy84goA0.js (built Dec 22 01:22)

---

## 🔍 WHERE IS THE TASKS BUTTON?

**Location:** Actions column (far right)  
**Icon:** 📝 ListTodo (checklist icon)  
**Position:** 3rd button after Eye and Refrigerator icons

**Expected Actions Column:**
```
Eye (👁️)          - View Details
Refrigerator (🧊) - Manage Appliances  
ListTodo (📝)     - View Tasks ← NEW!
```

---

## ✅ VERIFICATION STEPS

### Step 1: Hard Refresh (FASTEST)
1. Go to: https://upkeepqr.com/admin/setup-forms
2. Press: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Look for **3 icons** in Actions column
4. Click the **ListTodo (checklist)** icon

### Step 2: Incognito Mode (GUARANTEED)
1. Open **incognito/private** browser window
2. Go to: https://upkeepqr.com/admin/setup-forms
3. Login as admin
4. Look for **3 icons** in Actions column
5. Click the **ListTodo** icon

### Step 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or: Settings → Clear browsing data → Cached images and files

### Step 4: Check Network Tab
1. Open DevTools (F12)
2. Network tab
3. Refresh page
4. Find: `index-Cy84goA0.js`
5. If you see older hash → cache issue
6. If you see `index-Cy84goA0.js` → button should be there!

---

## 🐛 IF BUTTON STILL NOT VISIBLE

### Verify Icon Import
The button uses `ListTodo` from lucide-react. Check browser console for errors.

### Check Element Exists
Open DevTools console and run:
```javascript
document.querySelectorAll('[data-testid^="button-tasks-"]').length
```
**Expected:** Number of households (should match row count)

### Check if Hidden by CSS
```javascript
const buttons = document.querySelectorAll('[data-testid^="button-tasks-"]');
buttons.forEach(btn => console.log(btn, window.getComputedStyle(btn).display));
```
**Expected:** All buttons should have `display: inline-flex` or similar (not `none`)

---

## ✅ WHAT YOU SHOULD SEE

When you click the **ListTodo** icon:

1. **Dialog opens** with title (from HouseholdTasksView)
2. **Summary cards** showing:
   - Total Tasks
   - Pending (blue)
   - Overdue (red)  
   - Completed (green)
3. **Task table** with:
   - Task Name
   - Category (badge)
   - Due Date
   - Status (badge)
   - Priority (badge)

---

## 📊 TEST CHECKLIST

- [ ] Can see 3 icons in Actions column (Eye, Refrigerator, ListTodo)
- [ ] ListTodo icon clickable
- [ ] Dialog opens when clicked
- [ ] Summary cards display correctly
- [ ] Task table loads
- [ ] Can close dialog with X or Back button

---

## 🚨 TROUBLESHOOTING

**Issue:** Only 2 icons (Eye, Refrigerator)  
**Solution:** Hard refresh or incognito mode

**Issue:** ListTodo icon not clickable  
**Check:** Browser console for JavaScript errors

**Issue:** Dialog opens but no data  
**Check:** Network tab → `/api/households/{id}/tasks` returns 200

**Issue:** "Failed to fetch tasks" error  
**Check:** Render logs for API errors

---

## 📞 QUICK DEBUG COMMANDS

Run in browser console:
```javascript
// Check if button exists
console.log('Tasks buttons:', document.querySelectorAll('[data-testid^="button-tasks-"]').length);

// Check current JS bundle
performance.getEntriesByType('resource')
  .find(r => r.name.includes('index-') && r.name.endsWith('.js'))
  ?.name.split('/').pop();
// Should be: index-Cy84goA0.js

// Force reload without cache
location.reload(true);
```

---

**Status:** Code is deployed ✅  
**Action:** Clear cache and check! 🔄

