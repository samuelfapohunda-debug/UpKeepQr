import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Debug: Log the public key to identify the issue
console.log('Stripe public key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

      const responseData = await response.json();
      console.log('Checkout API response:', responseData);
      const { sessionId } = responseData;
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      console.log('About to redirect to checkout with sessionId:', sessionId);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      // Only log actual errors, not empty objects
      if (error && (error.message || error.name || Object.keys(error).length > 0)) {
        console.error("Checkout error:", error);
      }
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