import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, MapPin } from "lucide-react";

interface Step2Data {
  email: string;
  name: string;
  zipCode: string;
}

interface Step2Props {
  data: Step2Data;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function Step2Account({ data, onNext, onBack, isLoading }: Step2Props) {
  const [email, setEmail] = useState(data.email || "");
  const [name, setName] = useState(data.name || "");
  const [zipCode, setZipCode] = useState(data.zipCode || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!name || name.trim().length < 2) {
      newErrors.name = "Full name is required";
    }
    
    if (!zipCode) {
      newErrors.zipCode = "ZIP code is required";
    } else if (zipCode.length < 5) {
      newErrors.zipCode = "Please enter a valid ZIP code";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({ email, name, zipCode });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            We'll use this to send your personalized maintenance schedule
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                data-testid="input-email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              We'll send your schedule and reminders here
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                data-testid="input-name"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">
              ZIP Code <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="zipCode"
                type="text"
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className={`pl-10 ${errors.zipCode ? 'border-destructive' : ''}`}
                maxLength={5}
                data-testid="input-zip-code"
              />
            </div>
            {errors.zipCode && (
              <p className="text-sm text-destructive">{errors.zipCode}</p>
            )}
            <p className="text-xs text-muted-foreground">
              For weather-based reminders and local service matching
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1 min-w-[120px]"
              disabled={isLoading}
              data-testid="button-step2-back"
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 min-w-[120px]"
              size="lg"
              disabled={isLoading}
              data-testid="button-step2-continue"
            >
              {isLoading ? "Creating..." : "Generate My Schedule"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
