import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function SubscriptionSuccess() {
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
              <li>3. Scan your QR magnet when it arrives</li>
            </ul>
          </div>

          <Link href="/my-home">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-go-to-dashboard">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
