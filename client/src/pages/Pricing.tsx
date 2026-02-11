import { useState } from "react";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

function BillingToggle({ interval, onChange }: { interval: 'monthly' | 'annual'; onChange: (v: 'monthly' | 'annual') => void }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <span className={`text-sm font-medium ${interval === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onChange(interval === 'monthly' ? 'annual' : 'monthly')}
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
          interval === 'annual' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
        data-testid="toggle-billing-interval"
        aria-label="Toggle billing interval"
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
          interval === 'annual' ? 'translate-x-7' : 'translate-x-0'
        }`} />
      </button>
      <span className={`text-sm font-medium ${interval === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        Annual
      </span>
      {interval === 'annual' && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
          Save 30%
        </span>
      )}
    </div>
  );
}

interface PricingCardProps {
  title: string;
  monthlyPrice: string;
  annualPrice: string;
  billingInterval: 'monthly' | 'annual';
  badge?: string;
  features: string[];
  ctaLabel: string;
  planId: string;
  highlighted?: boolean;
  onGetStarted: (planId: string, interval: 'monthly' | 'annual') => void;
  isLoading?: boolean;
  trialDays?: number;
}

function PricingCard({
  title,
  monthlyPrice,
  annualPrice,
  billingInterval,
  badge,
  features,
  ctaLabel,
  planId,
  highlighted = false,
  onGetStarted,
  isLoading = false,
  trialDays = 30,
}: PricingCardProps) {
  const price = billingInterval === 'monthly' ? monthlyPrice : annualPrice;
  const billedText = billingInterval === 'monthly'
    ? 'Billed monthly'
    : `Billed annually at $${(parseFloat(annualPrice.replace('$', '')) * 12).toFixed(0)}`;

  return (
    <div className={`
      relative bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 
      border-2 transition-all duration-300
      ${highlighted 
        ? 'border-emerald-500 shadow-lg' 
        : 'border-slate-200 dark:border-slate-700 shadow-sm'
      }
    `}>
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            {badge}
          </span>
        </div>
      )}
      
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2" data-testid={`text-plan-title-${planId}`}>
        {title}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white" data-testid={`text-plan-price-${planId}`}>
            {price}
          </span>
          <span className="text-slate-600 dark:text-slate-400">/ month</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {billedText}
        </p>
      </div>

      {trialDays > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300" data-testid={`text-trial-info-${planId}`}>
            {trialDays}-day free trial included
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            No charge until trial ends. Cancel anytime.
          </p>
        </div>
      )}
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        onClick={() => onGetStarted(planId, billingInterval)}
        disabled={isLoading}
        variant={highlighted ? "default" : "outline"}
        className={`w-full ${highlighted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
        data-testid={`button-pricing-${planId}`}
      >
        {isLoading ? 'Loading...' : ctaLabel}
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const { toast } = useToast();

  const handleGetStarted = async (planId: string, interval: 'monthly' | 'annual') => {
    setLoadingPlan(planId);
    
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billingInterval: interval,
          email: '',
          name: '',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Unavailable",
        description: "Subscription checkout is being set up. Please contact us to get started.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <main className="flex-1 pt-16">
        <section className="w-full py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Simple, Smart Home Maintenance Pricing
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-2">
                Start with a 30-day free trial. No credit card required to explore.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400">
                No clutter. No complexity. Cancel anytime.
              </p>
            </div>

            <BillingToggle interval={billingInterval} onChange={setBillingInterval} />

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Homeowner Basic"
                monthlyPrice="$9.99"
                annualPrice="$6.99"
                billingInterval={billingInterval}
                features={[
                  "1 Premium QR Magnet",
                  "Smart maintenance task list",
                  "Climate-based scheduling",
                  "Email reminders",
                  "Up to 3 SMS reminders/month",
                  "Task completion history"
                ]}
                ctaLabel="Start Free Trial"
                planId="homeowner_basic"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "homeowner_basic"}
                trialDays={30}
              />

              <PricingCard
                title="Homeowner Plus"
                monthlyPrice="$16.99"
                annualPrice="$12.99"
                billingInterval={billingInterval}
                badge="Most Popular"
                features={[
                  "Up to 10 QR magnets",
                  "Manage up to 3 properties",
                  "Appliance-level maintenance tracking",
                  "Priority reminders",
                  "Exportable maintenance history",
                  "Everything in Homeowner Basic"
                ]}
                ctaLabel="Start Free Trial"
                planId="homeowner_plus"
                highlighted={true}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "homeowner_plus"}
                trialDays={30}
              />

              <PricingCard
                title="Realtor / Agent"
                monthlyPrice="$49"
                annualPrice="$39"
                billingInterval={billingInterval}
                features={[
                  "25 branded QR magnets per year",
                  "25 homeowner activations",
                  "Agent dashboard",
                  "Client activation tracking",
                  "Co-branded QR experience"
                ]}
                ctaLabel="Request Agent Access"
                planId="realtor"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "realtor"}
                trialDays={0}
              />

              <PricingCard
                title="Property Manager"
                monthlyPrice="$199"
                annualPrice="$149"
                billingInterval={billingInterval}
                features={[
                  "Up to 200 units",
                  "Appliance & unit-level tracking",
                  "Maintenance & service history logs",
                  "Audit & compliance reports",
                  "Bulk branded magnets",
                  "SMS limits per unit"
                ]}
                ctaLabel="Contact Sales"
                planId="property_manager"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "property_manager"}
                trialDays={0}
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-800 py-12 md:py-16 mt-12 md:mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
              All Plans Include
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Physical QR magnets shipped to you</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">High-quality, weatherproof magnets</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Secure cloud access</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Your data is encrypted and protected</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">No ads</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Clean interface, focused on your needs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Easy cancellation</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cancel anytime, no hassle</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h3>

            <div className="text-left space-y-6 mt-8">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">How does the free trial work?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You get full access for 30 days. We will send you a reminder 3 days before your trial ends. If you do not cancel before the trial is over, your card on file will be charged for the plan you selected.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Can I switch between monthly and annual?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes. You can switch your billing interval at any time from your billing settings. Changes take effect at your next billing cycle.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">What happens if my payment fails?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You will have a 3-day grace period to update your payment method. During this time, your account remains fully functional. After the grace period, access will be paused until payment is resolved.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">How do I cancel?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You can cancel anytime from your billing settings page. Your access continues until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
