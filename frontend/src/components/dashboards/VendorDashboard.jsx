import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  HardHat,
  FileText,
  CheckCircle2,
  Camera,
  Loader2,
} from "lucide-react";
import { apiService } from "../../services/apiService";

export function VendorDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("contracts");
  const [liveProjects, setLiveProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadingProjectId, setUploadingProjectId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchLiveProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await apiService.getLiveProjects();
      // Filter for projects assigned to this contractor (VEN-9942)
      setLiveProjects(
        allProjects.filter((p) => p.contractor_assigned === "VEN-9942"),
      );
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLiveProjects();
  }, []);

  const handleUploadClick = (projectId) => {
    setUploadingProjectId(projectId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingProjectId) {
      setUploadingProjectId(null);
      return;
    }

    try {
      // 1. Trigger HTML5 Live Geolocation (This will popup in the browser!)
      const getLiveLocation = () => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({ lat: null, lng: null });
          } else {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              (error) => {
                console.warn("Geolocation blocked by user or failed.", error);
                resolve({ lat: null, lng: null });
              },
            );
          }
        });
      };

      const liveLocation = await getLiveLocation();

      // Simulate processing delay for UI
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Submit file + live location coordinates
      await apiService.submitLiveEvidence(
        uploadingProjectId,
        file,
        liveLocation.lat,
        liveLocation.lng,
      );

      setUploadStatus({
        type: "success",
        message:
          "Geo-tagged photo & live location verified successfully. Pending Audit.",
      });
      fetchLiveProjects();
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (e) {
      setUploadStatus({ type: "error", message: "Upload failed." });
    } finally {
      setUploadingProjectId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeContractsCount = liveProjects.filter(
    (p) => p.status === "APPROVED",
  ).length;
  const clearedClaims = liveProjects.filter(
    (p) => p.status === "EVIDENCE_SUBMITTED",
  ).length;
  const pendingPayments = liveProjects
    .filter((p) => p.status === "APPROVED")
    .reduce((sum, p) => sum + p.estimated_budget, 0);

  const formatCr = (amount) => `INR ${(amount / 10000000).toFixed(2)} Cr`;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-amber-500 p-2 rounded-lg">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Contractor Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono">ID: VEN-9942</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div
            onClick={() => setActiveTab("contracts")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "contracts" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">My Contracts</span>
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
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Assigned Contracts
          </h2>
        </header>

        <main className="p-8 max-w-5xl mx-auto space-y-6">
          {uploadStatus && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${uploadStatus.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium text-sm">{uploadStatus.message}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-sm font-medium mb-1">
                Active Contracts (Approved)
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {activeContractsCount}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-sm font-medium mb-1">
                Pending Payments
              </div>
              <div className="text-3xl font-extrabold text-amber-600">
                {formatCr(pendingPayments)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-sm font-medium mb-1">
                Evidence Submitted
              </div>
              <div className="text-3xl font-extrabold text-emerald-600">
                {clearedClaims}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Contract Status</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading contracts...
                </div>
              ) : liveProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No active contracts assigned to you yet.
                </div>
              ) : (
                liveProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-6 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {proj.work_description}
                      </h4>
                      <p className="text-sm font-mono text-slate-500 mt-1">
                        ID: P000{proj.id} | Budget:{" "}
                        {formatCr(proj.estimated_budget)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${proj.status === "EVIDENCE_SUBMITTED" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}
                      >
                        {proj.status === "EVIDENCE_SUBMITTED"
                          ? "Audit Pending"
                          : "Ongoing Work"}
                      </div>

                      {proj.status === "APPROVED" && (
                        <button
                          onClick={() => handleUploadClick(proj.id)}
                          disabled={uploadingProjectId === proj.id}
                          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {uploadingProjectId === proj.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing EXIF...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              Upload Evidence
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </main>
      </div>
    </div>
  );
}
