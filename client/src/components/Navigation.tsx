import { Link, useLocation } from 'wouter';

export default function Navigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-tie text-primary text-xl" data-testid="logo-icon"></i>
              <span className="font-semibold text-lg" data-testid="logo-text">AgentHub</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
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
              href="/setup/demo-token" 
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
              href="/agent" 
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