import React, { useState, useEffect } from "react";
import { Shield, Bell, Clock, Search, Sparkles } from "lucide-react";

export const Header = ({ activeTab }) => {
  const [timeStr, setTimeStr] = useState("");

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
    all_projects: {
      title: "Master Project Database",
      subtitle: "100,000 sanctioned works under parliamentary oversight",
    },
    fraud_network: {
      title: "Contractor Cartel Topology",
      subtitle:
        "Graph-based detection of shared bank accounts & puppet-master ringleaders",
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
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
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

      <div className="flex items-center gap-4">
        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono">{timeStr || "Live Sync..."}</span>
        </div>

        {/* Cryptographic Ledger Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-sm">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>SHA-256 Ledger Intact</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
          title="New alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
