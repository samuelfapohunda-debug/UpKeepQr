import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        🚀 UpKeepQR
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">
        Smart Home Maintenance Management with QR-powered scheduling,
        automated reminders, and climate-based task management.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
          Get Started
        </button>
        <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition">
          Learn More
        </button>
      </div>

      {/* How It Works */}
      <div className="mt-12 max-w-2xl text-left">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          How It Works
        </h2>
        <ol className="list-decimal list-inside text-gray-700 space-y-2">
          <li>Get Your Magnet – place it on your refrigerator or utility area.</li>
          <li>Scan & Setup – personalize your maintenance schedule.</li>
          <li>Climate-Based Scheduling – get optimized tasks for your zone.</li>
          <li>Get Reminders – timely email alerts with calendar events.</li>
        </ol>
      </div>

      {/* Pricing */}
      <div className="mt-12 max-w-md bg-white shadow-lg rounded-xl p-6 border">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Simple Pricing</h2>
        <p className="text-gray-600 mb-4">Choose the plan that fits your needs</p>
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600 mb-2">$19</p>
          <p className="text-gray-600 mb-4">Single Pack – Perfect for homeowners</p>
          <ul className="space-y-1 text-left text-gray-700">
            <li>✅ 1 QR Magnet</li>
            <li>✅ Lifetime Reminders</li>
            <li>✅ Climate-Based Scheduling</li>
          </ul>
          <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Order Magnet
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
