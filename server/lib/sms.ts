import twilio from 'twilio';

// Replit Twilio Connector Integration with Environment Variable Fallback
// Credentials are managed securely via Replit's connector system or environment secrets
let twilioClient: any = null;
let twilioFromNumber: string | null = null;
let twilioConfigured = false;
let lastConfigCheck = 0;
const CONFIG_CACHE_MS = 60000; // Re-check credentials every 60 seconds

// Initialize Twilio client using Replit connector or environment variables
async function initializeTwilioClient() {
  // Allow periodic re-initialization to pick up credential updates
  const now = Date.now();
  if (twilioConfigured && (now - lastConfigCheck) < CONFIG_CACHE_MS) {
    return { client: twilioClient, fromNumber: twilioFromNumber };
  }
  
  // Reset state for re-initialization
  twilioConfigured = false;
  twilioClient = null;
  twilioFromNumber = null;
  lastConfigCheck = now;

  // Try environment variables first (direct credentials)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      // Ensure phone number has + prefix for E.164 format
      twilioFromNumber = process.env.TWILIO_PHONE_NUMBER.startsWith('+')
        ? process.env.TWILIO_PHONE_NUMBER
        : '+' + process.env.TWILIO_PHONE_NUMBER;
      
      twilioConfigured = true;

      console.log('✅ Twilio client initialized via environment variables');
      console.log(`   From number: ${twilioFromNumber}`);

      return { client: twilioClient, fromNumber: twilioFromNumber };
    } catch (error: any) {
      console.error('❌ Failed to initialize Twilio via env vars:', error.message);
      // Fall through to try connector
    }
  }

  // Try Replit connector as fallback
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken || !hostname) {
      console.warn("⚠️ Twilio not available - SMS features will be disabled");
      console.warn("   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables");
      return { client: null, fromNumber: null };
    }

    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings || 
        !connectionSettings.settings.account_sid || 
        !connectionSettings.settings.api_key || 
        !connectionSettings.settings.api_key_secret) {
      console.warn('⚠️ Twilio not connected via Replit connector');
      console.warn('   Please set up the Twilio integration or use environment variables');
      return { client: null, fromNumber: null };
    }

    // Initialize Twilio client with API key authentication (more secure than auth token)
    twilioClient = twilio(
      connectionSettings.settings.api_key,
      connectionSettings.settings.api_key_secret,
      { accountSid: connectionSettings.settings.account_sid }
    );

    twilioFromNumber = connectionSettings.settings.phone_number;
    twilioConfigured = true;

    console.log('✅ Twilio client initialized successfully via Replit connector');
    console.log(`   From number: ${twilioFromNumber}`);

    return { client: twilioClient, fromNumber: twilioFromNumber };
  } catch (error: any) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    return { client: null, fromNumber: null };
  }
}

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map<string, { code: string; expires: Date }>();

/**
 * Generate and send SMS verification code
 * @returns Promise<boolean> - true if sent successfully, false if Twilio unavailable or send failed
 */
export async function sendVerificationCode(phone: string, token: string): Promise<boolean> {
  try {
    const { client, fromNumber } = await initializeTwilioClient();
    
    // Check if Twilio is configured
    if (!client || !fromNumber) {
      console.warn(`⚠️ Verification code NOT SENT: Twilio not configured`);
      console.warn(`   Would have sent verification code to: ${phone}`);
      return false; // Gracefully fail - allows non-SMS environments to continue
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    verificationCodes.set(token, { code, expires });
    
    const message = `Your UpKeepQR verification code is: ${code}. This code expires in 10 minutes.`;
    
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });
    
    console.log(`✅ Verification code sent successfully to ${phone}`);
    return true;
  } catch (error: any) {
    console.error('❌ Verification code send error:', {
      phone,
      error: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Verify SMS code
 */
export function verifyCode(token: string, inputCode: string): boolean {
  const stored = verificationCodes.get(token);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expires < new Date()) {
    verificationCodes.delete(token);
    return false;
  }
  
  if (stored.code === inputCode) {
    verificationCodes.delete(token);
    return true;
  }
  
  return false;
}

/**
 * Send generic SMS with TCPA compliance (unified function)
 * @param phone - Phone number in E.164 format (e.g., +14155552671)
 * @param message - Message content (opt-out text will be added if not present)
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const { client, fromNumber } = await initializeTwilioClient();
    
    // Check if Twilio is configured
    if (!client || !fromNumber) {
      console.warn(`⚠️ SMS NOT SENT: Twilio not configured`);
      console.warn(`   Would have sent to: ${phone}`);
      console.warn(`   Message: ${message.substring(0, 50)}...`);
      return false; // Gracefully fail
    }
    
    // TCPA Compliance: Validate US/Canada phone format (E.164)
    if (!phone.startsWith('+1')) {
      console.error('❌ SMS Error: Only US/Canada phone numbers supported (must start with +1)');
      throw new Error('Only US/Canada phone numbers supported (E.164 format required)');
    }
    
    // TCPA Compliance: Ensure STOP opt-out message is included
    const tcpaMessage = message.includes('STOP') || message.includes('opt-out') || message.includes('opt out')
      ? message
      : `${message}\n\nReply STOP to opt-out`;
    
    // Send via Twilio
    await client.messages.create({
      body: tcpaMessage,
      from: fromNumber,
      to: phone,
    });
    
    console.log(`✅ SMS sent successfully to ${phone}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS send error:', {
      phone,
      error: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Send maintenance reminder SMS (wrapper for backward compatibility)
 * @deprecated Use sendSMS() directly for new code
 */
export async function sendReminderSMS(
  phone: string, 
  taskName: string, 
  dueDate: string
): Promise<void> {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  const message = `UpKeepQR Reminder: ${taskName} is due ${dueDateFormatted}. Complete this task to keep your home in great condition.`;
  
  // Use the new generic sendSMS function
  await sendSMS(phone, message);
}
