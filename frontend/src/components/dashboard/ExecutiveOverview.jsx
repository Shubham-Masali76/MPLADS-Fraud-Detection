import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  Users,
  ArrowRight,
  Eye,
  Sparkles,
  MapPin,
} from "lucide-react";
import { StatCard } from "../common/StatCard";
import { RiskBadge } from "../common/RiskBadge";
import { RiskDistributionChart } from "./RiskDistributionChart";
import { DistrictRiskChart } from "./DistrictRiskChart";

export const ExecutiveOverview = ({
  stats,
  categoryData,
  districtData,
  topAlerts,
  onSelectProject,
  onNavigateToHighRisk,
}) => {
  const criticalProject =
    topAlerts.find((p) => p.priority_tier === "CRITICAL") || topAlerts[0];

  return (
    <div className="space-y-8">
      {/* Modern Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>National Vigilance AI Engine Active</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Central Vigilance Command Center
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Continuous multi-signal fraud monitoring across 100,000 national
              development projects. Currently isolating 1 critical cartel
              ringleader in Warangal and 660 high-risk works for auditor review.
            </p>
          </div>

          {criticalProject && (
            <div className="shrink-0">
              <button
                onClick={() => onSelectProject(criticalProject)}
                className="group flex items-center gap-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white px-5 py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all duration-200 hover:scale-102"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-rose-200 tracking-wider">
                    Immediate Action
                  </span>
                  <span className="text-sm">
                    Inspect Critical Alert #{criticalProject.project_id}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary 4 Metric Cards (Clean & Breathable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monitored Public Funds"
          value={`₹${((stats.total_sanctioned_funds_inr || 525923850000) / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr`}
          subtitle="Across 100,000 works nationwide"
          icon={Layers}
          variant="navy"
          badgeText="100% Covered"
        />

        <StatCard
          title="Critical Priority Alert"
          value={stats.critical_priority_count || 1}
          subtitle="Multi-signal syndicate in Warangal"
          icon={ShieldAlert}
          variant="critical"
          badgeText="Action Needed"
          onClick={() => criticalProject && onSelectProject(criticalProject)}
        />

        <StatCard
          title="High-Risk Review Queue"
          value={stats.high_priority_count || 660}
          subtitle="Cartel collusion & GFR evasions"
          icon={AlertTriangle}
          variant="high"
          badgeText="Pending Review"
          onClick={onNavigateToHighRisk}
        />

        <StatCard
          title="Contractor Cartels Caught"
          value={stats.total_syndicates || 100}
          subtitle="1,000 vendors sharing bank accounts"
          icon={Users}
          variant="medium"
          badgeText="100 Cartels"
        />
      </div>

      {/* Analytics Charts (2 Spacious Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={categoryData} stats={stats} />
        <DistrictRiskChart data={districtData} />
      </div>

      {/* Modern High-Risk Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Top Projects Requiring Your Review
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Prioritized by composite Vigilance Priority Index (VPI) combining
              AI anomaly scores, graph cartels, and GPS checks.
            </p>
          </div>
          <button
            onClick={onNavigateToHighRisk}
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-4 py-2 rounded-xl transition"
          >
            <span>View All 661 Flagged Works</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">Project & Purpose</th>
                <th className="py-3.5 px-6">Location & MP</th>
                <th className="py-3.5 px-6">Contractor</th>
                <th className="py-3.5 px-6">Budget (INR)</th>
                <th className="py-3.5 px-6">Risk Score</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {topAlerts.slice(0, 5).map((proj) => {
                const isCrit = proj.priority_tier === "CRITICAL";
                return (
                  <tr
                    key={proj.project_id}
                    className={`hover:bg-indigo-50/40 transition-colors ${
                      isCrit ? "bg-rose-50/20" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-900">
                        {proj.project_id}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate max-w-xs mt-0.5">
                        {proj.project_description ||
                          `${proj.project_category} Development Work`}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {proj.constituency}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        MP:{" "}
                        <span className="font-mono text-slate-600">
                          {proj.mp_id}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">
                        {proj.contractor_name || proj.contractor_id}
                      </div>
                      {proj.is_ringleader && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                          Cartel Ringleader
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ₹{Number(proj.sanctioned_amount).toLocaleString()}
                    </td>

                    <td className="py-4 px-6">
                      <RiskBadge
                        tier={proj.priority_tier}
                        score={proj.vpi}
                        size="sm"
                      />
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onSelectProject(proj)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          isCrit
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Evidence</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
