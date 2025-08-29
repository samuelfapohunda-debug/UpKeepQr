import { useState } from 'react';
import { API_BASE_URL } from '../constants';

interface AgentStats {
  totalEvents: number;
  upcomingEvents: number;
  completedTasks: number;
  qrCodesGenerated: number;
}

export default function Dashboard() {
  const [stats] = useState<AgentStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    completedTasks: 0,
    qrCodesGenerated: 0,
  });
  const [qrCode, setQrCode] = useState<string>('');
  const [qrData, setQrData] = useState('');

  const generateQR = async () => {
    if (!qrData.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: qrData }),
      });
      
      const result = await response.json();
      if (result.success) {
        setQrCode(result.qrCode);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">Agent Dashboard</h1>
          <p className="text-muted-foreground" data-testid="dashboard-description">
            Manage your operations and track performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-xl border border-border" data-testid="stat-total-events">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold" data-testid="text-total-events">{stats.totalEvents}</p>
              </div>
              <i className="fas fa-calendar text-primary text-xl"></i>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl border border-border" data-testid="stat-upcoming-events">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold" data-testid="text-upcoming-events">{stats.upcomingEvents}</p>
              </div>
              <i className="fas fa-clock text-blue-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl border border-border" data-testid="stat-completed-tasks">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold" data-testid="text-completed-tasks">{stats.completedTasks}</p>
              </div>
              <i className="fas fa-check-circle text-green-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl border border-border" data-testid="stat-qr-generated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QR Codes Generated</p>
                <p className="text-2xl font-bold" data-testid="text-qr-generated">{stats.qrCodesGenerated}</p>
              </div>
              <i className="fas fa-qrcode text-purple-500 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Generator */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4" data-testid="qr-generator-title">QR Code Generator</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="qrData" className="block text-sm font-medium mb-2">Data to encode</label>
                <input 
                  type="text" 
                  id="qrData"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Enter URL or text to encode"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-qr-data"
                />
              </div>
              <button 
                onClick={generateQR}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                data-testid="button-generate-qr"
              >
                Generate QR Code
              </button>
              {qrCode && (
                <div className="text-center">
                  <img 
                    src={qrCode} 
                    alt="Generated QR Code" 
                    className="mx-auto border border-border rounded"
                    data-testid="img-qr-code"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4" data-testid="activity-title">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <i className="fas fa-user-plus text-primary"></i>
                <div>
                  <p className="font-medium text-sm">Agent setup completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <i className="fas fa-qrcode text-purple-500"></i>
                <div>
                  <p className="font-medium text-sm">QR code generated</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <i className="fas fa-calendar text-blue-500"></i>
                <div>
                  <p className="font-medium text-sm">Event scheduled</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
