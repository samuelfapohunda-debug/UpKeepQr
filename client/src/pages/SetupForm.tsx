import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ProgressIndicator from "@/components/onboarding/ProgressIndicator";
import Step1HomeProfile from "@/components/onboarding/Step1HomeProfile";
import Step2Account from "@/components/onboarding/Step2Account";
import GratificationPreview from "@/components/onboarding/GratificationPreview";
import Step3RefineSchedule from "@/components/onboarding/Step3RefineSchedule";
import Step4Notifications from "@/components/onboarding/Step4Notifications";
import { API_BASE_URL } from "@/lib/api-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";

interface FormData {
  homeType: string;
  squareFootage: string;
  email: string;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  hvacType: string;
  waterHeaterType: string;
  yearBuilt: string;
  enableSMS: boolean;
  phoneNumber: string;
}

type ActivationStatus = 'checking' | 'inactive' | 'active' | 'invalid' | 'error';

const TOTAL_STEPS = 4;
const STEP_LABELS = [
  "Your Home",
  "Account Setup",
  "Refine Schedule",
  "Notifications"
];

export default function SetupForm() {
  const [, navigate] = useLocation();
  const [newSetupMatch, newSetupParams] = useRoute<{ token: string }>('/new-setup/:token');
  const [setupMatch, setupParams] = useRoute<{ token: string }>('/setup/:token');
  const { toast } = useToast();

  // Support both /new-setup/:token and /setup/:token URLs
  // Also extract from URL path as fallback in case route matching fails
  const routeToken = newSetupMatch ? newSetupParams.token : (setupMatch ? setupParams.token : null);
  const urlToken = (() => {
    const path = window.location.pathname;
    const setupMatch = path.match(/\/(?:new-)?setup\/([^/]+)/);
    return setupMatch ? setupMatch[1] : null;
  })();
  const token = routeToken || urlToken;

  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('checking');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showGratification, setShowGratification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    homeType: "",
    squareFootage: "",
    email: "",
    name: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    hvacType: "",
    waterHeaterType: "",
    yearBuilt: "",
    enableSMS: false,
    phoneNumber: ""
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkActivationStatus = async () => {
      if (!token) {
        setActivationStatus('inactive');
        return;
      }
      
      try {
        console.log("Checking activation status for token:", token);
        const response = await fetch(`${API_BASE_URL}/api/setup/check/${token}`);
        const result = await response.json();
        console.log("Activation check response:", response.status, result);
        
        // Check for invalid QR code (404 or status='invalid')
        if (response.status === 404 || result.status === 'invalid') {
          console.log("Setting activation status to invalid");
          setActivationStatus('invalid');
          return;
        }
        
        if (!response.ok) {
          console.log("Response not OK, setting error status");
          setActivationStatus('error');
          return;
        }
        
        if (result.status === 'active') {
          console.log("QR is already active");
          setActivationStatus('active');
          if (result.email) {
            setMaskedEmail(result.email);
          }
        } else {
          console.log("QR is inactive, showing form");
          setActivationStatus('inactive');
        }
      } catch (error) {
        console.error("Failed to check activation status:", error);
        setActivationStatus('error');
      }
    };
    
    checkActivationStatus();
  }, [token]);

  useEffect(() => {
    if (activationStatus !== 'inactive') return;
    
    const saved = localStorage.getItem("onboarding_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load saved progress:", e);
      }
    }
  }, [activationStatus]);

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

  const handleStep2Next = async (data: { email: string; name: string; zipCode: string; streetAddress?: string; city?: string; state?: string }) => {
    setFormData(prev => ({ 
      ...prev, 
      ...data,
      streetAddress: data.streetAddress || "",
      city: data.city || "",
      state: data.state || ""
    }));
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
    if (isSubmitting) return;
    
    // CRITICAL: Ensure token is present before submission
    if (!token) {
      console.error("Cannot complete onboarding without activation token");
      toast({
        title: "Error",
        description: "Missing activation code. Please scan your QR code again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const activationData: Record<string, string | boolean | number | undefined> = {
        fullName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phoneNumber || '',
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zip: formData.zipCode.trim(),
        smsOptIn: formData.enableSMS,
        token: token, // Always include token
      };

      if (formData.homeType) activationData.homeType = formData.homeType.toLowerCase().replace(' ', '_');
      if (formData.squareFootage) activationData.sqft = parseInt(formData.squareFootage);
      if (formData.yearBuilt) activationData.yearBuilt = parseInt(formData.yearBuilt);
      if (formData.hvacType) activationData.hvacType = formData.hvacType.toLowerCase().replace(' ', '_');
      if (formData.waterHeaterType) activationData.waterHeater = formData.waterHeaterType.toLowerCase().replace(' ', '_');

      console.log("Submitting activation data with token:", token, activationData);

      const jwtToken = localStorage.getItem('maintcue_admin_token') || sessionStorage.getItem('maintcue_admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/setup/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activationData),
        credentials: 'include',
      });

      const result = await response.json();
      console.log("Activation response:", response.status, result);

      if (!response.ok || !result.success) {
        setIsSubmitting(false);
        toast({
          title: "Error",
          description: result.error || "Failed to complete setup. Please try again.",
          variant: "destructive"
        });
        return;
      }

      localStorage.removeItem("onboarding_progress");
      
      const firstName = formData.name.split(" ")[0];
      
      if (result.alreadyActivated) {
        navigate(`/check-email?name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(result.email || formData.email)}&returning=true`);
      } else {
        navigate(`/check-email?name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(formData.email)}`);
      }
      
    } catch (error) {
      console.error("Error completing setup:", error);
      setIsSubmitting(false);
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

  if (activationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground" data-testid="text-checking-status">Checking QR code status...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activationStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle data-testid="title-invalid-code">Invalid QR Code</CardTitle>
              <CardDescription>
                This QR code is not recognized. Please check your QR magnet and try scanning again.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (activationStatus === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle data-testid="title-already-activated">Check Your Email</CardTitle>
              <CardDescription className="space-y-2">
                <p>This QR code is already activated!</p>
                {maskedEmail ? (
                  <p>We've sent a login link to <strong>{maskedEmail}</strong></p>
                ) : (
                  <p>We've sent a login link to your registered email address.</p>
                )}
                <p className="text-sm mt-4">The link will expire in 24 hours. Check your spam folder if you don't see it.</p>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (activationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle data-testid="title-error">Something Went Wrong</CardTitle>
              <CardDescription>
                We couldn't verify your QR code. Please try scanning again or contact support.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

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
              data={{ 
                email: formData.email, 
                name: formData.name, 
                zipCode: formData.zipCode,
                streetAddress: formData.streetAddress,
                city: formData.city,
                state: formData.state
              }}
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
              isSubmitting={isSubmitting}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
