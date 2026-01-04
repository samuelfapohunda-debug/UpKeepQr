import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Package, Bell, Shield, Calendar, MapPin, Wrench, Home as HomeIcon } from "lucide-react";

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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        
        {/* Hero Section - Clean, Light */}
        <section className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Your Home's Maintenance, Finally Organized
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
                  UpKeepQR uses smart QR magnets to track service history, reminders, 
                  and home care — just scan and go.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-get-started"
                  >
                    Order Your Magnet
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
                  Trusted by 10,000+ homeowners nationwide
                </p>
              </div>
              
              {/* Right: Product Visual */}
              <div className="relative hidden lg:block">
                <div className="bg-gradient-to-br from-emerald-50 to-slate-100 rounded-2xl p-8 shadow-lg">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <HomeIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Smart QR Magnet</h3>
                        <p className="text-sm text-slate-500">Scan. Track. Maintain.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>37+ maintenance tasks covered</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>Automated SMS & email reminders</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>Climate-based scheduling</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* How It Works - Bento Grid */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                How UpKeepQR Works
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
                  <CardTitle className="text-xl text-slate-900">Order Your Magnet</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    Get your smart QR magnet delivered to your door. 
                    Set up takes less than 5 minutes.
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Card 2 */}
              <Card className="text-center border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">2</span>
                  </div>
                  <CardTitle className="text-xl text-slate-900">Scan & Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    Scan the QR code with your phone and enter your home details.
                    We create your personalized schedule.
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Card 3 */}
              <Card className="text-center border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">3</span>
                  </div>
                  <CardTitle className="text-xl text-slate-900">Get Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base">
                    Receive SMS and email alerts when it's time for maintenance.
                    Never forget again.
                  </CardDescription>
                </CardContent>
              </Card>
              
            </div>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Why Homeowners Love UpKeepQR
              </h2>
              <p className="text-lg sm:text-xl text-slate-600">
                Save money, time, and stress with smart home maintenance
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
                  <p className="text-slate-600">
                    Regular maintenance prevents expensive emergency repairs. 
                    Save thousands on HVAC, plumbing, and appliances.
                  </p>
                </div>
              </div>
              
              {/* Benefit 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Automated Reminders
                  </h3>
                  <p className="text-slate-600">
                    Get SMS and email alerts before tasks are due.
                    Never forget to change filters or service your HVAC again.
                  </p>
                </div>
              </div>
              
              {/* Benefit 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Climate-Based Scheduling
                  </h3>
                  <p className="text-slate-600">
                    Tasks are scheduled based on your local climate zone.
                    Winterize before the first freeze, clean gutters after fall.
                  </p>
                </div>
              </div>
              
              {/* Benefit 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Calendar Integration
                  </h3>
                  <p className="text-slate-600">
                    Add maintenance events directly to your calendar.
                    Works with Google Calendar, Apple, and Outlook.
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
                  <p className="text-slate-600">
                    From HVAC filters to roof inspections, our comprehensive 
                    catalog covers all essential home maintenance tasks.
                  </p>
                </div>
              </div>
              
              {/* Benefit 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No App Required
                  </h3>
                  <p className="text-slate-600">
                    Works directly through your phone's camera.
                    Just scan the QR code — no downloads needed.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                One-time purchase. Lifetime reminders. No subscriptions.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              
              {/* Single Pack */}
              <Card className="relative border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Package className="h-5 w-5 text-emerald-500" />
                    Single Pack
                  </CardTitle>
                  <CardDescription>Perfect for homeowners</CardDescription>
                  <div className="text-4xl font-bold text-slate-900 mt-2">$19</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      1 QR Magnet
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Lifetime Reminders
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Climate-Based Scheduling
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Email & Calendar Sync
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    onClick={() => openStripeCheckout('single')}
                    data-testid="button-single-pack"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Two Pack */}
              <Card className="relative border-slate-200 shadow-sm card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Package className="h-5 w-5 text-emerald-500" />
                    Two Pack
                  </CardTitle>
                  <CardDescription>Great for sharing</CardDescription>
                  <div className="text-4xl font-bold text-slate-900 mt-2">$35</div>
                  <Badge className="absolute -top-3 -right-3 bg-emerald-500 text-white">Save $3</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      2 QR Magnets
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Lifetime Reminders
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Climate-Based Scheduling
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Email & Calendar Sync
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    onClick={() => openStripeCheckout('twopack')}
                    data-testid="button-two-pack"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* 100 Pack */}
              <Card className="relative border-2 border-emerald-500 shadow-md card-hover bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Agent 100-Pack
                  </CardTitle>
                  <CardDescription>For real estate agents</CardDescription>
                  <div className="text-4xl font-bold text-slate-900 mt-2">$899</div>
                  <Badge className="absolute -top-3 -right-3 bg-emerald-500 text-white">Popular</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      100 QR Magnets
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Agent Dashboard
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      Customer Analytics
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      CSV Download
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                    onClick={() => openStripeCheckout('100pack')}
                    data-testid="button-100-pack"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
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
                    No. UpKeepQR works directly through your phone's camera. Just scan the magnet and set reminders instantly — no extra app required.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Is my data safe?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Yes. UpKeepQR only collects the information needed to send you reminders. Your data is never sold or shared with third parties, and you have full control over your settings.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-emerald-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Take Control of Your Home Maintenance?
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of homeowners who never miss maintenance again.
              Order your QR magnet today and get started in minutes.
            </p>
            <Button 
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-8"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-final-cta"
            >
              Get Your Magnet Now
            </Button>
          </div>
        </section>

      </main>
    </div>
  );
}
