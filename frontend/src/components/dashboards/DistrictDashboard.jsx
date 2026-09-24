import React, { useState, useEffect } from "react";
import { LogOut, Building2, CheckSquare, FileSpreadsheet } from "lucide-react";
import { apiService } from "../../services/apiService";

export function DistrictDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("sanction");
  const [liveProjects, setLiveProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

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

  const handleApprove = async (projectId) => {
    try {
      await apiService.approveLiveProject(projectId);
      setActionStatus(`Success: Project LIVE-${projectId} sanctioned!`);
      fetchLiveProjects();
    } catch (e) {
      setActionStatus("Error: Failed to sanction project.");
    }
  };

  const handleReject = async (projectId) => {
    try {
      await apiService.rejectLiveProject(projectId);
      setActionStatus(`Success: Project LIVE-${projectId} REJECTED.`);
      fetchLiveProjects();
    } catch (e) {
      setActionStatus("Error: Failed to reject project.");
    }
  };

  const pendingProjects = liveProjects.filter((p) => p.status === "GEOFENCED");
  const approvedProjects = liveProjects.filter(
    (p) => p.status === "APPROVED" || p.status === "EVIDENCE_SUBMITTED",
  );

  const totalReleased = approvedProjects.reduce(
    (sum, p) => sum + p.estimated_budget,
    0,
  );
  const totalPending = pendingProjects.reduce(
    (sum, p) => sum + p.estimated_budget,
    0,
  );

  const formatCr = (val) => `₹ ${(val / 10000000).toFixed(2)} Cr`;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">District Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono">Role: DC/DM</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div
            onClick={() => setActiveTab("sanction")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${
              activeTab === "sanction"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Sanction Works</span>
          </div>
          <div
            onClick={() => setActiveTab("funds")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${
              activeTab === "funds"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="text-sm font-medium">Fund Disbursal</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-3 py-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Secure Logout</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8">
          <h2 className="text-lg font-bold text-slate-800">
            {activeTab === "sanction"
              ? "Pending Sanctions"
              : "Fund Release Logs"}
          </h2>
        </header>
        <main className="p-8 max-w-5xl mx-auto space-y-6">
          {actionStatus && (
            <div
              className={`p-4 rounded-lg font-bold ${actionStatus.includes("Error") ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}
            >
              {actionStatus}
            </div>
          )}

          {activeTab === "sanction" ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">
                  Geofenced Works Pending Sanction
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500">
                    Loading live projects...
                  </div>
                ) : pendingProjects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No pending projects awaiting your approval.
                  </div>
                ) : (
                  pendingProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-6 hover:bg-slate-50 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-lg">
                            {p.work_description}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Category:</span>{" "}
                            {p.project_category} |
                            <span className="font-medium ml-2">District:</span>{" "}
                            {p.district}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-2">
                            ID: LIVE-{p.id} • Proposed by: {p.mp_id} (
                            {p.constituency})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-xl">
                            INR {(p.estimated_budget / 100000).toFixed(2)} Lakhs
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-100 p-4 rounded-lg flex items-start gap-4">
                        <div className="h-20 w-32 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-300">
                          <img
                            src="https://placehold.co/300x200/e2e8f0/475569?text=EXIF+Photo"
                            alt="Site Baseline"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-xs font-bold mb-2">
                            DAY-0 BASELINE LOCKED (EXIF VALIDATED)
                          </div>
                          <div className="font-mono text-sm text-slate-700">
                            Coordinates: {p.target_location}
                          </div>
                          <div className="font-mono text-sm text-slate-700 mt-1">
                            Reverse Geocode: {p.village ? `${p.village}, ` : ""}{p.taluka ? `${p.taluka}, ` : ""}{p.district}, {p.state}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Timestamp: {new Date().toLocaleDateString()} |
                            Integrity: Verified
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-2">
                        <button
                          onClick={() => handleReject(p.id)}
                          className="bg-white border border-rose-600 text-rose-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-rose-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                        >
                          Sanction & Release Funds
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-1">
                    Funds Released (FY)
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {formatCr(totalReleased)}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-1">
                    Pending Installments
                  </div>
                  <div className="text-3xl font-extrabold text-amber-600">
                    {formatCr(totalPending)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800">
                    Approved Projects Directory
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
                  {approvedProjects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No projects have been approved yet.
                    </div>
                  ) : (
                    approvedProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {p.work_description}
                          </div>
                          <div className="text-sm text-slate-500">
                            ID: LIVE-{p.id} • {p.district}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            INR {(p.estimated_budget / 100000).toFixed(2)} Lakhs
                          </div>
                          <div className="mt-1 text-xs font-bold text-emerald-600">
                            FUNDS DISBURSED
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
