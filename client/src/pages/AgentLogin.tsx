import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AgentLogin() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/agent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("agentToken", data.token);
      localStorage.setItem("agentEmail", data.agent.email);
      localStorage.setItem("agentId", data.agent.id);
      toast({
        title: "Login successful",
        description: "Welcome to your agent dashboard",
      });
      setLocation("/agent/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your email and try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      loginMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Agent Login</CardTitle>
          <CardDescription>
            Enter your email to access your agent dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold">Demo Instructions:</p>
            <p>Enter any valid email address to log in. The system will generate a mock agent account.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}