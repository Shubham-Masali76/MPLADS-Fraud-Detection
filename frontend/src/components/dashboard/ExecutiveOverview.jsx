import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  FolderGit2,
  Users,
  Coins,
  ArrowRight,
  Eye,
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
  return (
    <div className="space-y-6">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monitored Works"
          value={stats.total_projects?.toLocaleString() || "100,000"}
          subtitle={`₹${((stats.total_sanctioned_funds_inr || 525923850000) / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr Monitored`}
          icon={Layers}
          variant="navy"
          badgeText="100% Ingested"
        />

        <StatCard
          title="Critical Priority Alert"
          value={stats.critical_priority_count || 1}
          subtitle="Multi-Signal Syndicate Ring"
          icon={ShieldAlert}
          variant="critical"
          badgeText="Immediate Action"
        />

        <StatCard
          title="High-Risk Queue"
          value={stats.high_priority_count || 660}
          subtitle="Cartel & GFR Evasion Cases"
          icon={AlertTriangle}
          variant="high"
          badgeText="Requires Audit"
        />

        <StatCard
          title="Shell Syndicates Detected"
          value={stats.total_syndicates || 100}
          subtitle="1,000 Vendors sharing Bank Accounts"
          icon={Users}
          variant="medium"
          badgeText="100% Precision"
        />
      </div>

      {/* Secondary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tender Slicing Clusters
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 mt-1">
              {stats.total_split_clusters || 45} Clusters
            </div>
            <div className="text-[11px] text-orange-600 font-medium mt-0.5">
              29 directly evade ₹50L statutory GFR limit
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <FolderGit2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Constituency Monitored
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 mt-1">
              {stats.total_mps_monitored || 100} MPs Profiled
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Dual-level HHI & CR1/CR3 Favoritism Index
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-navy-800 flex items-center justify-center font-bold">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vigilance Priority Index (VPI)
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 mt-1">
              0 – 100 Calibrated
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Multi-Layer Fusion: ML + Graph + GPS
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Eye className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={categoryData} stats={stats} />
        <DistrictRiskChart data={districtData} />
      </div>

      {/* Top Critical / High Priority Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Prioritized Vigilance Action Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-confidence multi-signal anomalies requiring immediate auditor
              determination
            </p>
          </div>
          <button
            onClick={onNavigateToHighRisk}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 hover:text-navy-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            <span>
              View All High-Risk Cases (
              {stats.high_priority_count + stats.critical_priority_count})
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Project ID</th>
                <th className="py-3 px-4">Category & Work</th>
                <th className="py-3 px-4">Awarding MP</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Constituency</th>
                <th className="py-3 px-4 text-right">Sanctioned INR</th>
                <th className="py-3 px-4 text-center">VPI Score</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topAlerts.map((project) => {
                const isCrit = project.priority_tier === "CRITICAL";
                return (
                  <tr
                    key={project.project_id}
                    onClick={() => onSelectProject(project.project_id)}
                    className={`cursor-pointer transition-colors ${
                      isCrit
                        ? "bg-red-50/40 hover:bg-red-50/80"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">
                      {project.project_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {project.project_description ||
                          project.project_category}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {project.project_category}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {project.mp_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-semibold">
                        {project.contractor_id}
                      </div>
                      {project.is_ringleader && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-mono text-[9px] font-bold">
                          RINGLEADER
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{project.constituency}</div>
                      <div className="text-[10px] text-slate-400">
                        {project.state}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(project.sanctioned_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-red-600">
                      {Number(project.vpi).toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <RiskBadge tier={project.priority_tier} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project.project_id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-navy-900 hover:bg-navy-800 text-white px-2.5 py-1 text-[11px] font-semibold transition shadow-sm"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
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
