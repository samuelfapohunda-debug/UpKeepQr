import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Package, Mail, Phone, MapPin } from "lucide-react";

// Stripe Payment Links mapping
const STRIPE_PAYMENT_LINKS = {
  single: "https://buy.stripe.com/test_14A00l9mwdUFbpncy9gIo07", // 1 QR Magnet - $19
  twopack: "https://buy.stripe.com/test_8x27sNdCM03P3WVdCdgIo03", // 2 QR Magnets - $35
  "100pack": "https://buy.stripe.com/test_eVq00l42c5o98db69LgIo01", // 100 QR Magnets - $899
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
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Smart Home Maintenance Management
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Transform your home maintenance with QR-powered scheduling, automated reminders, and climate-based task management.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-get-started">
                  Get Started
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('how-it-works')?.scrollIntoView()}>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed">
                  Get your home maintenance on autopilot in four simple steps
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-center gap-6 py-12 lg:grid-cols-4">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <CardTitle>Get Your Magnet</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Order your QR code magnet pack and place it on your refrigerator or utility area
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <CardTitle>Scan & Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Scan the QR code and enter your home details to create a personalized maintenance schedule
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-orange-600">3</span>
                  </div>
                  <CardTitle>Climate-Based Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our system creates optimal maintenance schedules based on your local climate zone
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-purple-600">4</span>
                  </div>
                  <CardTitle>Get Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receive timely email reminders with calendar events to keep your home in perfect condition
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple Pricing</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed">
                  Choose the plan that fits your needs
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-center gap-6 py-12 lg:grid-cols-3">
              {/* Single Pack */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Single Pack
                  </CardTitle>
                  <CardDescription>Perfect for homeowners</CardDescription>
                  <div className="text-3xl font-bold">$19</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      1 QR Magnet
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Lifetime Reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Climate-Based Scheduling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Email & Calendar Sync
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => openStripeCheckout('single')}
                    data-testid="button-single-pack"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Two Pack */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Two Pack
                  </CardTitle>
                  <CardDescription>Great for sharing</CardDescription>
                  <div className="text-3xl font-bold">$35</div>
                  <Badge className="absolute -top-2 -right-2 bg-green-500">Save $3</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      2 QR Magnets
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Lifetime Reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Climate-Based Scheduling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Email & Calendar Sync
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => openStripeCheckout('twopack')}
                    data-testid="button-two-pack"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* 100 Pack */}
              <Card className="relative border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Agent 100-Pack
                  </CardTitle>
                  <CardDescription>For real estate agents</CardDescription>
                  <div className="text-3xl font-bold">$899</div>
                  <Badge className="absolute -top-2 -right-2 bg-blue-500">Popular</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      100 QR Magnets
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Agent Dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Customer Analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      CSV Download
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Frequently Asked Questions</h2>
            </div>
            <div className="mx-auto max-w-4xl grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>How does the QR magnet work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Simply scan the QR code with your phone camera to access the setup page. Enter your home details and we'll create a customized maintenance schedule based on your climate zone.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>What maintenance tasks are included?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our system includes HVAC filter changes, gutter cleaning, deck maintenance, sprinkler winterization, and many more tasks tailored to your specific home type and local climate.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>How often will I get reminders?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Reminders are sent 7 days before each task is due. You'll receive an email with a calendar event you can add directly to your calendar app.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Can I customize my maintenance schedule?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Currently, our system automatically generates schedules based on proven best practices for your climate zone. Custom scheduling options will be available in future updates.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Do I need to download an app to use UpKeepQR?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    No. UpKeepQR works directly through your phone's camera. Just scan the magnet and set reminders instantly — no extra app required.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Will my personal data be safe if I use UpKeepQR?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Yes. UpKeepQR only collects the information needed to send you reminders. Your data is never sold or shared with third parties, and you have full control over your reminder settings.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}