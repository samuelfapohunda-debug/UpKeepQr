import { db } from "../db";
import { canonicalizeEmail, getEmailVariations } from "./emailCanonicalization";
import { householdsTable, signupAttemptsTable } from "@shared/schema";
import { eq, and, sql, gte } from "drizzle-orm";

interface TrialAbuseCheck {
  blocked: boolean;
  reason?: string;
}

export async function checkTrialAbuse(
  email: string,
  ipAddress: string,
  deviceFingerprint?: string
): Promise<TrialAbuseCheck> {
  
  const canonicalEmail = canonicalizeEmail(email);
  
  const canonicalResult = await db
    .select({ id: householdsTable.id, email: householdsTable.email })
    .from(householdsTable)
    .where(
      and(
        eq(householdsTable.trialUsed, true),
        eq(householdsTable.canonicalEmail, canonicalEmail)
      )
    )
    .limit(1);

  if (canonicalResult.length > 0) {
    return {
      blocked: true,
      reason: `Trial already used with this email`
    };
  }

  const variations = getEmailVariations(email);
  
  const variationResult = await db
    .select({ id: householdsTable.id, email: householdsTable.email })
    .from(householdsTable)
    .where(
      and(
        eq(householdsTable.trialUsed, true),
        sql`${householdsTable.email} = ANY(${variations})`
      )
    )
    .limit(1);

  if (variationResult.length > 0) {
    return {
      blocked: true,
      reason: `Trial already used with email variation`
    };
  }

  if (ipAddress) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ipResult = await db
      .select({ emailCount: sql<number>`COUNT(DISTINCT email)` })
      .from(signupAttemptsTable)
      .where(
        and(
          eq(signupAttemptsTable.ipAddress, ipAddress),
          eq(signupAttemptsTable.success, true),
          gte(signupAttemptsTable.createdAt, sevenDaysAgo)
        )
      );

    const emailCount = Number(ipResult[0]?.emailCount ?? 0);
    if (emailCount >= 3) {
      return {
        blocked: true,
        reason: 'Too many trial signups from this network'
      };
    }
  }

  if (deviceFingerprint) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fpResult = await db
      .select({ emailCount: sql<number>`COUNT(DISTINCT email)` })
      .from(signupAttemptsTable)
      .where(
        and(
          eq(signupAttemptsTable.deviceFingerprint, deviceFingerprint),
          eq(signupAttemptsTable.success, true),
          gte(signupAttemptsTable.createdAt, sevenDaysAgo)
        )
      );

    const emailCount = Number(fpResult[0]?.emailCount ?? 0);
    if (emailCount >= 3) {
      return {
        blocked: true,
        reason: 'Too many trial signups from this device'
      };
    }
  }

  return { blocked: false };
}

export async function logSignupAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint: string | undefined,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const canonical = canonicalizeEmail(email);
  
  await db.insert(signupAttemptsTable).values({
    email: email.toLowerCase(),
    canonicalEmail: canonical,
    ipAddress,
    userAgent,
    deviceFingerprint: deviceFingerprint || null,
    success,
    errorMessage: errorMessage || null,
  });
}
