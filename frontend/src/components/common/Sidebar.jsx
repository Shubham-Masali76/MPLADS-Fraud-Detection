import React from "react";
import { LayoutDashboard, AlertTriangle, ShieldCheck, LogOut, Database } from "lucide-react";

export function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <div className="w-full md:w-64 md:h-screen md:shrink-0 overflow-y-auto bg-white text-slate-800 flex flex-col h-screen font-sans border-r border-slate-200 shrink-0 shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-slate-900 font-extrabold tracking-tight">MPLADS <span className="text-indigo-600">Audit</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <div className="px-2 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Core Workflow</div>
        
        <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
          <LayoutDashboard className="h-5 w-5" /> Home Summary
        </button>
        
        <button onClick={() => setActiveTab("high_risk")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "high_risk" ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-50"}`}>
          <AlertTriangle className="h-5 w-5" /> Action Required
        </button>

        <div className="pt-6 px-2 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">System Log</div>

        <button onClick={() => setActiveTab("audit_trail")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "audit_trail" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>
          <Database className="h-5 w-5" /> Blockchain Ledger
        </button>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 rounded-xl text-sm font-bold transition-colors shadow-sm">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </div>
  );
}
