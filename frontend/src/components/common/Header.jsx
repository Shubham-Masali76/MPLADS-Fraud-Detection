import React, { useState, useEffect } from "react";
import { Shield, Bell, Clock, Search, Sparkles } from "lucide-react";

export const Header = ({ activeTab }) => {
  const [timeStr, setTimeStr] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = {
    dashboard: {
      title: "Overview & Threat Monitor",
      subtitle:
        "Continuous real-time AI anomaly detection across national development works",
    },
    high_risk: {
      title: "High-Risk Priority Queue",
      subtitle:
        "661 works flagged for severe cost anomalies, cartel collusion, or GFR evasion",
    },
    work_splitting: {
      title: "Tender Slicing & Work Splitting Radar",
      subtitle:
        "Detection of fragmented contracts evading GFR Rule 149/157 ₹50 Lakh threshold",
    },
    mp_favoritism: {
      title: "MP Contractor Allocation Risk & HHI Concentration",
      subtitle:
        "Analysis of parliamentary fund channeling, syndicate favoritism, and cartel links",
    },
    photo_lab: {
      title: "Multi-Modal Physical Photo Verification Lab",
      subtitle:
        "Live EXIF GPS extraction, Haversine geospatial mismatch calculation, and duplicate image hashing",
    },
    fraud_network: {
      title: "Contractor Cartel Topology",
      subtitle:
        "Graph-based detection of shared bank accounts & puppet-master ringleaders",
    },
    all_projects: {
      title: "Master Project Database",
      subtitle: "100,000 sanctioned works under parliamentary oversight",
    },
    audit_trail: {
      title: "Cryptographic Blockchain Ledger",
      subtitle:
        "Tamper-evident, immutable SHA-256 chain of custody for all auditor decisions",
    },
  };

  const current = meta[activeTab] || {
    title: "Vigilance Monitor",
    subtitle: "Real-time AI monitoring active",
  };

  return (
    <header className="min-h-[80px] py-4 md:py-0 bg-white border-b border-slate-200/80 px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 shadow-sm relative">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-0.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span className="uppercase tracking-wider">
            {activeTab.replace("_", " ")}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {current.title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono">{timeStr || "Live Sync..."}</span>
        </div>

        {/* Cryptographic Ledger Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-sm">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span className="whitespace-nowrap">SHA-256 Ledger Intact</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
            title="New alerts"
          >
            <Bell className="h-4 w-4" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-2 w-72 max-w-[85vw] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                <span className="text-sm font-bold text-slate-800">Alerts</span>
                {hasUnread && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                    2 New
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer ${hasUnread ? "bg-white hover:bg-slate-50" : "bg-slate-50 opacity-75"}`}
                >
                  <p className="text-xs font-semibold text-rose-600 mb-0.5">
                    Critical Risk Detected
                  </p>
                  <p className="text-xs text-slate-600">
                    Project P00059973 flagged for GPS Mismatch.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">2 mins ago</p>
                </div>
                <div
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer ${hasUnread ? "bg-white hover:bg-slate-50" : "bg-slate-50 opacity-75"}`}
                >
                  <p className="text-xs font-semibold text-orange-600 mb-0.5">
                    Cartel Activity
                  </p>
                  <p className="text-xs text-slate-600">
                    New node joined Syndicate_011.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">1 hr ago</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-50 text-center border-t border-slate-100">
                <button
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  onClick={() => {
                    setHasUnread(false);
                    setShowNotifications(false);
                  }}
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
