import React, { useState, useEffect } from 'react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';

interface HomeProfileExtraFormProps {
  householdId: string;
  onSaveSuccess?: () => void;
}

export default function HomeProfileExtraForm({ householdId, onSaveSuccess }: HomeProfileExtraFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    ownerType: '', sellWindow: '', yearBuilt: '', exteriorType: '', lotSqFt: '',
    roofMaterial: '', roofAgeYears: '', hvacType: '', hvacAgeYears: '',
    hvacLastServiceMonth: '', waterHeaterType: '', waterHeaterAgeYears: '',
    waterHeaterCapacityGal: '', insuranceProvider: '', insuranceRenewalMonth: '',
    electricProvider: '', gasProvider: '', hasHoa: false, hoaName: '',
    plannedProjects: [] as string[], smartHomeGear: [] as string[],
    budgetBand: '', contactPrefChannel: '', contactPrefCadence: '',
    marketingConsent: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadExistingData();
  }, [householdId]);

  const loadExistingData = async () => {
    try {
      const res = await fetch(`/api/home/setup/${householdId}/extra`);
      if (res.ok) {
        const data = await res.json();
        if (data) setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (error) { 
      console.log('No existing data'); 
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    
    if (name === 'sellWindow' && value) {
      analytics.track(ANALYTICS_EVENTS.INTENT_SELL_WINDOW_SELECTED, { sellWindow: value });
    }
    if (name === 'marketingConsent') {
      analytics.track(ANALYTICS_EVENTS.CONSENT_MARKETING_TOGGLED, { consent: checked });
    }
  };

  const handleCheckboxArray = (field: 'plannedProjects' | 'smartHomeGear', value: string, checked: boolean) => {
    setFormData(prev => {
      const updated = checked ? [...prev[field], value] : prev[field].filter(v => v !== value);
      return { ...prev, [field]: updated };
    });
    if (field === 'plannedProjects' && checked) {
      analytics.track(ANALYTICS_EVENTS.INTENT_PROJECT_SELECTED, { project: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const cleanData: Record<string, string | number> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (['yearBuilt', 'lotSqFt', 'roofAgeYears', 'hvacAgeYears', 'waterHeaterAgeYears', 
               'waterHeaterCapacityGal', 'insuranceRenewalMonth'].includes(key) && typeof value === 'string') {
            cleanData[key] = parseInt(value);
          } else {
            cleanData[key] = value;
          }
        }
      });
      
      const res = await fetch(`/api/home/setup/${householdId}/extra`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      setSaveStatus('success');
      analytics.track(ANALYTICS_EVENTS.HOME_EXTRA_SAVED, { 
        fieldCount: Object.keys(cleanData).length 
      });
      
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setIsExpanded(false), 2000);
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-6 border border-gray-200 rounded-xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-lg">More About Your Home (optional)</h3>
          {!isExpanded && (
            <p className="text-sm text-gray-600 mt-1">
              Answer a few questions to unlock personalized reminders and discounts.
            </p>
          )}
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          
          <section>
            <h4 className="font-medium mb-3 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">1</span>
              Ownership & Timeline
            </h4>
            <div className="grid md:grid-cols-2 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium mb-2">Homeowner Type</label>
                <select name="ownerType" value={formData.ownerType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  <option value="owner">Owner-occupant</option>
                  <option value="landlord">Landlord</option>
                  <option value="pm">Property Manager</option>
                  <option value="flipper">Flipper</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Planning to Sell?</label>
                <select name="sellWindow" value={formData.sellWindow} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  <option value="none">No plans</option>
                  <option value="lt12">Within 12 months</option>
                  <option value="12to24">12–24 months</option>
                  <option value="gt24">24+ months</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-medium mb-3 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">2</span>
              Property Details
            </h4>
            <div className="grid md:grid-cols-3 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium mb-2">Year Built</label>
                <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} 
                  min="1800" max={currentYear} placeholder="1995" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Exterior Type</label>
                <select name="exteriorType" value={formData.exteriorType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  <option value="siding">Siding</option>
                  <option value="brick">Brick</option>
                  <option value="stucco">Stucco</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lot Size (sq ft)</label>
                <input type="number" name="lotSqFt" value={formData.lotSqFt} onChange={handleChange} 
                  placeholder="5000" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-medium mb-3 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">3</span>
              Roof
            </h4>
            <div className="grid md:grid-cols-2 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <select name="roofMaterial" value={formData.roofMaterial} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  <option value="asphalt">Asphalt</option>
                  <option value="metal">Metal</option>
                  <option value="tile">Tile</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Age (years)</label>
                <input type="number" name="roofAgeYears" value={formData.roofAgeYears} onChange={handleChange} 
                  min="0" max="100" placeholder="10" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-medium mb-3 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">4</span>
              HVAC System
            </h4>
            <div className="grid md:grid-cols-3 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select name="hvacType" value={formData.hvacType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select...</option>
                  <option value="gas">Gas</option>
                  <option value="electric">Electric</option>
                  <option value="heat_pump">Heat Pump</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Age (years)</label>
                <input type="number" name="hvacAgeYears" value={formData.hvacAgeYears} onChange={handleChange} 
                  min="0" max="50" placeholder="5" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Service (YYYY-MM)</label>
                <input type="month" name="hvacLastServiceMonth" value={formData.hvacLastServiceMonth} 
                  onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-medium mb-3 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">5</span>
              Planned Projects
            </h4>
            <div className="ml-11 grid grid-cols-2 md:grid-cols-4 gap-3">
              {['kitchen', 'bath', 'flooring', 'roof', 'solar', 'adu', 'landscaping', 'painting'].map(p => (
                <label key={p} className="flex items-center">
                  <input type="checkbox" checked={formData.plannedProjects.includes(p)}
                    onChange={(e) => handleCheckboxArray('plannedProjects', p, e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded" />
                  <span className="ml-2 text-sm capitalize">{p}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between pt-4 border-t">
            <label className="flex items-center">
              <input type="checkbox" name="marketingConsent" checked={formData.marketingConsent}
                onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
              <span className="ml-2 text-sm">Use my answers to personalize reminders</span>
            </label>
            <button type="submit" disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {saveStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✅ Preferences saved successfully!</p>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">❌ {errorMessage || 'Error saving'}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}