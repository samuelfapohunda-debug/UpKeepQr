import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { API_BASE_URL } from "@/lib/api-config";

interface SubscriptionStatus {
  tier: string;
  billingInterval: string;
  status: string;
  trialDaysRemaining: number | null;
  graceDaysRemaining: number | null;
  cancelAtPeriodEnd: boolean;
  hasPaymentMethod: boolean;
}

export default function SubscriptionBanner() {
  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/subscription/status`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
    retry: false,
  });

  if (!subscription) return null;

  if (subscription.status === 'trialing' && subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining <= 5) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap" data-testid="banner-trial-ending">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your trial ends in <strong>{subscription.trialDaysRemaining} day{subscription.trialDaysRemaining !== 1 ? 's' : ''}</strong>
          </p>
        </div>
        <Link href="/settings/billing">
          <Button variant="outline" size="sm" data-testid="button-manage-trial">
            Manage Billing
          </Button>
        </Link>
      </div>
    );
  }

  if (subscription.status === 'past_due') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap" data-testid="banner-past-due">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            [!] Payment issue - update your payment method within {subscription.graceDaysRemaining} day{subscription.graceDaysRemaining !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/settings/billing">
          <Button variant="outline" size="sm" data-testid="button-fix-payment">
            Fix Payment
          </Button>
        </Link>
      </div>
    );
  }

  if (subscription.status === 'unpaid' || subscription.status === 'canceled') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap" data-testid="banner-suspended">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Your account is paused. Resubscribe to restore access.
          </p>
        </div>
        <Link href="/pricing">
          <Button variant="outline" size="sm" data-testid="button-resubscribe">
            Resubscribe
          </Button>
        </Link>
      </div>
    );
  }

  if (subscription.cancelAtPeriodEnd) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap" data-testid="banner-cancel-pending">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your subscription is set to cancel at the end of the billing period.
          </p>
        </div>
        <Link href="/settings/billing">
          <Button variant="outline" size="sm" data-testid="button-manage-subscription">
            Manage
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
