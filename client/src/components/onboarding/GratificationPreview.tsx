import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, AlertTriangle, Clock } from "lucide-react";

interface GratificationProps {
  homeType: string;
  taskCount: number;
  previewTasks: Array<{
    name: string;
    priority: string;
    dueDate: string;
    category: string;
  }>;
  onContinue: () => void;
  onSkip: () => void;
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

  const getPriorityVariant = (priority: string): "destructive" | "secondary" | "outline" => {
    switch (priority.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="gratification-preview">
      <Card className="border-2 border-green-500">
        <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Your Schedule is Ready!</CardTitle>
          <CardDescription className="text-lg">
            Based on your <strong>{homeType}</strong> home, we've generated{" "}
            <strong className="text-blue-600">{taskCount} personalized maintenance tasks</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600" data-testid="stat-total-tasks">{taskCount}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600" data-testid="stat-high-priority">
                {previewTasks.filter(t => t.priority.toLowerCase() === "high").length}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600" data-testid="stat-categories">
                {new Set(previewTasks.map(t => t.category)).size}
              </div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Your Next 3 Tasks:
            </h3>

            <div className="space-y-3">
              {previewTasks.slice(0, 3).map((task, index) => (
                <Card key={index} className="hover-elevate" data-testid={`preview-task-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={getPriorityVariant(task.priority)}>
                            {getPriorityIcon(task.priority)}
                            <span className="ml-1">{task.priority} Priority</span>
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

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
              data-testid="button-skip-refinement"
            >
              Skip Refinement
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
