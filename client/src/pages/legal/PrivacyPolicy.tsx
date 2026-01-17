export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6" data-testid="text-privacy-title">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last Updated: January 3, 2026</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We collect information you provide directly to us, including name, email address, phone number, and home address for service delivery.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We use the information we collect to provide, maintain, and improve our services, send you maintenance reminders, and communicate with you.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Information Sharing</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We do not sell your personal information. We may share your information with service providers who assist us in operating our platform.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Data Security</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We implement appropriate security measures to protect your personal information against unauthorized access or disclosure.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Your Rights</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You have the right to access, update, or delete your personal information at any time through your account settings.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Contact Us</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              For privacy-related questions, contact us at privacy@upkeepqr.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
