import { useState } from "react";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingCardProps {
  title: string;
  price: string;
  billedAmount: string;
  badge?: string;
  features: string[];
  ctaLabel: string;
  planId: string;
  highlighted?: boolean;
  onGetStarted: (planId: string, planName: string) => void;
  isLoading?: boolean;
}

function PricingCard({
  title,
  price,
  billedAmount,
  badge,
  features,
  ctaLabel,
  planId,
  highlighted = false,
  onGetStarted,
  isLoading = false
}: PricingCardProps) {
  return (
    <div className={`
      relative bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 
      border-2 transition-all duration-300
      hover:shadow-xl hover:-translate-y-1
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
      
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            {price}
          </span>
          <span className="text-slate-600 dark:text-slate-400">/ month</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {billedAmount}
        </p>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => onGetStarted(planId, title)}
        disabled={isLoading}
        className={`
          block w-full text-center py-3 px-6 rounded-lg font-semibold
          transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          ${highlighted
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
            : 'bg-white dark:bg-slate-800 text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700'
          }
        `}
        data-testid={`button-pricing-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {isLoading ? 'Loading...' : ctaLabel}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGetStarted = async (planId: string, planName: string) => {
    setLoadingPlan(planId);
    
    try {
      const response = await fetch('/api/checkout/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: planId,
          plan: planName 
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
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Simple, Smart Home Maintenance Pricing
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-4">
                Monthly plans, billed annually.
                <br />
                Physical QR magnets included.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400">
                No clutter. No complexity. Cancel anytime at renewal.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <PricingCard
                title="Homeowner Basic"
                price="$6.99"
                billedAmount="Billed annually at $69"
                features={[
                  "1 Premium QR Magnet",
                  "Smart maintenance task list",
                  "Climate-based scheduling",
                  "Email reminders",
                  "Up to 3 SMS reminders/month",
                  "Task completion history"
                ]}
                ctaLabel="Get Started"
                planId="homeowner_basic_yearly"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "homeowner_basic_yearly"}
              />

              <PricingCard
                title="Homeowner Plus"
                price="$12.99"
                billedAmount="Billed annually at $129"
                badge="Most Popular"
                features={[
                  "Up to 10 QR magnets",
                  "Manage up to 3 properties",
                  "Appliance-level maintenance tracking",
                  "Priority reminders",
                  "Exportable maintenance history",
                  "Everything in Homeowner Basic"
                ]}
                ctaLabel="Get Started"
                planId="homeowner_plus_yearly"
                highlighted={true}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "homeowner_plus_yearly"}
              />

              <PricingCard
                title="Realtor / Agent"
                price="$39"
                billedAmount="Billed annually at $390"
                features={[
                  "25 branded QR magnets per year",
                  "25 homeowner activations",
                  "Agent dashboard",
                  "Client activation tracking",
                  "Co-branded QR experience"
                ]}
                ctaLabel="Request Agent Access"
                planId="realtor_yearly"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "realtor_yearly"}
              />

              <PricingCard
                title="Property / Maintenance Manager"
                price="$149"
                billedAmount="Billed annually at $1,490"
                features={[
                  "Up to 200 units",
                  "Appliance & unit-level tracking",
                  "Maintenance & service history logs",
                  "Audit & compliance reports",
                  "Bulk branded magnets",
                  "SMS limits per unit"
                ]}
                ctaLabel="Contact Sales"
                planId="property_manager_yearly"
                highlighted={false}
                onGetStarted={handleGetStarted}
                isLoading={loadingPlan === "property_manager_yearly"}
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cancel anytime before renewal, no hassle</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
