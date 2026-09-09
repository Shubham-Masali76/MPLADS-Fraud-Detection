import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/common/Sidebar";
import { Header } from "./components/common/Header";
import { ExecutiveOverview } from "./components/dashboard/ExecutiveOverview";
import { HighRiskQueue } from "./components/projects/HighRiskQueue";
import { AllProjectsTable } from "./components/projects/AllProjectsTable";
import { FraudNetworkView } from "./components/network/FraudNetworkView";
import { BlockchainLedgerView } from "./components/audit/BlockchainLedgerView";
import { ProjectDetailModal } from "./components/projects/ProjectDetailModal";
import { LoadingSkeleton } from "./components/common/LoadingSkeleton";
import { apiService } from "./services/apiService";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal inspection state
  const [selectedProject, setSelectedProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [ov, cat, dist, projs, synd, grp] = await Promise.all([
          apiService.getOverview(),
          apiService.getCategoryDistribution(),
          apiService.getDistrictRisk(),
          apiService.getProjects(),
          apiService.getSyndicates(),
          apiService.getGraphSubgraph("project", "P00059973"),
        ]);

        setStats(ov || {});
        setCategoryData(cat || []);
        setDistrictData(dist || []);
        setProjects(projs || []);
        setSyndicates(synd || []);
        setGraphData(grp || null);
      } catch (err) {
        console.error("Failed to initialize dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectProjectById = async (projectId) => {
    let proj = projects.find((p) => p.project_id === projectId);
    if (!proj) {
      proj = await apiService.getProjectDossier(projectId);
    }
    if (proj) {
      setSelectedProject(proj);
    }
  };

  const handleRecordDecision = async (projectId, decision, notes) => {
    const receipt = await apiService.recordAuditorDecision(
      projectId,
      decision,
      notes,
    );

    // Update local projects array with the new auditor verdict
    setProjects((prev) =>
      prev.map((p) =>
        p.project_id === projectId ? { ...p, auditor_verdict: decision } : p,
      ),
    );

    // If currently selected project matches, update it
    if (selectedProject && selectedProject.project_id === projectId) {
      setSelectedProject((prev) => ({
        ...prev,
        auditor_verdict: decision,
      }));
    }

    // Trigger toast notification
    setToastMessage({
      title: `Auditor Verdict Recorded: ${decision}`,
      detail: `Cryptographically anchored to Block #${receipt.block_index} (Hash: ${receipt.block_hash.substring(0, 16)}...)`,
      type: decision === "APPROVE" ? "success" : "alert",
    });

    setTimeout(() => {
      setToastMessage(null);
    }, 6000);

    return receipt;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased selection:bg-amber-500/20">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header activeTab={activeTab} />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
          {/* Toast Alert Notification */}
          {toastMessage && (
            <div className="bg-navy-950 text-white p-4 rounded-xl border border-navy-700 shadow-xl flex items-start justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                {toastMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {toastMessage.title}
                  </div>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    {toastMessage.detail}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6">
              <LoadingSkeleton rows={3} />
              <LoadingSkeleton rows={5} />
            </div>
          ) : (
            <>
              {/* Active Tab View Rendering */}
              {activeTab === "dashboard" && (
                <ExecutiveOverview
                  stats={stats}
                  categoryData={categoryData}
                  districtData={districtData}
                  topAlerts={projects.slice(0, 5)}
                  onSelectProject={setSelectedProject}
                  onNavigateToHighRisk={() => setActiveTab("high_risk")}
                />
              )}

              {activeTab === "high_risk" && (
                <HighRiskQueue
                  projects={projects}
                  onSelectProject={setSelectedProject}
                />
              )}

              {activeTab === "all_projects" && (
                <AllProjectsTable
                  projects={projects}
                  onSelectProject={setSelectedProject}
                />
              )}

              {activeTab === "fraud_network" && (
                <FraudNetworkView
                  syndicates={syndicates}
                  graphData={graphData}
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

      {/* Forensic Dossier Modal */}
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
