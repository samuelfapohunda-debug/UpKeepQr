import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Package } from "lucide-react";

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

export default function Pricing() {

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16">
        {/* Pricing Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple Pricing</h1>
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
      </main>

    </div>
  );
}