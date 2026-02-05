import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Mail, Calendar, Bell, Smartphone } from "lucide-react";

export default function RegistrationSuccess() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const householdId = urlParams.get("household");
  const customerName = urlParams.get("name") || "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl" data-testid="text-welcome-title">Welcome to MaintCue!</CardTitle>
          <CardDescription className="text-lg">
            Your home has been successfully registered
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-300 font-medium" data-testid="text-registration-complete">
              Registration Complete, {customerName}!
            </p>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              We're now generating your personalized maintenance schedule based on your home details.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              What Happens Next
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Personalized Schedule Generated</p>
                  <p className="text-sm text-muted-foreground">
                    We've created{" "}
                    <span className="font-semibold text-blue-600">37 maintenance tasks</span>
                    {" "}tailored to your home's specific needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">First Reminder Coming Soon</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive your first maintenance reminder via email within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">Access Your Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Track your maintenance tasks, view history, and manage your home on any device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-300">Check Your Email</p>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                We've sent you login credentials and next steps to help you get started.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-300 mb-2">Mobile-Friendly Dashboard</p>
                <p className="text-sm text-purple-800 dark:text-purple-400 mb-3">
                  Access your maintenance tasks from anywhere! Our mobile-optimized dashboard works perfectly on phones and tablets.
                </p>
                {householdId && (
                  <Button
                    onClick={() => navigate(`/my-home?household=${householdId}`)}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                    size="sm"
                    data-testid="button-open-dashboard"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Open Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Quick Tips
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Stick your QR code magnet on your main appliance (fridge, water heater, etc.)</li>
              <li>Add our email to your contacts to ensure you receive reminders</li>
              <li>Bookmark your dashboard for easy access from any device</li>
              <li>Complete tasks on time to maintain your home's value and safety</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {householdId && (
              <Button
                onClick={() => navigate(`/my-home?household=${householdId}`)}
                className="flex-1"
                size="lg"
                data-testid="button-go-to-dashboard"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="flex-1"
              size="lg"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at{" "}
              <a href="mailto:support@maintcue.com" className="text-blue-600 hover:underline">
                support@maintcue.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
