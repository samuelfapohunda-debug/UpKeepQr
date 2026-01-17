import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, Smartphone, Bell, Shield, Loader2 } from "lucide-react";

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
  isSubmitting?: boolean;
}

export default function Step4Notifications({ email, data, onComplete, onBack, onSkip, isSubmitting = false }: Step4Props) {
  const [enableSMS, setEnableSMS] = useState(data.enableSMS || false);
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || "");

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ enableSMS, phoneNumber: enableSMS ? phoneNumber : "" });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">How Would You Like Reminders?</CardTitle>
          <CardDescription>
            Choose how we'll notify you about upcoming maintenance tasks
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Email Reminders</p>
                <p className="text-sm text-muted-foreground">Enabled for: {email}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  Always On
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${enableSMS ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Smartphone className={`h-5 w-5 ${enableSMS ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium">SMS Text Reminders</p>
                  <p className="text-sm text-muted-foreground">Get urgent reminders via text</p>
                </div>
              </div>
              <Switch
                checked={enableSMS}
                onCheckedChange={setEnableSMS}
                data-testid="switch-sms"
              />
            </div>

            {enableSMS && (
              <div className="mt-4 pl-13 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    data-testid="input-phone"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    We'll only text you about important maintenance reminders. 
                    Message frequency varies. Message and data rates may apply. 
                    Reply STOP to cancel anytime.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What you'll receive:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Weekly maintenance digest every Monday</li>
                  <li>Urgent reminders 3 days before high-priority tasks</li>
                  <li>Seasonal maintenance tips</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
                className="flex-1"
                data-testid="button-step4-back"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                size="lg"
                disabled={isSubmitting}
                data-testid="button-complete-setup"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-step4-skip"
            >
              {isSubmitting ? "Saving..." : "Skip - Use email only"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
