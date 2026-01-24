import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Calendar, DollarSign, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

interface Appliance {
  id: string;
  householdId: string;
  applianceType: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string | null;
  purchasePrice: string | null;
  installationDate: string | null;
  location: string | null;
  notes: string | null;
  warrantyType: string | null;
  warrantyExpiration: string | null;
  warrantyProvider: string | null;
  warrantyPolicyNumber: string | null;
  warrantyCoverageDetails: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  warrantyDaysRemaining?: number | null;
  isWarrantyExpiringSoon?: boolean;
}

interface ApplianceManagerProps {
  householdId: string;
  onClose: () => void;
}

const APPLIANCE_TYPES = [
  'Refrigerator',
  'Dishwasher',
  'Washer',
  'Dryer',
  'Oven/Range',
  'Microwave',
  'Water Heater',
  'HVAC System',
  'Garbage Disposal',
  'Air Purifier',
  'Dehumidifier',
  'Sump Pump',
  'Water Softener',
  'Security System',
  'Smart Thermostat',
  'Ceiling Fan',
  'Garage Door Opener',
  'Smoke Detector',
  'Carbon Monoxide Detector',
  'Water Filter',
];

interface ApplianceFormData {
  applianceType: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  installationDate: string;
  warrantyExpiration: string;
  warrantyType: string;
  warrantyProvider: string;
  warrantyPolicyNumber: string;
  warrantyCoverageDetails: string;
  purchasePrice: string;
  location: string;
  notes: string;
}

const emptyFormData: ApplianceFormData = {
  applianceType: '',
  brand: '',
  modelNumber: '',
  serialNumber: '',
  purchaseDate: '',
  installationDate: '',
  warrantyExpiration: '',
  warrantyType: '',
  warrantyProvider: '',
  warrantyPolicyNumber: '',
  warrantyCoverageDetails: '',
  purchasePrice: '',
  location: '',
  notes: '',
};

