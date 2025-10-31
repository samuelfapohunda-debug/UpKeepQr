import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import OnboardingWithLead from "@/pages/OnboardingWithLead";
import SetupSuccess from "@/pages/SetupSuccess";
import Dashboard from "@/pages/Dashboard";
import AgentLogin from "@/pages/AgentLogin";
import AgentDashboard from "@/pages/AgentDashboard";
import TaskDetail from "@/pages/TaskDetail";
import NotFound from "@/pages/not-found";
import RequestPro from "@/pages/RequestPro";
import AdminDashboard from "@/pages/AdminDashboard";
import MagnetDashboard from "@/pages/MagnetDashboard";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/contact" component={Contact} />
        <Route path="/setup/success" component={SetupSuccess} />
        <Route path="/setup/:token" component={OnboardingWithLead} />
        <Route path="/admin" component={Dashboard} />
        <Route path="/agent" component={AgentLogin} />
        <Route path="/agent/dashboard" component={AgentDashboard} />
        <Route path="/task/:token/:taskId" component={TaskDetail} />
        <Route path="/request-pro" component={RequestPro} />
        <Route path="/admin/requests" component={AdminDashboard} />
        <Route path="/admin/magnets" component={MagnetDashboard} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
