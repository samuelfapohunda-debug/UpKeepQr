import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function CheckEmail() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name') || 'there';
  const email = params.get('email') || '';
  const isReturning = params.get('returning') === 'true';

  const maskedEmail = email 
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="title-check-email">
              {isReturning ? `Welcome Back, ${name}!` : `Check Your Email, ${name}!`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                {isReturning 
                  ? "Your home is already set up! We've sent a login link to"
                  : "We've sent a secure login link to"
                }
              </p>
              {maskedEmail && (
                <p className="font-medium text-lg" data-testid="text-masked-email">
                  {maskedEmail}
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Click the link in your email to access your home maintenance dashboard
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  The link is valid for 24 hours and can only be used once
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Check your spam folder if you don't see it within a few minutes
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Already clicked the link? You can close this page.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                data-testid="button-back-home"
              >
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
