# 🔧 Browser Debugging Guide

**Current Issue:** Tasks button (ListTodo icon) not visible despite being in deployed code

---

## 🔍 RUN THESE IN BROWSER CONSOLE

Open browser console (F12 → Console tab) and paste these commands:

### 1. Check if buttons exist in DOM
```javascript
// Count task buttons (should equal number of household rows)
const taskButtons = document.querySelectorAll('[data-testid^="button-tasks-"]');
console.log('Task buttons found:', taskButtons.length);

// Count appliance buttons
const applianceButtons = document.querySelectorAll('[data-testid^="button-appliances-"]');
console.log('Appliance buttons found:', applianceButtons.length);

// Count view buttons
const viewButtons = document.querySelectorAll('[data-testid^="button-view-"]');
console.log('View buttons found:', viewButtons.length);
```

**Expected:** All three should equal the number of household rows (7 in your case)

---

### 2. Check current bundle hash
```javascript
// Get current JS bundle name
const jsBundle = performance.getEntriesByType('resource')
  .find(r => r.name.includes('index-') && r.name.endsWith('.js'))
  ?.name.split('/').pop();

console.log('Current bundle:', jsBundle);
console.log('Expected:', 'index-Cy84goA0.js');
```

**If different:** Cache issue - hard refresh needed

---

### 3. Check if ListTodo icon loaded
```javascript
// Check if lucide-react icons are loaded
const allSvgs = document.querySelectorAll('svg');
console.log('Total SVG icons on page:', allSvgs.length);

// Check for ListTodo specifically (it should be a checklist icon)
const checklistIcons = Array.from(allSvgs).filter(svg => {
  return svg.parentElement?.getAttribute('title') === 'View Tasks';
});
console.log('ListTodo (Tasks) icons found:', checklistIcons.length);
```

**Expected:** Should match number of households

---

### 4. Force reload without cache
```javascript
// This will force a hard reload
location.reload(true);
```

---

### 5. Check Actions column structure
```javascript
// Get all Actions cells
const actionCells = Array.from(document.querySelectorAll('td')).filter(td => {
  return td.textContent === '' && td.querySelector('button');
});

console.log('Actions columns found:', actionCells.length);

// Check buttons in first Actions cell
if (actionCells[0]) {
  const buttons = actionCells[0].querySelectorAll('button');
  console.log('Buttons in first Actions column:', buttons.length);
  console.log('Button titles:', Array.from(buttons).map(b => b.getAttribute('title')));
}
```

**Expected:** 
- Buttons: 3
- Titles: ["View Details", "Manage Appliances", "View Tasks"]

---

## 📊 DIAGNOSTIC RESULTS

Run all 5 checks above and report back:

1. **Button counts:** _______ (should be 7, 7, 7)
2. **Bundle hash:** _______ (should be index-Cy84goA0.js)
3. **ListTodo icons:** _______ (should be 7)
4. **Actions columns:** _______ (should be 7)
5. **Buttons per column:** _______ (should be 3)
6. **Button titles:** _______ (should include "View Tasks")

---

## ✅ SOLUTIONS BASED ON RESULTS

**If button count = 0:**
- Icons not rendering → Check browser console for errors
- Possible React render issue

**If bundle hash ≠ index-Cy84goA0.js:**
- Old bundle cached → Hard refresh (Ctrl+Shift+F5)

**If buttons exist but not visible:**
- CSS hiding them → Check computed styles
- Display: none? Opacity: 0?

**If everything looks good but still not showing:**
- Clear all site data
- Try incognito mode
- Wait for Render deployment

