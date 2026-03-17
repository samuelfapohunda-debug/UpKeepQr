import { useState, useEffect, useRef } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [activating, setActivating] = useState(true);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const maxAutoRetries = 3;
  const attemptedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setActivating(false);
      setActivated(true);
      return;
    }

    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const activate = async (attempt: number) => {
      try {
        setActivating(true);
        setError("");

        const res = await fetch("/api/subscription/activate-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setSubscriptionTier(data.subscriptionTier ?? null);
          setActivated(true);
          setActivating(false);
          return;
        }

        const data = await res.json().catch(() => ({ error: "Server error" }));

        if (res.status === 404 && attempt < maxAutoRetries) {
          setRetryCount(attempt + 1);
          await new Promise(r => setTimeout(r, 3000));
          return activate(attempt + 1);
        }

        setError(data.error || "Could not activate session");
        setActivating(false);
      } catch (err) {
        if (attempt < maxAutoRetries) {
          setRetryCount(attempt + 1);
          await new Promise(r => setTimeout(r, 3000));
          return activate(attempt + 1);
        }
        setError("Could not connect to server. Please try again.");
        setActivating(false);
      }
    };

    activate(0);
  }, []);

  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  const handleGoToDashboard = () => {
    navigate(subscriptionTier === "property_manager" ? "/property-manager" : "/my-home");
  };

  const handleManualRetry = async () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    setActivating(true);
    setError("");
    attemptedRef.current = false;

    try {
      const res = await fetch("/api/subscription/activate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubscriptionTier(data.subscriptionTier ?? null);
        setActivated(true);
      } else {
        const data = await res.json().catch(() => ({ error: "Server error" }));
        setError(data.error || "Could not activate session");
      }
    } catch (err) {
      setError("Could not connect to server. Please try again.");
    } finally {
      setActivating(false);
    }
  };

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

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your 30-day free trial has started. You will not be charged today.
          </p>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              [i] What to do next
            </p>
            <ul className="text-sm text-emerald-600 dark:text-emerald-400 text-left mt-2 space-y-1">
              <li>1. Check your email for a welcome message</li>
              <li>2. Explore your maintenance dashboard</li>
              <li>3. Activate your service</li>
            </ul>
          </div>

          {activating ? (
            <Button className="w-full bg-emerald-600 text-white" disabled data-testid="button-go-to-dashboard">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {retryCount > 0 ? `Setting up your account (attempt ${retryCount + 1})...` : "Setting up your account..."}
            </Button>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600" data-testid="text-activation-error">{error}</p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleManualRetry}
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate("/")}
              data-testid="button-go-to-home"
            >
              Go to Home Page <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </Card>
      </main>
    </div>
  );
}
