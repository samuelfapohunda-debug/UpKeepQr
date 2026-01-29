import { Router } from 'express';
import { google } from 'googleapis';
import { db } from '../../db.js';
import { calendarConnectionsTable, householdTaskAssignmentsTable, householdsTable, homeMaintenanceTasksTable } from '../../../shared/schema.js';
import { encryptToken } from '../../lib/encryption.js';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

const router = Router();

// =============================================
// .ICS FILE DOWNLOAD (Simple Approach)
// =============================================

// Format date as YYYYMMDD for .ics
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Format datetime as YYYYMMDDTHHmmssZ for .ics
function formatICSDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Escape special characters for .ics format
function escapeICS(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/;/g, '\\;')    // Semicolon
    .replace(/,/g, '\\,')    // Comma
    .replace(/\n/g, '\\n')   // Newline
    .replace(/\r/g, '');     // Remove carriage return
}

// Fold lines longer than 75 characters per RFC 5545
// Lines are split at 75 chars, then continued with CRLF + single SPACE (no backslashes)
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  
  let result = '';
  let remaining = line;
  let isFirstLine = true;
  
  while (remaining.length > 0) {
    if (isFirstLine) {
      // First line: take up to 75 characters
      result += remaining.slice(0, 75);
      remaining = remaining.slice(75);
      isFirstLine = false;
    } else {
      // Continuation lines: CRLF + SPACE + up to 74 more characters (75 total with space)
      result += '\r\n ' + remaining.slice(0, 74);
      remaining = remaining.slice(74);
    }
  }
  
  return result;
}

// Generate .ics file content for household tasks with PROPER LINE ENDINGS
function generateICSFile(tasks: any[], householdName: string): string {
  const timestamp = formatICSDateTime(new Date());
  
  // Build as array of lines, then join with \r\n (CRLF) - REQUIRED by iCalendar spec
  const lines: string[] = [];
  
  // Calendar header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//UpKeepQR//NONSGML Home Tasks//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:UpKeepQR - ${escapeICS(householdName)}`);
  lines.push('X-WR-TIMEZONE:America/New_York');
  
  // Add each task as an event
  let validEventCount = 0;
  
  tasks.forEach((task, index) => {
    // Validate required fields
    if (!task.id) {
      console.warn(`Task ${index}: Missing ID, skipping`);
      return;
    }
    
    const taskTitle = task.taskTitle || task.title || 'Maintenance Task';
    if (!taskTitle || taskTitle.trim() === '') {
      console.warn(`Task ${index}: Empty title, skipping`);
      return;
    }
    
    const uid = `task-${task.id}@upkeepqr.com`;
    const dueDate = task.dueDate ? formatICSDate(new Date(task.dueDate)) : formatICSDate(new Date());
    
    // Priority mapping: High=1, Medium=5, Low=9
    const priorityNum = task.priority === 'high' ? '1' : 
                        task.priority === 'medium' ? '5' : '9';
    
    const taskDescription = task.taskDescription || task.description || '';
    const taskCategory = task.taskCategory || task.category || 'Home Maintenance';
    
    validEventCount++;
    
    // Build description with details
    const fullDescription = `${escapeICS(taskDescription)}\\nPriority: ${task.priority || 'medium'}\\nCategory: ${taskCategory}\\nFrom UpKeepQR`;
    
    // Add event with proper structure (ACTION before DESCRIPTION in VALARM)
    // Use foldLine for potentially long lines per RFC 5545
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dueDate}`);
    lines.push(`DTEND;VALUE=DATE:${dueDate}`);
    lines.push(foldLine(`SUMMARY:${escapeICS(taskTitle)}`));
    lines.push(foldLine(`DESCRIPTION:${fullDescription}`));
    lines.push(`PRIORITY:${priorityNum}`);
    lines.push(foldLine(`CATEGORIES:${escapeICS(taskCategory)}`));
    lines.push(task.status === 'completed' ? 'STATUS:COMPLETED' : 'STATUS:NEEDS-ACTION');
    lines.push('CLASS:PUBLIC');
    lines.push('TRANSP:TRANSPARENT');
    
    // Add reminder alarm - 1 day before (ACTION before DESCRIPTION per spec)
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push(foldLine(`DESCRIPTION:${escapeICS(taskTitle)} is due tomorrow`));
    lines.push('END:VALARM');
    
    lines.push('END:VEVENT');
  });
  
  // Calendar footer
  lines.push('END:VCALENDAR');

  console.log(`Generated ${validEventCount} valid events out of ${tasks.length} tasks`);
  
  // CRITICAL: Join with \r\n (CRLF) and add final \r\n - REQUIRED by iCalendar spec
  return lines.join('\r\n') + '\r\n';
}

// GET /api/calendar/household/:householdId/tasks.ics - Download .ics file
router.get('/household/:householdId/tasks.ics', async (req, res) => {
  try {
    const { householdId } = req.params;
    const includeCompleted = req.query.includeCompleted === 'true';

    console.log(`Generating .ics file for household: ${householdId}`);

    // Get household info
    const households = await db.select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);

    const household = households[0];
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Get tasks for this household with task details
    const tasksQuery = db.select({
      id: householdTaskAssignmentsTable.id,
      dueDate: householdTaskAssignmentsTable.dueDate,
      priority: householdTaskAssignmentsTable.priority,
      status: householdTaskAssignmentsTable.status,
      taskTitle: homeMaintenanceTasksTable.taskName,
      taskDescription: homeMaintenanceTasksTable.howTo,
      taskCategory: homeMaintenanceTasksTable.category,
    })
    .from(householdTaskAssignmentsTable)
    .leftJoin(homeMaintenanceTasksTable, eq(householdTaskAssignmentsTable.taskId, homeMaintenanceTasksTable.id))
    .where(eq(householdTaskAssignmentsTable.householdId, householdId));

    const tasks = await tasksQuery;

    // Filter to pending tasks unless includeCompleted is true
    const filteredTasks = includeCompleted 
      ? tasks 
      : tasks.filter(t => t.status !== 'completed');

    console.log(`Found ${filteredTasks.length} tasks for .ics file`);

    if (filteredTasks.length === 0) {
      return res.status(404).json({ error: 'No tasks found for this household' });
    }

    // Generate .ics content
    const householdName = `${household.ownerFirstName || ''} ${household.ownerLastName || ''}`.trim() || 'Home';
    const icsContent = generateICSFile(filteredTasks, householdName);

    // Set headers for .ics file download
    const safeFilename = householdName.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="UpKeepQR_Tasks_${safeFilename}.ics"`);
    
    return res.send(icsContent);

  } catch (error: any) {
    console.error('Calendar .ics generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate calendar file',
      details: error.message 
    });
  }
});

