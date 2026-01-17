import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MagicLink() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/auth/error');
      return;
    }

    // Call backend to verify token and create session
    fetch(`/api/auth/magic?token=${token}`, {
      credentials: 'include'
    })
      .then(res => {
        if (res.redirected) {
          window.location.href = res.url;
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data?.error) {
          setError(data.error);
          setTimeout(() => navigate('/auth/error'), 2000);
        }
      })
      .catch(err => {
        console.error('Magic link error:', err);
        setError('Failed to authenticate');
        setTimeout(() => navigate('/auth/error'), 2000);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {error ? (
              <>
                <div className="text-red-500">❌</div>
                <h2 className="text-xl font-semibold text-slate-900">Authentication Failed</h2>
                <p className="text-slate-600">{error}</p>
                <p className="text-sm text-slate-500">Redirecting...</p>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <h2 className="text-xl font-semibold text-slate-900">Verifying Your Link</h2>
                <p className="text-slate-600">Please wait while we authenticate you...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
