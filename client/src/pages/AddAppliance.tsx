import { useState } from 'react';
import { useLocation } from 'wouter';
import { API_BASE_URL } from '../lib/api-config';

export default function AddAppliance() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applianceType: '',
    brand: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiration: '',
    installationDate: '',
    location: '',
    estimatedLifespanYears: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/appliances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          estimatedLifespanYears: formData.estimatedLifespanYears 
            ? parseInt(formData.estimatedLifespanYears) 
            : null,
        }),
      });

      if (response.ok) {
        setLocation('/appliances');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to add appliance'}`);
      }
    } catch (error) {
      console.error('Failed to add appliance:', error);
      alert('Failed to add appliance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Appliance</h1>
          <p className="text-muted-foreground">
            Track your household appliance with warranty and maintenance info
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl border border-border">
          <div className="space-y-6">
            {/* Appliance Type */}
            <div>
              <label htmlFor="applianceType" className="block text-sm font-medium mb-2">
                Appliance Type *
              </label>
              <select
                id="applianceType"
                name="applianceType"
                required
                value={formData.applianceType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select type...</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Oven">Oven</option>
                <option value="Dishwasher">Dishwasher</option>
                <option value="Washing Machine">Washing Machine</option>
                <option value="Dryer">Dryer</option>
                <option value="Microwave">Microwave</option>
                <option value="HVAC">HVAC</option>
                <option value="Water Heater">Water Heater</option>
                <option value="Furnace">Furnace</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium mb-2">
                Brand *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Samsung, LG, Whirlpool"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Model Number */}
            <div>
              <label htmlFor="modelNumber" className="block text-sm font-medium mb-2">
                Model Number *
              </label>
              <input
                type="text"
                id="modelNumber"
                name="modelNumber"
                required
                value={formData.modelNumber}
                onChange={handleChange}
                placeholder="e.g., RF28R7201SR"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium mb-2">
                Serial Number
              </label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                required
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Warranty Expiration */}
            <div>
              <label htmlFor="warrantyExpiration" className="block text-sm font-medium mb-2">
                Warranty Expiration
              </label>
              <input
                type="date"
                id="warrantyExpiration"
                name="warrantyExpiration"
                value={formData.warrantyExpiration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Installation Date */}
            <div>
              <label htmlFor="installationDate" className="block text-sm font-medium mb-2">
                Installation Date
              </label>
              <input
                type="date"
                id="installationDate"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location in Home
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Kitchen, Basement, Garage"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Estimated Lifespan */}
            <div>
              <label htmlFor="estimatedLifespanYears" className="block text-sm font-medium mb-2">
                Estimated Lifespan (Years)
              </label>
              <input
                type="number"
                id="estimatedLifespanYears"
                name="estimatedLifespanYears"
                value={formData.estimatedLifespanYears}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Additional information about this appliance..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Appliance'}
            </button>
            <button
              type="button"
              onClick={() => setLocation('/appliances')}
              className="px-6 py-3 border border-border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
