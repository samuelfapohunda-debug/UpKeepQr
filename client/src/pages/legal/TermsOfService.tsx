export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6" data-testid="text-terms-title">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last Updated: January 3, 2026</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              By accessing and using UpKeepQR.com, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. Use License</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Permission is granted to temporarily access the materials (information or software) on UpKeepQR.com for personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Service Description</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              UpKeepQR provides home maintenance management services through QR code technology and automated reminders.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. User Responsibilities</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Payment Terms</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              All payments are processed securely through Stripe. Refunds are subject to our refund policy.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Contact Information</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms, please contact us at support@upkeepqr.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
