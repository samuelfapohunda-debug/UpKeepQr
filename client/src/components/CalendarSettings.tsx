import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Calendar, CheckCircle, Loader2, RefreshCw, ExternalLink, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface CalendarConnectionStatus {
  connected: boolean;
  provider?: string;
  calendarName?: string;
  calendarTimezone?: string;
  syncEnabled?: boolean;
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

interface CalendarSettingsProps {
  householdToken?: string;
}

export function CalendarSettings({ householdToken }: CalendarSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = useQuery<CalendarConnectionStatus>({
    queryKey: ["/api/calendar/connection/status", householdToken],
    queryFn: async () => {
      if (!householdToken) {
        return { connected: false };
      }
      const response = await fetch("/api/calendar/connection/status", {
        headers: {
          "Authorization": `Bearer ${householdToken}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          return { connected: false };
        }
        throw new Error("Failed to fetch calendar status");
      }
      return response.json();
    },
    staleTime: 30000,
    retry: false,
    enabled: !!householdToken,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!householdToken) {
        throw new Error("No household token");
      }
      const response = await fetch("/api/calendar/google/auth-url", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${householdToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Could not start calendar connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      if (!householdToken) {
        throw new Error("No household token");
      }
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${householdToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetch();
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

  const toggleSyncMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!householdToken) {
        throw new Error("No household token");
      }
      const response = await fetch("/api/calendar/toggle-sync", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${householdToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncEnabled: enabled }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle sync");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update sync setting.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!householdToken) {
        throw new Error("No household token");
      }
      const response = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${householdToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteEvents: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectMutation.mutate();
  };

  const handleManualSync = () => {
    syncMutation.mutate();
  };

  const handleToggleSync = (enabled: boolean) => {
    toggleSyncMutation.mutate(enabled);
  };

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect your Google Calendar? This will remove all synced events.")) {
      disconnectMutation.mutate();
    }
  };

  if (!householdToken) {
    return (
      <Card data-testid="card-calendar-settings">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2" data-testid="title-calendar-integration">
            <Calendar className="w-5 h-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="w-4 h-4" />
            <AlertDescription data-testid="text-calendar-description">
              Calendar integration will be available after your home profile is complete.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || connectMutation.isPending}
              className="w-full"
              data-testid="button-connect-calendar"
            >
              {isConnecting || connectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
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
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-sync enabled</span>
              <Switch
                checked={status?.syncEnabled ?? true}
                onCheckedChange={handleToggleSync}
                disabled={toggleSyncMutation.isPending}
                data-testid="switch-auto-sync"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleManualSync}
                disabled={syncMutation.isPending || !status?.syncEnabled}
                variant="outline"
                className="flex-1"
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
              <Button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                variant="outline"
                size="icon"
                data-testid="button-disconnect-calendar"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
              </Button>
            </div>

            {status?.lastSync && (
              <p className="text-xs text-muted-foreground text-center" data-testid="text-last-sync">
                Last synced: {new Date(status.lastSync).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarSettings;
