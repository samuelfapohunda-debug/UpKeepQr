import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import type { ManagedProperty } from "@/types/dashboard";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (property: ManagedProperty) => void;
}

export default function AddPropertyModal({ open, onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    propertyName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    propertyType: "single_family",
    yearBuilt: "",
    squareFootage: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyName || !form.address || !form.city || !form.state || !form.zip) {
      toast({ title: "Required fields missing", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/portfolio/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          propertyName: form.propertyName,
          address: form.address,
          city: form.city,
          state: form.state.toUpperCase(),
          zip: form.zip,
          propertyType: form.propertyType,
          yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt, 10) : undefined,
          squareFootage: form.squareFootage ? parseInt(form.squareFootage, 10) : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || "Failed to add property");
      }

      const property = await response.json();
      toast({ title: "Property added!", description: "Your maintenance schedule is being generated." });
      onAdded(property);
      onClose();
      setForm({ propertyName: "", address: "", city: "", state: "", zip: "", propertyType: "single_family", yearBuilt: "", squareFootage: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not add property", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a Property</DialogTitle>
            <DialogDescription>
              Enter the details for your additional property. A maintenance schedule will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="propertyName">Property Name *</Label>
              <Input
                id="propertyName"
                placeholder="e.g. Beach House, Rental #2"
                value={form.propertyName}
                onChange={(e) => handleChange("propertyName", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  placeholder="75001"
                  value={form.zip}
                  onChange={(e) => handleChange("zip", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="propertyType">Type</Label>
                <Select value={form.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                  <SelectTrigger id="propertyType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="condo">Condo / Townhouse</SelectItem>
                    <SelectItem value="multi_family">Multi-Family</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  placeholder="1995"
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={form.yearBuilt}
                  onChange={(e) => handleChange("yearBuilt", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="squareFootage">Sq Ft</Label>
                <Input
                  id="squareFootage"
                  placeholder="1800"
                  type="number"
                  min={1}
                  value={form.squareFootage}
                  onChange={(e) => handleChange("squareFootage", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
