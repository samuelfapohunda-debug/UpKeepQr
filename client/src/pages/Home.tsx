import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Package, Bell, Shield, Calendar, MapPin, Wrench, Home as HomeIcon, X, Building2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const trustStatistics = [
  { number: "5000+", label: "Homeowner subscriptions in North America" },
  { number: "100+", label: "Realtor subscriptions in North America" },
  { number: "20+", label: "Apartment Complex subscriptions in North America" },
];

export default function Home() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentStatIndex((prevIndex) => (prevIndex + 1) % trustStatistics.length);
        setIsAnimating(false);
      }, 500);
      
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async (planId: string, planName: string) => {
    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/checkout/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: planId, plan: planName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start checkout');
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        
        {/* Hero Section - Updated Copy */}
        <section className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Never Miss Home Maintenance Again
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
                  Smart QR codes that track service history and send climate-aware reminders — 
                  so your home stays protected without the guesswork.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-semibold"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-get-started"
                  >
                    Start Free (No Credit Card Required)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-how-it-works"
                  >
                    See How It Works
                  </Button>
                </div>
                
                {/* Trust Badge */}
                <p className="text-sm text-slate-500 mt-6">
                  Trusted by <span className="font-semibold">5,000+</span> homeowners in North US and Canada
                </p>
              </div>
              
              {/* Right: Video Demo */}
              <div className="relative" data-testid="section-video-demo">
                <div className="bg-white rounded-xl p-6 shadow-lg max-w-[600px] mx-auto">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">See MaintCue in Action</h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    See how MaintCue tracks your home's maintenance automatically.
                  </p>

                  <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-slate-100">
                    {/* TODO: Replace placeholder YouTube ID with official MaintCue demo video */}
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="MaintCue Demo - Automated Home Maintenance Tracking"
                      frameBorder="0"
                      loading="lazy"
                      allow="encrypted-media; picture-in-picture"
                      allowFullScreen
                      data-testid="video-demo-iframe"
                    />
                  </div>

                  <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      Setup in under 2 minutes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      No credit card required
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      Works anywhere in the U.S. & Canada
                    </li>
                  </ul>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* Social Proof Section - Rotating Statistics */}
        <section className="py-8 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 md:h-10 flex items-center justify-center overflow-hidden relative">
              <p 
                key={currentStatIndex}
                className={`text-center text-slate-600 text-lg absolute transition-all duration-500 ease-in-out ${
                  isAnimating 
                    ? 'opacity-0 -translate-y-4 rotate-3' 
                    : 'opacity-100 translate-y-0 rotate-0'
                }`}
                data-testid="trust-badge-rotating"
              >
                Trusted by{' '}
                <span className="font-bold text-blue-600 text-xl">
                  {trustStatistics[currentStatIndex].number}
                </span>{' '}
                {trustStatistics[currentStatIndex].label}
              </p>
            </div>
          </div>
        </section>

        {/* Problem → Solution Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Maintenance Is Easy to Forget — Until It's Expensive
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Most homeowners don't realize a skipped filter change can lead to a $3,000 HVAC repair.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* BEFORE Column */}
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <X className="w-6 h-6" />
                    Without MaintCue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Paper lists that get lost</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Forgotten filter changes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Surprise $3,000+ repair bills</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">No service history when selling</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* AFTER Column */}
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="w-6 h-6" />
                    With MaintCue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">One scan, instant setup</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Automatic climate-smart reminders</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Prevent costly repairs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Complete maintenance history</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works - Updated Copy */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                How MaintCue Works
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Three simple steps to never miss home maintenance again
              </p>
            </div>
            
            {/* Bento Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Card 1 */}
              <Card className="text-center border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">1</span>
                  </div>
                  <CardTitle className="text-xl text-slate-900">Order & Attach QR</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    Attach your QR magnet to key appliances. 
                    It arrives ready to use.
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Card 2 */}
              <Card className="text-center border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">2</span>
                  </div>
                  <CardTitle className="text-xl text-slate-900">Scan to Activate</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    We generate your personalized maintenance schedule 
                    based on your home and climate.
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Card 3 */}
              <Card className="text-center border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">3</span>
                  </div>
                  <CardTitle className="text-xl text-slate-900">Get Smart Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    Timely alerts based on your local climate.
                    Never miss a maintenance task again.
                  </CardDescription>
                </CardContent>
              </Card>
              
            </div>

            {/* Micro-copy */}
            <p className="text-center text-sm text-slate-500 mt-8">
              Setup takes under 5 minutes. No app required.
            </p>
          </div>
        </section>

        {/* Benefits Section - Outcome Focused */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                What Happens When You Never Miss Maintenance Again
              </h2>
              <p className="text-lg sm:text-xl text-slate-600">
                Real outcomes from staying on top of your home care
              </p>
            </div>
            
            {/* 2-column grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Benefit 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Prevent Costly Repairs
                  </h3>
                  <p className="text-slate-600 mb-1">
                    Avoid $1,000–$5,000 emergency fixes with timely upkeep.
                  </p>
                  <p className="text-sm text-slate-500">
                    Our climate-smart scheduling adjusts reminders based on your local weather.
                  </p>
                </div>
              </div>
              
              {/* Benefit 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Protect Your Home Value
                  </h3>
                  <p className="text-slate-600 mb-1">
                    Documented maintenance history increases your home's resale value.
                  </p>
                  <p className="text-sm text-slate-500">
                    Complete records show buyers your home has been well cared for.
                  </p>
                </div>
              </div>
              
              {/* Benefit 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Sell Your Home Faster
                  </h3>
                  <p className="text-slate-600 mb-1">
                    Buyers trust homes with documented maintenance history.
                  </p>
                  <p className="text-sm text-slate-500">
                    Exportable reports make disclosures and negotiations easier.
                  </p>
                </div>
              </div>
              
              {/* Benefit 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Stop Worrying, Start Living
                  </h3>
                  <p className="text-slate-600 mb-1">
                    We remember so you don't have to.
                  </p>
                  <p className="text-sm text-slate-500">
                    Get SMS and email alerts before tasks are due. Just check them off.
                  </p>
                </div>
              </div>
              
              {/* Benefit 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    37+ Tasks Covered
                  </h3>
                  <p className="text-slate-600 mb-1">
                    From HVAC filters to roof inspections — we've got it all.
                  </p>
                  <p className="text-sm text-slate-500">
                    Comprehensive catalog tailored to your home type and climate zone.
                  </p>
                </div>
              </div>
              
              {/* Benefit 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No App Required
                  </h3>
                  <p className="text-slate-600 mb-1">
                    Works directly through your phone's camera.
                  </p>
                  <p className="text-sm text-slate-500">
                    Just scan the QR code — no downloads, no accounts to remember.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* Who MaintCue Is For */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Built for Homeowners — Powerful Enough for Professionals
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Whether you're protecting your own home or managing properties for clients, 
                MaintCue scales with your needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Homeowners */}
              <Card className="border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <HomeIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Homeowners</CardTitle>
                  <CardDescription>Peace of mind and home value protection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Never forget maintenance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Protect your investment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Simple setup in minutes</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-audience-homeowners"
                  >
                    Start Free
                  </Button>
                </CardContent>
              </Card>

              {/* Multi-Property Owners */}
              <Card className="border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Multi-Property Owners</CardTitle>
                  <CardDescription>Centralized tracking for all your properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Manage up to 3 properties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Exportable history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Track everything in one place</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-audience-multi-property"
                  >
                    View Plus Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Realtors & Agents */}
              <Card className="border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Realtors & Agents</CardTitle>
                  <CardDescription>Branded closing gifts that keep clients engaged</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">25 branded QR magnets/year</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Client dashboard access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Stand out from competitors</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-audience-realtor"
                  >
                    View Realtor Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Property Managers */}
              <Card className="border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Property Managers</CardTitle>
                  <CardDescription>Compliance and audit logs at scale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Manage up to 200 units</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Complete maintenance logs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Regulatory compliance</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-audience-property-manager"
                  >
                    View Manager Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple, Smart Home Maintenance Pricing</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Simple pricing. No clutter. Cancel anytime at renewal.
              </p>
              <p className="text-base text-slate-500 mt-2">
                Monthly plans, billed annually. Physical QR magnets included.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Homeowner Basic */}
              <Card className="relative border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Package className="h-5 w-5 text-emerald-500" />
                    Homeowner Basic
                  </CardTitle>
                  <CardDescription>Perfect for single-home owners</CardDescription>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-slate-900">$6.99</span>
                    <span className="text-slate-600">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Billed annually at $69</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      1 Premium QR Magnet
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Smart maintenance task list
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Climate-based scheduling
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Email reminders
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Up to 3 SMS reminders/month
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Task completion history
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    data-testid="button-homeowner-basic"
                    onClick={() => handleCheckout('homeowner_basic_yearly', 'Homeowner Basic')}
                    disabled={loadingPlan === 'homeowner_basic_yearly'}
                  >
                    {loadingPlan === 'homeowner_basic_yearly' ? 'Loading...' : 'Start Free'}
                  </Button>
                </CardContent>
              </Card>

              {/* Homeowner Plus - Most Popular */}
              <Card className="relative border-2 border-emerald-500 shadow-lg card-hover bg-white">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4">Most Popular</Badge>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Package className="h-5 w-5 text-emerald-500" />
                    Homeowner Plus
                  </CardTitle>
                  <CardDescription>For multi-property owners</CardDescription>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-slate-900">$12.99</span>
                    <span className="text-slate-600">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Billed annually at $129</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Up to 10 QR magnets
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Manage up to 3 properties
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Appliance-level maintenance tracking
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Priority reminders
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Exportable maintenance history
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Everything in Homeowner Basic
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    data-testid="button-homeowner-plus"
                    onClick={() => handleCheckout('homeowner_plus_yearly', 'Homeowner Plus')}
                    disabled={loadingPlan === 'homeowner_plus_yearly'}
                  >
                    {loadingPlan === 'homeowner_plus_yearly' ? 'Loading...' : 'Start Free'}
                  </Button>
                </CardContent>
              </Card>

              {/* Realtor / Agent */}
              <Card className="relative border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Realtor / Agent
                  </CardTitle>
                  <CardDescription>For real estate professionals</CardDescription>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-slate-900">$39</span>
                    <span className="text-slate-600">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Billed annually at $390</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      25 branded QR magnets per year
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      25 homeowner activations
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Agent dashboard
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Client activation tracking
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Co-branded QR experience
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    data-testid="button-realtor-agent"
                    onClick={() => handleCheckout('realtor_yearly', 'Realtor / Agent')}
                    disabled={loadingPlan === 'realtor_yearly'}
                  >
                    {loadingPlan === 'realtor_yearly' ? 'Loading...' : 'Start Free'}
                  </Button>
                </CardContent>
              </Card>

              {/* Property Manager */}
              <Card className="relative border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Property / Maintenance Manager
                  </CardTitle>
                  <CardDescription>For property management companies</CardDescription>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-slate-900">$149</span>
                    <span className="text-slate-600">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Billed annually at $1,490</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Up to 200 units
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Appliance & unit-level tracking
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Maintenance & service history logs
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Audit & compliance reports
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Bulk branded magnets
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      SMS limits per unit
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    data-testid="button-property-manager"
                    onClick={() => handleCheckout('property_manager_yearly', 'Property Manager')}
                    disabled={loadingPlan === 'property_manager_yearly'}
                  >
                    {loadingPlan === 'property_manager_yearly' ? 'Loading...' : 'Start Free'}
                  </Button>
                </CardContent>
              </Card>

            </div>
            
            {/* No credit card note */}
            <p className="text-center text-sm text-slate-500 mt-8">
              No credit card required to get started.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">How does the QR magnet work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Simply scan the QR code with your phone camera to access the setup page. Enter your home details and we'll create a customized maintenance schedule based on your climate zone.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">What maintenance tasks are included?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Our system includes HVAC filter changes, gutter cleaning, deck maintenance, sprinkler winterization, and many more tasks tailored to your specific home type and local climate.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">How often will I get reminders?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Reminders are sent 7 days before each task is due. You'll receive an email with a calendar event you can add directly to your calendar app.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Can I customize my maintenance schedule?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Currently, our system automatically generates schedules based on proven best practices for your climate zone. Custom scheduling options will be available in future updates.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Do I need to download an app?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    No. MaintCue works directly through your phone's camera. Just scan the magnet and set reminders instantly — no extra app required.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Is my data safe?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Yes. MaintCue only collects the information needed to send you reminders. Your data is never sold or shared with third parties, and you have full control over your settings.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Updated */}
        <section className="py-20 bg-emerald-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Stop Guessing and Start Protecting?
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of homeowners who never miss maintenance again.
            </p>
            <Button 
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-6 text-lg font-semibold"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-final-cta"
            >
              Get Started Free
            </Button>
            <p className="text-sm text-emerald-100 mt-6">
              No credit card required. Cancel anytime. 30-day guarantee.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