export default function ApplianceManager({ householdId, onClose }: ApplianceManagerProps) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [formData, setFormData] = useState<ApplianceFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [warrantiesExpiringSoon, setWarrantiesExpiringSoon] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppliances();
  }, [householdId]);

  const fetchAppliances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/households/${householdId}/appliances`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.status === 401 || response.status === 403) {
        console.error('[Appliances] Authentication failed');
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to manage appliances',
          variant: 'destructive',
        });
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch appliances');
      const data = await response.json();
      setAppliances(data.appliances || []);
      setWarrantiesExpiringSoon(data.warrantiesExpiringSoon || 0);
    } catch (error) {
      console.error('Error fetching appliances:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appliances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppliance = () => {
    setEditingAppliance(null);
    setFormData(emptyFormData);
    setIsFormOpen(true);
  };

  const handleEditAppliance = (appliance: Appliance) => {
    setEditingAppliance(appliance);
    setFormData({
      applianceType: appliance.applianceType || '',
      brand: appliance.brand || '',
      modelNumber: appliance.modelNumber || '',
      serialNumber: appliance.serialNumber || '',
      purchaseDate: appliance.purchaseDate
        ? new Date(appliance.purchaseDate).toISOString().split('T')[0]
        : '',
      installationDate: appliance.installationDate
        ? new Date(appliance.installationDate).toISOString().split('T')[0]
        : '',
      warrantyExpiration: appliance.warrantyExpiration
        ? new Date(appliance.warrantyExpiration).toISOString().split('T')[0]
        : '',
      warrantyType: appliance.warrantyType || '',
      warrantyProvider: appliance.warrantyProvider || '',
      warrantyPolicyNumber: appliance.warrantyPolicyNumber || '',
      warrantyCoverageDetails: appliance.warrantyCoverageDetails || '',
      purchasePrice: appliance.purchasePrice || '',
      location: appliance.location || '',
      notes: appliance.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applianceType) {
      toast({
        title: 'Validation Error',
        description: 'Appliance type is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.brand || !formData.modelNumber || !formData.serialNumber || !formData.purchaseDate) {
      toast({
        title: 'Validation Error',
        description: 'Brand, model number, serial number, and purchase date are required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const url = editingAppliance
        ? `${API_BASE_URL}/api/households/${householdId}/appliances/${editingAppliance.id}`
        : `${API_BASE_URL}/api/households/${householdId}/appliances`;

      const method = editingAppliance ? 'PATCH' : 'POST';

      const normalizedPayload: Record<string, unknown> = {
        applianceType: formData.applianceType,
        brand: formData.brand,
        modelNumber: formData.modelNumber,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate,
      };

      if (formData.purchasePrice) {
        const parsedPrice = parseFloat(formData.purchasePrice);
        if (!isNaN(parsedPrice)) {
          normalizedPayload.purchasePrice = parsedPrice;
        }
      }
      if (formData.installationDate) normalizedPayload.installationDate = formData.installationDate;
      if (formData.location.trim()) normalizedPayload.location = formData.location.trim();
      if (formData.notes.trim()) normalizedPayload.notes = formData.notes.trim();
      if (formData.warrantyType) normalizedPayload.warrantyType = formData.warrantyType;
      if (formData.warrantyExpiration) normalizedPayload.warrantyExpiration = formData.warrantyExpiration;
      if (formData.warrantyProvider.trim()) normalizedPayload.warrantyProvider = formData.warrantyProvider.trim();
      if (formData.warrantyPolicyNumber.trim()) normalizedPayload.warrantyPolicyNumber = formData.warrantyPolicyNumber.trim();
      if (formData.warrantyCoverageDetails.trim()) normalizedPayload.warrantyCoverageDetails = formData.warrantyCoverageDetails.trim();

      const token = localStorage.getItem('adminToken');
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(normalizedPayload),
      });
      
      if (response.status === 401 || response.status === 403) {
        console.error('[Appliances] Authentication failed on save');
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to save appliance',
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to save appliance';
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors = errorData.details.map((e: { path?: string[]; message?: string }) => {
            const field = e.path?.join('.') || 'Unknown field';
            return `${field}: ${e.message}`;
          });
          errorMessage = fieldErrors.join('; ');
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: `Appliance ${editingAppliance ? 'updated' : 'added'} successfully`,
      });

      setIsFormOpen(false);
      fetchAppliances();
    } catch (error: any) {
      console.error('Error saving appliance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save appliance',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAppliance = async (applianceId: string) => {
    if (!confirm('Are you sure you want to delete this appliance?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/api/households/${householdId}/appliances/${applianceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.status === 401 || response.status === 403) {
        console.error('[Appliances] Authentication failed on delete');
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to delete appliance',
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) throw new Error('Failed to delete appliance');

      toast({
        title: 'Success',
        description: 'Appliance deleted successfully',
      });

      fetchAppliances();
    } catch (error) {
      console.error('Error deleting appliance:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appliance',
        variant: 'destructive',
      });
    }
  };

  const getWarrantyStatus = (appliance: Appliance) => {
    if (!appliance.warrantyExpiration) return null;

    const daysRemaining = appliance.warrantyDaysRemaining;
    if (daysRemaining === null || daysRemaining === undefined) {
      const now = new Date();
      const expiration = new Date(appliance.warrantyExpiration);
      const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: 'Expired', variant: 'destructive' as const, icon: AlertTriangle };
      } else if (diffDays <= 30) {
        return { label: `${diffDays}d left`, variant: 'secondary' as const, icon: AlertTriangle };
      } else {
        return { label: 'Active', variant: 'default' as const, icon: Shield };
      }
    }

    if (daysRemaining < 0) {
      return { label: 'Expired', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (appliance.isWarrantyExpiringSoon || daysRemaining <= 14) {
      return { label: `${daysRemaining}d left`, variant: 'secondary' as const, icon: AlertTriangle };
    } else {
      return { label: 'Active', variant: 'default' as const, icon: Shield };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appliances</h2>
          <p className="text-muted-foreground">
            Manage and track all appliances in your home
          </p>
        </div>
        <div className="flex items-center gap-2">
          {warrantiesExpiringSoon > 0 && (
            <Badge variant="secondary">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warrantiesExpiringSoon} warranty alert{warrantiesExpiringSoon > 1 ? 's' : ''}
            </Badge>
          )}
          <Button onClick={handleAddAppliance} data-testid="button-add-appliance">
            <Plus className="mr-2 h-4 w-4" />
            Add Appliance
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading appliances...</div>
      ) : appliances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No appliances added yet</p>
            <Button onClick={handleAddAppliance}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Appliance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appliances.map((appliance) => {
            const warrantyStatus = getWarrantyStatus(appliance);

            return (
              <Card key={appliance.id} data-testid={`card-appliance-${appliance.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {appliance.applianceType}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {appliance.brand} {appliance.modelNumber && `- ${appliance.modelNumber}`}
                      </CardDescription>
                    </div>
                    {warrantyStatus && (
                      <Badge variant={warrantyStatus.variant} className="shrink-0">
                        <warrantyStatus.icon className="h-3 w-3 mr-1" />
                        {warrantyStatus.label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {appliance.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{appliance.location}</span>
                    </div>
                  )}
                  {appliance.purchasePrice && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 shrink-0" />
                      ${parseFloat(appliance.purchasePrice).toFixed(2)}
                    </div>
                  )}
                  {appliance.warrantyExpiration && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      Warranty: {new Date(appliance.warrantyExpiration).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    S/N: {appliance.serialNumber}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAppliance(appliance)}
                      className="flex-1"
                      data-testid={`button-edit-appliance-${appliance.id}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteAppliance(appliance.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                      data-testid={`button-delete-appliance-${appliance.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppliance ? 'Edit Appliance' : 'Add New Appliance'}
            </DialogTitle>
            <DialogDescription>
              {editingAppliance ? 'Update the appliance details' : 'Enter the appliance details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applianceType">
                Appliance Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.applianceType}
                onValueChange={(value) =>
                  setFormData({ ...formData, applianceType: value })
                }
              >
                <SelectTrigger data-testid="select-appliance-type">
                  <SelectValue placeholder="Select appliance type" />
                </SelectTrigger>
                <SelectContent>
                  {APPLIANCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand <span className="text-destructive">*</span></Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="e.g., Samsung, LG, Whirlpool"
                  data-testid="input-appliance-brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number <span className="text-destructive">*</span></Label>
                <Input
                  id="modelNumber"
                  value={formData.modelNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, modelNumber: e.target.value })
                  }
                  placeholder="e.g., RF28R7351SR"
                  data-testid="input-appliance-model"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number <span className="text-destructive">*</span></Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, serialNumber: e.target.value })
                  }
                  placeholder="e.g., 123456789"
                  data-testid="input-appliance-serial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location in Home</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Kitchen, Basement"
                  data-testid="input-appliance-location"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date <span className="text-destructive">*</span></Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  data-testid="input-appliance-purchase-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installationDate">Installation Date</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installationDate: e.target.value,
                    })
                  }
                  data-testid="input-appliance-install-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                placeholder="e.g., 1299.99"
                data-testid="input-appliance-price"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Warranty Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiration">Warranty Expiration</Label>
                  <Input
                    id="warrantyExpiration"
                    type="date"
                    value={formData.warrantyExpiration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warrantyExpiration: e.target.value,
                      })
                    }
                    data-testid="input-appliance-warranty-exp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyType">Warranty Type</Label>
                  <Select
                    value={formData.warrantyType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, warrantyType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-warranty-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="Extended">Extended</SelectItem>
                      <SelectItem value="Labor">Labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyProvider">Warranty Provider</Label>
                  <Input
                    id="warrantyProvider"
                    value={formData.warrantyProvider}
                    onChange={(e) =>
                      setFormData({ ...formData, warrantyProvider: e.target.value })
                    }
                    placeholder="e.g., Samsung, Asurion"
                    data-testid="input-warranty-provider"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyPolicyNumber">Policy Number</Label>
                  <Input
                    id="warrantyPolicyNumber"
                    value={formData.warrantyPolicyNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, warrantyPolicyNumber: e.target.value })
                    }
                    placeholder="e.g., WP-12345678"
                    data-testid="input-warranty-policy"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="warrantyCoverageDetails">Coverage Details</Label>
                <Textarea
                  id="warrantyCoverageDetails"
                  value={formData.warrantyCoverageDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, warrantyCoverageDetails: e.target.value })
                  }
                  placeholder="What does the warranty cover?"
                  rows={2}
                  data-testid="textarea-warranty-coverage"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional notes about this appliance"
                rows={2}
                data-testid="textarea-appliance-notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel-appliance"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-save-appliance">
                {submitting ? 'Saving...' : editingAppliance ? 'Update Appliance' : 'Add Appliance'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
