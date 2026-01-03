export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6" data-testid="text-cookie-title">Cookie Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last Updated: January 3, 2026</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. What Are Cookies</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Cookies</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We use cookies to remember your preferences, analyze site traffic, and improve our services.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Essential cookies: Required for the website to function</li>
              <li className="mb-2">Analytics cookies: Help us understand how visitors use our site</li>
              <li className="mb-2">Preference cookies: Remember your settings and preferences</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Managing Cookies</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You can control and delete cookies through your browser settings. Note that disabling cookies may affect website functionality.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Contact Us</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Questions about our cookie policy? Email us at support@upkeepqr.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
