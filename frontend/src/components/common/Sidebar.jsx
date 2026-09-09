import React from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  Layers,
  Share2,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "high_risk",
      label: "High-Risk Projects",
      icon: AlertTriangle,
      badge: "661",
      badgeColor: "bg-red-500/20 text-red-300 border border-red-500/30",
    },
    {
      id: "all_projects",
      label: "All Projects",
      icon: Layers,
      badge: "100k",
      badgeColor: "bg-slate-700/60 text-slate-300",
    },
    {
      id: "fraud_network",
      label: "Fraud Network",
      icon: Share2,
      badge: "Cartels",
      badgeColor:
        "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    },
    {
      id: "audit_trail",
      label: "Audit Trail",
      icon: ShieldCheck,
      badge: "SHA-256",
      badgeColor:
        "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    },
  ];

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col justify-between border-r border-navy-800 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-navy-800/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-navy-950 font-black shadow-md shadow-amber-500/10 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                MPLADS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-navy-800 text-slate-400 border border-navy-700">
                AI Vigilance
              </span>
            </div>
            <h1 className="text-sm font-semibold text-white truncate tracking-tight">
              Anti-Fraud Intelligence
            </h1>
          </div>
        </div>

        {/* Oversight Authority Banner */}
        <div className="px-5 py-3 bg-navy-900/60 border-b border-navy-800/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">Oversight: CVC / MoSPI Portal</span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-navy-700 text-white font-semibold shadow-inner border border-navy-600"
                    : "text-slate-400 hover:text-slate-200 hover:bg-navy-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-navy-800/80 bg-navy-900/40 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-bold">● Operational</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400 bg-navy-950 p-2 rounded border border-navy-800 space-y-1">
          <div className="flex justify-between">
            <span>FastAPI:</span>
            <span className="text-slate-300">port 8000</span>
          </div>
          <div className="flex justify-between">
            <span>Ledger:</span>
            <span className="text-amber-400">SHA-256 Valid</span>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-500 pt-1">
          SIH 2026 Audit Architecture
        </div>
      </div>
    </aside>
  );
};
