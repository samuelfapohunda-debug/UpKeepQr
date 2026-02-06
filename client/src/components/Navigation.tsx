import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Loader2 } from 'lucide-react';
const maintcueLogo = '/images/maintcue-logo.svg';

export default function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading, isCustomer, customerLoading, logout, customerLogout, adminEmail } = useAuth();
  
  const isActive = (path: string) => location === path;
  
  const handleAdminLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleCustomerLogout = async () => {
    await customerLogout();
    window.location.href = '/';
  };

  const isAdmin = isAuthenticated && !isCustomer;
  const showLoading = isLoading || customerLoading;

  if (isAdmin) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity"
                data-testid="logo-link"
              >
                <img 
                  src={maintcueLogo} 
                  alt="MaintCue - Your Maintenance Intelligence Platform" 
                  className="h-9 sm:h-11 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  data-testid="logo-icon"
                />
                <span className="font-semibold text-sm sm:text-base lg:text-lg truncate text-white" data-testid="logo-text">Admin</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              <Link 
                href="/admin/requests" 
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/requests') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
                data-testid="link-admin-dashboard"
              >
                Pro Dashboard
              </Link>
              
              <Link 
                href="/admin/magnets" 
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/magnets') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
                data-testid="link-magnet-dashboard"
              >
                Magnet Orders
              </Link>
              
              <Link 
                href="/admin/setup-forms" 
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/admin/setup-forms') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
                data-testid="link-setup-forms"
              >
                Setup Forms
              </Link>

              <Link 
                href="/contact?type=demo" 
                className="px-4 py-1.5 sm:px-6 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                data-testid="button-demo-request"
              >
                Demo Request
              </Link>

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-600">
                <span className="hidden md:inline text-xs text-gray-400 truncate max-w-[150px]" title={adminEmail || ''}>
                  {adminEmail}
                </span>
                <Button onClick={handleAdminLogout} variant="ghost" size="sm" className="text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-slate-700" data-testid="button-logout">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="logo-link"
            >
              <img 
                src={maintcueLogo} 
                alt="MaintCue - Your Maintenance Intelligence Platform" 
                className="h-10 sm:h-12 w-auto"
                data-testid="logo-icon"
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            {!showLoading && isCustomer && (
              <Link 
                href="/my-home" 
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  isActive('/my-home') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                data-testid="link-my-home"
              >
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                My Home
              </Link>
            )}

            <Link 
              href="/request-pro" 
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive('/request-pro') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="link-request-pro"
            >
              Request a Pro
            </Link>
            
            <Link 
              href="/contact" 
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive('/contact') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="link-contact"
            >
              Contact Us
            </Link>
            
            
            <Link 
              href="/pricing" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap hover:bg-primary/90"
              data-testid="button-order-magnet"
            >
              Order Magnet
            </Link>

            <Link 
              href="/contact?type=demo" 
              className="px-3 py-1.5 sm:px-6 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              data-testid="button-demo-request"
            >
              Demo Request
            </Link>
            
            {showLoading ? (
              <div className="ml-2 pl-2 border-l border-border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : isCustomer ? (
              <Button onClick={handleCustomerLogout} variant="ghost" size="sm" className="text-xs sm:text-sm ml-2" data-testid="button-customer-logout">
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm ml-2" data-testid="button-admin-login">
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
