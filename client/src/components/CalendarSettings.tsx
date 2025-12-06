import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CalendarConnectionStatus {
  connected: boolean;
  provider?: string;
  calendarName?: string;
  calendarTimezone?: string;
  syncEnabled: boolean;
  lastSync?: string | null;
  lastSyncStatus?: string | null;
  totalEventsSynced?: number;
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

  const { data: status, isLoading } = useQuery<CalendarConnectionStatus>({
    queryKey: ["/api/calendar/connection/status"],
    staleTime: 30000,
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/google/auth-url", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to start calendar connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/calendar/disconnect", { deleteEvents: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/connection/status"] });
      toast({
        title: "Calendar Disconnected",
        description: "Your calendar has been disconnected successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleSyncMutation = useMutation({
    mutationFn: async (syncEnabled: boolean) => {
      return apiRequest("PATCH", "/api/calendar/toggle-sync", { syncEnabled });
    },
    onSuccess: (_, syncEnabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/connection/status"] });
      toast({
        title: syncEnabled ? "Sync Enabled" : "Sync Disabled",
        description: syncEnabled 
          ? "Calendar sync is now active." 
          : "Calendar sync has been paused.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update sync setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/sync", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/connection/status"] });
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

  const handleConnectCalendar = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    if (!window.confirm("Are you sure you want to disconnect your calendar? This will remove all synced events.")) {
      return;
    }
    disconnectMutation.mutate();
  };

  const handleToggleSync = (enabled: boolean) => {
    toggleSyncMutation.mutate(enabled);
  };

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
  const isSyncEnabled = status?.syncEnabled ?? false;

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
            <Button 
              onClick={handleConnectCalendar}
              disabled={connectMutation.isPending}
              className="w-full"
              data-testid="button-connect-calendar"
            >
              {connectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Connect Google Calendar
            </Button>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                data-testid="button-disconnect-calendar"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-md" data-testid="section-auto-sync">
              <div>
                <p className="font-medium text-foreground" data-testid="label-auto-sync">Automatic Sync</p>
                <p className="text-sm text-muted-foreground" data-testid="text-auto-sync-description">
                  Update calendar when tasks change
                </p>
              </div>
              <Switch
                checked={isSyncEnabled}
                onCheckedChange={handleToggleSync}
                disabled={toggleSyncMutation.isPending}
                data-testid="switch-auto-sync"
              />
            </div>

            {status?.lastSync && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="section-last-sync">
                {status.lastSyncStatus === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" data-testid="icon-sync-success" />
                ) : status.lastSyncStatus === "failed" ? (
                  <XCircle className="w-4 h-4 text-red-600" data-testid="icon-sync-failed" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" data-testid="icon-sync-warning" />
                )}
                <span data-testid="text-last-sync">
                  Last synced: {new Date(status.lastSync).toLocaleString()}
                  {status.lastSyncStatus === "failed" && " (with errors)"}
                </span>
              </div>
            )}

            <Button
              onClick={handleManualSync}
              disabled={syncMutation.isPending || !isSyncEnabled}
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
                  Sync Now
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarSettings;
