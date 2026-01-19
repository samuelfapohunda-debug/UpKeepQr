import { nanoid } from 'nanoid';
import { db } from '../db';
import { magicLinksTable, sessionsTable } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function generateMagicLink(
  email: string, 
  householdId: string
): Promise<string> {
  const token = nanoid(32);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await db.insert(magicLinksTable).values({
    token,
    email,
    householdId,
    expiresAt,
    used: false
  });
  
  // Use PUBLIC_BASE_URL for production, or FRONTEND_URL, or fallback to upkeepqr.com
  const baseUrl = process.env.PUBLIC_BASE_URL 
    || process.env.FRONTEND_URL 
    || 'https://upkeepqr.com';
  
  return `${baseUrl}/auth/magic?token=${token}`;
}

export async function verifyMagicLink(token: string): Promise<{
  email: string;
  householdId: string | null;
}> {
  const [link] = await db
    .select()
    .from(magicLinksTable)
    .where(eq(magicLinksTable.token, token))
    .limit(1);
  
  if (!link) {
    throw new Error('Invalid magic link');
  }
  
  if (link.used) {
    throw new Error('Magic link already used');
  }
  
  if (new Date() > link.expiresAt) {
    throw new Error('Magic link expired');
  }
  
  await db
    .update(magicLinksTable)
    .set({ used: true, usedAt: new Date() })
    .where(eq(magicLinksTable.token, token));
  
  return {
    email: link.email,
    householdId: link.householdId
  };
}

export async function createSession(
  email: string,
  householdId: string | null
): Promise<string> {
  const token = nanoid(32);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  await db.insert(sessionsTable).values({
    token,
    email,
    householdId,
    expiresAt
  });
  
  return token;
}

export async function verifySession(token: string): Promise<{
  email: string;
  householdId: string | null;
} | null> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, token),
        lt(new Date(), sessionsTable.expiresAt)
      )
    )
    .limit(1);
  
  if (!session) {
    return null;
  }
  
  return {
    email: session.email,
    householdId: session.householdId
  };
}

export async function cleanupExpiredLinks(): Promise<void> {
  const now = new Date();
  
  await db
    .delete(magicLinksTable)
    .where(lt(magicLinksTable.expiresAt, now));
  
  await db
    .delete(sessionsTable)
    .where(lt(sessionsTable.expiresAt, now));
}
