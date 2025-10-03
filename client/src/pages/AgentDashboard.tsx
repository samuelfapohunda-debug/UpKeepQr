import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Users, Package, CheckCircle, Activity, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function useAuthenticatedRequest(url: string) {
  const token = localStorage.getItem("agentToken");
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      return response.json();
    },
    enabled: !!token,
  });
}

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const agentEmail = localStorage.getItem("agentEmail");
  const agentId = localStorage.getItem("agentId");

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("agentToken");
    if (!token) {
      setLocation("/agent");
    }
  }, [setLocation]);

  const metricsQuery = useAuthenticatedRequest("/api/agent/metrics");
  const householdsQuery = useAuthenticatedRequest("/api/agent/households");
  const batchesQuery = useAuthenticatedRequest("/api/agent/batches");

  const handleLogout = () => {
    localStorage.removeItem("agentToken");
    localStorage.removeItem("agentEmail");
    localStorage.removeItem("agentId");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation("/agent");
  };

  const metrics = metricsQuery.data || { totalMagnets: 0, scans: 0, activations: 0, last30DayActive: 0 };
  const households = householdsQuery.data || [];
  const batches = batchesQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {agentEmail}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-magnets">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Magnets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-magnets">
                {metricsQuery.isLoading ? "..." : metrics.totalMagnets}
              </div>
              <p className="text-xs text-muted-foreground">
                All magnets distributed
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-scans">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scans</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-scans">
                {metricsQuery.isLoading ? "..." : metrics.scans}
              </div>
              <p className="text-xs text-muted-foreground">
                Households that scanned QR codes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-activations">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-activations">
                {metricsQuery.isLoading ? "..." : metrics.activations}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed setup households
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-households">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">30-Day Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-households">
                {metricsQuery.isLoading ? "..." : metrics.last30DayActive}
              </div>
              <p className="text-xs text-muted-foreground">
                Active in last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Households Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Households</CardTitle>
              <CardDescription>
                Households that have completed setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              {householdsQuery.isLoading ? (
                <div>Loading households...</div>
              ) : households.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active households yet
                </div>
              ) : (
                <div className="space-y-4">
                  {households.map((household: any) => (
                    <div 
                      key={household.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`row-household-${household.id}`}
                    >
                      <div>
                        <div className="font-medium" data-testid={`text-household-city-${household.id}`}>
                          {household.city}, {household.zip}
                        </div>
                        <div className="text-sm text-gray-600">
                          {household.homeType}
                          {household.email && ` • ${household.email}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {household.lastReminder ? (
                            <Badge variant="secondary">
                              Last reminder: {new Date(household.lastReminder).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No reminders sent</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Activated: {new Date(household.activatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batches Table */}
          <Card>
            <CardHeader>
              <CardTitle>Magnet Batches</CardTitle>
              <CardDescription>
                Your distributed magnet batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchesQuery.isLoading ? (
                <div>Loading batches...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No batches found
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch: any) => (
                    <div 
                      key={batch.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`row-batch-${batch.id}`}
                    >
                      <div>
                        <div className="font-medium" data-testid={`text-batch-qty-${batch.id}`}>
                          {batch.qty} magnets
                        </div>
                        <div className="text-sm text-gray-600">
                          Batch ID: {batch.id.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Created: {new Date(batch.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}