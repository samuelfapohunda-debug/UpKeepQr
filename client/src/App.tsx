import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import SetupSuccess from "@/pages/SetupSuccess";
import Dashboard from "@/pages/Dashboard";
import AgentLogin from "@/pages/AgentLogin";
import AgentDashboard from "@/pages/AgentDashboard";
import TaskDetail from "@/pages/TaskDetail";
import NotFound from "@/pages/not-found";
import RequestPro from "@/pages/RequestPro";
import AdminDashboard from "@/pages/AdminDashboard";
import MagnetDashboard from "@/pages/MagnetDashboard";
import SetupFormsDashboard from "@/pages/SetupFormsDashboard";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import Appliances from "@/pages/Appliances";
import RegistrationSuccess from "@/pages/RegistrationSuccess";
import CustomerDashboard from "@/pages/CustomerDashboard";
import SetupForm from "@/pages/SetupForm";
import PaymentSuccess from "@/pages/PaymentSuccess";
import CheckEmail from "@/pages/CheckEmail";
import AuthError from "@/pages/AuthError";
import MagicLink from "@/pages/MagicLink";
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import HomeownerDashboard from "@/features/homeowner/Dashboard";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <div className="pt-20 flex-1">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={HomeownerDashboard} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/contact" component={Contact} />
        <Route path="/login" component={Login} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/setup/success" component={SetupSuccess} />
        <Route path="/registration/success" component={RegistrationSuccess} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/check-email" component={CheckEmail} />
        <Route path="/auth/magic" component={MagicLink} />
        <Route path="/auth/error" component={AuthError} />
        <Route path="/auth/error" component={AuthError} />
        <Route path="/my-home" component={CustomerDashboard} />
        <Route path="/new-setup" component={SetupForm} />
        <Route path="/new-setup/:token" component={SetupForm} />
        <Route path="/setup/:token" component={SetupForm} />
        <Route path="/task/:token/:taskId" component={TaskDetail} />
        <Route path="/request-pro" component={RequestPro} />
        
        {/* Legal Pages */}
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        
        {/* Appliance Management Routes */}
        <Route path="/appliances">
          <ProtectedRoute>
            <Appliances />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/requests">
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/magnets">
          <ProtectedRoute>
            <MagnetDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/setup-forms">
          <ProtectedRoute>
            <SetupFormsDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/agent" component={AgentLogin} />
        <Route path="/agent/dashboard">
          <ProtectedRoute>
            <AgentDashboard />
          </ProtectedRoute>
        </Route>
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
