import React, { useState, useEffect } from "react";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import {
  LogOut,
  Landmark,
  Map,
  FileText,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { apiService } from "../../services/apiService";

export function MPDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Form State
  const [workDescription, setWorkDescription] = useState("");
  const [projectCategory, setProjectCategory] = useState("Water Supply");
  const [district, setDistrict] = useState("Warangal");
  const [stateName, setStateName] = useState("Telangana");
  const [city, setCity] = useState("");
  const [taluka, setTaluka] = useState("Hanamkonda");
  const [village, setVillage] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [justification, setJustification] = useState("");
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);

  // Projects State
  const [liveProjects, setLiveProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedExifProject, setSelectedExifProject] = useState(null);
  const [showExifModal, setShowExifModal] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);

  // Hardcoded for demo MP
  const mpId = "MP0046";
  const constituency = "Pune (MH)";

  const fetchData = async () => {
    setIsLoadingProjects(true);
    try {
      const [allProjects, wallet] = await Promise.all([
        apiService.getLiveProjects(),
        apiService.getMPWallet(mpId),
      ]);
      // Filter for this MP only
      setLiveProjects(allProjects.filter((p) => p.mp_id === mpId));
      setTotalBudget(wallet.total_allocated_funds);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingProjects(false);
  };

  // Fetch projects as soon as dashboard loads to populate the overview
  useEffect(() => {
    fetchData();

        const fetchStatusAndWallet = async () => {
      try {
        const statusRes = await apiService.getSystemStatus();
        setFreezeActive(statusRes.election_freeze);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatusAndWallet();
  }, []);

  // --- Dynamic Financial Calculations ---

  // Calculate how much has been officially approved by the DC
  const parseCoords = (locStr) => {
    if (!locStr) return [18.5204, 73.8567];
    try {
      const parts = locStr.split('|');
      const lat = parseFloat(parts[0].replace('LAT:', '').trim());
      const lng = parseFloat(parts[1].replace('LNG:', '').trim());
      if (isNaN(lat) || isNaN(lng)) return [18.5204, 73.8567];
      return [lat, lng];
    } catch (e) {
      return [18.5204, 73.8567];
    }
  };
  const fundsSpent = liveProjects
    .filter((p) => p.status === "APPROVED" || p.status === "EVIDENCE_SUBMITTED")
    .reduce((sum, project) => sum + project.estimated_budget, 0);

  const unspentBalance = totalBudget - fundsSpent;
  const percentageSpent =
    totalBudget > 0 ? Math.round((fundsSpent / totalBudget) * 100) : 0;

  // Formatting helper
  const formatCr = (amount) => `INR ${(amount / 10000000).toFixed(2)} Cr`;

  const handleRolloverDemo = async () => {
    try {
      // Add the new year's allocation (5 Crore) on top of the unspent balance
      await apiService.addMPFunds(mpId, 50000000);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: "", message: "" });

    // Validate if MP has enough budget left
    if (parseFloat(estimatedBudget) > unspentBalance) {
      setSubmitStatus({
        type: "error",
        message: `Insufficient funds! You only have ${formatCr(unspentBalance)} remaining.`,
      });
      return;
    }

    if (
      !workDescription ||
      !estimatedBudget ||
      !district ||
      !expectedDuration ||
      !justification
    ) {
      setSubmitStatus({
        type: "error",
        message: "Please fill out all fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createLiveProject({
        mp_id: mpId,
        constituency: constituency,
        work_description: workDescription,
        project_category: projectCategory,
        district: district,
        estimated_budget: parseFloat(estimatedBudget),
        expected_duration_months: parseInt(expectedDuration),
        justification: justification,
      });
      setSubmitStatus({
        type: "success",
        message: "Project proposed successfully!",
      });
      setWorkDescription("");
      setEstimatedBudget("");
      setDistrict("");
      setExpectedDuration("");
      setJustification("");

      // Refresh the projects to update the overview
      fetchData();
    } catch (e) {
      setSubmitStatus({ type: "error", message: "Failed to submit proposal." });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-slate-50 font-sans">
      {/* EXIF Modal */}
      {showExifModal && selectedExifProject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-4xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Day-0 Baseline Geofence Verification
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Project: {selectedExifProject.work_description}
                </p>
              </div>
              <button
                onClick={() => setShowExifModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Close X
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-[450px]">
              {/* Left Column: Location Metadata & Security */}
              <div className="w-full md:w-1/2 p-4 md:p-6 bg-slate-900 text-emerald-400 font-mono text-xs overflow-y-auto shadow-inner flex flex-col gap-4">
                {/* Reverse Geocoded Address */}
                <div className="bg-emerald-900/30 p-4 rounded border border-emerald-500/50 mb-2">
                  <div className="text-emerald-300 font-bold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    REVERSE GEOCODED ADDRESS (LOCKED)
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    {selectedExifProject.village
                      ? `${selectedExifProject.village}, `
                      : ""}
                    {selectedExifProject.taluka
                      ? `${selectedExifProject.taluka}, `
                      : ""}
                    {selectedExifProject.district || "Warangal"},{" "}
                    {selectedExifProject.state || "Telangana"}
                    {selectedExifProject.village
                      ? `${selectedExifProject.village}, `
                      : ""}
                    {selectedExifProject.taluka
                      ? `${selectedExifProject.taluka}, `
                      : ""}
                    {selectedExifProject.district || "Warangal"},{" "}
                    {selectedExifProject.state || "Telangana"}
                  </p>
                  <p className="text-emerald-500/70 mt-2 text-[10px] uppercase">
                    Translated from raw coordinates via VIGIL-AI Geo-engine
                  </p>
                </div>

                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                  <div className="text-white font-bold mb-1 border-b border-slate-600 pb-1">
                    GPS METADATA RAW BASELINE COORDINATES GPS METADATA RAW
                    BASELINE COORDINATES
                  </div>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-slate-400">COORDINATES:</div>
                      <div>{selectedExifProject.target_location}</div>
                      <div className="text-slate-400">ALTITUDE:</div>
                      <div>568 m</div>
                      <div className="text-slate-400">LOCKED BY:</div>
                      <div className="text-emerald-300">Field Engineer (JE)</div>
                      <div className="text-slate-400">TIMESTAMP:</div>
                      <div>{new Date().toISOString()}</div>
                    </div>
                  </div>
                  <div className="bg-emerald-900/40 p-3 rounded border border-emerald-800">
                  <div className="text-emerald-400 font-bold mb-1 border-b border-emerald-800 pb-1 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      ></path>
                    </svg>
                    ANTI-SPOOF CHECK
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 mt-2 items-center">
                    <div className="text-slate-300">Software Tamper Check:</div>
                    <div className="bg-emerald-600 text-white px-2 rounded text-[10px] font-bold">
                      PASS
                    </div>
                    <div className="text-slate-300">
                      Device Hardware Signature:
                    </div>
                    <div className="bg-emerald-600 text-white px-2 rounded text-[10px] font-bold">
                      VERIFIED
                    </div>
                    <div className="text-slate-300">EXIF Edit History:</div>
                    <div className="bg-emerald-600 text-white px-2 rounded text-[10px] font-bold">
                      CLEAN
                    </div>
                  </div>
                </div>

                <div className="text-blue-300 border-l-2 border-blue-500 pl-3">
                  &gt; 100m Geo-Fence securely locked.
                  <br />
                  &gt; Subsequent contractor photos must match this exact
                  perimeter.
                </div>
              </div>

              {/* Right Column: Visual Map & Reverse Geocoding */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    Physical Site Evidence
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-1 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    {selectedExifProject.village ? `${selectedExifProject.village}, ` : ""}{selectedExifProject.district || "Warangal"}, {selectedExifProject.state || "Telangana"}
                  </div>
                </div>
                <div className="flex-1 w-full bg-slate-200 relative">
                  <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-inner group relative">
                    <img 
                      src={`/uploads/evidence_${selectedExifProject.id}.jpg`}
                      onError={(e) => { if (!e.target.src.includes('mock-evidence.jpg')) { e.target.src = '/mock-evidence.jpg'; } }}
                      alt="Site Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={(e) => window.open(e.target.src, '_blank')}
                      title="Click to view full screen evidence"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded shadow text-[10px] font-bold text-white z-[10] backdrop-blur-sm flex items-center gap-1 border border-white/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Day-0 Photo Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full md:w-64 md:h-screen md:shrink-0 overflow-y-auto bg-slate-900 text-white flex flex-col">
        <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">MP Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Constituency: {constituency}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "overview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <PieChart className="h-4 w-4" />
            <span className="text-sm font-medium">Fund Utilization</span>
          </div>
          <div
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "projects" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <Map className="h-4 w-4" />
            <span className="text-sm font-medium">My Live Projects</span>
          </div>
          <div
            onClick={() => setActiveTab("recommend")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "recommend" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Recommend Work</span>
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
            {activeTab === "overview" && "Constituency Overview"}
            {activeTab === "projects" && "My Proposed Projects"}
            {activeTab === "recommend" && "Recommend New Work"}
          </h2>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {activeTab === "overview" && (
            <>
              <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Total Available Fund Pool
                  </h3>
                  <div className="text-5xl font-extrabold text-slate-900">
                    {formatCr(totalBudget)}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-sm text-slate-500">
                      Allocated directly by Central Govt (MoSPI)
                    </p>
                    {unspentBalance > 0 && (
                      <button
                        onClick={handleRolloverDemo}
                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-200"
                      >
                        Run Year-End Rollover (April 1st)
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-24 w-24 rounded-full border-8 border-indigo-100 flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#10b981 ${percentageSpent}%, transparent 0)`,
                    }}
                  />
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <span className="font-bold text-slate-700">
                      {percentageSpent}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-1">
                    Funds Spent (Approved by DC)
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {formatCr(fundsSpent)}
                  </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-1">
                    Unspent Balance (Rollover)
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {formatCr(unspentBalance)}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "projects" && (
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-700 mb-6">
                Live Project Directory
              </h3>
              {isLoadingProjects ? (
                <div className="text-slate-500">
                  Loading projects from live database...
                </div>
              ) : liveProjects.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  <Map className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>
                    You have no live projects yet. Go to "Recommend Work" to
                    submit one.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {p.work_description}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">
                          ID: LIVE-{p.id} | Budget: INR{" "}
                          {p.estimated_budget.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === "APPROVED" || p.status === "EVIDENCE_SUBMITTED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {p.status}
                        </div>
                        {(p.status === "GEOFENCED" ||
                          p.status === "APPROVED" ||
                          p.status === "EVIDENCE_SUBMITTED") && (
                          <button
                            onClick={() => {
                              setSelectedExifProject(p);
                              setShowExifModal(true);
                            }}
                            className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded hover:bg-indigo-200 transition-colors flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                            </svg>
                            Verify EXIF Baseline Verify Day-0 Location Verify
                            EXIF Baseline Verify Day-0 Location
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "recommend" && (
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                Submit Recommendation to District Authority
              </h3>

              {submitStatus.message && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${submitStatus.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
                >
                  {submitStatus.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="font-medium text-sm">
                    {submitStatus.message}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Work Description / Title
                  </label>
                  <input
                    type="text"
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Construction of Community Hall in Ward 4..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Project Category
                    </label>
                    <select
                      value={projectCategory}
                      onChange={(e) => setProjectCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="Water Supply">Water Supply</option>
                      <option value="Roads & Bridges">Roads & Bridges</option>
                      <option value="Education">Education</option>
                      <option value="Health & Family Welfare">
                        Health & Family Welfare
                      </option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Location Grid */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Target Location
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Telangana"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Warangal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Hanamkonda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Taluka/Tehsil
                      </label>
                      <input
                        type="text"
                        value={taluka}
                        onChange={(e) => setTaluka(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Hanamkonda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Village/Ward
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Ward 42"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estimated Budget (INR)
                    </label>
                    <input
                      type="number"
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 1500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Duration (Months)
                    </label>
                    <input
                      type="number"
                      value={expectedDuration}
                      onChange={(e) => setExpectedDuration(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Public Need / Justification
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Briefly explain why this project is necessary for the constituency..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting
                      ? "Submitting to Database..."
                      : "Submit Project Proposal"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
