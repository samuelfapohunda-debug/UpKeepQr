import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, AlertTriangle, Clock, ExternalLink, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    past_due: { label: "Past Due", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    canceled: { label: "Canceled", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    unpaid: { label: "Paused", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    incomplete: { label: "Incomplete", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };

  const v = variants[status] || variants.incomplete;
  return <Badge className={v.className} data-testid="badge-subscription-status">{v.label}</Badge>;
}

export default function BillingSettings() {
  const { toast } = useToast();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");

  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/subscription/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch subscription status');
      return res.json();
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/subscription/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to open billing portal');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Unable to open billing portal",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: cancelReason,
          feedback: cancelFeedback,
        }),
      });
      if (!res.ok) throw new Error('Failed to cancel subscription');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription canceled",
        description: "Your access will continue until the end of your billing period.",
      });
      setShowCancelForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: () => {
      toast({
        title: "Unable to cancel",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8" data-testid="text-billing-title">
        Billing Settings
      </h1>

      {subscription?.status === 'past_due' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200" data-testid="text-payment-warning">
              [!] Payment issue
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Your last payment failed. Please update your payment method within {subscription.graceDaysRemaining} day{subscription.graceDaysRemaining !== 1 ? 's' : ''} to keep your account active.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              data-testid="button-update-payment"
            >
              <CreditCard className="w-4 h-4 mr-2" /> Update Payment Method
            </Button>
          </div>
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Plan</h2>
          {subscription && <StatusBadge status={subscription.status} />}
        </div>

        {subscription ? (
          <div className="space-y-3">
            <div className="flex justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">Plan</span>
              <span className="font-medium text-slate-900 dark:text-white capitalize" data-testid="text-plan-name">
                {subscription.tier || 'Basic'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">Billing</span>
              <span className="font-medium text-slate-900 dark:text-white capitalize" data-testid="text-billing-interval">
                {subscription.billingInterval || '--'}
              </span>
            </div>

            {subscription.status === 'trialing' && subscription.trialDaysRemaining !== null && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">Trial remaining</span>
                <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1" data-testid="text-trial-remaining">
                  <Clock className="w-4 h-4" /> {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mt-3">
                <p className="text-sm text-slate-600 dark:text-slate-400" data-testid="text-cancel-pending">
                  [i] Your subscription will cancel at the end of your current billing period. You will keep access until then.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No active subscription found.</p>
        )}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Method</h2>
        <Button
          variant="outline"
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
          data-testid="button-manage-billing"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {portalMutation.isPending ? 'Opening...' : 'Manage in Stripe'}
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Update your card, download invoices, or change your billing details.
        </p>
      </Card>

      {subscription && !subscription.cancelAtPeriodEnd && ['trialing', 'active'].includes(subscription.status) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cancel Subscription</h2>

          {!showCancelForm ? (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                If you cancel, you will keep access until the end of your current billing period.
              </p>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 dark:border-red-800 dark:text-red-400"
                onClick={() => setShowCancelForm(true)}
                data-testid="button-show-cancel"
              >
                <X className="w-4 h-4 mr-2" /> Cancel Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Why are you canceling?
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  data-testid="select-cancel-reason"
                >
                  <option value="">Select a reason (optional)</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using it enough</option>
                  <option value="missing_features">Missing features I need</option>
                  <option value="found_alternative">Found an alternative</option>
                  <option value="temporary">Just taking a break</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Anything else you would like to share? (optional)
                </label>
                <Textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  className="resize-none"
                  data-testid="textarea-cancel-feedback"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelForm(false)}
                  data-testid="button-cancel-back"
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  data-testid="button-confirm-cancel"
                >
                  {cancelMutation.isPending ? 'Canceling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
