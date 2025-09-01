import { useState } from 'react';
import { useParams, useLocation } from 'wouter';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // In production, assume same origin
  : 'http://localhost:5000'; // Development server URL

export default function Onboarding() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const token = params.token;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    zip: '',
    home_type: '',
    sqft: '',
    hvac_type: '',
    water_heater: '',
    roof_age_years: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestBody = {
        token,
        zip: formData.zip,
        home_type: formData.home_type,
        ...(formData.sqft && { sqft: parseInt(formData.sqft) }),
        ...(formData.hvac_type && { hvac_type: formData.hvac_type }),
        ...(formData.water_heater && { water_heater: formData.water_heater }),
        ...(formData.roof_age_years && { roof_age_years: parseInt(formData.roof_age_years) }),
        ...(formData.email && { email: formData.email }),
      };

      const response = await fetch(`${API_BASE_URL}/api/setup/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store result data for success page
        sessionStorage.setItem('setupResult', JSON.stringify(result));
        setLocation('/setup/success');
      } else {
        setError(result.error || 'Setup activation failed');
      }
    } catch (err: any) {
      // Only log actual errors, not empty objects
      if (err && (err.message || err.name || Object.keys(err).length > 0)) {
        console.error('Setup error:', err);
      }
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-xl border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-home text-primary text-2xl" data-testid="setup-icon"></i>
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="setup-title">Home Setup</h1>
            <p className="text-muted-foreground" data-testid="setup-description">Tell us about your home to get personalized maintenance schedules</p>
            {token && (
              <div className="mt-4 bg-muted px-3 py-2 rounded-md text-sm">
                <span className="text-muted-foreground">Setup Token:</span> 
                <span className="font-mono font-medium ml-1" data-testid="setup-token">{token}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm" data-testid="error-message">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium mb-2">ZIP Code *</label>
                <input 
                  type="text" 
                  id="zip" 
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  placeholder="12345"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="input-zip"
                />
              </div>
              <div>
                <label htmlFor="home_type" className="block text-sm font-medium mb-2">Home Type *</label>
                <select 
                  id="home_type"
                  name="home_type" 
                  value={formData.home_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="select-home-type"
                >
                  <option value="">Select home type</option>
                  <option value="single-family">Single Family Home</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="condo">Condominium</option>
                  <option value="apartment">Apartment</option>
                  <option value="mobile">Mobile Home</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sqft" className="block text-sm font-medium mb-2">Square Footage</label>
                <input 
                  type="number" 
                  id="sqft"
                  name="sqft"
                  value={formData.sqft}
                  onChange={handleInputChange}
                  placeholder="2000"
                  min="100"
                  max="20000"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="input-sqft"
                />
              </div>
              <div>
                <label htmlFor="hvac_type" className="block text-sm font-medium mb-2">HVAC Type</label>
                <select 
                  id="hvac_type"
                  name="hvac_type"
                  value={formData.hvac_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="select-hvac-type"
                >
                  <option value="">Select HVAC type</option>
                  <option value="central-air">Central Air & Heat</option>
                  <option value="heat-pump">Heat Pump</option>
                  <option value="window-units">Window Units</option>
                  <option value="baseboard">Baseboard Heat</option>
                  <option value="radiant">Radiant Heat</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="water_heater" className="block text-sm font-medium mb-2">Water Heater Type</label>
                <select 
                  id="water_heater"
                  name="water_heater"
                  value={formData.water_heater}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="select-water-heater"
                >
                  <option value="">Select water heater type</option>
                  <option value="gas-tank">Gas Tank</option>
                  <option value="electric-tank">Electric Tank</option>
                  <option value="gas-tankless">Gas Tankless</option>
                  <option value="electric-tankless">Electric Tankless</option>
                  <option value="hybrid">Hybrid Heat Pump</option>
                  <option value="solar">Solar</option>
                </select>
              </div>
              <div>
                <label htmlFor="roof_age_years" className="block text-sm font-medium mb-2">Roof Age (Years)</label>
                <input 
                  type="number" 
                  id="roof_age_years"
                  name="roof_age_years"
                  value={formData.roof_age_years}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="input-roof-age"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email (Optional)</label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="homeowner@example.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                data-testid="input-email"
              />
              <p className="text-sm text-muted-foreground mt-1">We'll send you maintenance reminders and tips</p>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-complete-setup"
            >
              {loading ? 'Setting up your home...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}