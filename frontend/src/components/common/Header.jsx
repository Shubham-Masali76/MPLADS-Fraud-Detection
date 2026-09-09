import React, { useState, useEffect } from "react";
import { Shield, UserCheck, Bell, Clock } from "lucide-react";

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

  const titles = {
    dashboard: "Executive Vigilance Dashboard",
    high_risk: "High-Risk Priority Queue (CRITICAL & HIGH)",
    all_projects: "Master Project Repository (100,000 Works)",
    fraud_network: "Fraud Network & Cartel Topology Explorer",
    audit_trail: "Tamper-Evident Blockchain Audit Ledger",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>MPLADS Vigilance</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold uppercase tracking-wider">
            {activeTab.replace("_", " ")}
          </span>
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {titles[activeTab] || "Vigilance Monitor"}
        </h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{timeStr || "Live Sync..."}</span>
        </div>

        {/* Cryptographic Ledger Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>SHA-256 Ledger: Intact</span>
        </div>

        {/* Auditor Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-navy-900 text-amber-400 flex items-center justify-center font-bold text-xs shadow-sm">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-800">
              CVC_AUDITOR_007
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Vigilance Division (Central)
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
