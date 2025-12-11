import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Plus, Package, MapPin, Calendar, Shield } from 'lucide-react';
import { API_BASE_URL } from '../lib/api-config';

interface Appliance {
  id: string;
  applianceType: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiration: string | null;
  location: string | null;
  isActive: boolean;
}

export default function Appliances() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppliances();
  }, []);

  const fetchAppliances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appliances`, {
        credentials: 'include',
      });
      const data = await response.json();
      setAppliances(data.appliances || []);
    } catch (error) {
      console.error('Failed to fetch appliances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyStatus = (expiration: string | null) => {
    if (!expiration) return null;
    const exp = new Date(expiration);
    const today = new Date();
    const daysUntilExpiry = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return `${daysUntilExpiry} days left`;
    return 'Active';
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Household Appliances</h1>
            <p className="text-muted-foreground">
              Track appliances, warranties, and maintenance
            </p>
          </div>
          <Link href="/appliances/new">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Appliance
            </button>
          </Link>
        </div>

        {appliances.length === 0 ? (
          <div className="bg-card p-12 rounded-xl border border-border text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No appliances yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first appliance
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appliances.map((appliance) => (
              <Link key={appliance.id} href={`/appliances/${appliance.id}`}>
                <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1">
                      {appliance.applianceType}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {appliance.brand} {appliance.modelNumber}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    {appliance.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {appliance.location}
                      </div>
                    )}
                    
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(appliance.purchaseDate).toLocaleDateString()}
                    </div>

                    {appliance.warrantyExpiration && (
                      <div className="flex items-center justify-between pt-2 mt-2 border-t gap-2">
                        <span className="text-muted-foreground flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Warranty
                        </span>
                        <span className="text-xs font-medium">
                          {getWarrantyStatus(appliance.warrantyExpiration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
