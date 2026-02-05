import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, Calendar, Bell, Home, Download, Package, Wrench, Mail } from "lucide-react";
import HomeProfileExtraForm from "@/components/HomeProfileExtraForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function PaymentSuccessContent() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate]);

  const handleGoHomeNow = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 
          className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4"
          data-testid="text-payment-success"
        >
          Payment Successful!
        </h1>
        
        <p className="text-lg text-slate-700 text-center mb-8">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        
        {/* Email Activation Section */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Check Your Email to Activate Your Magnet
              </h2>
              <p className="text-slate-700 mb-4">
                We've sent a welcome email with instructions on how to activate your MaintCue magnet. 
                Please check your inbox (and spam folder) for the email titled:
              </p>
              <div className="bg-white border border-emerald-300 rounded-lg p-3 mb-4">
                <p className="font-semibold text-emerald-800" data-testid="text-email-subject">
                  "Welcome to MaintCue - Activate Your Magnet"
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Can't find it? Check your spam folder or contact us at{" "}
                <a 
                  href="mailto:support@maintcue.com" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                  data-testid="link-support-email"
                >
                  support@maintcue.com
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* What's Next Section */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            What happens next?
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-slate-700">
                Check your email for the welcome message with activation instructions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-slate-700">
                Your magnet will arrive within 5-7 business days
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span className="text-slate-700">
                Follow the setup guide to activate your magnet and start tracking maintenance
              </span>
            </li>
          </ol>
        </div>
        
        {/* Order Details */}
        <div className="border-t border-slate-200 pt-6 mb-8">
          <p className="text-sm text-slate-600 text-center">
            A confirmation email with your order details has also been sent to your email address.
          </p>
        </div>
        
        {/* Redirect Notice & CTA */}
        <div className="text-center">
          <button
            onClick={handleGoHomeNow}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg mb-4"
            data-testid="button-return-home"
          >
            <Home className="h-5 w-5" />
            Return to Home
          </button>
          
          <p className="text-sm text-slate-500">
            You'll be automatically redirected in{" "}
            <span className="font-semibold text-emerald-600" data-testid="text-countdown">
              {countdown}
            </span>{" "}
            {countdown === 1 ? "second" : "seconds"}
          </p>
        </div>
        
      </div>
    </div>
  );
}

interface Household {
  id: string;
  token: string;
  zip: string;
  homeType: string;
  climateZone: string;
}

interface Schedule {
  taskName: string;
  description: string;
  frequencyMonths: number;
  priority: number;
}

interface SetupResult {
  success: boolean;
  household: Household;
  schedules: Schedule[];
  firstTaskDue: string;
}

interface SessionData {
  isPayment: boolean;
  sessionId: string | null;
}

export default function SetupSuccess() {
  useLocation(); // Hook required for routing
  const [result, setResult] = useState<SetupResult | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if this is a payment success page
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  useEffect(() => {
    // Check for setup result from sessionStorage
    const storedResult = sessionStorage.getItem('setupResult');
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        sessionStorage.removeItem('setupResult');
      } catch (error) {
        console.error('Failed to parse setup result:', error);
      }
    }

    // Check if this is a payment success page
    if (sessionId) {
      setSessionData({ isPayment: true, sessionId });
    }
  }, [sessionId]);

  const handleDownloadCSV = async (batchId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/download/batch/${batchId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magnet-batch-${batchId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  // If this is a payment success page (check sessionId directly, not state)
  if (sessionId) {
    return <PaymentSuccessContent />;
  }

  // If this is a setup completion page but no result data
  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Setup Complete!</CardTitle>
            <CardDescription className="text-lg">
              Your home maintenance schedule has been successfully created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                What happens next?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <strong>Email reminders:</strong> You'll receive maintenance reminders 7 days before each task is due
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Calendar integration:</strong> Each reminder includes a calendar event you can add to your calendar
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <strong>Climate-optimized:</strong> Tasks are scheduled based on your local climate conditions
                  </div>
                </li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Keep your QR magnet in a visible location for easy access to task completion tracking.
              </p>
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto">
                  Return Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show detailed setup result if available
  const { household, schedules, firstTaskDue } = result;
  const dueDate = new Date(firstTaskDue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 h-12 w-12" />
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-4" data-testid="success-title">
            Setup Complete!
          </h1>
          <p className="text-xl text-gray-600 mb-2" data-testid="success-description">
            Your home maintenance schedule is ready
          </p>
          <div className="bg-white px-4 py-2 rounded-lg inline-block border">
            <span className="text-sm text-gray-600">Climate Zone:</span>
            <span className="font-semibold ml-2 capitalize" data-testid="climate-zone">
              {household.climateZone}
            </span>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="tasks-title">
              Your Personalized Maintenance Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {schedules
                .sort((a, b) => a.priority - b.priority)
                .map((schedule, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    data-testid={`task-${index}`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        schedule.priority === 1 
                          ? 'bg-red-100 text-red-600' 
                          : schedule.priority === 2 
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {schedule.priority}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`task-name-${index}`}>
                        {schedule.taskName}
                      </h3>
                      <p className="text-gray-600 mb-2" data-testid={`task-description-${index}`}>
                        {schedule.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <Badge variant="secondary">
                            Every {schedule.frequencyMonths} month{schedule.frequencyMonths > 1 ? 's' : ''}
                          </Badge>
                          <span className="text-gray-500">
                            Priority {schedule.priority}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={`/task/${household.token}/${schedule.taskName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '')}`}
                          >
                            <Button variant="outline" size="sm" data-testid={`button-view-details-${index}`}>
                              View Details
                            </Button>
                          </Link>
                          <Link 
                            href={`/task/${household.token}/${schedule.taskName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '')}`}
                          >
                            <Button variant="outline" size="sm" className="text-blue-600" data-testid={`button-book-pro-${index}`}>
                              <Wrench className="mr-1 h-3 w-3" />
                              Book a Pro
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Calendar className="text-blue-500 h-6 w-6 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2" data-testid="first-task-title">
                  Your First Task Reminder
                </h3>
                <p className="text-gray-600 mb-2">
                  We'll remind you about your highest priority task:
                </p>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="font-medium" data-testid="first-task-date">
                    {dueDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">What's Next?</h3>

          {/* Home Profile Extra Data Collection */}
          {result?.household?.id && (
            <HomeProfileExtraForm
              householdId={result.household.id}
              onSaveSuccess={() => console.log('Home profile data saved!')}
            />
          )}

          <p className="text-gray-600 max-w-2xl mx-auto">
            We'll send you reminders based on your home's needs and climate zone. 
            Each task is personalized for your {household.homeType} in {household.zip}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agent">
              <Button size="lg" data-testid="button-view-dashboard">
                View Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" data-testid="button-home">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}