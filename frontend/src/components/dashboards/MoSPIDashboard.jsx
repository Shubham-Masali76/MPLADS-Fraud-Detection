import React, { useState, useEffect } from "react";
import { Shield, Settings, AlertTriangle, CheckCircle, LogOut, Search, BarChart3, TrendingUp, Map, ShieldAlert, Database, Lock, Activity, FileText, UserCheck, AlertOctagon } from "lucide-react";
import { apiService } from "../../services/apiService";

export function MoSPIDashboard({ onLogout }) {
  const [freezeActive, setFreezeActive] = useState(false);
  const [selectedMPs, setSelectedMPs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [allMPs, setAllMPs] = useState([]);

  useEffect(() => {
    fetchStatus();
    fetchMPs();
  }, []);
  
  const fetchMPs = async () => {
    try {
      const data = await apiService.getMPs();
      setAllMPs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch MPs", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await apiService.getSystemStatus();
      setFreezeActive(res.election_freeze);
    } catch (e) {
      console.error("Status error", e);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const res = await apiService.toggleElectionFreeze();
      setFreezeActive(res.election_freeze);
      setMessage(res.message);
    } catch (e) {
      console.error(e);
      setMessage("Failed to toggle freeze");
    }
  };

  const filteredMPs = (allMPs || []).filter(m => {
    if (!m) return false;
    const query = searchTerm.toLowerCase();
    return (
      m?.name?.toLowerCase().includes(query) ||
      m?.constituency?.toLowerCase().includes(query) ||
      m?.state?.toLowerCase().includes(query) ||
      m?.type?.toLowerCase().includes(query) ||
      m?.party?.toLowerCase().includes(query)
    );
  });

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMPs.map(m => m.id);
    const allSelected = filteredIds.every(id => selectedMPs.includes(id));
    
    if (allSelected && filteredIds.length > 0) {
      setSelectedMPs(selectedMPs.filter(id => !filteredIds.includes(id)));
    } else {
      const newSelection = new Set([...selectedMPs, ...filteredIds]);
      setSelectedMPs(Array.from(newSelection));
    }
  };

  const toggleMP = (id) => {
    if (selectedMPs.includes(id)) {
      setSelectedMPs(selectedMPs.filter(m => m !== id));
    } else {
      setSelectedMPs([...selectedMPs, id]);
    }
  };

  const handleDisburse = async () => {
    if (selectedMPs.length === 0) return;
    setIsDisbursing(true);
    try {
      let lastRes;
      for (const mp of selectedMPs) {
         lastRes = await apiService.disburseFunds(mp);
      }
      
      const totalAmount = selectedMPs.length * 5;
      setMessage(`Success: Released ₹${totalAmount} Crore to District Authority (DC) Accounts for ${selectedMPs.length} MPs.`);
      setSelectedMPs([]); 
      setSearchTerm("");
    } catch (e) {
      console.error(e);
      setMessage("Failed to release funds to District Authorities.");
    }
    setIsDisbursing(false);
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="text-indigo-400" />
          <h1 className="text-xl font-bold">MoSPI Central Oversight Dashboard</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm opacity-80 hidden md:block">Ministry of Statistics and Programme Implementation</div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
        {message && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            National System Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col">
              <h3 className="font-bold text-slate-700 mb-2">Fund Allocation to Districts</h3>
              <p className="text-sm text-slate-500 mb-4">
                Release the annual ₹5.00 Crore installment to the Nodal District Authority (DC) Accounts for the selected MPs.
              </p>
              
              <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex-1 mb-4 flex flex-col h-[280px]">
                <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <Search size={16} className="text-slate-400 ml-1" />
                  <input 
                    type="text" 
                    placeholder="Search by MP, City, State, or Party..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                {!isSearching ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
                    <Search size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm text-slate-600 font-bold">Search Database</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Type a state, party, or MP name to begin selecting records.</p>
                  </div>
                ) : (
                  <>
                    <div 
                      className="bg-slate-100 p-2.5 border-b border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors" 
                      onClick={handleSelectAllFiltered}
                    >
                      <input 
                        type="checkbox" 
                        checked={filteredMPs.length > 0 && filteredMPs.every(m => selectedMPs.includes(m.id))} 
                        readOnly 
                        className="h-4 w-4 text-indigo-600 rounded border-slate-300 cursor-pointer" 
                      />
                      <span className="text-sm font-bold text-slate-700">
                        Select All {searchTerm ? 'Filtered' : ''} ({filteredMPs.length})
                      </span>
                    </div>

                    <div className="overflow-y-auto p-2 space-y-1 flex-1">
                      {filteredMPs.length === 0 ? (
                        <div className="text-sm text-slate-400 text-center py-4">No MPs match your search.</div>
                      ) : (
                        filteredMPs.map(m => (
                          <label key={m.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-100 last:border-0">
                            <input 
                              type="checkbox" 
                              checked={selectedMPs.includes(m.id)} 
                              onChange={() => toggleMP(m.id)}
                              className="h-4 w-4 mt-1 text-indigo-600 rounded border-slate-300 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-800 font-bold">{m.name} <span className="text-xs font-normal text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded ml-1">{m.party}</span></span>
                              <span className="text-xs text-slate-500">{m.constituency}, {m.state} ({m.type})</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={handleDisburse}
                disabled={selectedMPs.length === 0 || isDisbursing}
                className={`w-full py-2.5 rounded-lg font-bold text-white transition-colors flex justify-center items-center gap-2 ${selectedMPs.length > 0 && !isDisbursing ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                {isDisbursing ? 'Releasing to DC Accounts...' : `Release ₹${selectedMPs.length * 5}Cr to DC Accounts`}
              </button>
            </div>

            <div className="border border-slate-200 p-5 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-700 mb-2">Model Code of Conduct (MCC)</h3>
              <p className="text-sm text-slate-500 mb-4">
                Globally lock all MP project recommendations and District sanctions when election dates are announced.
              </p>
              <button 
                onClick={handleToggleFreeze}
                className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex justify-center items-center gap-2 ${freezeActive ? 'bg-red-600 hover:bg-red-700 shadow-md' : 'bg-slate-800 hover:bg-slate-900 shadow-md'}`}
              >
                {freezeActive ? <AlertTriangle size={20} /> : <Shield size={20} />}
                {freezeActive ? "MCC Freeze is ACTIVE (Click to Revoke)" : "Enable Election Freeze (MCC)"}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="text-slate-500 text-sm font-medium mb-1">Total National Corpus</div>
             <div className="text-3xl font-extrabold text-slate-900">₹3,950 Cr</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="text-slate-500 text-sm font-medium mb-1">Active MPLADS Projects</div>
             <div className="text-3xl font-extrabold text-slate-900">12,403</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="text-slate-500 text-sm font-medium mb-1">Fraud Flagged (AI)</div>
             <div className="text-3xl font-extrabold text-rose-600">47</div>
           </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" />
              National Analytics & Fraud Intelligence
            </h2>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={14} /> LIVE DATA
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 1: Fund Utilization */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Annual Fund Utilization</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">Disbursed to Districts</span>
                    <span className="font-bold text-emerald-600">₹2,840 Cr (72%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">Pending Release</span>
                    <span className="font-bold text-amber-600">₹1,110 Cr (28%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: AI Fraud Distribution */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">AI Fraud Detection Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">GPS Location Spoofing</span>
                    <span className="font-bold text-rose-600">21 Incidents</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">Duplicate/Stock Photos</span>
                    <span className="font-bold text-rose-600">14 Incidents</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-rose-400 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">Cartel/Syndicate Bidding</span>
                    <span className="font-bold text-rose-600">12 Incidents</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-rose-300 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Chart 3: High-Risk Districts */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Map size={16} className="text-slate-400" />
                Vigilance Watchlist (Top High-Risk Districts)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-white border border-rose-100 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-rose-500" />
                    <span className="text-sm font-bold text-slate-800">Warangal, Telangana</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">12 Flags</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white border border-amber-100 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-amber-500" />
                    <span className="text-sm font-bold text-slate-800">Patna, Bihar</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">8 Flags</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white border border-amber-100 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-amber-500" />
                    <span className="text-sm font-bold text-slate-800">Varanasi, Uttar Pradesh</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">5 Flags</span>
                </div>
              </div>
            </div>

            {/* Chart 4: Blockchain Ledger Health */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Database size={100} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 relative z-10">
                <Lock size={16} className="text-emerald-400" />
                Hyperledger Network Status
              </h3>
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Cryptographic Blocks Secured</div>
                  <div className="text-2xl font-mono text-emerald-400 font-bold">14,892</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Network Integrity</div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      100% Verified
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Smart Contracts</div>
                    <div className="text-sm font-bold text-slate-100">12,403 Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* God Mode: Live National Audit Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-indigo-600" />
              Global System Audit Trail (Live Action Feed)
            </h2>
            <div className="text-xs font-bold text-slate-500">
              Showing Real-Time Cross-System Activity
            </div>
          </div>

          <div className="space-y-4">
            {/* Log 1: Fraud AI */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100">
              <div className="bg-rose-100 p-2 rounded-lg mt-0.5">
                <AlertOctagon size={16} className="text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-rose-900">[VIGIL-AI] Fraud Prevented - Installment Blocked</span>
                  <span className="text-xs text-rose-600 font-medium">Just now</span>
                </div>
                <p className="text-sm text-rose-800">
                  AI Engine intercepted and blocked a ₹12.5 Lakh payment to Contractor (GSTIN: 36ABCDE1234F) in Warangal. 
                  Reason: <strong>Duplicate Image Reuse Detected (Hash Match: 0x48f9...a12)</strong>. Sent to Auditor Dashboard.
                </p>
              </div>
            </div>

            {/* Log 2: MP Action */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                <UserCheck size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-blue-900">[MP ACTION] Project Recommended</span>
                  <span className="text-xs text-blue-600 font-medium">4 mins ago</span>
                </div>
                <p className="text-sm text-blue-800">
                  MP Shashi Tharoor (Thiruvananthapuram, Kerala) recommended ₹25.00 Lakh for "Installation of Solar Panels in Govt Schools". 
                  Status updated in District Authority (DC) Inbox.
                </p>
              </div>
            </div>

            {/* Log 3: DC Sanction */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="bg-emerald-100 p-2 rounded-lg mt-0.5">
                <FileText size={16} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-emerald-900">[DISTRICT AUTHORITY] Funds Sanctioned</span>
                  <span className="text-xs text-emerald-600 font-medium">12 mins ago</span>
                </div>
                <p className="text-sm text-emerald-800">
                  DC Varanasi sanctioned ₹5.00 Lakhs for "Road Repair Phase 1". Implementing Agency (PWD) notified to assign Contractor.
                </p>
              </div>
            </div>

            {/* Log 4: Blockchain Record */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="bg-slate-800 p-2 rounded-lg mt-0.5">
                <Lock size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-100">[HYPERLEDGER] Smart Contract Executed</span>
                  <span className="text-xs text-emerald-400 font-medium">18 mins ago</span>
                </div>
                <p className="text-sm text-slate-300 font-mono text-xs mt-1">
                  BLOCK_WRITTEN: 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                  <br />
                  <span className="text-slate-400">Transaction permanently recorded to decentralized ledger.</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
