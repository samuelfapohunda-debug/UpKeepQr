import { useState, useEffect } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../lib/api-config';

interface Appliance {
  id: string;
  applianceType: string;
  brand: string;
  modelNumber: string;
  warrantyExpiration: string | null;
  location: string | null;
}

interface ApplianceManagerProps {
  householdId: string;
  onClose: () => void;
}

export default function ApplianceManager({ householdId, onClose }: ApplianceManagerProps) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAppliances();
  }, [householdId]);

  const fetchAppliances = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appliances?householdId=${householdId}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setAppliances(data.appliances || []);
    } catch (error) {
      console.error('Failed to fetch appliances:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Appliances</h2>
          <button onClick={onClose} className="text-2xl hover:text-muted-foreground">×</button>
        </div>

        {loading ? (
          <p>Loading appliances...</p>
        ) : appliances.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No appliances added yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Add First Appliance
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{appliances.length} appliance(s)</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Appliance
              </button>
            </div>
            
            <div className="grid gap-4">
              {appliances.map((appliance) => (
                <div key={appliance.id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{appliance.applianceType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {appliance.brand} {appliance.modelNumber}
                      </p>
                      {appliance.location && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {appliance.location}
                        </p>
                      )}
                    </div>
                    {appliance.warrantyExpiration && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Warranty</p>
                        <p className="text-sm">
                          {new Date(appliance.warrantyExpiration).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Add New Appliance</h3>
            <p className="text-sm text-muted-foreground">Form coming next...</p>
            <button
              onClick={() => setShowForm(false)}
              className="mt-4 px-4 py-2 border border-border rounded-md"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
