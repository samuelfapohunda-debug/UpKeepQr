import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api-config';
import { Button } from '@/components/ui/button';

const maintcueLogo = '/images/maintcue-logo.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={maintcueLogo} alt="MaintCue" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Forgot your password?</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-foreground font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground">
                If that email is registered, you'll receive a reset link shortly.
              </p>
              <a href="/login" className="block text-sm text-primary hover:text-primary/80 font-medium mt-4">
                ← Back to sign in
              </a>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" disabled={loading || !email} className="w-full py-3 text-base font-semibold bg-green-600 hover:bg-green-700 text-white">
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-5">
                <a href="/login" className="text-primary hover:text-primary/80 font-medium">← Back to sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
