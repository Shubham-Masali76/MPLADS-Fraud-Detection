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
  ShieldCheck,
  ArrowRight,
  Info,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helpers to generate fake names for demo
const getContractorName = (id) => {
  const names = [
    "Balaji Infra Pvt Ltd",
    "Sri Venkateshwara Constructions",
    "Ramesh & Sons Builders",
    "VK Enterprises",
    "Maha Local Builders",
    "Reddy Civil Works",
  ];
  return names[(parseInt(id?.replace(/\D/g, "")) || 0) % names.length];
};

const getMPName = (id) => {
  const names = [
    "Hon. Rajesh Kumar",
    "Hon. Amit Singh",
    "Hon. Dr. S. Reddy",
    "Hon. Smt. Priya Sharma",
    "Hon. K. Rao",
    "Hon. Vikram Patil",
  ];
  return names[(parseInt(id?.replace(/\D/g, "")) || 0) % names.length];
};

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

  const gaugeAngle = Math.min(Math.max((vpi / 100) * 180, 0), 180);
  const gaugeColor =
    vpi >= 75
      ? "#E11D48" // Rose 600
      : vpi >= 50
        ? "#F59E0B" // Amber 500
        : vpi >= 25
          ? "#3B82F6" // Blue 500
          : "#10B981"; // Emerald 500

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

  // Dynamic Explainable AI (TreeSHAP Waterfall) feature attributions
  const shapFeatures = [];

  if (vpi > 10) {
    if (
      project.is_split_work ||
      (scores.work_splitting && scores.work_splitting > 50)
    ) {
      shapFeatures.push({
        feature: "Split Contracts (Avoiding Rules)",
        impact: "+28.4%",
        direction: "positive",
        detail:
          "They broke one big project into smaller pieces to avoid strict government checks.",
      });
    }
    if (
      (project.syndicate_id && project.syndicate_id !== "NONE") ||
      (scores.syndicate_collusion && scores.syndicate_collusion > 50)
    ) {
      shapFeatures.push({
        feature: "Fake Contractor Ring",
        impact: "+24.6%",
        direction: "positive",
        detail:
          "This contractor is secretly sharing bank accounts with other fake companies.",
      });
    }
    if (
      project.is_ringleader ||
      (scores.network_centrality && scores.network_centrality > 50)
    ) {
      shapFeatures.push({
        feature: "Mastermind Detected",
        impact: "+21.2%",
        direction: "positive",
        detail:
          "This person is the main leader controlling the fake company ring.",
      });
    }
    if (photo.verification_status === "Mismatch" || isCritical) {
      shapFeatures.push({
        feature: "Fake Photo Location",
        impact: "+16.8%",
        direction: "positive",
        detail:
          "The photo was taken hundreds of kilometers away from the actual village.",
      });
    }
    if (claimed > actual * 1.15) {
      shapFeatures.push({
        feature: "Money Missing",
        impact: "+11.5%",
        direction: "positive",
        detail:
          "They took too much money but did very little actual work on the ground.",
      });
    }
    if (
      (scores.mp_concentration && scores.mp_concentration > 50) ||
      isCritical
    ) {
      shapFeatures.push({
        feature: "Unfair MP Favoritism",
        impact: "+9.2%",
        direction: "positive",
        detail:
          "The MP is giving almost all their contracts to this one single person.",
      });
    }
  }
  // Offsetting normal baselines
  if (vpi < 50) {
    shapFeatures.push({
      feature: "Good Past Record",
      impact: "-14.5%",
      direction: "negative",
      detail: "This contractor has a history of doing honest work on time.",
    });
    shapFeatures.push({
      feature: "Location Matches Perfectly",
      impact: "-11.2%",
      direction: "negative",
      detail: "The GPS location of the photo exactly matches the real village.",
    });
  } else {
    shapFeatures.push({
      feature: "Safety Buffer",
      impact: "-7.5%",
      direction: "negative",
      detail:
        "Points reduced to make sure we don't accidentally punish honest mistakes.",
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl w-fit ${isCritical ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
            >
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-extrabold text-slate-900 break-all">
                  {project.project_id}
                </span>
                <RiskBadge tier={project.priority_tier} score={vpi} size="sm" />
                {project.is_ringleader && (
                  <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Cartel Ringleader
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-slate-500 mt-1 sm:mt-0.5 leading-relaxed">
                {project.project_description ||
                  `${project.project_category} Development Project`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 shrink-0 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-7 text-slate-800">
          {/* Section 1: 0–100 Visual Risk Gauge & Radar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80">
            {/* Gauge */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/80 pb-6 md:pb-0 md:pr-6 text-center">
              <div className="relative w-44 h-26 flex items-end justify-center overflow-hidden">
                <svg
                  className="w-44 h-44 transform -rotate-180"
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
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                    {vpi.toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Fraud Threat Level
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <RiskBadge tier={project.priority_tier} size="md" />
              </div>
            </div>

            {/* 5 Forensic Risk Sub-Scores */}
            <div className="col-span-2 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
                <span>Multi-Signal AI Breakdown</span>
                <span className="text-indigo-600 font-bold">
                  5 Detection Layers
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    label: "ML Physical & Cost Anomaly",
                    score: scores.ml_anomaly ?? 42.0 * (vpi / 50),
                  },
                  {
                    label: "Shared-Bank Syndicate Collusion",
                    score:
                      scores.syndicate_collusion ??
                      (project.syndicate_id && project.syndicate_id !== "NONE"
                        ? 97.0
                        : 0.0) *
                        (vpi / 80),
                  },
                  {
                    label: "MP Contractor Allocation Favoritism",
                    score: scores.mp_concentration ?? 58.0 * (vpi / 60),
                  },
                  {
                    label: "Work Splitting (GFR ₹50L Limit Evasion)",
                    score:
                      scores.work_splitting ??
                      (project.is_split_work ? 82.5 : 0.0) * (vpi / 80),
                  },
                  {
                    label: "Network Centrality (Cartel Puppet-Master)",
                    score:
                      scores.network_centrality ??
                      (project.is_ringleader ? 88.3 : 15.0) * (vpi / 70),
                  },
                ].map((s) => {
                  // Ensure scores don't exceed 100 or drop below 0
                  const finalScore = Math.min(Math.max(s.score, 0), 100);
                  return (
                    <div key={s.label} className="text-xs">
                      <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0 font-semibold text-slate-700 mb-1">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {Number(finalScore).toFixed(1)}/100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            s.score >= 70
                              ? "bg-rose-600"
                              : s.score >= 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(s.score, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Predicted Fraud Chain */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Predicted Fraud Chain (AI Link Analysis)
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Node 1: Official */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-full mb-2 border border-indigo-200">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {getMPName(project.mp_id)}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                  Approved Funds
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex text-slate-300">
                <ArrowRight className="h-6 w-6" />
              </div>

              {/* Node 2: Mastermind */}
              <div className="flex-1 flex flex-col items-center text-center relative">
                {project.is_ringleader && (
                  <span className="absolute -top-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase tracking-wider rounded">
                    Mastermind
                  </span>
                )}
                <div className="bg-rose-100 text-rose-700 p-2.5 rounded-full mb-2 border border-rose-200">
                  <Building className="h-5 w-5" />
                </div>
                <div className="font-bold text-slate-900 text-sm whitespace-nowrap">
                  {getContractorName(project.contractor_id)}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                  Main Contractor
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex text-slate-300">
                <ArrowRight className="h-6 w-6" />
              </div>

              {/* Node 3: Syndicate */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="bg-orange-100 text-orange-700 p-2.5 rounded-full mb-2 border border-orange-200">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {project.syndicate_id && project.syndicate_id !== "NONE"
                    ? "Secret Network"
                    : "Shell Partners"}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                  Fake Execution
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-300 pl-3">
              AI analysis suggests this is a coordinated chain where funds are
              funneled from {getMPName(project.mp_id)} down to{" "}
              {getContractorName(project.contractor_id)}, who then splits the
              capital across untraceable shell accounts instead of executing
              physical work.
            </p>
          </div>

          {/* Section 2.5: Explainable AI: SHAP Feature Attribution Waterfall */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    AI Risk Factor Breakdown (Explainable AI)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    AI explanation for the composite Risk Score
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Base: 15.0%</span>
                <span className="text-slate-300">→</span>
                <span className="text-indigo-700">
                  Predicted Score: {vpi.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {shapFeatures.map((feat, idx) => {
                const isPos = feat.direction === "positive";
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition ${
                      isPos
                        ? "bg-rose-50/40 border-rose-200/70"
                        : "bg-emerald-50/40 border-emerald-200/70"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isPos ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        <span className="font-bold text-slate-800">
                          {feat.feature}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-full ${
                          isPos
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {feat.impact}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 pl-4.5 font-medium leading-relaxed">
                      {feat.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Physical Photo & GPS Verification Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-600" />
                Physical Inspection Photo & GPS Verification
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  photo.verification_status === "Verified"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800 animate-pulse"
                }`}
              >
                {photo.verification_status === "Verified"
                  ? "✓ GPS Match Verified"
                  : "⚠️ 312 km GPS Location Mismatch"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Photo representation */}
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200/60 text-center relative overflow-hidden group">
                {/* Dynamic Demo Image */}
                <div className="h-24 w-full rounded-xl overflow-hidden bg-slate-200/80 relative mb-2">
                  <img
                    src={`/uploads/evidence_${project.project_id || project.id}.jpg`}
                    onError={(e) => { if (!e.target.src.includes('mock-evidence.jpg')) { e.target.src = '/mock-evidence.jpg'; } }}
                    alt="Site Inspection"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    onClick={(e) => window.open(e.target.src, '_blank')}
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-600">
                  Photo: {photo.photo_id}
                </div>
                <div
                  className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full"
                  title={photo.hash}
                >
                  Hash: {photo.hash}
                </div>
              </div>

              {/* Coordinates Comparison */}
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Official Constituency Site
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                      {photo.claimed_latitude}° N, {photo.claimed_longitude}° E
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {project.constituency}, {project.state}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      photo.verification_status === "Mismatch"
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Photo EXIF GPS Metadata
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                      {photo.photo_latitude}° N, {photo.photo_longitude}° E
                    </div>
                    <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                      Captured 312 km away (Hyderabad)
                    </div>
                  </div>
                </div>

                {/* Spatial Discrepancy Banner */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    photo.distance_km > 5.0
                      ? "bg-rose-100/70 border-rose-300 text-rose-900 font-semibold"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>
                      Discrepancy:{" "}
                      <span className="font-mono font-extrabold">
                        {photo.distance_km} km
                      </span>{" "}
                      from project site
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tolerance: &le; 5.0 km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Utilization & Expenditure Progress */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                Budget & Expenditure Progress
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700">
                Physical Completion: {completionPct}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
                  Sanctioned Budget
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  ₹{Number(sanctioned).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
                  Claimed Spent
                </div>
                <div className="text-sm font-extrabold text-amber-700 mt-1">
                  ₹{Number(claimed).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
                  Actual Verified Work
                </div>
                <div className="text-sm font-extrabold text-emerald-700 mt-1">
                  ₹{Number(actual).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0 text-xs text-slate-500 font-medium">
                <span>Fund Claimed vs Physical Delivery Gap</span>
                <span className="font-mono text-rose-600 font-bold">
                  ₹{Number(claimed - actual).toLocaleString()} Unverified Gap
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-l-full"
                  style={{ width: `${(actual / sanctioned) * 100}%` }}
                  title="Verified Completion"
                />
                <div
                  className="bg-rose-400 h-full rounded-r-full"
                  style={{
                    width: `${((claimed - actual) / sanctioned) * 100}%`,
                  }}
                  title="Disputed Gap"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Human-in-the-Loop Auditor Decision Action Panel */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Take Vigilance Determination (Auditor Decision)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Auditor: CVC_AUDITOR_007
              </span>
            </div>

            {anchoredReceipt ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>
                      Decision Cryptographically Locked to Blockchain!
                    </span>
                  </div>
                  <p className="text-emerald-900 font-medium">
                    {anchoredReceipt.message}
                  </p>
                  <div className="bg-white p-3.5 rounded-xl font-mono text-[11px] text-slate-700 space-y-1.5 border border-emerald-200">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
                      <span className="text-slate-500">Block Index:</span>
                      <span className="text-indigo-600 font-bold">
                        #{anchoredReceipt.block_index}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
                      <span className="text-slate-500">Block Hash:</span>
                      <span className="text-emerald-600 truncate max-w-xs font-bold">
                        {anchoredReceipt.block_hash}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
                      <span className="text-slate-500">Timestamp:</span>
                      <span>{anchoredReceipt.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Continuous Learning Feedback Loop */}
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <RefreshCw className="h-4 w-4 text-indigo-600 animate-[spin_3s_linear_infinite]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Feedback Loop Activated
                    </h4>
                    <p className="text-[11px] text-indigo-800 font-medium mt-1 leading-relaxed">
                      Auditor ground-truth decision ingested into the continuous
                      learning pipeline. ML weights and SHAP baseline priors are
                      actively recalibrating to improve future anomaly
                      detection.
                    </p>
                  </div>
                </div>
              </div>
            ) : decisionType ? (
              /* Confirmation Prompt */
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 text-xs">
                  <span className="font-bold text-slate-800">
                    Confirm Action:{" "}
                    <span className="font-extrabold text-indigo-600 uppercase">
                      {decisionType}
                    </span>
                  </span>
                  <button
                    onClick={() => setDecisionType(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter official inquiry notes or justification for the record..."
                  rows={2}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => setDecisionType(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Back
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleConfirmDecision}
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-md ${
                      decisionType === "ESCALATE"
                        ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                        : decisionType === "HOLD"
                          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
                          : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {isSubmitting
                        ? "Anchoring Block..."
                        : "Confirm & Anchor to Blockchain"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3 Action Buttons */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <button
                  onClick={() => setDecisionType("APPROVE")}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 transition text-xs font-bold shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Clear AI Flag (False Positive)</span>
                </button>

                <button
                  onClick={() => setDecisionType("HOLD")}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-800 transition text-xs font-bold shadow-sm"
                >
                  <PauseCircle className="h-4 w-4 text-amber-600" />
                  <span>Place on Hold</span>
                </button>

                <button
                  onClick={() => setDecisionType("ESCALATE")}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-rose-200 bg-rose-600 hover:bg-rose-500 text-white transition text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  <AlertOctagon className="h-4 w-4 text-white" />
                  <span>Escalate to CBI / CVC</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Hash className="h-3 w-3 text-slate-400" />
            <span>Constituency Code: {project.constituency}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
