import { useState, useEffect } from 'react';
import { HomeProfileExtra } from '../../types/homeExtra';

interface Props {
  homeId: number;
  onSave?: (data: HomeProfileExtra) => void;
}

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

export default function ExtendedHomeProfile({ homeId, onSave }: Props) {
  const [form, setForm] = useState<HomeProfileExtra>({ marketingConsent: true });
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (expanded && homeId) {
      loadData();
    }
  }, [expanded, homeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/home/${homeId}/extra`);
      if (res.ok) {
        const { data } = await res.json();
        if (data && Object.keys(data).length > 0) {
          setForm({ ...form, ...data });
        }
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof HomeProfileExtra, value: any) => {
    setForm({ ...form, [key]: value });
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/home/${homeId}/extra`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "✓ Profile saved!" });
        onSave?.(result.data);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
      <button
        type="button"
        className="flex justify-between items-center w-full hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-left">
          <h3 className="text-xl font-bold text-foreground mb-1">
            📋 Complete Your Home Profile
          </h3>
          <p className="text-sm text-muted-foreground">
            Get personalized maintenance schedules (optional)
          </p>
        </div>
        <span className="text-2xl">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium mb-2 block">Homeowner Type</span>
                  <select
                    value={form.ownerType || ""}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("ownerType", e.target.value || undefined)}
                  >
                    <option value="">Select</option>
                    <option value="owner">Owner-occupant</option>
                    <option value="landlord">Landlord</option>
                    <option value="pm">Property Manager</option>
                    <option value="flipper">Flipper</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block">Year Built</span>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={form.yearBuilt || ""}
                    placeholder="2010"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("yearBuilt", parseInt(e.target.value) || undefined)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block">HVAC Brand</span>
                  <input
                    type="text"
                    value={form.hvacBrand || ""}
                    placeholder="Carrier, Trane, etc."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("hvacBrand", e.target.value || undefined)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block">HVAC Age (years)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.hvacAgeYears || ""}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("hvacAgeYears", parseInt(e.target.value) || undefined)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block">Water Heater Brand</span>
                  <input
                    type="text"
                    value={form.waterHeaterBrand || ""}
                    placeholder="Rheem, AO Smith, etc."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("waterHeaterBrand", e.target.value || undefined)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block">Insurance Provider</span>
                  <input
                    type="text"
                    value={form.insuranceProvider || ""}
                    placeholder="State Farm, Allstate, etc."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                    onChange={(e) => update("insuranceProvider", e.target.value || undefined)}
                  />
                </label>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.hasHoa ?? false}
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={(e) => update("hasHoa", e.target.checked)}
                />
                <span className="text-sm">This property has an HOA</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.marketingConsent ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={(e) => update("marketingConsent", e.target.checked)}
                />
                <span className="text-sm">Send me personalized maintenance tips</span>
              </label>

              {message && (
                <div className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
