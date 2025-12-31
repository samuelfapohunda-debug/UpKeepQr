import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ProgressIndicator from "@/components/onboarding/ProgressIndicator";
import Step1HomeProfile from "@/components/onboarding/Step1HomeProfile";
import Step2Account from "@/components/onboarding/Step2Account";
import GratificationPreview from "@/components/onboarding/GratificationPreview";
import Step3RefineSchedule from "@/components/onboarding/Step3RefineSchedule";
import Step4Notifications from "@/components/onboarding/Step4Notifications";
import { apiRequest } from "@/lib/queryClient";

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
}

const TOTAL_STEPS = 4;
const STEP_LABELS = [
  "Your Home",
  "Account Setup",
  "Refine Schedule",
  "Notifications"
];

export default function SetupForm() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ token: string }>('/new-setup/:token');
  const { toast } = useToast();

  const token = match ? params.token : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [showGratification, setShowGratification] = useState(false);
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
    phoneNumber: ""
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const debouncedSave = useCallback((data: FormData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("onboarding_progress", JSON.stringify(data));
    }, 500);
  }, []);

  useEffect(() => {
    debouncedSave(formData);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, debouncedSave]);

  const handleStep1Next = (data: { homeType: string; squareFootage: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handleStep2Next = async (data: { email: string; name: string; zipCode: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setShowGratification(true);
    window.scrollTo(0, 0);
  };

  const handleGratificationContinue = () => {
    setShowGratification(false);
    setCurrentStep(3);
    window.scrollTo(0, 0);
  };

  const handleGratificationSkip = () => {
    setShowGratification(false);
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  const handleStep3Next = (data: { hvacType: string; waterHeaterType: string; yearBuilt: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  const handleStep3Skip = () => {
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  const handleStep4Complete = async (data: { enableSMS: boolean; phoneNumber: string }) => {
    setFormData(prev => ({ ...prev, ...data }));
    completeOnboarding();
  };

  const handleStep4Skip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      localStorage.removeItem("onboarding_progress");
      
      const firstName = formData.name.split(" ")[0];
      navigate(`/registration/success?name=${encodeURIComponent(firstName)}`);
      
    } catch (error) {
      console.error("Error completing setup:", error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
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

  const getPreviewTasks = () => {
    return [
      {
        name: "Replace HVAC Filters",
        priority: "high",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        category: "HVAC"
      },
      {
        name: "Test Smoke Detectors",
        priority: "high",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Safety"
      },
      {
        name: "Clean Kitchen Exhaust Hood",
        priority: "medium",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Appliances"
      }
    ];
  };

  const getTaskCount = () => {
    if (formData.homeType === "Condo" || formData.homeType === "Apartment") {
      return 28;
    }
    return 37;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="setup-title">
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
              taskCount={getTaskCount()}
              previewTasks={getPreviewTasks()}
              onContinue={handleGratificationContinue}
              onSkip={handleGratificationSkip}
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
            />
          ) : currentStep === 3 ? (
            <Step3RefineSchedule
              data={{ 
                hvacType: formData.hvacType, 
                waterHeaterType: formData.waterHeaterType,
                yearBuilt: formData.yearBuilt 
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
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
