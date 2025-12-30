import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Calendar, 
  Bell, 
  Package, 
  Clock, 
  ChevronRight,
  Info,
  Users,
  CheckCircle,
  Shield,
  Zap
} from "lucide-react";

const STRIPE_PAYMENT_LINKS = {
  single: "https://buy.stripe.com/test_14A00l9mwdUFbpncy9gIo07",
  twopack: "https://buy.stripe.com/test_8x27sNdCM03P3WVdCdgIo03",
  "100pack": "https://buy.stripe.com/test_eVq00l42c5o98db69LgIo01",
};

const openStripeCheckout = (sku: keyof typeof STRIPE_PAYMENT_LINKS) => {
  const paymentLink = STRIPE_PAYMENT_LINKS[sku];
  if (paymentLink) {
    window.open(paymentLink, '_blank');
  }
};

function HeroSection() {
  const [, navigate] = useLocation();
  
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight" data-testid="text-hero-headline">
              Never Forget Home Maintenance Again
            </h1>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-hero-subheadline">
              Prevent costly repairs with automated reminders tailored to YOUR home and climate.
            </p>
            
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-hero-value-prop">
              One simple QR magnet = $3,000+ saved
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3" data-testid="text-benefit-tasks">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg text-gray-800 dark:text-gray-200">37 personalized tasks for YOUR home</span>
              </div>
              <div className="flex items-center gap-3" data-testid="text-benefit-reminders">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg text-gray-800 dark:text-gray-200">Reminders before problems happen</span>
              </div>
              <div className="flex items-center gap-3" data-testid="text-benefit-no-hassle">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-lg text-gray-800 dark:text-gray-200">No app, no subscription, no hassle</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="text-lg"
                onClick={() => navigate('/setup/new')}
                data-testid="button-get-free-schedule"
              >
                Get My Free Schedule
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-see-how-it-works"
              >
                See How It Works
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No credit card required - Instant access - No app needed
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="relative">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-32 w-32 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">QR Magnet on Fridge</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 max-w-sm border dark:border-slate-700">
                <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Your Dashboard Preview</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-700 dark:text-gray-300">Replace HVAC Filter</span>
                    <Badge variant="destructive" className="text-xs">Due Jan 15</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-700 dark:text-gray-300">Test Smoke Detectors</span>
                    <Badge className="text-xs">Due Jan 22</Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">+ 35 more tasks</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

function ProblemSolutionSection() {
  return (
    <section className="py-16 px-4 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white" data-testid="text-problem-headline">
          The Silent Home Maintenance Problem
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-lg p-6 space-y-4" data-testid="card-problem-without-system">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mb-4">Without a System:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">Forgotten HVAC filters</p>
                  <p className="text-sm text-red-800 dark:text-red-300">= $1,500 repair + higher energy bills</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">Skipped gutter cleaning</p>
                  <p className="text-sm text-red-800 dark:text-red-300">= $3,000 water damage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">Missed roof inspections</p>
                  <p className="text-sm text-red-800 dark:text-red-300">= Insurance claims + emergency repairs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">"I'll remember later"</p>
                  <p className="text-sm text-red-800 dark:text-red-300">= Expensive regret</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 rounded-lg p-6 space-y-4" data-testid="card-solution-with-upkeep">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-200 mb-4">With UpKeepQR:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">Automated reminders for 37 tasks</p>
                  <p className="text-sm text-green-800 dark:text-green-300">Never forget critical maintenance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">Climate-smart scheduling</p>
                  <p className="text-sm text-green-800 dark:text-green-300">Timed perfectly for your ZIP code</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">One-tap calendar sync</p>
                  <p className="text-sm text-green-800 dark:text-green-300">Add tasks to your calendar instantly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">Always-visible QR magnet</p>
                  <p className="text-sm text-green-800 dark:text-green-300">On your fridge = never out of sight</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [, navigate] = useLocation();
  
  const steps = [
    {
      number: 1,
      icon: Calendar,
      title: "Get Your Free Schedule",
      description: "Answer 3 quick questions (home type, ZIP, email)",
      result: "Instantly see your 37 personalized tasks",
      time: "30 seconds"
    },
    {
      number: 2,
      icon: Bell,
      title: "Activate Smart Reminders",
      description: "One click to enable email + calendar reminders",
      result: "Customized for YOUR climate zone",
      time: "30 seconds"
    },
    {
      number: 3,
      icon: Package,
      title: "Make It Permanent with QR",
      description: "Order your magnet ($19 one-time)",
      result: "Stick on fridge, scan anytime to view tasks",
      time: "Optional"
    },
    {
      number: 4,
      icon: CheckCircle2,
      title: "Stay Protected Forever",
      description: "Reminders keep coming (for life)",
      result: "Log completions, update if you move",
      time: "Ongoing"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            How It Works: Value in 90 Seconds
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Get your personalized maintenance plan instantly—no payment required
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <Card className="h-full flex flex-col pt-8">
                  <div className="absolute -top-4 left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  
                  <CardHeader className="pt-2">
                    <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-grow flex flex-col">
                    <CardDescription className="mb-3 flex-grow">{step.description}</CardDescription>
                    
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      {step.result}
                    </p>
                    
                    <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{step.time}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Instant Access
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                Get your digital dashboard immediately while your magnet ships (3-5 days). 
                You can start getting reminders right away—no waiting!
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            className="text-lg"
            onClick={() => navigate('/setup/new')}
            data-testid="button-get-schedule-how-it-works"
          >
            Get My Free Schedule Now
          </Button>
        </div>
        
      </div>
    </section>
  );
}

function SocialProofSection() {
  const stats = [
    { value: "3,000+", label: "Homes Protected", testId: "text-homes-protected" },
    { value: "37", label: "Maintenance Tasks", testId: "text-maintenance-tasks" },
    { value: "$3,000+", label: "Average Savings", testId: "text-average-savings" },
    { value: "100%", label: "Satisfaction", testId: "text-satisfaction" }
  ];

  return (
    <section className="py-16 px-4 bg-white dark:bg-slate-900" data-testid="section-social-proof">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center" data-testid={stat.testId}>
              <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [, navigate] = useLocation();
  
  return (
    <section id="pricing" className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Simple, One-Time Pricing</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            No subscriptions. No hidden fees. Just pay once and you're set for life.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Single Pack</CardTitle>
              </div>
              <CardDescription>Perfect for homeowners</CardDescription>
              <div className="text-4xl font-bold mt-4">$19</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">one-time payment</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>1 QR Magnet</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Lifetime Reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Climate-Based Scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Email & Calendar Sync</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => openStripeCheckout('single')}
                data-testid="button-single-pack"
              >
                Order Now
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-green-500">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">Best Value</Badge>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle>Two Pack</CardTitle>
              </div>
              <CardDescription>Great for sharing</CardDescription>
              <div className="text-4xl font-bold mt-4">$35</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">one-time payment (save $3)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>2 QR Magnets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Lifetime Reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Climate-Based Scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Email & Calendar Sync</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => openStripeCheckout('twopack')}
                data-testid="button-two-pack"
              >
                Order Now
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-blue-500">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">For Agents</Badge>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Agent 100-Pack</CardTitle>
              </div>
              <CardDescription>For real estate agents</CardDescription>
              <div className="text-4xl font-bold mt-4">$899</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">one-time payment ($8.99/magnet)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>100 QR Magnets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Agent Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Customer Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>CSV Download</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => openStripeCheckout('100pack')}
                data-testid="button-100-pack"
              >
                Order Now
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Want to try first?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 dark:text-blue-400"
              onClick={() => navigate('/setup/new')}
              data-testid="link-try-free"
            >
              Get your free schedule
            </Button>
            {" "}before ordering.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const features = [
    {
      icon: Shield,
      title: "No App Required",
      description: "Works with your phone's camera—no downloads needed",
      testId: "text-trust-no-app"
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get your personalized schedule in under 2 minutes",
      testId: "text-trust-instant"
    },
    {
      icon: CheckCircle2,
      title: "Lifetime Access",
      description: "One-time payment, reminders forever",
      testId: "text-trust-lifetime"
    }
  ];

  return (
    <section className="py-16 px-4 bg-white dark:bg-slate-900" data-testid="section-trust">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center" data-testid={feature.testId}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                  <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "How does the QR magnet work?",
      answer: "Simply scan the QR code with your phone camera to access your personalized dashboard. Enter your home details once and we'll create a customized maintenance schedule based on your climate zone."
    },
    {
      question: "What maintenance tasks are included?",
      answer: "Our system includes 37 essential tasks: HVAC filter changes, gutter cleaning, deck maintenance, sprinkler winterization, smoke detector tests, and many more—all tailored to your specific home type and local climate."
    },
    {
      question: "How often will I get reminders?",
      answer: "Reminders are sent 7, 3, and 1 day before each task is due (based on priority). You'll receive emails with calendar events you can add directly to your calendar app."
    },
    {
      question: "Can I try it before buying a magnet?",
      answer: "Absolutely! Click 'Get My Free Schedule' to create your personalized maintenance plan instantly. You can use the digital dashboard forever—the magnet is just a convenient way to access it from your fridge."
    },
    {
      question: "Do I need to download an app?",
      answer: "No. UpKeepQR works directly through your phone's camera. Just scan the magnet and access your dashboard instantly—no app required."
    },
    {
      question: "Is my personal data safe?",
      answer: "Yes. We only collect information needed to send you reminders (email, home type, ZIP code). Your data is never sold or shared with third parties."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{faq.answer}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const [, navigate] = useLocation();
  
  return (
    <section className="py-20 px-4 bg-blue-600 dark:bg-blue-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Protect Your Home?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of homeowners who never forget maintenance again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg"
            onClick={() => navigate('/setup/new')}
            data-testid="button-final-cta"
          >
            Get My Free Schedule
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg border-white text-white"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="button-view-pricing"
          >
            View Pricing
          </Button>
        </div>
        <p className="text-sm text-blue-200 mt-4">
          No credit card required - Start in 30 seconds
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <SocialProofSection />
        <TrustSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </div>
  );
}
