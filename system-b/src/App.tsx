import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState(localStorage.getItem('system_b_api_key') || '');
  const [systemName, setSystemName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkStatus = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      // Decode JWT Token Payload
      const parts = key.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid API Key format. Expected a JWT token.");
      }
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadString = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const data = JSON.parse(payloadString);

      if (data.status !== "active") {
         throw new Error("Your embedded token indicates you are not approved.");
      }

      setStatus(data.status);
      setSystemName(data.name || '');
      setPermissions(data.permissions || {});
      setSavedKey(key);
      localStorage.setItem('system_b_api_key', key);
    } catch (e: any) {
      setError(e.message || "Failed to parse the API Key payload.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedKey) {
      checkStatus(savedKey);
    }
  }, [savedKey]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      checkStatus(apiKey.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('system_b_api_key');
    setSavedKey('');
    setSystemName('');
    setStatus(null);
    setPermissions(null);
    setApiKey('');
  };

  if (!savedKey && !status) {
    return (
      <div className="container center-screen">
        <div className="card login-card">
          <h1>External Office Portal</h1>
          <p>Please enter the API Key provided by the CDEMS superadmin to connect.</p>
          <form onSubmit={handleSaveKey} className="key-form">
            <input 
              type="text" 
              placeholder="Paste your unique API Key..." 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Connecting...' : 'Connect to CDEMS'}
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      </div>
    );
  }

  const isApproved = status === 'active';
  const canSendData = !!permissions?.send_data;
  const canRequestRecords = !!permissions?.request_public_records;
  const canViewReports = !!permissions?.view_reports;

  const noActionChecked = !canSendData && !canRequestRecords && !canViewReports;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Internal Office Dashboard</h1>
          <p>
            Connected Name: <strong>{systemName || 'Unknown Office'}</strong><br/>
            Network: CDEMS Core
          </p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">Disconnect API</button>
      </div>

      <div className="card status-card">
        <h2>Network Connection Status</h2>
        
        <div className="status-indicator">
          <strong>Registration Status:</strong> 
          <span className={`badge ${status || 'unknown'}`}>
            {status ? status.toUpperCase() : 'UNKNOWN'}
          </span>
        </div>

        {error && <div className="error-box mt-4">{error}</div>}

        {isApproved ? (
          <div className="approved-section animate-in">
            <div className="success-box">
              ✓ Your system is fully approved and securely connected to CDEMS.
            </div>
            
            <div className="integration-module">
              <h3>Integrated Features Unlocked</h3>
              <p>Because your system is <strong>Approved</strong>, you can now access the following features:</p>
              
              <div className="action-grid">
                {canSendData && (
                  <button className="btn-action primary-action" onClick={async () => {
                    alert('Sending secure payload to CDEMS...');
                    try {
                      await fetch('http://localhost:4000/api/data/share', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${savedKey}` 
                        },
                        body: JSON.stringify({
                          payload: {
                            patient: "Juan Dela Cruz",
                            status: "Cleared",
                            records: ["Vax-A", "Vax-B"],
                            timestamp: new Date().toISOString()
                          }
                        })
                      });
                      alert('Done! Data securely shared to CDEMS.');
                    } catch (e) {
                      alert('Error sharing data');
                    }
                  }}>
                    🚀 Send Data to CDEMS
                  </button>
                )}
                {canRequestRecords && (
                  <button className="btn-action secondary-action" onClick={() => alert('Fetching securely from CDEMS API...')}>
                    📥 Request Public Records
                  </button>
                )}
                {canViewReports && (
                  <button className="btn-action outline-action" style={{ backgroundColor: 'white', border: '2px solid #cbd5e1', color: '#374151' }} onClick={() => alert('Opening reports center...')}>
                    📊 View Reports
                  </button>
                )}
              </div>

              {noActionChecked && (
                <div className="mt-4 p-4" style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '0.9rem', color: '#6b7280' }}>
                  Superadmin approved your connection but granted no specific feature assignments.
                </div>
              )}
            </div>

            <div className="permissions-box">
              <strong>Your Granted Permissions:</strong>
              <pre>{JSON.stringify(permissions, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="pending-section">
            <div className="warning-box">
              <h3>Approval Pending</h3>
              <p>
                Your system registration is currently marked as <strong>{status?.toUpperCase()}</strong>.
              </p>
              <p className="mt-2">
                The "Send Data" and other integrated modules are hidden. You must wait for the CDEMS Superadmin to review your registration and switch your status to <strong>ACTIVE</strong>.
              </p>
            </div>
            <button className="btn-outline mt-4" onClick={() => checkStatus(savedKey)} disabled={loading}>
              {loading ? 'Refreshing...' : '↻ Refresh Status Now'}
            </button>
            <p className="auto-refresh-text">Status also auto-refreshes every 30 seconds.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
