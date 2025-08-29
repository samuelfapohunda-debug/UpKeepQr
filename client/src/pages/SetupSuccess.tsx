import { useEffect, useState } from 'react';
import { Link } from 'wouter';

interface SetupResult {
  success: boolean;
  household: {
    id: string;
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
  const [result, setResult] = useState<SetupResult | null>(null);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('setupResult');
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        // Clear from session storage after loading
        sessionStorage.removeItem('setupResult');
      } catch (error) {
        console.error('Failed to parse setup result:', error);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="pt-16 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setup Complete!</h1>
          <Link href="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  const { household, schedules, firstTaskDue } = result;
  const dueDate = new Date(firstTaskDue);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-green-600 text-4xl" data-testid="success-icon"></i>
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-4" data-testid="success-title">
            Setup Complete!
          </h1>
          <p className="text-xl text-muted-foreground mb-2" data-testid="success-description">
            Your home maintenance schedule is ready
          </p>
          <div className="bg-muted px-4 py-2 rounded-lg inline-block">
            <span className="text-sm text-muted-foreground">Climate Zone:</span>
            <span className="font-semibold ml-2 capitalize" data-testid="climate-zone">
              {household.climateZone}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6" data-testid="tasks-title">
            Your Personalized Maintenance Tasks
          </h2>
          <div className="grid gap-4">
            {schedules
              .sort((a, b) => a.priority - b.priority)
              .map((schedule, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-muted rounded-lg"
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
                    <p className="text-muted-foreground mb-2" data-testid={`task-description-${index}`}>
                      {schedule.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="bg-background px-2 py-1 rounded">
                        Every {schedule.frequencyMonths} month{schedule.frequencyMonths > 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground">
                        Priority {schedule.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <i className="fas fa-clock text-primary text-xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2" data-testid="first-task-title">
                Your First Task Reminder
              </h3>
              <p className="text-muted-foreground mb-2">
                We'll remind you about your highest priority task tomorrow:
              </p>
              <div className="bg-white px-4 py-2 rounded-lg">
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
        </div>

        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">What's Next?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We'll send you reminders based on your home's needs and climate zone. 
            Each task is personalized for your {household.homeType} in {household.zip}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/agent"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-view-dashboard"
            >
              View Dashboard
            </Link>
            <Link 
              href="/"
              className="border border-border px-6 py-3 rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
              data-testid="button-home"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}