import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle, Calendar, Bell, Home, Download, Package, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SetupResult {
  success: boolean;
  household: {
    id: string;
    token: string;
    zip: string;
    homeType: string;
    climateZone: string;
  };
  schedules: Array<{
    taskName: string;
    description: string;
    frequencyMonths: number;
    priority: number;
  }>;
  firstTaskDue: string;
}

export default function SetupSuccess() {
  const search = useSearch();
  const [result, setResult] = useState<SetupResult | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check if this is a payment success page
  const urlParams = new URLSearchParams(search);
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

  // If this is a payment success page
  if (sessionData?.isPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
            <CardDescription className="text-lg">
              Your order has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Order Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Order ID:</span>
                  <Badge variant="outline">{sessionId?.slice(0, 12)}...</Badge>
                </div>
                <p className="text-gray-600">
                  You'll receive an email confirmation with your order details shortly.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">For Agent Packs:</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Your QR magnets are being generated. You'll receive download links for your CSV files and QR code sheets.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadCSV('demo')}
                    disabled={loading}
                    className="w-full"
                    data-testid="button-download-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Download Sample CSV'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Thank you for your purchase! Check your email for further instructions.
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

  // If this is a setup completion page
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