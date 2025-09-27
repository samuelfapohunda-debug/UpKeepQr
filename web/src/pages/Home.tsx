import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6" data-testid="hero-title">
                Streamline Your 
                <span className="text-yellow-300">Agent Operations</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100" data-testid="hero-description">
                Powerful scheduling, QR code generation, and workflow automation for modern business agents. Get set up in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/setup/demo-token"
                  className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
                  data-testid="button-get-started"
                >
                  Get Started Free
                </Link>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors" data-testid="button-watch-demo">
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Dashboard analytics interface" 
                className="rounded-xl shadow-2xl"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="features-title">Everything You Need to Manage Agents</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="features-description">
              Comprehensive tools for scheduling, communication, and workflow automation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-qr">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-qrcode text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">QR Code Generation</h3>
              <p className="text-muted-foreground">
                Instantly generate QR codes for agent onboarding, event registration, and quick access links.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-calendar">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-calendar-alt text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Calendar Integration</h3>
              <p className="text-muted-foreground">
                Seamless ICS calendar support with automated scheduling and event management.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-automation">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-cog text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Automated Jobs</h3>
              <p className="text-muted-foreground">
                Set up recurring tasks and automated workflows to streamline operations.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-data">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-database text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Data Management</h3>
              <p className="text-muted-foreground">
                Robust PostgreSQL integration with secure data handling and validation.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-security">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-shield-alt text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Tokens</h3>
              <p className="text-muted-foreground">
                Unique token-based authentication and secure access management for all agents.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow" data-testid="feature-email">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-envelope text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Email Integration</h3>
              <p className="text-muted-foreground">
                Automated email notifications and communication tools for agent coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="cta-title">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8" data-testid="cta-description">
            Join thousands of businesses streamlining their agent operations with AgentHub.
          </p>
          <Link 
            to="/setup/demo-token"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block"
            data-testid="button-start-trial"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
