import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OrderMagnetOrder, OrderMagnetItem, OrderMagnetBatch, OrderMagnetShipment, OrderMagnetAuditEvent, AdminOrderMagnetFilters } from "@shared/schema";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Search, Filter, Eye, Package, Truck, Clock, CheckCircle, DollarSign } from "lucide-react";


const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  paid: "bg-green-500", 
  in_production: "bg-orange-500", 
  shipped: "bg-purple-500",
  delivered: "bg-emerald-500",
  activated: "bg-teal-500",
  canceled: "bg-gray-500",
  refunded: "bg-red-500"
};

export default function MagnetDashboard() {
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderMagnetOrder | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "batches" | "items">("orders");
  
  // Filters state for orders (using allowed fields from schema)
  const [filters, setFilters] = useState<AdminOrderMagnetFilters>({
    status: [],
    paymentStatus: [],
    dateFrom: "",
    dateTo: "",
    sku: "",
    zip: "",
    batchId: "",
    carrier: "",
    q: "",
    page: 1,
    pageSize: 25,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const { toast } = useToast();

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Test token validity
  const testAuth = async (testToken: string) => {
    try {
      const response = await fetch("/api/admin/magnets/orders?page=1&pageSize=1", {
        headers: {
          "Authorization": `Bearer ${testToken}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter an admin token",
        variant: "destructive",
      });
      return;
    }

    const isValid = await testAuth(token);
    if (isValid) {
      localStorage.setItem("adminToken", token);
      setIsAuthenticated(true);
      toast({
        title: "Success",
        description: "Successfully authenticated as admin",
      });
    } else {
      toast({
        title: "Error", 
        description: "Invalid admin token",
        variant: "destructive",
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
    setIsAuthenticated(false);
    setSelectedOrder(null);
  };

  // Configure API request headers for authenticated calls
  useEffect(() => {
    if (isAuthenticated && token) {
      queryClient.setDefaultOptions({
        queries: {
          queryFn: async ({ queryKey }) => {
            const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
            const response = await fetch(url as string, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            
            if (response.status === 401) {
              setIsAuthenticated(false);
              localStorage.removeItem("adminToken");
              throw new Error("Unauthorized");
            }
            
            if (!response.ok) {
              throw new Error(`Request failed: ${response.status}`);
            }
            
            return response.json();
          }
        }
      });
    }
  }, [isAuthenticated, token]);

  // Fetch orders with filters  
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/magnets/orders", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(s => params.append("status", s));
      }
      if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        filters.paymentStatus.forEach(p => params.append("paymentStatus", p));
      }
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.sku) params.set("sku", filters.sku);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.batchId) params.set("batchId", filters.batchId);
      if (filters.carrier) params.set("carrier", filters.carrier);
      if (filters.q) params.set("q", filters.q);
      params.set("page", filters.page.toString());
      params.set("pageSize", filters.pageSize.toString());
      params.set("sortBy", filters.sortBy);
      params.set("sortDir", filters.sortDir);

      const response = await fetch(`/api/admin/magnets/orders?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      return response.json();
    },
    enabled: isAuthenticated && !!token && activeTab === "orders",
  });

  // Fetch order metrics for KPIs
  const { data: metricsData } = useQuery({
    queryKey: ["/api/admin/magnets/orders/metrics", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(s => params.append("status", s));
      }
      if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        filters.paymentStatus.forEach(p => params.append("paymentStatus", p));
      }
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.sku) params.set("sku", filters.sku);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.batchId) params.set("batchId", filters.batchId);
      if (filters.carrier) params.set("carrier", filters.carrier);
      if (filters.q) params.set("q", filters.q);

      const response = await fetch(`/api/admin/magnets/orders/metrics?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      return response.json();
    },
    enabled: isAuthenticated && !!token,
  });

  // Fetch batches
  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/admin/magnets/batches"],
    enabled: isAuthenticated && !!token && activeTab === "batches",
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/magnets/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/magnets/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Enter your admin token to access the Order Magnet dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Admin Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter admin token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-testid="input-admin-token"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" data-testid="button-admin-login">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate KPIs from metrics data
  const kpis = {
    totalOrders: metricsData?.totalOrders || ordersData?.total || 0,
    pending: metricsData?.pendingCount || 0,
    inProduction: metricsData?.inProductionCount || 0,
    shipped: metricsData?.shippedCount || 0,
    totalRevenue: metricsData?.totalRevenue || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order Magnet Dashboard
            </h1>
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={activeTab === "orders" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("orders")}
                  data-testid="tab-orders"
                >
                  Orders
                </Button>
                <Button
                  variant={activeTab === "batches" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("batches")}
                  data-testid="tab-batches"
                >
                  Batches
                </Button>
                <Button
                  variant={activeTab === "items" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("items")}
                  data-testid="tab-items"
                >
                  Items
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Production</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.inProduction}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipped</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.shipped}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ${(kpis.totalRevenue / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeTab === "orders" && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search orders..."
                        className="pl-10"
                        value={filters.q}
                        onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
                        data-testid="input-search"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Product SKU"
                      value={filters.sku}
                      onChange={(e) => setFilters({ ...filters, sku: e.target.value, page: 1 })}
                      data-testid="input-sku"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      placeholder="ZIP code"
                      value={filters.zip}
                      onChange={(e) => setFilters({ ...filters, zip: e.target.value, page: 1 })}
                      data-testid="input-zip"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateFrom">Date From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
                      data-testid="input-date-from"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateTo">Date To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
                      data-testid="input-date-to"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["new", "paid", "in_production", "shipped", "delivered", "activated", "canceled", "refunded"].map((status) => (
                        <Button
                          key={status}
                          variant={(filters.status || []).includes(status as any) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentStatus = filters.status || [];
                            const newStatus = currentStatus.includes(status as any)
                              ? currentStatus.filter(s => s !== status)
                              : [...currentStatus, status as any];
                            setFilters({ ...filters, status: newStatus, page: 1 });
                          }}
                          data-testid={`button-status-${status}`}
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  {ordersData?.total || 0} total orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordersData?.items?.map((order: OrderMagnetOrder) => (
                          <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                            <TableCell className="font-mono text-sm">{order.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-gray-500">{order.customerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${(order.total / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-white ${statusColors[order.status] || 'bg-gray-500'}`}>
                                {order.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                data-testid={`button-view-${order.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-500">
                        Showing {((filters.page - 1) * filters.pageSize) + 1} to{" "}
                        {Math.min(filters.page * filters.pageSize, ordersData?.total || 0)} of{" "}
                        {ordersData?.total || 0} results
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page <= 1}
                          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page >= Math.ceil((ordersData?.total || 0) / filters.pageSize)}
                          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "batches" && (
          <Card>
            <CardHeader>
              <CardTitle>Production Batches</CardTitle>
              <CardDescription>
                Manage magnet production batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="text-center py-8">Loading batches...</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Batch management coming soon...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "items" && (
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Manage individual order items and production status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Items management coming soon...
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Placed {new Date(selectedOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                    <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Addresses</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Shipping:</strong> {selectedOrder.shipAddressLine1}, {selectedOrder.shipCity}, {selectedOrder.shipState} {selectedOrder.shipZip}</div>
                    <div><strong>Billing:</strong> {selectedOrder.billAddressLine1}, {selectedOrder.billCity}, {selectedOrder.billState} {selectedOrder.billZip}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Total Amount:</strong> ${(selectedOrder.total / 100).toFixed(2)}</div>
                    <div><strong>Status:</strong> {selectedOrder.status.replace("_", " ")}</div>
                    <div><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="text-sm text-gray-600">
                    {selectedOrder.notes || "No notes available"}
                  </div>
                </div>
              </div>

              {/* Actions Panel */}
              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <div className="space-y-2">
                    <Select 
                      value={selectedOrder.status}
                      onValueChange={(status) => {
                        updateStatusMutation.mutate({
                          id: selectedOrder.id,
                          status
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new" data-testid="status-new">New</SelectItem>
                        <SelectItem value="paid" data-testid="status-paid">Paid</SelectItem>
                        <SelectItem value="in_production" data-testid="status-in-production">In Production</SelectItem>
                        <SelectItem value="shipped" data-testid="status-shipped">Shipped</SelectItem>
                        <SelectItem value="delivered" data-testid="status-delivered">Delivered</SelectItem>
                        <SelectItem value="activated" data-testid="status-activated">Activated</SelectItem>
                        <SelectItem value="canceled" data-testid="status-canceled">Canceled</SelectItem>
                        <SelectItem value="refunded" data-testid="status-refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Shipments */}
                <div>
                  <h3 className="font-semibold mb-2">Shipping Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Carrier:</strong> {selectedOrder.shippingCarrier || 'Not assigned'}</div>
                    <div><strong>Tracking:</strong> {selectedOrder.trackingNumber || 'Not available'}</div>
                    {selectedOrder.shippedAt && (
                      <div><strong>Shipped:</strong> {new Date(selectedOrder.shippedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {/* Audit Events */}
                <div>
                  <h3 className="font-semibold mb-2">Activity History</h3>
                  <div className="text-sm text-gray-600">
                    Activity history will be loaded here
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}