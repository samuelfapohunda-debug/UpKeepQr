import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MagicLink() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      window.location.href = '/auth/error?message=invalid-link';
      return;
    }

    // The backend returns HTML with a form that auto-submits
    // Just let the browser handle the redirect naturally
    window.location.href = `/api/auth/magic?token=${token}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <h2 className="text-xl font-semibold text-slate-900">Verifying Your Link</h2>
            <p className="text-slate-600">Please wait while we authenticate you...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
