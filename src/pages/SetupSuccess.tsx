import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import ExtendedHomeProfile from '../components/setup/ExtendedHomeProfile';

export default function SetupSuccess() {
  const [setupResult, setSetupResult] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const stored = sessionStorage.getItem('setupResult');
    if (!stored) {
      setLocation('/');
      return;
    }
    
    const result = JSON.parse(stored);
    setSetupResult(result);
  }, []);

  if (!setupResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">🎉 Setup Complete!</h1>
            <p className="text-muted-foreground mb-6">
              Your home profile has been created successfully
            </p>
            
            {setupResult.qr_url && (
              <div className="inline-block p-4 bg-white rounded-lg border-2 border-border mb-4">
                <img 
                  src={setupResult.qr_url} 
                  alt="Home QR Code" 
                  className="w-48 h-48"
                />
              </div>
            )}
            
            <div className="text-sm text-muted-foreground mb-6">
              <p>Home ID: <span className="font-mono font-bold">{setupResult.home_id}</span></p>
              {setupResult.share_code && (
                <p>Share Code: <span className="font-mono font-bold">{setupResult.share_code}</span></p>
              )}
            </div>

            <Link href="/dashboard">
              <a className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Go to Dashboard
              </a>
            </Link>
          </div>
        </div>

        {setupResult.home_id && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Want More Personalized Maintenance?</h2>
              <p className="text-muted-foreground">
                Add more details to get customized schedules
              </p>
            </div>
            
            <ExtendedHomeProfile 
              homeId={setupResult.home_id}
              onSave={(data) => console.log('Saved:', data)}
            />
          </>
        )}

        <div className="text-center mt-6">
          <Link href="/dashboard">
            <a className="text-sm text-muted-foreground hover:text-foreground">
              Skip for now →
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
