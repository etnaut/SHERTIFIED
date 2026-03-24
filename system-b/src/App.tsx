import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState(localStorage.getItem('system_b_api_key') || '');
  const [status, setStatus] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkStatus = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/system/status', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      if (!res.ok) {
        throw new Error('Invalid API Key or your system was removed.');
      }
      const data = await res.json();
      setStatus(data.status);
      setPermissions(data.permissions);
      setSavedKey(key);
      localStorage.setItem('system_b_api_key', key);
    } catch (e: any) {
      setError(e.message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedKey) {
      checkStatus(savedKey);
    }
    // Poll every 30 seconds to optionally refresh approval status
    const interval = setInterval(() => {
      if (savedKey) checkStatus(savedKey);
    }, 30000);
    return () => clearInterval(interval);
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
    setStatus(null);
    setPermissions(null);
    setApiKey('');
  };

  if (!savedKey && !status) {
    return (
      <div className="container center-screen">
        <div className="card login-card">
          <h1>External System Portal (System B)</h1>
          <p>Please enter the API Key provided by the Main System (System A) superadmin to connect.</p>
          <form onSubmit={handleSaveKey} className="key-form">
            <input 
              type="text" 
              placeholder="Paste your unique API Key..." 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Connecting...' : 'Connect to Main System'}
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      </div>
    );
  }

  const isApproved = status === 'active';

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>System B Internal Dashboard</h1>
          <p>Connected to SHERTIFIED Network</p>
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
              ✓ Your system is fully approved and securely connected to System A.
            </div>
            
            {/* Conditional UI Module based on Approval Status */}
            <div className="integration-module">
              <h3>Integrated Features Unlocked</h3>
              <p>Because your system is <strong>Approved</strong>, you can now access the following features:</p>
              
              <div className="action-grid">
                <button className="btn-action primary-action" onClick={() => alert('Secure encrypted payload sent to System A!')}>
                  🚀 Send Data to Main System
                </button>
                <button className="btn-action secondary-action" onClick={() => alert('Fetching securely from System A API...')}>
                  📥 Request Public Records
                </button>
              </div>
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
                The "Send Data" and other integrated modules are hidden. You must wait for the Superadmin of System A to review your registration and switch your status to <strong>ACTIVE</strong>.
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
