import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Smartphone, Bell } from "lucide-react";

interface Step4Data {
  enableSMS: boolean;
  phoneNumber: string;
}

interface Step4Props {
  email: string;
  data: Step4Data;
  onComplete: (data: Step4Data) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export default function Step4Notifications({ 
  email, 
  data, 
  onComplete, 
  onBack, 
  onSkip,
  isLoading 
}: Step4Props) {
  const [enableSMS, setEnableSMS] = useState(data.enableSMS || false);
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || "");
  const [error, setError] = useState("");

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enableSMS) {
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Please enter a valid 10-digit phone number");
        return;
      }
    }
    
    onComplete({ enableSMS, phoneNumber });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set Up Notifications</CardTitle>
          <CardDescription>
            Choose how you'd like to receive maintenance reminders
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Email Notifications Enabled</p>
                <p className="text-sm text-green-700 dark:text-green-300">{email}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="enableSMS"
                checked={enableSMS}
                onCheckedChange={(checked) => {
                  setEnableSMS(checked as boolean);
                  if (!checked) {
                    setPhoneNumber("");
                    setError("");
                  }
                }}
                data-testid="checkbox-enable-sms"
              />
              <div className="flex-1">
                <Label htmlFor="enableSMS" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="w-4 h-4" />
                  <span className="font-medium">Enable SMS Reminders</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get text message reminders for upcoming maintenance tasks
                </p>
              </div>
            </div>

            {enableSMS && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className={error ? 'border-destructive' : ''}
                  data-testid="input-phone-number"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Standard message and data rates may apply. Reply STOP to opt out anytime.
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Reminder Schedule</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>High priority tasks: 7, 3, and 1 day before due</li>
                  <li>Medium priority tasks: 7 and 1 day before due</li>
                  <li>Low priority tasks: 3 days before due</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
              data-testid="button-step4-back"
            >
              Back
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onSkip}
              className="flex-1"
              disabled={isLoading}
              data-testid="button-step4-skip"
            >
              Skip & Finish
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              size="lg"
              disabled={isLoading}
              data-testid="button-complete-setup"
            >
              {isLoading ? "Completing..." : "Complete Setup"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
