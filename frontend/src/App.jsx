import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/common/Sidebar";
import { Header } from "./components/common/Header";
import { ExecutiveOverview } from "./components/dashboard/ExecutiveOverview";
import { HighRiskQueue } from "./components/projects/HighRiskQueue";
import { AllProjectsTable } from "./components/projects/AllProjectsTable";
import { WorkSplittingView } from "./components/splitting/WorkSplittingView";
import { MPFavoritismView } from "./components/mps/MPFavoritismView";
import { PhotoVerificationView } from "./components/evidence/PhotoVerificationView";
import { FraudNetworkView } from "./components/network/FraudNetworkView";
import { BlockchainLedgerView } from "./components/audit/BlockchainLedgerView";
import { ProjectDetailModal } from "./components/projects/ProjectDetailModal";
import { LoadingSkeleton } from "./components/common/LoadingSkeleton";
import { apiService } from "./services/apiService";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { EntrancePortal } from "./components/auth/EntrancePortal";
import { VendorDashboard } from "./components/dashboards/VendorDashboard";
import { MPDashboard } from "./components/dashboards/MPDashboard";
import { DistrictDashboard } from "./components/dashboards/DistrictDashboard";
import { FieldEngineerDashboard } from "./components/dashboards/FieldEngineerDashboard";
import { MaterialVendorDashboard } from "./components/dashboards/MaterialVendorDashboard";
import { MoSPIDashboard } from "./components/dashboards/MoSPIDashboard";
import { ImplementingAgencyDashboard } from "./components/dashboards/ImplementingAgencyDashboard";


// Temporary mock for District Authority & Vendor (separated)
const SimpleMockDashboard = ({ title, role, onLogout }) => (
  <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-slate-50 font-sans">
    <div className="w-full md:w-64 md:h-screen md:shrink-0 overflow-y-auto bg-slate-900 text-white flex flex-col justify-between">
      <div className="p-6 border-b border-slate-800">
        <h1 className="font-bold text-sm">{title}</h1>
        <p className="text-[10px] text-slate-400 font-mono">Role: {role}</p>
      </div>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white w-full px-3 py-2"
        >
          <span className="text-sm font-medium">Secure Logout</span>
        </button>
      </div>
    </div>
    <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {title} Dashboard
      </h2>
      <p className="text-slate-500">
        This module handles {role} operations. Features are customized for this
        access level.
      </p>
    </div>
  </div>
);

export function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [workSplitting, setWorkSplitting] = useState([]);
  const [mps, setMps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [ov, cat, dist, projs, synd, grp, split, mpList] =
          await Promise.all([
            apiService.getOverview(),
            apiService.getCategoryDistribution(),
            apiService.getDistrictRisk(),
            apiService.getProjects(),
            apiService.getSyndicates(),
            apiService.getGraphSubgraph("project", "P00059973"),
            apiService.getWorkSplitting(),
            apiService.getMPs(),
          ]);
        setStats(ov || {});
        setCategoryData(cat || []);
        setDistrictData(dist || []);
        setProjects(projs || []);
        setSyndicates(synd || []);
        setGraphData(grp || null);
        setWorkSplitting(split || []);
        setMps(mpList || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectProjectById = async (projectId) => {
    let proj = projects.find((p) => p.project_id === projectId);
    if (!proj) proj = await apiService.getProjectDossier(projectId);
    if (proj) setSelectedProject(proj);
  };

  const handleRecordDecision = async (projectId, decision, notes) => {
    const receipt = await apiService.recordAuditorDecision(
      projectId,
      decision,
      notes,
    );
    setProjects((prev) =>
      prev.map((p) =>
        p.project_id === projectId ? { ...p, auditor_verdict: decision } : p,
      ),
    );
    if (selectedProject && selectedProject.project_id === projectId) {
      setSelectedProject((prev) => ({ ...prev, auditor_verdict: decision }));
    }
    setToastMessage({
      title: `Auditor Verdict Recorded: ${decision}`,
      detail: `Cryptographically anchored to Block #${receipt.block_index} (Hash: ${receipt.block_hash.substring(0, 16)}...)`,
      type: decision === "APPROVE" ? "success" : "alert",
    });
    setTimeout(() => setToastMessage(null), 6000);
    return receipt;
  };

  // ROLE ROUTING
  if (!currentRole) return <EntrancePortal onSelectRole={setCurrentRole} />;
  
  if (currentRole === "mospi")
    return <MoSPIDashboard onLogout={() => setCurrentRole(null)} />;

  if (currentRole === "implementing_agency")
    return <ImplementingAgencyDashboard onLogout={() => setCurrentRole(null)} />;
  if (currentRole === "mp")
    return (
      <MPDashboard projects={projects} onLogout={() => setCurrentRole(null)} />
    );
  if (currentRole === "contractor")
    return (
      <VendorDashboard
        projects={projects}
        onLogout={() => setCurrentRole(null)}
      />
    );

  if (currentRole === "vendor")
    return (
      <MaterialVendorDashboard
        projects={projects}
        onLogout={() => setCurrentRole(null)}
      />
    );
  if (currentRole === "district_authority")
    return (
      <DistrictDashboard
        projects={projects}
        onLogout={() => setCurrentRole(null)}
      />
    );

  if (currentRole === "field_engineer")
    return (
      <FieldEngineerDashboard
        projects={projects}
        onLogout={() => setCurrentRole(null)}
      />
    );

  // AUDITOR DASHBOARD
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-800 antialiased selection:bg-indigo-500/20">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setCurrentRole(null)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header activeTab={activeTab} />
        <main className="p-6 md:p-10 space-y-8 max-w-7xl w-full mx-auto pb-20">
          {toastMessage && (
            <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200/80 shadow-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              <div>
                <div className="text-xs font-bold">{toastMessage.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {toastMessage.detail}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <LoadingSkeleton rows={3} />
              <LoadingSkeleton rows={5} />
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <ExecutiveOverview
                  stats={stats}
                  categoryData={categoryData}
                  districtData={districtData}
                  topAlerts={projects.slice(0, 5)}
                  onSelectProject={handleSelectProjectById}
                  onNavigateToHighRisk={() => setActiveTab("high_risk")}
                />
              )}
              {activeTab === "high_risk" && (
                <HighRiskQueue
                  projects={projects}
                  onSelectProject={handleSelectProjectById}
                />
              )}
              {activeTab === "work_splitting" && (
                <WorkSplittingView
                  clusters={workSplitting}
                  onSelectProject={handleSelectProjectById}
                />
              )}
              {activeTab === "mp_favoritism" && (
                <MPFavoritismView
                  mps={mps}
                  onSelectProject={handleSelectProjectById}
                />
              )}
              {activeTab === "photo_lab" && <PhotoVerificationView />}
              {activeTab === "fraud_network" && (
                <FraudNetworkView
                  syndicates={syndicates}
                  graphData={graphData}
                  onSelectProject={handleSelectProjectById}
                />
              )}
              {activeTab === "all_projects" && (
                <AllProjectsTable
                  projects={projects}
                  onSelectProject={handleSelectProjectById}
                />
              )}
              {activeTab === "audit_trail" && (
                <BlockchainLedgerView
                  onSelectProject={handleSelectProjectById}
                />
              )}
            </>
          )}
        </main>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onRecordDecision={handleRecordDecision}
        />
      )}
    </div>
  );
}
export default App;
