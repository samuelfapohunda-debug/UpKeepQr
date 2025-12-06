import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)');
  }
  
  return keyBuffer;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected IV:authTag:encrypted');
  }
  
  const [ivString, authTagString, encryptedData] = parts;
  
  const iv = Buffer.from(ivString, ENCODING);
  const authTag = Buffer.from(authTagString, ENCODING);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateHmacState(payload: {
  householdId: string;
  timestamp: number;
  nonce: string;
}): string {
  const key = getEncryptionKey();
  const data = JSON.stringify(payload);
  
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const signature = hmac.digest(ENCODING);
  
  const encodedData = Buffer.from(data).toString(ENCODING);
  return `${encodedData}.${signature}`;
}

export function verifyHmacState(
  state: string,
  maxAgeMs: number = 15 * 60 * 1000
): { valid: boolean; payload?: { householdId: string; timestamp: number; nonce: string }; error?: string } {
  try {
    const parts = state.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid state format' };
    }
    
    const [encodedData, signature] = parts;
    const data = Buffer.from(encodedData, ENCODING).toString('utf8');
    
    const key = getEncryptionKey();
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    const expectedSignature = hmac.digest(ENCODING);
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    const payload = JSON.parse(data);
    
    const age = Date.now() - payload.timestamp;
    if (age > maxAgeMs) {
      return { valid: false, error: 'State token expired' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Failed to verify state' };
  }
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
