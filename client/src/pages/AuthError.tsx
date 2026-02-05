import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, ArrowRight } from "lucide-react";

export default function AuthError() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const message = params.get('message') || 'invalid-link';

  const getErrorContent = () => {
    switch (message) {
      case 'link-expired':
        return {
          title: 'Link Expired',
          description: 'This login link has expired. Please scan your QR code again to get a new link.',
          icon: RefreshCw
        };
      case 'link-already-used':
        return {
          title: 'Link Already Used',
          description: 'This login link has already been used. Each link can only be used once. Please scan your QR code again to get a new link.',
          icon: RefreshCw
        };
      case 'invalid-link':
      default:
        return {
          title: 'Invalid Link',
          description: 'This login link is not valid. Please scan your QR code again to get a new link.',
          icon: XCircle
        };
    }
  };

  const { title, description, icon: Icon } = getErrorContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl" data-testid="title-auth-error">
              {title}
            </CardTitle>
            <CardDescription className="text-base" data-testid="text-auth-error-description">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Need help? Contact support at support@maintcue.com
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              data-testid="button-back-home"
            >
              Back to Home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
