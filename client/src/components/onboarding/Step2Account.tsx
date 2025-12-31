import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Step2Data {
  email: string;
  name: string;
  zipCode: string;
}

interface Step2Props {
  data: Step2Data;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

export default function Step2Account({ data, onNext, onBack }: Step2Props) {
  const [email, setEmail] = useState(data.email || "");
  const [name, setName] = useState(data.name || "");
  const [zipCode, setZipCode] = useState(data.zipCode || "");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !zipCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (zipCode.length < 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive"
      });
      return;
    }

    onNext({ email, name, zipCode });
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
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                data-testid="input-email"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send your schedule and reminders here
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10"
                data-testid="input-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">
              ZIP Code <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="zipCode"
                type="text"
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                required
                className="pl-10"
                maxLength={5}
                data-testid="input-zip-code"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              For weather-based reminders and local service matching
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
              data-testid="button-step2-back"
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              size="lg"
              data-testid="button-step2-continue"
            >
              Generate My Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
