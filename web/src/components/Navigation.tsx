import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" data-testid="logo-icon">
                <rect width="32" height="32" rx="6" fill="#A6E22E"/>
                <path d="M16 6L8 12H10V20H14V16H18V20H22V12H24L16 6Z" fill="white"/>
                <path d="M12 18L14 20L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-semibold text-lg" data-testid="logo-text">UpKeepQR</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="link-home"
            >
              Home
            </Link>
            <Link 
              to="/setup/demo-token" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/setup/demo-token') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="link-setup"
            >
              Setup
            </Link>
            <Link 
              to="/agent" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/agent') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="link-dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
