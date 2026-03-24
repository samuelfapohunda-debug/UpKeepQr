import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { API_BASE_URL } from '@/lib/api-config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const maintcueLogo = '/images/maintcue-logo.svg';

function tierRedirect(tier?: string | null): string {
  if (tier === 'property_manager') return '/property-manager';
  if (tier === 'realtor') return '/realtor';
  if (tier === 'homeowner_basic' || tier === 'homeowner_plus') return '/my-home';
  return '/my-home';
}

export default function SetPassword() {
  const [, setLocation] = useLocation();
  const { refreshCustomerSession } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/auth/setup-info?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.email) {
          setEmail(data.email);
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to set password. Please try again.');
        return;
      }
      await refreshCustomerSession();
      setLocation(tierRedirect(data.user?.subscriptionTier));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Setup link expired</CardTitle>
            <CardDescription>
              This setup link has expired or is invalid.
              Contact support at{' '}
              <a href="mailto:support@maintcue.com" className="text-primary underline">support@maintcue.com</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setLocation('/customer-login')}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={maintcueLogo} alt="MaintCue" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Create your password</h1>
          <p className="text-muted-foreground text-sm">
            You're almost in. Set a password to access your MaintCue dashboard.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">Confirm password</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full py-3 text-base font-semibold bg-green-600 hover:bg-green-700 text-white">
              {loading ? 'Setting up...' : 'Set password & continue →'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
