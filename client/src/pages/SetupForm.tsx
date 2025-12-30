import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";

import ProgressIndicator from "@/components/onboarding/ProgressIndicator";
import Step1HomeProfile from "@/components/onboarding/Step1HomeProfile";
import Step2Account from "@/components/onboarding/Step2Account";
import GratificationPreview from "@/components/onboarding/GratificationPreview";
import Step3RefineSchedule from "@/components/onboarding/Step3RefineSchedule";
import Step4Notifications from "@/components/onboarding/Step4Notifications";

const TOTAL_STEPS = 4;
const STEP_LABELS = [
  "Home Profile",
  "Account Details",
  "Refine Schedule",
  "Notifications"
];

interface FormData {
  homeType: string;
  squareFootage: string;
  email: string;
  name: string;
  zipCode: string;
  hvacType: string;
  waterHeaterType: string;
  yearBuilt: string;
  enableSMS: boolean;
  phoneNumber: string;
  householdId: string;
}

interface PreviewTask {
  name: string;
  priority: string;
  dueDate: string;
  category: string;
}

export default function SetupForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/setup/:token");
  const { toast } = useToast();
  
  const token = params?.token || null;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showGratification, setShowGratification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    homeType: "",
    squareFootage: "",
    email: "",
    name: "",
    zipCode: "",
    hvacType: "",
    waterHeaterType: "",
    yearBuilt: "",
    enableSMS: false,
    phoneNumber: "",
    householdId: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load saved progress:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.homeType || formData.email) {
      localStorage.setItem("onboarding_progress", JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!token || token === "new") return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/setup/${token}/customer-data`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.customerData) {
            setFormData(prev => ({
              ...prev,
              name: data.customerData.name || "",
              email: data.customerData.email || "",
              zipCode: data.customerData.zip || ""
            }));
          }
        } else if (response.status === 409) {
          const data = await response.json();
          toast({
            variant: "destructive",
            title: "Already Activated",
            description: data.message || "This QR code has already been activated."
          });
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    };

    fetchCustomerData();
  }, [token, toast]);

  const handleStep1Next = (data: { homeType: string; squareFootage: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handleStep2Next = async (data: { email: string; name: string; zipCode: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/setup/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeType: formData.homeType,
          squareFootage: formData.squareFootage,
          email: data.email,
          name: data.name,
          zipCode: data.zipCode,
          token: token
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      const result = await response.json();
      
      setFormData(prev => ({ ...prev, householdId: result.householdId }));
      setTaskCount(result.taskCount || 0);
      setPreviewTasks(result.previewTasks || []);
      
      setShowGratification(true);
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGratificationContinue = () => {
    setShowGratification(false);
    setCurrentStep(3);
    window.scrollTo(0, 0);
  };

  const handleGratificationSkip = () => {
    completeOnboarding();
  };

  const handleStep3Next = async (data: { hvacType: string; waterHeaterType: string; yearBuilt: string; squareFootage: string; homeType: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    
    try {
      await fetch(`${API_BASE_URL}/api/setup/update-home-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: formData.householdId,
          hvacType: data.hvacType,
          waterHeaterType: data.waterHeaterType,
          yearBuilt: data.yearBuilt,
          squareFootage: data.squareFootage
        })
      });
    } catch (error) {
      console.error("Error updating home details:", error);
    }
    
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  const handleStep3Skip = () => {
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  const handleStep4Complete = async (data: { enableSMS: boolean; phoneNumber: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setIsLoading(true);
    
    try {
      await fetch(`${API_BASE_URL}/api/setup/update-preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: formData.householdId,
          enableSMS: data.enableSMS,
          phoneNumber: data.phoneNumber
        })
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }

    completeOnboarding();
  };

  const handleStep4Skip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      await fetch(`${API_BASE_URL}/api/setup/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: formData.householdId,
          hvacType: formData.hvacType,
          waterHeaterType: formData.waterHeaterType,
          yearBuilt: formData.yearBuilt
        })
      });

      localStorage.removeItem("onboarding_progress");

      setLocation(`/registration/success?household=${formData.householdId}&name=${encodeURIComponent(formData.name)}`);
      
    } catch (error) {
      console.error("Error finalizing setup:", error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (showGratification) {
      setShowGratification(false);
      return;
    }
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-background dark:to-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Home Setup
          </h1>
          <p className="text-muted-foreground">
            Get your personalized maintenance schedule in just a few minutes
          </p>
        </div>

        {!showGratification && (
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
          />
        )}

        <div className="mt-8">
          {showGratification ? (
            <GratificationPreview
              homeType={formData.homeType}
              taskCount={taskCount}
              previewTasks={previewTasks}
              onContinue={handleGratificationContinue}
              onSkip={handleGratificationSkip}
              householdId={formData.householdId}
            />
          ) : currentStep === 1 ? (
            <Step1HomeProfile
              data={{ homeType: formData.homeType, squareFootage: formData.squareFootage }}
              onNext={handleStep1Next}
            />
          ) : currentStep === 2 ? (
            <Step2Account
              data={{ email: formData.email, name: formData.name, zipCode: formData.zipCode }}
              onNext={handleStep2Next}
              onBack={handleBack}
              isLoading={isLoading}
            />
          ) : currentStep === 3 ? (
            <Step3RefineSchedule
              data={{ 
                hvacType: formData.hvacType, 
                waterHeaterType: formData.waterHeaterType,
                yearBuilt: formData.yearBuilt,
                squareFootage: formData.squareFootage,
                homeType: formData.homeType
              }}
              onNext={handleStep3Next}
              onBack={handleBack}
              onSkip={handleStep3Skip}
            />
          ) : currentStep === 4 ? (
            <Step4Notifications
              email={formData.email}
              data={{ enableSMS: formData.enableSMS, phoneNumber: formData.phoneNumber }}
              onComplete={handleStep4Complete}
              onBack={handleBack}
              onSkip={handleStep4Skip}
              isLoading={isLoading}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
