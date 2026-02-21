import { useState } from "react";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useGoogleLogin } from '@react-oauth/google';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function AuthModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading,
  planType
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (email: string, firstName: string, lastName: string) => void;
  isLoading: boolean;
  planType: 'trial' | 'enterprise';
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = await userInfoResponse.json();
      const nameParts = (userInfo.name || '').split(' ');
      const gFirstName = nameParts[0] || '';
      const gLastName = nameParts.slice(1).join(' ') || '';
      onSubmit(userInfo.email, gFirstName, gLastName);
    } catch (err: any) {
      toast({
        title: "Google Sign-In Error",
        description: err.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast({
        title: "Sign-In Failed",
        description: "Could not sign in with Google. Please try email instead.",
        variant: "destructive"
      });
    },
  });

  if (!isOpen) return null;

  const handleEmailChange = (value: string) => {
    setEmail(value.trim());
    if (emailError && value.trim()) setEmailError('');
  };

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedEmail || !trimmedFirst || !trimmedLast) return;
    
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    onSubmit(trimmedEmail, trimmedFirst, trimmedLast);
  };

  const isEnterprise = planType === 'enterprise';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isEnterprise ? 'Request Enterprise Access' : 'Start Your Free Trial'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isEnterprise 
              ? 'Our sales team will contact you within 24 hours'
              : '30 days free. Card required but not charged until trial ends.'
            }
          </p>
        </div>

        {!isEnterprise && (
          <>
            <div className="space-y-3 mb-6">
              <button 
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => googleLogin()}
                data-testid="button-google-oauth"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-slate-700 dark:text-slate-300">Continue with Google</span>
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                emailError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:ring-emerald-500'
              }`}
              data-testid="input-email"
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                {emailError}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium text-base"
            disabled={isLoading || !email || !firstName || !lastName}
            data-testid="button-auth-submit"
          >
            {isLoading ? 'Loading...' : (isEnterprise ? 'Submit Request' : 'Continue')}
          </Button>

          {!isEnterprise && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              You'll be redirected to secure checkout
            </p>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms-of-service" className="text-emerald-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy-policy" className="text-emerald-600 hover:underline">Privacy Policy</a>
        </p>

        {!isEnterprise && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
            Secure checkout powered by Stripe
          </p>
        )}
      </div>
    </div>
  );
}

function BillingToggle({ interval, onChange }: { interval: 'monthly' | 'annual'; onChange: (v: 'monthly' | 'annual') => void }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <span className={`text-sm font-medium transition-colors ${interval === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onChange(interval === 'monthly' ? 'annual' : 'monthly')}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
          interval === 'annual' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
        aria-label="Toggle billing interval"
        data-testid="button-billing-toggle"
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 transform ${
          interval === 'annual' ? 'translate-x-7 scale-105' : 'translate-x-0'
        }`} />
      </button>
      <span className={`text-sm font-medium transition-colors ${interval === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        Annual
      </span>
      {interval === 'annual' && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-top-2">
          Save 30%
        </span>
      )}
    </div>
  );
}

interface PlanConfig {
  id: string;
  title: string;
  monthlyPrice: string;
  annualPrice: string;
  badge?: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
  trialDays: number;
  type: 'trial' | 'enterprise';
}

const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'homeowner_basic',
    title: 'Homeowner Basic',
    monthlyPrice: '$9.99',
    annualPrice: '$6.99',
    features: [
      '1 Premium QR Magnet',
      'Smart maintenance task list',
      'Climate-based scheduling',
      'Email reminders',
      'Up to 3 SMS reminders/month',
      'Task completion history'
    ],
    ctaLabel: 'Start Free Trial',
    highlighted: false,
    trialDays: 30,
    type: 'trial'
  },
  {
    id: 'homeowner_plus',
    title: 'Homeowner Plus',
    monthlyPrice: '$16.99',
    annualPrice: '$12.99',
    badge: 'Most Popular',
    features: [
      'Up to 10 QR magnets',
      'Manage up to 3 properties',
      'Appliance-level maintenance tracking',
      'Priority reminders',
      'Exportable maintenance history',
      'Everything in Homeowner Basic'
    ],
    ctaLabel: 'Start Free Trial',
    highlighted: true,
    trialDays: 30,
    type: 'trial'
  },
  {
    id: 'realtor',
    title: 'Realtor / Agent',
    monthlyPrice: '$49',
    annualPrice: '$39',
    features: [
      '25 branded QR magnets per year',
      '25 homeowner activations',
      'Agent dashboard',
      'Client activation tracking',
      'Co-branded QR experience'
    ],
    ctaLabel: 'Request Agent Access',
    highlighted: false,
    trialDays: 0,
    type: 'enterprise'
  },
  {
    id: 'property_manager',
    title: 'Property Manager',
    monthlyPrice: '$199',
    annualPrice: '$149',
    features: [
      'Up to 200 units',
      'Appliance & unit-level tracking',
      'Maintenance & service history logs',
      'Audit & compliance reports',
      'Bulk branded magnets',
      'SMS limits per unit'
    ],
    ctaLabel: 'Contact Sales',
    highlighted: false,
    trialDays: 0,
    type: 'enterprise'
  }
];

