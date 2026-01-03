import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center mx-4">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-payment-success">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 dark:text-green-300">
            You will receive a confirmation email shortly with your order details.
          </p>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirecting to home page in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
