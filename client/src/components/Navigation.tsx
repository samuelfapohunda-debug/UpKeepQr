import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated, logout, adminEmail } = useAuth();
  
  const isActive = (path: string) => location === path;
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity"
              data-testid="logo-link"
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" data-testid="logo-icon" className="sm:w-6 sm:h-6">
                <rect width="32" height="32" rx="6" fill="#A6E22E"/>
                <path d="M16 6L8 12H10V20H14V16H18V20H22V12H24L16 6Z" fill="white"/>
                <path d="M12 18L14 20L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-semibold text-sm sm:text-base lg:text-lg truncate" data-testid="logo-text">UpKeepQR</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
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
            
            {isAuthenticated && (
              <>
                <Link 
                  href="/admin/requests" 
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive('/admin/requests') 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent hover:text-accent-foreground'
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
                      : 'hover:bg-accent hover:text-accent-foreground'
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
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid="link-setup-forms"
                >
                  Setup Forms
                </Link>
              </>
            )}
            
            <Link 
              href="/pricing" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap hover:bg-primary/90"
              data-testid="button-order-magnet"
            >
              Order Magnet
            </Link>
            
            {isAuthenticated && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[150px]" title={adminEmail || ''}>
                  {adminEmail}
                </span>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-xs sm:text-sm" data-testid="button-logout">
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}