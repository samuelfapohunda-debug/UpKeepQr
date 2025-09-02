import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutModalProps {
  sku: string;
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
}

const SKU_DETAILS = {
  single: { name: "Single Pack", price: "$19", description: "1 QR Magnet for homeowners" },
  twopack: { name: "Two Pack", price: "$35", description: "2 QR Magnets - great for sharing" },
  "100pack": { name: "Agent 100-Pack", price: "$899", description: "100 QR Magnets for real estate agents" },
  "500pack": { name: "Agent 500-Pack", price: "$3,999", description: "500 QR Magnets for enterprise agents" },
};

export default function CheckoutModal({ sku, isOpen, onClose, agentId }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Create checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sku, agentId }),
      });

      if (!response.ok) {
        let errorMessage = "Checkout failed";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          // Failed to parse error response, use default message
        }
        throw new Error(errorMessage);
      }

      const { sessionId } = await response.json();
      
      // Check if sessionId is valid
      if (!sessionId || !sessionId.startsWith('cs_')) {
        throw new Error("Invalid session ID received from server");
      }
      
      // Get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load - check your internet connection");
      }

      // Open Stripe checkout in new window to avoid navigation issues
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId.trim()}`;
      const checkoutWindow = window.open(checkoutUrl, '_blank');
      
      if (!checkoutWindow) {
        throw new Error('Please allow popups for this site to complete your purchase');
      }
      
      // Close the modal since checkout is opening in new tab
      onClose();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error?.message || "Unable to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const details = SKU_DETAILS[sku as keyof typeof SKU_DETAILS];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You're about to purchase the {details?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">{details?.name}</h3>
            <p className="text-gray-600 text-sm">{details?.description}</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{details?.price}</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isLoading}
              data-testid="button-cancel-checkout"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              className="flex-1"
              disabled={isLoading}
              data-testid="button-proceed-checkout"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}