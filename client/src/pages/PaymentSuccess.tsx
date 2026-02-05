import { useLocation } from "wouter";
import { CheckCircle, Mail, Home } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 
          className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4"
          data-testid="text-payment-success"
        >
          Payment Successful!
        </h1>
        
        <p className="text-lg text-slate-700 text-center mb-8">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        
        {/* Email Activation Section */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Check Your Email to Activate Your Magnet
              </h2>
              <p className="text-slate-700 mb-4">
                We've sent a welcome email with instructions on how to activate your MaintCue magnet. 
                Please check your inbox (and spam folder) for the email titled:
              </p>
              <div className="bg-white border border-emerald-300 rounded-lg p-3 mb-4">
                <p className="font-semibold text-emerald-800" data-testid="text-email-subject">
                  "Welcome to MaintCue - Activate Your Magnet"
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Can't find it? Check your spam folder or contact us at{" "}
                <a 
                  href="mailto:support@maintcue.com" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                  data-testid="link-support-email"
                >
                  support@maintcue.com
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* What's Next Section */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            What happens next?
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-slate-700">
                Check your email for the welcome message with activation instructions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-slate-700">
                Your magnet will arrive within 5-7 business days
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span className="text-slate-700">
                Follow the setup guide to activate your magnet and start tracking maintenance
              </span>
            </li>
          </ol>
        </div>
        
        {/* Order Details */}
        <div className="border-t border-slate-200 pt-6 mb-8">
          <p className="text-sm text-slate-600 text-center">
            A confirmation email with your order details has also been sent to your email address.
          </p>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg"
            data-testid="button-return-home"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </button>
        </div>
        
      </div>
    </div>
  );
}