interface PricingCardProps extends PlanConfig {
  billingInterval: 'monthly' | 'annual';
  onGetStarted: (planId: string, interval: 'monthly' | 'annual', type: 'trial' | 'enterprise') => void;
  isLoading?: boolean;
}

function PricingCard({
  id, title, monthlyPrice, annualPrice, billingInterval, badge, features,
  ctaLabel, highlighted = false, onGetStarted, isLoading = false, trialDays, type
}: PricingCardProps) {
  const currentPrice = billingInterval === 'monthly' ? monthlyPrice : annualPrice;
  const monthlyPriceNum = parseFloat(monthlyPrice.replace('$', ''));
  const annualPriceNum = parseFloat(annualPrice.replace('$', ''));
  const annualTotal = (annualPriceNum * 12).toFixed(2);
  
  const savings = billingInterval === 'annual' 
    ? Math.round(((monthlyPriceNum - annualPriceNum) / monthlyPriceNum) * 100)
    : 0;

  return (
    <div className={`relative bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 border-2 transition-all duration-300 ${
      highlighted ? 'border-emerald-500 shadow-lg' : 'border-slate-200 dark:border-slate-700 shadow-sm'
    }`} data-testid={`card-pricing-${id}`}>
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            {badge}
          </span>
        </div>
      )}
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          {billingInterval === 'annual' && (
            <span className="text-lg text-slate-400 dark:text-slate-500 line-through">
              {monthlyPrice}
            </span>
          )}
          <span className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{currentPrice}</span>
          <span className="text-slate-600 dark:text-slate-400">/ month</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {billingInterval === 'monthly' 
            ? 'Billed monthly' 
            : `Billed annually at $${annualTotal} (Save ${savings}%)`
          }
        </p>
      </div>
      {trialDays > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{trialDays}-day free trial included</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Card required but not charged until trial ends</p>
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
        onClick={() => onGetStarted(id, billingInterval, type)}
        disabled={isLoading}
        variant={highlighted ? "default" : "outline"}
        className={`w-full ${highlighted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
        data-testid={`button-get-started-${id}`}
      >
        {isLoading ? 'Loading...' : ctaLabel}
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{planId: string, interval: 'monthly' | 'annual', type: 'trial' | 'enterprise'} | null>(null);
  const { toast } = useToast();

  const handleGetStarted = (planId: string, interval: 'monthly' | 'annual', type: 'trial' | 'enterprise') => {
    setPendingPlan({ planId, interval, type });
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (email: string, firstName: string, lastName: string) => {
    if (!pendingPlan) return;

    const { planId, interval, type } = pendingPlan;
    setShowAuthModal(false);
    setLoadingPlan(planId);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          billingInterval: interval,
          email,
          name: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (type === 'enterprise') {
        toast({
          title: "Request Submitted!",
          description: "Our sales team will contact you within 24 hours.",
        });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSubmit={handleAuthSubmit}
        isLoading={!!loadingPlan}
        planType={pendingPlan?.type || 'trial'}
      />

      <main className="flex-1 pt-16">
        <section className="w-full py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Simple, Smart Home Maintenance Pricing
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-2">
                Start with a 30-day free trial. Card required but not charged until trial ends.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400">
                No clutter. No complexity. Cancel anytime.
              </p>
            </div>

            <BillingToggle interval={billingInterval} onChange={setBillingInterval} />

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {PRICING_PLANS.map(plan => (
                <PricingCard
                  key={plan.id}
                  {...plan}
                  billingInterval={billingInterval}
                  onGetStarted={handleGetStarted}
                  isLoading={loadingPlan === plan.id}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-800 py-12 md:py-16 mt-12 md:mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">All Plans Include</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {title: "Physical QR magnets shipped to you", desc: "High-quality, weatherproof magnets"},
                {title: "Secure cloud access", desc: "Your data is encrypted and protected"},
                {title: "No ads", desc: "Clean interface, focused on your needs"},
                {title: "Easy cancellation", desc: "Cancel anytime, no hassle"},
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h3>
            <div className="text-left space-y-6 mt-8">
              {[
                {q: "How does the free trial work?", a: "You get full access for 30 days. We require a card upfront but won't charge it until your trial ends. Cancel anytime before then--no questions asked."},
                {q: "Can I switch between monthly and annual?", a: "Yes. You can switch your billing interval at any time from your billing settings. Changes take effect at your next billing cycle."},
                {q: "What happens if my payment fails?", a: "You'll have a 3-day grace period to update your payment method. During this time, your account remains fully functional. After the grace period, access will be paused until payment is resolved."},
                {q: "How do I cancel?", a: "You can cancel anytime from your billing settings page. Your access continues until the end of your current billing period."},
              ].map((item, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{item.q}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
