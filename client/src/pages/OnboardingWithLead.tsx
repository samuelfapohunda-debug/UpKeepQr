import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Onboarding from "./Onboarding";
import LeadCaptureForm from "@/components/LeadCapture/LeadCaptureForm";

export default function OnboardingWithLead() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"setup" | "lead">("setup");
  const activationCode = params.token || "";

  const handleSetupComplete = () => {
    console.log("✅ Setup complete, showing lead capture form");
    setStep("lead");
  };

  const handleLeadComplete = () => {
    console.log("✅ Lead captured, redirecting to success");
    setLocation("/setup/success");
  };

  if (step === "setup") {
    return <Onboarding onComplete={handleSetupComplete} />;
  }

  return <LeadCaptureForm activationCode={activationCode} onComplete={handleLeadComplete} />;
}
