import React, { useState, useEffect } from "react";
import { Briefcase, LogOut, CheckCircle, Camera, Building2, Loader2 } from "lucide-react";
import { apiService } from "../../services/apiService";

export function ImplementingAgencyDashboard({ onLogout }) {
  const [activeAgency, setActiveAgency] = useState("PWD");
  const [liveProjects, setLiveProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");

  const fetchLiveProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await apiService.getLiveProjects();
      setLiveProjects(allProjects);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLiveProjects();
  }, []);

  const handleAssignContractor = async (projectId) => {
    try {
      await apiService.assignContractor(projectId, "VEN-9942");
      setActionStatus(`Success: Contractor VEN-9942 assigned to LIVE-${projectId}`);
      fetchLiveProjects();
    } catch (e) {
      setActionStatus("Error: Failed to assign contractor.");
    }
  };

  const handleAssignEngineer = async (projectId) => {
    try {
      await apiService.assignEngineer(projectId);
      setActionStatus(`Success: Field Engineer assigned to LIVE-${projectId}`);
      fetchLiveProjects();
    } catch (e) {
      setActionStatus("Error: Failed to assign field engineer.");
    }
  };

  // Only show projects that are APPROVED and belong to this IA
  const approvedProjects = liveProjects.filter(p => p.status === "APPROVED" && p.implementing_agency === activeAgency);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left">
        <div className="flex items-center gap-4">
          <Briefcase className="text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">Implementing Agency Portal</h1>
          
          <div className="ml-4 flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
            <Building2 size={14} className="text-slate-400 mr-2" />
            <select 
              className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
              value={activeAgency}
              onChange={(e) => setActiveAgency(e.target.value)}
            >
              <option value="PWD" className="text-slate-900 bg-white">Public Works Dept (PWD)</option>
              <option value="WATER" className="text-slate-900 bg-white">Water Supply Dept</option>
              <option value="ZILLA" className="text-slate-900 bg-white">Zilla Parishad</option>
              <option value="RURAL" className="text-slate-900 bg-white">Rural Development</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0 items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tender & Execution Management</h2>
            <p className="text-slate-500 mt-1">
              Currently viewing sanctioned projects for: <strong className="text-slate-700">{activeAgency}</strong>
            </p>
          </div>
        </div>

        {actionStatus && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${
            actionStatus.includes("Success") ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}>
            {actionStatus}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading active sanctioned projects...</p>
            </div>
          ) : approvedProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              No sanctioned projects waiting for tender or engineer assignment in {activeAgency}.
            </div>
          ) : (
            approvedProjects.map((p) => {
              const isAssigned = p.contractor_assigned && p.contractor_assigned !== "None";
              
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                  
                  <div className="w-full md:w-1/3">
                    <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-48 relative group">
                      <img 
                        src={`/uploads/evidence_${p.id}.jpg`}
                        onError={(e) => { e.target.src = '/mock-evidence.jpg'; }}
                        alt="Site Evidence" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        Day-0 Evidence
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">Sanctioned</span>
                      <span className="text-sm font-medium text-slate-500">ID: LIVE-{p.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {p.work_description || p.project_category}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">Location: {p.district}, {p.state} | Budget: INR {p.estimated_budget}</p>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleAssignContractor(p.id)}
                        disabled={isAssigned}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                          isAssigned 
                            ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isAssigned ? (
                          <><CheckCircle size={16} /> Tender Awarded ({p.contractor_assigned})</>
                        ) : (
                          "Award Tender to Contractor"
                        )}
                      </button>
                      <button 
                        onClick={() => handleAssignEngineer(p.id)}
                        className="flex-1 py-2 px-4 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera size={16} /> Assign Field Engineer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
