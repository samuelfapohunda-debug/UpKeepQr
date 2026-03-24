import { useState, useEffect } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api-config";

export default function SubscriptionSuccess() {
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/setup-token?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.token) setSetupUrl(`/set-password?token=${encodeURIComponent(data.token)}`);
      })
      .catch(() => { /* fall back to email message */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2" data-testid="text-subscription-success-title">
            Welcome to MaintCue!
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Your 30-day free trial has started. You will not be charged today.
          </p>

          {loading ? (
            <Button className="w-full bg-emerald-600 text-white" disabled data-testid="button-setup-loading">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparing your account...
            </Button>
          ) : (
            <>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base py-6"
                onClick={() => window.location.href = setupUrl ?? '/customer-login'}
                data-testid="button-set-up-account"
              >
                Set Up My Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-4" data-testid="text-email-fallback">
                A setup link has also been sent to your email.
              </p>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
