import { db } from "../db";
import { householdsTable, featurePermissionsTable } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface FeatureCheck {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  currentUsage?: number;
  limit?: number | null;
}

export async function checkFeatureAccess(
  householdId: string,
  featureKey: string
): Promise<FeatureCheck> {
  const household = await db
    .select({
      subscriptionTier: householdsTable.subscriptionTier,
      subscriptionStatus: householdsTable.subscriptionStatus,
    })
    .from(householdsTable)
    .where(eq(householdsTable.id, householdId))
    .limit(1);

  if (household.length === 0) {
    return { allowed: false, reason: 'Household not found' };
  }

  const { subscriptionTier, subscriptionStatus } = household[0];

  if (!subscriptionStatus || !['trialing', 'active'].includes(subscriptionStatus)) {
    const inGracePeriod = subscriptionStatus === 'past_due';
    if (!inGracePeriod) {
      return {
        allowed: false,
        reason: 'Subscription inactive',
        upgradeUrl: '/pricing'
      };
    }
  }

  const tier = subscriptionTier || 'basic';

  const permission = await db
    .select({
      enabled: featurePermissionsTable.enabled,
      limitValue: featurePermissionsTable.limitValue,
    })
    .from(featurePermissionsTable)
    .where(
      and(
        eq(featurePermissionsTable.subscriptionTier, tier),
        eq(featurePermissionsTable.featureKey, featureKey)
      )
    )
    .limit(1);

  if (permission.length === 0) {
    return {
      allowed: false,
      reason: 'Feature not available on your plan',
      upgradeUrl: '/pricing'
    };
  }

  if (!permission[0].enabled) {
    return {
      allowed: false,
      reason: 'Feature not enabled',
      upgradeUrl: '/pricing'
    };
  }

  return { allowed: true, limit: permission[0].limitValue };
}
