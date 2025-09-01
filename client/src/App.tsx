import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import SetupSuccess from "@/pages/SetupSuccess";
import Dashboard from "@/pages/Dashboard";
import AgentLogin from "@/pages/AgentLogin";
import AgentDashboard from "@/pages/AgentDashboard";
import TaskDetail from "@/pages/TaskDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/setup/:token" component={Onboarding} />
        <Route path="/setup/success" component={SetupSuccess} />
        <Route path="/admin" component={Dashboard} />
        <Route path="/agent" component={AgentLogin} />
        <Route path="/agent/dashboard" component={AgentDashboard} />
        <Route path="/task/:token/:taskId" component={TaskDetail} />
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