// POST /api/calendar/google/auth-url
router.post('/google/auth-url', async (req, res) => {
  try {
    const redirectUri = `${process.env.BACKEND_URL || 'https://upkeepqr-backend.onrender.com'}/api/calendar/google/callback`;
    console.log('OAuth redirect_uri:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      prompt: 'consent',
    });

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// GET /api/calendar/google/callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=${error}`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=no_code`);
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.BACKEND_URL || 'https://upkeepqr-backend.onrender.com'}/api/calendar/google/callback`;
    console.log('Callback OAuth redirect_uri:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens from Google');
    }

    console.log('Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Get calendar info
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

    if (!primaryCalendar) {
      throw new Error('No primary calendar found');
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    // TODO: Get real household_id from authenticated user session
    // For now, using the test household
    const testHouseholdId = 'test-household-calendar';

    // Save to database
    await db.insert(calendarConnectionsTable).values({
      id: randomUUID(),
      household_id: testHouseholdId,
      provider: 'google',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      calendar_id: primaryCalendar.id || 'primary',
      calendar_name: primaryCalendar.summary || 'Primary Calendar',
      calendar_timezone: primaryCalendar.timeZone || 'America/New_York',
      sync_enabled: true,
    });

    console.log('✅ Calendar connection saved to database');

    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=success&connection_saved=true`);
    
  } catch (error: any) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=server_error`);
  }
});

// POST /api/calendar/sync
router.post('/sync', async (req, res) => {
  try {
    // TODO: Get household_id from authenticated user
    // For now, using test household
    const householdId = req.body.householdId || 'test-household-calendar';
    console.log('Starting calendar sync for household:', householdId);

    const { syncTasksToCalendar } = await import('../../lib/calendarSync.js');
    const result = await syncTasksToCalendar(householdId);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      message: `Synced ${result.created} tasks to calendar`,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync calendar', details: error.message });
  }
});

// GET /api/calendar/sync-test - Temporary browser testing endpoint
router.get('/sync-test', async (req, res) => {
  try {
    const householdId = (req.query.householdId as string) || 'test-household-calendar';
    console.log('Browser test: Starting calendar sync for household:', householdId);
    
    const { syncTasksToCalendar } = await import('../../lib/calendarSync.js');
    const result = await syncTasksToCalendar(householdId);

    if (!result.success) {
      return res.send(`Calendar sync failed: ${result.message}`);
    }

    res.send(`Calendar sync triggered for household: ${householdId} - Created: ${result.created}, Skipped: ${result.skipped}`);
  } catch (error: any) {
    console.error('Sync test error:', error);
    res.status(500).send(`Sync test failed: ${error.message}`);
  }
});

export default router;
