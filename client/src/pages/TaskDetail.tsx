import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Wrench, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MaintenanceTask {
  id: number;
  title: string;
  description: string | null;
  month: number;
  frequency: string;
  category: string;
  priority: string;
  estimatedCostMin: number | null;
  estimatedCostMax: number | null;
  isCompleted: boolean;
}

interface RouteParams {
  token: string;
  taskId: string;
}

export default function TaskDetail() {
  const [, rawParams] = useRoute("/task/:token/:taskId");
  const params = rawParams as RouteParams | null;
  useLocation(); // Hook required for routing
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    const householdId = localStorage.getItem('upkeepqr_household_id');
    const taskId = params ? params.taskId : null;
    if (!householdId || !taskId) {
      setTaskLoading(false);
      return;
    }

    fetch(`/api/maintenance/tasks?householdId=${householdId}`)
      .then(r => r.json())
      .then(data => {
        const found = (data.tasks ?? []).find(
          (t: MaintenanceTask) => t.id === parseInt(taskId, 10)
        );
        setTask(found ?? null);
      })
      .catch(err => console.error('Failed to fetch task:', err))
      .finally(() => setTaskLoading(false));
  }, [params?.taskId]);

  const bookProMutation = useMutation({
    mutationFn: async (data: { householdToken: string; service: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Service Request Submitted",
        description: data.message || "A professional will contact you soon.",
      });
      setShowBookingForm(false);
      setService("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit service request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookPro = () => {
    if (!service) {
      toast({
        title: "Service Required",
        description: "Please select a service type.",
        variant: "destructive",
      });
      return;
    }

    if (!params || !params.token) {
      toast({
        title: "Error",
        description: "Household token not found.",
        variant: "destructive",
      });
      return;
    }

    bookProMutation.mutate({
      householdToken: params.token,
      service,
      notes: notes.trim() || undefined,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return "bg-red-100 text-red-600 border-red-200";
      case 'medium': return "bg-yellow-100 text-yellow-600 border-yellow-200";
      default: return "bg-blue-100 text-blue-600 border-blue-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return "High Priority";
      case 'medium': return "Medium Priority";
      default: return "Low Priority";
    }
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Task not found.</p>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schedule
        </Button>

        {/* Task Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="text-blue-600 h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="task-title">
            {task.title}
          </h1>
          <Badge className={`${getPriorityColor(task.priority)} font-medium`} data-testid="task-priority">
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        {/* Task Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Description</Label>
              <p className="text-gray-900 mt-1" data-testid="task-description">
                {task.description ?? "No description available."}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Frequency</Label>
              <p className="text-gray-900 mt-1 capitalize" data-testid="task-frequency">
                {task.frequency}
              </p>
            </div>
            {(task.estimatedCostMin || task.estimatedCostMax) && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Estimated Cost</Label>
                <p className="text-gray-900 mt-1" data-testid="task-cost">
                  ${task.estimatedCostMin ?? 0} – ${task.estimatedCostMax ?? 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* DIY Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Do It Yourself
              </CardTitle>
              <CardDescription>
                Complete this task on your own with our step-by-step guide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" data-testid="button-diy-guide">
                View Step-by-Step Guide
              </Button>
            </CardContent>
          </Card>

          {/* Book a Pro Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Book a Professional
              </CardTitle>
              <CardDescription>
                Connect with vetted professionals in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showBookingForm ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowBookingForm(true)}
                  data-testid="button-book-pro"
                >
                  Book a Pro
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="service">Service Type</Label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger data-testid="select-service">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hvac">HVAC Service</SelectItem>
                        <SelectItem value="gutter">Gutter Cleaning</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="flooring">Flooring</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe any specific issues or requirements..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                      data-testid="textarea-notes"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBookPro}
                      disabled={bookProMutation.isPending || !service}
                      className="flex-1"
                      data-testid="button-submit-booking"
                    >
                      {bookProMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBookingForm(false);
                        setService("");
                        setNotes("");
                      }}
                      data-testid="button-cancel-booking"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you're unsure about completing this task or need guidance, our support team is here to help.
            </p>
            <Button variant="outline" data-testid="button-contact-support">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
