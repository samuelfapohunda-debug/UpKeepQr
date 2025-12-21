# Update Render Build Command

## Current Build Command:
```
npm install && npm run build
```

## New Build Command (with auto-migration):
```
npm install && npm run db:push && npm run build
```

## Steps to Update:

1. Go to https://dashboard.render.com
2. Click on "UpKeepQr-backend" service
3. Go to "Settings" tab
4. Scroll to "Build Command"
5. Replace with: `npm install && npm run db:push && npm run build`
6. Click "Save Changes"
7. Go to "Manual Deploy" → "Deploy latest commit"

This will:
- Install dependencies
- Run database migrations (create missing tables)
- Build the application
- Deploy to production

## What This Fixes:
- Creates agents, schedules, task_completions, reminder_queue tables
- Syncs schema changes automatically on every deploy
- Prevents future "table does not exist" errors
