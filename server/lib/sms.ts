import twilio from 'twilio';

if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_FROM) {
  throw new Error("TWILIO_SID, TWILIO_TOKEN, and TWILIO_FROM environment variables are required");
}

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map<string, { code: string; expires: Date }>();

/**
 * Generate and send SMS verification code
 */
export async function sendVerificationCode(phone: string, token: string): Promise<void> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  verificationCodes.set(token, { code, expires });
  
  const message = `Your AgentHub verification code is: ${code}. This code expires in 10 minutes.`;
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to: phone,
  });
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
 * Send maintenance reminder SMS
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
  
  const message = `🏠 AgentHub Reminder: ${taskName} is due ${dueDateFormatted}. Complete this task to keep your home in great condition. Reply STOP to opt out.`;
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to: phone,
  });
}