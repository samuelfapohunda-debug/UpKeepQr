import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

export default function GoogleAuthComplete() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      window.location.href = '/auth/error?message=invalid-link';
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/google/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          window.location.href = data.redirectPath || '/my-home';
        } else {
          setError(data.error || 'Sign-in failed');
        }
      })
      .catch(() => setError('Something went wrong. Please try again.'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/customer-login" className="text-primary underline">Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
