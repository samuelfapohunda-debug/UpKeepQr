import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface LeadCaptureFormProps {
  activationCode: string;
  onComplete: () => void;
}

export default function LeadCaptureForm({ activationCode, onComplete }: LeadCaptureFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    preferredContact: "Email",
    hearAboutUs: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "Residential",
    homeType: "",
    interestType: "Sales",
    needConsultation: true,
    isOwner: true,
    budgetRange: "",
    timelineToProceed: "",
    preferredContactTime: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.phone.match(/^\+?[\d\s\-()]+$/) || formData.phone.length < 10) {
      newErrors.phone = "Valid phone number is required";
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipCode.match(/^\d{5}(-\d{4})?$/)) {
      newErrors.zipCode = "Valid ZIP code is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData,
          activationCode,
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your information has been saved.",
        });
        onComplete();
      } else {
        toast({
          title: "Submission Failed",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Lead submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold">Complete Your Profile</h2>
        <p className="text-muted-foreground mt-2">Help us serve you better by sharing some details</p>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={errors.fullName ? "border-red-500" : ""}
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="preferredContact">Preferred Contact Method</Label>
          <Select
            value={formData.preferredContact}
            onValueChange={(value) => setFormData({ ...formData, preferredContact: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Phone">Phone</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="hearAboutUs">How did you hear about us?</Label>
          <Select
            value={formData.hearAboutUs}
            onValueChange={(value) => setFormData({ ...formData, hearAboutUs: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="QR Scan">QR Scan</SelectItem>
              <SelectItem value="Social Media">Social Media</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Property Location</h3>
        <div>
          <Label htmlFor="streetAddress">Street Address *</Label>
          <Input
            id="streetAddress"
            required
            value={formData.streetAddress}
            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
            className={errors.streetAddress ? "border-red-500" : ""}
          />
          {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              required
              maxLength={2}
              placeholder="GA"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              className={errors.state ? "border-red-500" : ""}
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              required
              placeholder="30301"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className={errors.zipCode ? "border-red-500" : ""}
            />
            {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="homeType">Home Type</Label>
          <Select
            value={formData.homeType}
            onValueChange={(value) => setFormData({ ...formData, homeType: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single-Family">Single-Family</SelectItem>
              <SelectItem value="Townhouse">Townhouse</SelectItem>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Duplex">Duplex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Your Interests</h3>
        <div>
          <Label>Interest Type *</Label>
          <RadioGroup
            value={formData.interestType}
            onValueChange={(value) => setFormData({ ...formData, interestType: value })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sales" id="sales" />
              <Label htmlFor="sales">Sales</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Rent" id="rent" />
              <Label htmlFor="rent">Rent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Lease" id="lease" />
              <Label htmlFor="lease">Lease</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label>Need Consultation?</Label>
          <RadioGroup
            value={formData.needConsultation ? "Yes" : "No"}
            onValueChange={(value) => setFormData({ ...formData, needConsultation: value === "Yes" })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="consult-yes" />
              <Label htmlFor="consult-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="consult-no" />
              <Label htmlFor="consult-no">No</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label>Are You the Owner?</Label>
          <RadioGroup
            value={formData.isOwner ? "Yes" : "No"}
            onValueChange={(value) => setFormData({ ...formData, isOwner: value === "Yes" })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="owner-yes" />
              <Label htmlFor="owner-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="owner-no" />
              <Label htmlFor="owner-no">No</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="budgetRange">Budget Range (Optional)</Label>
          <Select
            value={formData.budgetRange}
            onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="$0-5K">$0–5K</SelectItem>
              <SelectItem value="$5K-15K">$5K–15K</SelectItem>
              <SelectItem value="$15K-30K">$15K–30K</SelectItem>
              <SelectItem value="$30K+">$30K+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timelineToProceed">Timeline to Proceed</Label>
          <Select
            value={formData.timelineToProceed}
            onValueChange={(value) => setFormData({ ...formData, timelineToProceed: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Immediately">Immediately</SelectItem>
              <SelectItem value="Within 1 Month">Within 1 Month</SelectItem>
              <SelectItem value="1-3 Months">1–3 Months</SelectItem>
              <SelectItem value="Just Exploring">Just Exploring</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
          <Select
            value={formData.preferredContactTime}
            onValueChange={(value) => setFormData({ ...formData, preferredContactTime: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes / Comments</Label>
          <Textarea
            id="notes"
            placeholder="Tell us more about your needs..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Complete Setup"}
      </Button>
    </form>
  );
}
