import React from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  Layers,
  Share2,
  ShieldCheck,
  Shield,
  Activity,
  User,
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
      label: "High-Risk Queue",
      icon: AlertTriangle,
      badge: "661",
      badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
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
      label: "Cartel Network",
      icon: Share2,
      badge: "Cartels",
      badgeColor:
        "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    },
    {
      id: "audit_trail",
      label: "Blockchain Ledger",
      icon: ShieldCheck,
      badge: "SHA-256",
      badgeColor:
        "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    },
  ];

  return (
    <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800/80 shrink-0 h-screen sticky top-0 select-none shadow-xl z-20">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Shield className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">
                Vigilance<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              MPLADS Anti-Fraud Radar
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="mx-4 my-4 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">
              Monitoring Active
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            100k works
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modern User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
            CO
          </div>
          <div className="overflow-hidden flex-1 text-left">
            <div className="text-xs font-bold text-white truncate">
              Central Vigilance
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Auditor #007
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
        </div>
      </div>
    </aside>
  );
};
