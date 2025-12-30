import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, AlertTriangle, Clock } from "lucide-react";

interface PreviewTask {
  name: string;
  priority: string;
  dueDate: string;
  category: string;
}

interface GratificationProps {
  homeType: string;
  taskCount: number;
  previewTasks: PreviewTask[];
  onContinue: () => void;
  onSkip: () => void;
  householdId?: string;
}

export default function GratificationPreview({ 
  homeType, 
  taskCount, 
  previewTasks,
  onContinue,
  onSkip 
}: GratificationProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Clock className="h-4 w-4" />;
      case "low": return <CheckCircle2 className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (priority.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "default";
    }
  };

  const highPriorityCount = previewTasks.filter(t => t.priority.toLowerCase() === "high").length;
  const uniqueCategories = new Set(previewTasks.map(t => t.category)).size;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-2 border-green-500 dark:border-green-600">
        <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Your Schedule is Ready!</CardTitle>
          <CardDescription className="text-lg">
            Based on your <strong>{homeType}</strong> home, we've generated{" "}
            <strong className="text-primary">{taskCount} personalized maintenance tasks</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{taskCount}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {highPriorityCount}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {uniqueCategories}
              </div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Your Next Tasks:
            </h3>

            <div className="space-y-3">
              {previewTasks.slice(0, 3).map((task, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={getPriorityVariant(task.priority)} className="gap-1">
                            {getPriorityIcon(task.priority)}
                            <span>{task.priority}</span>
                          </Badge>
                          <Badge variant="outline">{task.category}</Badge>
                        </div>
                        <h4 className="font-semibold">{task.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>What's Next:</strong> You can refine this schedule by adding details about
              your HVAC system and water heater, or skip ahead to see your full dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
              size="lg"
              data-testid="button-skip-to-dashboard"
            >
              Skip to Dashboard
            </Button>
            <Button
              type="button"
              onClick={onContinue}
              className="flex-1"
              size="lg"
              data-testid="button-refine-schedule"
            >
              Refine My Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
