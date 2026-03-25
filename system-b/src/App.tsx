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
  const [sharedColumns, setSharedColumns] = useState({
    firstName: true, middleName: false, lastName: true, suffix: false,
    gender: true, birthDate: false, age: true, placeOfBirth: false,
    civilStatus: false, citizenship: false, houseNumber: false,
    street: true, purok: true, subdivision: false, barangay: true,
    city: true, province: true, status: true, incidentCount: true
  });

  const [citizenData, setCitizenData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    gender: 'Male',
    birthDate: '',
    age: '',
    placeOfBirth: '',
    civilStatus: 'Single',
    citizenship: 'Filipino',
    
    houseNumber: '',
    street: '',
    purok: '',
    subdivision: '',
    barangay: '',
    city: '',
    province: '',

    status: 'Active Resident',
    incidentCount: 0
  });

  const [savedCitizens, setSavedCitizens] = useState<any[]>([]);

  // Cross-system Data Request State
  const [isDataRequestModalOpen, setDataRequestModalOpen] = useState(false);
  const [registeredSystems, setRegisteredSystems] = useState<any[]>([]);
  const [targetSystemIds, setTargetSystemIds] = useState<number[]>([]);
  const [reqColumns, setReqColumns] = useState<Record<string, boolean>>({});
  const [approvedData, setApprovedData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (citizenData.birthDate) {
      const today = new Date();
      const birthDate = new Date(citizenData.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCitizenData(prev => ({ ...prev, age: age.toString() }));
    } else {
      setCitizenData(prev => ({ ...prev, age: '' }));
    }
  }, [citizenData.birthDate]);

  const checkStatus = async (key: string) => {
    setLoading(true);
    setError('');
    try {
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
      
      // Fetch authorized data requests if active
      if (data.status === 'active') {
        fetchApprovedData(key);
      }
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

  const handleAddCitizen = () => {
    if (!citizenData.firstName || !citizenData.lastName) {
      alert("First Name and Last Name are required.");
      return;
    }
    setSavedCitizens([...savedCitizens, { ...citizenData, id: Date.now() }]);
    setCitizenData({
      firstName: '', middleName: '', lastName: '', suffix: '', 
      gender: 'Male', birthDate: '', age: '', placeOfBirth: '', 
      civilStatus: 'Single', citizenship: 'Filipino',
      houseNumber: '', street: '', purok: '', subdivision: '', 
      barangay: '', city: '', province: '',
      status: 'Active Resident', incidentCount: 0
    });
  };

  const fetchApprovedData = async (key: string) => {
    try {
      const res = await fetch('http://localhost:4000/api/system/approved-data', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (res.ok) {
        setApprovedData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openDataRequestModal = async () => {
    setDataRequestModalOpen(true);
    setModalLoading(true);
    try {
      const res = await fetch('http://localhost:4000/systems');
      if (res.ok) {
        setRegisteredSystems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const submitDataRequest = async () => {
    if (targetSystemIds.length === 0) return alert("Select at least one target system.");
    const selectedCols = Object.keys(reqColumns).filter(k => reqColumns[k]);
    if (selectedCols.length === 0) return alert("Select at least one column to request.");
    
    setModalLoading(true);
    try {
      await Promise.all(targetSystemIds.map(id => 
        fetch('http://localhost:4000/api/data-requests', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedKey}` 
          },
          body: JSON.stringify({
            target_system_id: id,
            requested_columns: selectedCols
          })
        })
      ));
      
      alert("Data access requests securely dispatched to CDEMS Superadmin!");
      setDataRequestModalOpen(false);
      setTargetSystemIds([]);
      setReqColumns({});
    } catch (e) {
      alert("Error submitting data request.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCellEdit = (docId: any, originalId: any, key: string, val: string) => {
    setApprovedData(prev => prev.map(d => ({
      ...d,
      citizens: d.citizens.map((c: any) => 
        c._docId === docId && c._originalId === originalId ? { ...c, [key]: val } : c
      )
    })));
  };

  const syncEdit = async (docId: any, originalId: any, updates: any) => {
    try {
      const res = await fetch('http://localhost:4000/api/data/update-citizen', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedKey}`
        },
        body: JSON.stringify({ docId, originalId, updates })
      });
      if (res.ok) alert('Synced directly to CDEMS Database!');
      else alert('Sync failed. The data might have moved or you lack permissions.');
    } catch (e) {
      alert('Network error syncing to CDEMS.');
    }
  };

  const downloadAsExcel = (dataset: any) => {
    if (!dataset.citizens || dataset.citizens.length === 0) return;
    
    const headers = dataset.requestedColumns.join(",");
    const rows = dataset.citizens.map((citizen: any) => {
      return dataset.requestedColumns.map((col: string) => {
        let val = citizen[col] ?? "";
        val = String(val).replace(/"/g, '""');
        if (/[",\n]/.test(val)) val = `"${val}"`;
        return val;
      }).join(",");
    });
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CDEMS_ApprovedData_${dataset.providerName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!savedKey && !status) {
    return (
      <div className="container center-screen">
        <div className="card login-card">
          <h1>Barangay Management Portal</h1>
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

  // Helper for rendering column checkboxes
  const ColumnCheckbox = ({ field, label }: { field: keyof typeof sharedColumns, label: string }) => (
    <label className="checkbox-label" style={{ fontSize: '0.8rem', padding: '0.2rem 0' }}>
      <input 
        type="checkbox" 
        checked={sharedColumns[field]} 
        onChange={(e) => setSharedColumns({...sharedColumns, [field]: e.target.checked})} 
      /> {label}
    </label>
  );

  const allApprovedCitizens = approvedData.flatMap(d => 
    d.citizens.map((c: any) => ({ ...c, _sourceRecordProvider: d.providerName }))
  );
  const allApprovedCols = Array.from(new Set(approvedData.flatMap(d => d.requestedColumns)));

  return (
    <div className="container" style={{maxWidth: '1000px'}}>
      <div className="header">
        <div>
          <h1>Barangay System Dashboard</h1>
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
              
              <div className="action-grid" style={{gridTemplateColumns: '1fr'}}>
                {canSendData && (
                  <div className="send-data-container">
                    
                    <div className="citizen-form-panel">
                      <h4>Citizen Data Entry</h4>
                      
                      <div className="form-section-title">Basic Personal Information</div>
                      <div className="form-grid">
                        <div className="form-group"><label>First Name</label><input type="text" value={citizenData.firstName} onChange={e => setCitizenData({...citizenData, firstName: e.target.value})} /></div>
                        <div className="form-group"><label>Middle Name</label><input type="text" value={citizenData.middleName} onChange={e => setCitizenData({...citizenData, middleName: e.target.value})} /></div>
                        <div className="form-group"><label>Last Name</label><input type="text" value={citizenData.lastName} onChange={e => setCitizenData({...citizenData, lastName: e.target.value})} /></div>
                        <div className="form-group"><label>Suffix</label><input type="text" value={citizenData.suffix} onChange={e => setCitizenData({...citizenData, suffix: e.target.value})} placeholder="Jr., Sr." /></div>
                        
                        <div className="form-group">
                          <label>Gender</label>
                          <select className="form-select" value={citizenData.gender} onChange={e => setCitizenData({...citizenData, gender: e.target.value})}>
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Birth Date</label><input type="date" value={citizenData.birthDate} onChange={e => setCitizenData({...citizenData, birthDate: e.target.value})} /></div>
                        <div className="form-group"><label>Age</label><input type="text" value={citizenData.age} readOnly style={{backgroundColor: '#f1f5f9'}} /></div>
                        <div className="form-group"><label>Place of Birth</label><input type="text" value={citizenData.placeOfBirth} onChange={e => setCitizenData({...citizenData, placeOfBirth: e.target.value})} /></div>
                        
                        <div className="form-group">
                          <label>Civil Status</label>
                          <select className="form-select" value={citizenData.civilStatus} onChange={e => setCitizenData({...citizenData, civilStatus: e.target.value})}>
                            <option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Citizenship</label><input type="text" value={citizenData.citizenship} onChange={e => setCitizenData({...citizenData, citizenship: e.target.value})} /></div>
                      </div>

                      <div className="form-section-title">Address Information</div>
                      <div className="form-grid">
                        <div className="form-group"><label>House Number</label><input type="text" value={citizenData.houseNumber} onChange={e => setCitizenData({...citizenData, houseNumber: e.target.value})} /></div>
                        <div className="form-group"><label>Street</label><input type="text" value={citizenData.street} onChange={e => setCitizenData({...citizenData, street: e.target.value})} /></div>
                        <div className="form-group"><label>Purok / Zone</label><input type="text" value={citizenData.purok} onChange={e => setCitizenData({...citizenData, purok: e.target.value})} /></div>
                        <div className="form-group"><label>Subdivision / Sitio</label><input type="text" value={citizenData.subdivision} onChange={e => setCitizenData({...citizenData, subdivision: e.target.value})} /></div>
                        <div className="form-group"><label>Barangay</label><input type="text" value={citizenData.barangay} onChange={e => setCitizenData({...citizenData, barangay: e.target.value})} /></div>
                        <div className="form-group"><label>City / Mun.</label><input type="text" value={citizenData.city} onChange={e => setCitizenData({...citizenData, city: e.target.value})} /></div>
                        <div className="form-group"><label>Province</label><input type="text" value={citizenData.province} onChange={e => setCitizenData({...citizenData, province: e.target.value})} /></div>
                      </div>

                      <div className="form-section-title">Barangay Records</div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Clearance Status</label>
                          <select value={citizenData.status} onChange={e => setCitizenData({...citizenData, status: e.target.value})} className="form-select">
                            <option>Active Resident</option>
                            <option>Cleared</option>
                            <option>Under Verification</option>
                            <option>Has Hit / Record</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Incidents / Blotters</label>
                          <input type="number" min="0" value={citizenData.incidentCount} onChange={e => setCitizenData({...citizenData, incidentCount: parseInt(e.target.value) || 0})} />
                        </div>
                      </div>
                      
                      <button className="btn-secondary mt-4 w-full" onClick={handleAddCitizen}>
                        + Add Citizen to Local Table
                      </button>
                    </div>

                    {savedCitizens.length > 0 && (
                      <div className="citizen-form-panel">
                        <h4>Local Citizens Data ({savedCitizens.length})</h4>
                        <div className="table-wrapper">
                          <table className="citizen-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Age / Gender</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Blotters</th>
                              </tr>
                            </thead>
                            <tbody>
                              {savedCitizens.map((c) => (
                                <tr key={c.id}>
                                  <td>{c.lastName}, {c.firstName} {c.middleName && c.middleName.charAt(0)+'.'}</td>
                                  <td>{c.age ? `${c.age} yrs` : '-'} / {c.gender?.charAt(0)}</td>
                                  <td>{c.barangay ? `${c.street || ''} ${c.barangay}, ${c.city}` : '-'}</td>
                                  <td><span className={`badge ${c.status === 'Cleared' ? 'active' : 'unknown'}`}>{c.status}</span></td>
                                  <td>{c.incidentCount > 0 ? <span style={{color:'red', fontWeight:'bold'}}>{c.incidentCount}</span> : '0'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="data-config-panel">
                      <h4>Data Sharing Configuration</h4>
                      <p className="config-desc">Select which columns from the <strong>Citizens</strong> table to share:</p>
                      
                      <div className="form-section-title" style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>Personal Specs</div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', marginBottom: '1rem'}}>
                        <ColumnCheckbox field="firstName" label="First Name" />
                        <ColumnCheckbox field="middleName" label="Middle Name" />
                        <ColumnCheckbox field="lastName" label="Last Name" />
                        <ColumnCheckbox field="suffix" label="Suffix" />
                        <ColumnCheckbox field="gender" label="Gender" />
                        <ColumnCheckbox field="birthDate" label="Birth Date" />
                        <ColumnCheckbox field="age" label="Age" />
                        <ColumnCheckbox field="placeOfBirth" label="Place of Birth" />
                        <ColumnCheckbox field="civilStatus" label="Civil Status" />
                        <ColumnCheckbox field="citizenship" label="Citizenship" />
                      </div>

                      <div className="form-section-title" style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>Location & Status</div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem'}}>
                        <ColumnCheckbox field="houseNumber" label="House Number" />
                        <ColumnCheckbox field="street" label="Street" />
                        <ColumnCheckbox field="purok" label="Purok" />
                        <ColumnCheckbox field="subdivision" label="Subdivision" />
                        <ColumnCheckbox field="barangay" label="Barangay" />
                        <ColumnCheckbox field="city" label="City" />
                        <ColumnCheckbox field="province" label="Province" />
                        <ColumnCheckbox field="status" label="Clearance Status" />
                        <ColumnCheckbox field="incidentCount" label="Incident Count" />
                      </div>
                    </div>

                  <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button className="btn-action primary-action" disabled={savedCitizens.length === 0} onClick={async () => {
                      alert(`Sending secure payload of ${savedCitizens.length} citizens to CDEMS...`);
                      
                      const payloadToShare: any = { 
                        timestamp: new Date().toISOString(),
                        citizens: savedCitizens.map(citizen => {
                          const rec: any = {};
                          if (sharedColumns.firstName) rec.firstName = citizen.firstName;
                          if (sharedColumns.middleName) rec.middleName = citizen.middleName;
                          if (sharedColumns.lastName) rec.lastName = citizen.lastName;
                          if (sharedColumns.suffix) rec.suffix = citizen.suffix;
                          if (sharedColumns.gender) rec.gender = citizen.gender;
                          if (sharedColumns.birthDate) rec.birthDate = citizen.birthDate;
                          if (sharedColumns.age) rec.age = citizen.age;
                          if (sharedColumns.placeOfBirth) rec.placeOfBirth = citizen.placeOfBirth;
                          if (sharedColumns.civilStatus) rec.civilStatus = citizen.civilStatus;
                          if (sharedColumns.citizenship) rec.citizenship = citizen.citizenship;
                          
                          if (sharedColumns.houseNumber) rec.houseNumber = citizen.houseNumber;
                          if (sharedColumns.street) rec.street = citizen.street;
                          if (sharedColumns.purok) rec.purok = citizen.purok;
                          if (sharedColumns.subdivision) rec.subdivision = citizen.subdivision;
                          if (sharedColumns.barangay) rec.barangay = citizen.barangay;
                          if (sharedColumns.city) rec.city = citizen.city;
                          if (sharedColumns.province) rec.province = citizen.province;
                          
                          if (sharedColumns.status) {
                            rec.clearanceStatus = citizen.status;
                          }
                          if (sharedColumns.incidentCount) {
                            rec.incidentCount = citizen.incidentCount;
                            rec.hasIncidents = citizen.incidentCount > 0;
                          }
                          return rec;
                        })
                      };

                      try {
                        await fetch('http://localhost:4000/api/data/share', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${savedKey}` 
                          },
                          body: JSON.stringify({
                            payload: payloadToShare
                          })
                        });
                        alert('Done! Local citizens data securely shared to CDEMS.');
                      } catch (e) {
                        alert('Error sharing data');
                      }
                    }}>
                      🚀 Send Local Table Data to CDEMS
                    </button>
                    <button className="btn-action secondary-action" onClick={openDataRequestModal}>
                      📥 Data Request
                    </button>
                  </div>
                  </div>
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

            <div className="inbox-panel">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{margin: 0}}>Secured Authorized Data Inbox</h3>
                <button className="btn-outline" style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}} onClick={() => fetchApprovedData(savedKey)} disabled={loading}>
                  ↻ Refresh Inbox
                </button>
              </div>

              {approvedData.length === 0 ? (
                <div style={{padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', marginTop: '1rem'}}>
                  Your secure inbox is currently empty.<br/>
                  <span style={{fontSize: '0.85rem'}}>Submit a Data Request above. Authorized records will appear here once approved.</span>
                </div>
              ) : (
                <>
                  <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '0.75rem'}}>
                    Your authorized cross-platform data streams have been securely compiled into your master inbox grid below.
                  </p>

                  <div className="data-config-panel" style={{marginBottom: '2rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <h4 style={{margin: 0}}>Unified Encrypted Inbox</h4>
                      <button 
                        className="btn-action primary-action" 
                        style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0}}
                        onClick={() => downloadAsExcel({ requestedColumns: allApprovedCols, citizens: allApprovedCitizens, providerName: "Unified_CDEMS" })}
                        disabled={allApprovedCitizens.length === 0}
                      >
                        ⬇️ Download Unified Excel
                      </button>
                    </div>
                    <p className="config-desc" style={{marginTop: '0.5rem', marginBottom: '1rem'}}>
                      <span className="badge active">Authorized & Synced</span> 
                      &nbsp;&nbsp;Live merged records across all selected providers. Any inline edits made will sync back to central CDEMS.
                    </p>
                    
                    {allApprovedCitizens.length === 0 ? (
                      <p style={{fontSize: '0.85rem', color: '#64748b'}}>No records found in the approved datasets.</p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="citizen-table">
                          <thead>
                            <tr>
                              <th>Tracking Source DB</th>
                              {allApprovedCols.map((col: string) => <th key={col}>{col}</th>)}
                              <th>Sync Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allApprovedCitizens.map((record: any, i: number) => (
                              <tr key={`${record._docId}-${record._originalId}-${i}`}>
                                <td><span className="badge secondary whitespace-nowrap">{record._sourceRecordProvider}</span></td>
                                {allApprovedCols.map((col: string) => (
                                  <td key={col} style={{ padding: '0.2rem' }}>
                                    <input 
                                      type="text" 
                                      value={record[col] || ''}
                                      onChange={e => handleCellEdit(record._docId, record._originalId, col, e.target.value)}
                                      style={{ width: '100%', minWidth: '80px', border: '1px solid transparent', background: 'transparent', padding: '0.4rem', borderRadius: '4px' }}
                                      onFocus={e => Object.assign(e.target.style, { border: '1px solid #cbd5e1', background: 'white' })}
                                      onBlur={e => Object.assign(e.target.style, { border: '1px solid transparent', background: 'transparent' })}
                                      placeholder="-"
                                    />
                                  </td>
                                ))}
                                <td>
                                  <button 
                                    className="btn-outline" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                                    onClick={() => {
                                      const cleanRecord = { ...record };
                                      delete cleanRecord._docId;
                                      delete cleanRecord._originalId;
                                      delete cleanRecord._sourceRecordProvider;
                                      syncEdit(record._docId, record._originalId, cleanRecord);
                                    }}
                                  >
                                    ↻ Push Sync
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="pending-section">
            <div className="warning-box">
              <h3>Registration Pending</h3>
              <p>Your API key is valid, but your system connection has not been activated by the CDEMS Superadmin yet. Please wait for authorization.</p>
            </div>
            <button className="btn-outline mt-4" onClick={() => checkStatus(savedKey)} disabled={loading}>
              {loading ? 'Refreshing...' : '↻ Refresh Status Now'}
            </button>
            <p className="auto-refresh-text">Status also auto-refreshes every 30 seconds.</p>
          </div>
        )}
      </div>

      {isDataRequestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setDataRequestModalOpen(false)}>&times;</button>
            <h2>Create Data Access Request</h2>
            <p className="config-desc">Securely request specific cross-office records from other registered providers.</p>
            
            {modalLoading && registeredSystems.length === 0 ? (
              <p>Loading directory...</p>
            ) : (
              <>
                <div className="form-section-title">1. Select Target Provider(s)</div>
                <div className="provider-list">
                  {registeredSystems
                    .filter((s: any) => s.status === 'active' && s.name !== systemName)
                    .map((s: any) => (
                      <label 
                        key={s.id} 
                        className={`provider-item ${targetSystemIds.includes(s.id) ? 'selected' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <input 
                          type="checkbox" 
                          checked={targetSystemIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTargetSystemIds([...targetSystemIds, s.id]);
                            else setTargetSystemIds(targetSystemIds.filter(id => id !== s.id));
                          }}
                        />
                        <strong>{s.name}</strong>
                        <span className="badge active" style={{fontSize: '0.7rem'}}>Active</span>
                      </label>
                    ))
                  }
                  {registeredSystems.filter((s: any) => s.status === 'active' && s.name !== systemName).length === 0 && (
                    <p style={{fontSize: '0.85rem', color: '#64748b'}}>No other active providers available.</p>
                  )}
                </div>

                {targetSystemIds.length > 0 && (
                  <>
                    <div className="form-section-title">2. Select Requested Columns</div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem'}}>
                      {["firstName", "lastName", "age", "gender", "civilStatus", "barangay", "city", "clearanceStatus", "incidentCount"].map(col => (
                        <label key={col} className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={!!reqColumns[col]} 
                            onChange={(e) => setReqColumns({...reqColumns, [col]: e.target.checked})} 
                          />
                          {col}
                        </label>
                      ))}
                    </div>
                    
                    <button className="btn-primary w-full" onClick={submitDataRequest} disabled={modalLoading}>
                      {modalLoading ? "Dispatching..." : "Submit Formal Request"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
