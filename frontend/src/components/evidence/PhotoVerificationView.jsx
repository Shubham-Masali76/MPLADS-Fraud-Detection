import React, { useState } from "react";
import { Camera, CheckCircle2, AlertTriangle, MapPin, Hash, Clock, Upload, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { apiService } from "../../services/apiService";

export const PhotoVerificationView = () => {
  const [claimedLat, setClaimedLat] = useState("17.9784");
  const [claimedLon, setClaimedLon] = useState("79.5941");
  const [toleranceKm, setToleranceKm] = useState("5.0");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const demoScenarios = [
    {
      label: "Warangal NH-163 Road (Severe GPS Mismatch)",
      lat: "17.9784",
      lon: "79.5941",
      fileName: "warangal_nh163_mismatch.jpg",
      isMismatch: true,
    },
    {
      label: "Panchayat Community Hall (Verified Physical Match)",
      lat: "17.9784",
      lon: "79.5941",
      fileName: "community_hall_verified.jpg",
      isMismatch: false,
    },
  ];

  const handleLoadScenario = (sc) => {
    setClaimedLat(sc.lat);
    setClaimedLon(sc.lon);
    setFileName(sc.fileName);
    setSelectedFile(new File(["demo_bytes"], sc.fileName, { type: "image/jpeg" }));
    setResult(null);
  };

  const handleRunVerification = async () => {
    setLoading(true);
    try {
      const fileToUpload = selectedFile || new File(["dummy"], fileName || "inspection_photo.jpg", { type: "image/jpeg" });
      const res = await apiService.verifyPhoto(fileToUpload, claimedLat, claimedLon, Number(toleranceKm));
      setResult(res);
    } catch (e) {
      alert("Photo verification failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Camera className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Multi-Modal Physical Evidence Lab
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">
            AI Photo Evidence & Geospatial Verification Lab
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Inspect physical completion photographs in real time using EXIF GPS extraction, Haversine spatial discrepancy calculation, and duplicate cryptographic SHA-256 hash detection.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold shrink-0">
          <span>EXIF GPS Extraction</span>
          <span className="text-slate-300">•</span>
          <span>Duplicate Hash Check</span>
        </div>
      </div>

      {/* Main Form & Interactive Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs & File Upload */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Test Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoScenarios.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLoadScenario(sc)}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 text-left transition text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Scenario #{i + 1}</span>
                  </div>
                  <div>{sc.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Inspection Photograph (JPEG / PNG)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-6 text-center bg-slate-50/50 transition cursor-pointer relative">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setSelectedFile(f);
                    setFileName(f.name);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">
                {fileName ? <span className="text-indigo-600 font-mono font-bold">{fileName}</span> : "Drop inspection photograph here or click to browse"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Supports EXIF GPS metadata & SHA-256 hash hashing</div>
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Claimed Latitude</label>
              <input
                type="text"
                value={claimedLat}
                onChange={(e) => setClaimedLat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Claimed Longitude</label>
              <input
                type="text"
                value={claimedLon}
                onChange={(e) => setClaimedLon(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Distance Tolerance (km)</label>
            <input
              type="text"
              value={toleranceKm}
              onChange={(e) => setToleranceKm(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60"
            />
          </div>

          <button
            onClick={handleRunVerification}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Extracting EXIF & Calculating Haversine Distance...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Run AI Forensic Photo Verification</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Verification Dossier */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-900">Forensic Physical Verification Result</h3>
              <span className="text-xs font-mono text-slate-400">Live AI Output</span>
            </div>

            {result ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Status Callout */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    result.distance_km > Number(toleranceKm)
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  {result.distance_km > Number(toleranceKm) ? (
                    <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold uppercase tracking-tight">
                      {result.distance_km > Number(toleranceKm)
                        ? "CRITICAL GEOSPATIAL MISMATCH DETECTED"
                        : "PHOTOGRAPH GEOGRAPHICALLY VERIFIED"}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {result.distance_km > Number(toleranceKm)
                        ? `The submitted photo was taken ${result.distance_km.toFixed(1)} km away from the sanctioned project site (Tolerance: ${toleranceKm} km). Severe indicator of fraudulent evidence.`
                        : `The submitted photo GPS coordinates align within ${result.distance_km.toFixed(2)} km of the claimed site.`}
                    </p>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Haversine Discrepancy</div>
                    <div className="text-xl font-mono font-black text-slate-900 mt-1">
                      {result.distance_km.toFixed(1)} km
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Allowed Tolerance</div>
                    <div className="text-xl font-mono font-black text-slate-900 mt-1">
                      {result.tolerance_km} km
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates Comparison */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Claimed Site:</span>
                    <span className="font-bold text-slate-800">
                      {result.claimed_latitude?.toFixed(4)}° N, {result.claimed_longitude?.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Extracted EXIF GPS:</span>
                    <span className={`font-bold ${result.distance_km > Number(toleranceKm) ? "text-rose-600 font-black" : "text-emerald-700"}`}>
                      {result.photo_latitude?.toFixed(4)}° N, {result.photo_longitude?.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400">Capture Timestamp:</span>
                    <span className="text-slate-600">{result.photo_timestamp ? new Date(result.photo_timestamp).toLocaleString("en-IN") : "EXIF Timestamp Verified"}</span>
                  </div>
                </div>

                {/* Duplicate Hash Check */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-indigo-500" />
                      Cryptographic SHA-256 Photo Hash
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{result.image_hash?.substring(0, 16)}...</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Status: <strong className={result.duplicate_flag?.includes("Yes") ? "text-rose-600" : "text-emerald-600"}>{result.duplicate_flag}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                <Camera className="h-10 w-10 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-600">Ready for Forensic Analysis</div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Select a test scenario on the left or upload an inspection photograph, then click Run AI Forensic Verification.
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Module: evidence_service.py</span>
            <span>API: POST /api/evidence/verify-photo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
