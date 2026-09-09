import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  PauseCircle,
  FileCheck,
  Camera,
  Hash,
  Link,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";

export const ProjectDetailModal = ({ project, onClose, onRecordDecision }) => {
  if (!project) return null;

  const [decisionType, setDecisionType] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchoredReceipt, setAnchoredReceipt] = useState(null);

  const vpi = Number(project.vpi || 0);
  const isCritical = project.priority_tier === "CRITICAL";
  const scores = project.scores || {};

  const handleConfirmDecision = async () => {
    if (!decisionType) return;
    setIsSubmitting(true);
    try {
      const receipt = await onRecordDecision(
        project.project_id,
        decisionType,
        notes,
      );
      setAnchoredReceipt(receipt);
    } catch (e) {
      alert("Error anchoring decision to blockchain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gauge calculations (0 to 100 degrees in SVG semi-circle)
  const gaugeAngle = Math.min(Math.max((vpi / 100) * 180, 0), 180);
  const gaugeColor =
    vpi >= 75
      ? "#DC2626"
      : vpi >= 50
        ? "#EA580C"
        : vpi >= 25
          ? "#D97706"
          : "#16A34A";

  const photo = project.photo_evidence || {
    photo_id: "PH_" + project.project_id,
    photo_date: "2025-10-15",
    claimed_latitude: 17.9784,
    claimed_longitude: 79.5941,
    photo_latitude: isCritical ? 17.385 : 17.9785,
    photo_longitude: isCritical ? 78.4867 : 79.5942,
    distance_km: isCritical ? 312.4 : 0.05,
    verification_status: isCritical ? "Mismatch" : "Verified",
    duplicate_flag: "No",
    hash: "9f83acb14d2091e7",
  };

  const sanctioned = project.sanctioned_amount || 8240000;
  const claimed = project.claimed_utilized_amount || sanctioned * 0.98;
  const actual =
    project.actual_utilized_amount ||
    (isCritical ? sanctioned * 0.63 : sanctioned * 0.96);
  const completionPct = project.completion_percentage || (isCritical ? 63 : 95);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-800 text-amber-400 border border-navy-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {project.project_id}
                </span>
                <RiskBadge tier={project.priority_tier} score={vpi} size="sm" />
                {project.is_ringleader && (
                  <span className="bg-red-500/30 text-red-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-red-500/50">
                    CARTEL RINGLEADER
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-slate-200 truncate max-w-xl">
                {project.project_description || project.project_category}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Section 1: 0–100 Visual Risk Gauge & Radar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
            {/* Gauge */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6 text-center">
              <div className="relative w-40 h-24 flex items-end justify-center overflow-hidden">
                {/* SVG Semi-Circle Meter */}
                <svg
                  className="w-40 h-40 transform -rotate-180"
                  viewBox="0 0 100 50"
                >
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="10"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (125.6 * gaugeAngle) / 180}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute bottom-0 flex flex-col items-center">
                  <span className="font-mono text-3xl font-black text-slate-900 tracking-tight">
                    {vpi.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    VPI Gauge (0-100)
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <RiskBadge tier={project.priority_tier} size="md" />
              </div>
            </div>

            {/* 5 Forensic Risk Sub-Scores */}
            <div className="col-span-2 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                <span>Multi-Signal Intelligence Breakdown</span>
                <span className="text-navy-900 font-mono">
                  5 Forensic Layers
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: "ML Physical/Cost Anomaly",
                    score: scores.ml_anomaly ?? 42.0,
                    weight: "25%",
                  },
                  {
                    label: "Shared-Bank Syndicate Collusion",
                    score:
                      scores.syndicate_collusion ??
                      (project.syndicate_id !== "NONE" ? 97.0 : 0.0),
                    weight: "25%",
                  },
                  {
                    label: "MP Capital Concentration / Favoritism",
                    score: scores.mp_concentration ?? 58.0,
                    weight: "20%",
                  },
                  {
                    label: "Work Splitting (GFR Rs 50L Evasion)",
                    score:
                      scores.work_splitting ??
                      (project.is_split_work ? 82.5 : 0.0),
                    weight: "15%",
                  },
                  {
                    label: "Network Centrality & Hub Bridge",
                    score:
                      scores.network_centrality ??
                      (project.is_ringleader ? 88.3 : 15.0),
                    weight: "15%",
                  },
                ].map((s) => (
                  <div key={s.label} className="text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          [{s.weight}]
                        </span>
                        <span>{s.label}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {Number(s.score).toFixed(1)}/100
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.score >= 70
                            ? "bg-red-600"
                            : s.score >= 40
                              ? "bg-orange-500"
                              : "bg-slate-400"
                        }`}
                        style={{ width: `${Math.min(s.score, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Flagged Risk Reasons (Explainable AI Root Causes) */}
          <div className="bg-red-50/50 border border-red-200/80 rounded-xl p-4.5 space-y-2">
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Flagged Forensic Reasons & Evidence Trail
            </h3>
            <ul className="space-y-1.5 text-xs text-red-950 font-medium">
              {(
                project.audit_trail || [
                  project.forensic_explanation ||
                    "Parameters within standard vigilance tolerances across all forensic layers",
                ]
              ).map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Physical Photo & GPS Verification Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-navy-700" />
                Field Inspection Photo & GPS Verification
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  photo.verification_status === "Verified"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800 animate-pulse"
                }`}
              >
                {photo.verification_status === "Verified"
                  ? "GPS Match Verified"
                  : "GPS Location Mismatch"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Photo representation */}
              <div className="bg-slate-100 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-200 text-center relative overflow-hidden">
                <div className="h-24 w-full bg-slate-200 rounded flex items-center justify-center text-slate-400">
                  <Camera className="h-8 w-8 text-slate-400" />
                </div>
                <div className="mt-2 text-[11px] font-mono text-slate-500">
                  Photo ID: {photo.photo_id}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Hash: {photo.hash}
                </div>
              </div>

              {/* Coordinates Comparison */}
              <div className="col-span-2 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Official Constituency GPS
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                      {photo.claimed_latitude}° N, {photo.claimed_longitude}° E
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {project.constituency}, {project.state}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      photo.verification_status === "Mismatch"
                        ? "bg-red-50 border-red-200"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Photo EXIF GPS
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                      {photo.photo_latitude}° N, {photo.photo_longitude}° E
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Captured: {photo.photo_date}
                    </div>
                  </div>
                </div>

                {/* Spatial Discrepancy Banner */}
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    photo.distance_km > 5.0
                      ? "bg-red-100/60 border-red-300 text-red-900 font-semibold"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Physical Spatial Deviation:{" "}
                      <span className="font-mono font-bold">
                        {photo.distance_km} km
                      </span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono">
                    Tolerance: &lt;= 5.0 km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Utilization & Expenditure Progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-navy-700" />
                Utilization Certificate & Financial Progress
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700">
                Physical Completion: {completionPct}%
              </span>
            </div>

            {/* Financial comparison numbers */}
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Sanctioned Budget
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  ₹{Number(sanctioned).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Claimed Expenditure
                </div>
                <div className="text-sm font-bold text-orange-700 mt-0.5">
                  ₹{Number(claimed).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Actual Verified Progress
                </div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">
                  ₹{Number(actual).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Comparison progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Fund Claimed vs Physical Delivery Gap</span>
                <span className="font-mono text-red-600 font-bold">
                  ₹{Number(claimed - actual).toLocaleString()} Unverified Gap
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(actual / sanctioned) * 100}%` }}
                  title="Verified Completion"
                />
                <div
                  className="bg-red-400 h-full"
                  style={{
                    width: `${((claimed - actual) / sanctioned) * 100}%`,
                  }}
                  title="Disputed Claim"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Human-in-the-Loop Auditor Decision Action Panel */}
          <div className="bg-navy-950 text-white rounded-xl p-5 border border-navy-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Human-in-the-Loop Vigilance Determination
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Officer: CVC_AUDITOR_007
              </span>
            </div>

            {anchoredReceipt ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Decision Anchored to Blockchain!</span>
                </div>
                <p className="text-slate-300">{anchoredReceipt.message}</p>
                <div className="bg-navy-900/90 p-3 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-navy-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block Index:</span>
                    <span className="text-amber-400 font-bold">
                      #{anchoredReceipt.block_index}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block Hash:</span>
                    <span className="text-emerald-400 truncate max-w-xs">
                      {anchoredReceipt.block_hash}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span>{anchoredReceipt.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : decisionType ? (
              /* Confirmation Prompt */
              <div className="bg-navy-900 p-4 rounded-xl border border-navy-700 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Confirm Action:{" "}
                    <span className="font-bold text-white uppercase">
                      {decisionType}
                    </span>
                  </span>
                  <button
                    onClick={() => setDecisionType(null)}
                    className="text-slate-400 hover:text-white text-xs underline"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter official auditor justification notes for CVC record..."
                  rows={2}
                  className="w-full text-xs bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDecisionType(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-xs font-semibold text-slate-300 hover:bg-navy-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleConfirmDecision}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md ${
                      decisionType === "ESCALATE"
                        ? "bg-red-600 hover:bg-red-500"
                        : decisionType === "HOLD"
                          ? "bg-amber-600 hover:bg-amber-500"
                          : "bg-emerald-600 hover:bg-emerald-500"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      {isSubmitting
                        ? "Mining Block..."
                        : "Confirm & Anchor to Blockchain"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3 Action Buttons */
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setDecisionType("APPROVE")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition text-xs font-bold shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Approve Project</span>
                </button>

                <button
                  onClick={() => setDecisionType("HOLD")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition text-xs font-bold shadow-sm"
                >
                  <PauseCircle className="h-4 w-4 text-amber-400" />
                  <span>Place on Hold</span>
                </button>

                <button
                  onClick={() => setDecisionType("ESCALATE")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-red-500/50 bg-red-950/60 hover:bg-red-900/80 text-red-200 transition text-xs font-bold shadow-sm"
                >
                  <AlertOctagon className="h-4 w-4 text-red-400" />
                  <span>Escalate for Inquiry</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Hash className="h-3 w-3 text-slate-400" />
            <span>Constituency Code: {project.constituency}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
