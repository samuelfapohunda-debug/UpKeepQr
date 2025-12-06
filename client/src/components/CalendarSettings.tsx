import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CalendarConnectionStatus {
  connected: boolean;
  provider?: string;
  calendarName?: string;
  calendarTimezone?: string;
  syncEnabled: boolean;
  totalEventsSynced?: number;
  error?: string;
}

interface SyncResult {
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  totalSynced: number;
}

export function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<CalendarConnectionStatus>({
    queryKey: ["/api/calendar/replit/status"],
    staleTime: 30000,
    retry: false,
  });

  const syncMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/replit/sync", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/replit/status"] });
      toast({
        title: "Sync Complete",
        description: `Created: ${data.eventsCreated}, Updated: ${data.eventsUpdated}`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Calendar sync failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleManualSync = () => {
    syncMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card data-testid="card-calendar-settings">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" data-testid="loader-calendar-status" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.connected ?? false;

  return (
    <Card data-testid="card-calendar-settings">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2" data-testid="title-calendar-integration">
          <Calendar className="w-5 h-5" />
          Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4" data-testid="section-connect-calendar">
            <Alert>
              <Calendar className="w-4 h-4" />
              <AlertDescription data-testid="text-calendar-description">
                Connect your Google Calendar to automatically add maintenance reminders.
                Your tasks will sync as calendar events so you never miss a maintenance deadline.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3" data-testid="text-setup-instructions">
                Calendar integration is managed through your account settings.
              </p>
              <Button 
                variant="outline"
                className="gap-2"
                onClick={() => window.open('https://replit.com', '_blank')}
                data-testid="button-connect-calendar"
              >
                <ExternalLink className="w-4 h-4" />
                Manage Integrations
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="section-calendar-connected">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                <div>
                  <p className="font-medium text-foreground" data-testid="text-calendar-name">
                    Connected to {status?.calendarName || "Google Calendar"}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-events-synced">
                    {status?.totalEventsSynced || 0} events synced
                    {status?.calendarTimezone && ` | ${status.calendarTimezone}`}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleManualSync}
              disabled={syncMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-sync-now"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Tasks to Calendar
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center" data-testid="text-sync-info">
              Syncs your maintenance tasks as calendar events with reminders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarSettings;
