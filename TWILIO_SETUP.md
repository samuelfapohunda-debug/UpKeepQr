# Twilio Integration Setup Guide

## Current Status

✅ **Integration Installed**: Twilio connector is installed and configured in the codebase  
❌ **Status**: Disconnected (401 Unauthorized error)  
⚠️ **Issue**: The API key credentials are invalid or expired

## Problem Diagnosis

The Replit Twilio connector shows:
```json
{
  "status": "disconnected",
  "status_message": "Failed to connect to Twilio: 401 Unauthorized"
}
```

This means the API key provided during setup is either:
1. Invalid (incorrect API Key SID or Secret)
2. Expired or revoked
3. Doesn't have proper permissions

## How to Fix

### Option 1: Reconnect with Valid Credentials

1. **Get New Twilio API Credentials**:
   - Go to https://console.twilio.com/
   - Navigate to **Account** → **API Keys & Tokens**
   - Click **Create API Key**
   - Choose **Standard** key type (has SMS permissions)
   - Copy the **SID** and **Secret** (you can only see the secret once!)

2. **Get Your Account SID**:
   - On Twilio Console home page
   - Copy your **Account SID** (starts with `AC...`)

3. **Get Your Phone Number**:
   - Go to **Phone Numbers** → **Manage** → **Active numbers**
   - Copy your Twilio phone number (format: `+1XXXXXXXXXX`)

4. **Reconnect in Replit**:
   - Open the Twilio integration settings in Replit
   - Update the connection with:
     - Account SID: `AC...`
     - API Key: `SK...` (the SID from step 1)
     - API Key Secret: `...` (from step 1)
     - Phone Number: `+1XXXXXXXXXX`

### Option 2: Use Auth Token Instead (Simpler for Testing)

If you're having issues with API keys, you can use the main Auth Token:

1. **Get Auth Token**:
   - Go to https://console.twilio.com/
   - Click **Account Info** on the home page
   - Copy your **Auth Token** (click "show" to reveal it)

2. **Update Code** (if connector doesn't support auth token):
   - Set environment secrets in Replit:
     - `TWILIO_SID`: Your Account SID
     - `TWILIO_TOKEN`: Your Auth Token  
     - `TWILIO_FROM`: Your phone number
   - The code will fall back to environment variables

## Verification

Once you've reconnected with valid credentials, test the integration:

```bash
npx tsx server/test-twilio-connector.ts
```

You should see:
```
✅ API Key SUCCESS!
   Message SID: SM...
   Status: queued
```

## Testing the NotificationDispatcher

After Twilio is connected, run the full test suite:

```bash
npx tsx server/test-notification-dispatcher.ts
```

Expected results:
- ✅ Test 1: Preference = "both" (email + SMS) - **BOTH channels should succeed**
- ✅ Test 2: Preference = "email_only" - Email only
- ✅ Test 3: Preference = "sms_only" - **SMS should succeed**
- ✅ Test 4-6: Error handling tests

## Current Implementation Status

| Feature | Status |
|---------|--------|
| Email routing | ✅ Working (SendGrid) |
| SMS routing | ⚠️ Code ready, needs valid Twilio credentials |
| Preference-based routing | ✅ Working |
| TCPA compliance (smsOptIn check) | ✅ Working |
| E.164 phone validation | ✅ Working |
| Graceful degradation | ✅ Working (doesn't crash without SMS) |
| Event logging | ✅ Working (Firebase) |
| Error handling | ✅ Working |

## Architecture

The system uses:
- **Replit Twilio Connector**: Secure credential management
- **Fallback to Env Vars**: If connector unavailable (dev/test)
- **Graceful Degradation**: SMS failures don't crash the system
- **TCPA Compliance**: Won't send SMS unless `smsOptIn = true`
- **E.164 Validation**: Only US/Canada numbers (`+1...`)

## Next Steps

1. ✅ Reconnect Twilio with valid credentials
2. ✅ Run test-twilio-connector.ts to verify connection
3. ✅ Run test-notification-dispatcher.ts (should get 6/6 passing)
4. ✅ Test QR magnet welcome emails with SMS notifications
5. ✅ Deploy to production

## Support

If you continue having issues:
- Check Twilio account balance (needs funds)
- Verify phone number is SMS-enabled  
- Check API key permissions (should be "Standard" with full access)
- Review Twilio error logs: https://console.twilio.com/monitor/logs/errors
