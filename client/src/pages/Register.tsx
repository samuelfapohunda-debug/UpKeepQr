import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const maintcueLogo = '/images/maintcue-logo.svg';

function tierRedirect(tier?: string | null): string {
  if (tier === 'property_manager') return '/property-manager';
  if (tier === 'realtor') return '/realtor';
  return '/onboarding';
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { customerRegister, isCustomer, customerLoading } = useAuth();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerLoading && isCustomer) setLocation('/my-home');
  }, [isCustomer, customerLoading, setLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const result = await customerRegister(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim());
      if (result.success) {
        setLocation(tierRedirect(result.subscriptionTier));
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
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
          <h1 className="text-3xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Get started with MaintCue today</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">First name</label>
                <input id="firstName" name="firstName" type="text" required value={form.firstName} onChange={handleChange} disabled={loading}
                  className="w-full px-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                  placeholder="Jane" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">Last name</label>
                <input id="lastName" name="lastName" type="text" required value={form.lastName} onChange={handleChange} disabled={loading}
                  className="w-full px-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                  placeholder="Smith" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="Min. 8 characters" />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">Confirm password</label>
              <input id="confirm" name="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={handleChange} disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={loading} className="w-full py-3 text-base font-semibold bg-green-600 hover:bg-green-700 text-white mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:text-primary/80 font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
