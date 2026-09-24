import React, { useState } from "react";
import { Landmark, AlertTriangle, ShieldCheck, Search, Filter, TrendingUp, Users, ExternalLink } from "lucide-react";

export const MPFavoritismView = ({ mps = [], onSelectProject }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("allocation_risk");

  const filtered = mps.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      return m.mp_id.toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "allocation_risk") return (b.allocation_risk_score || 0) - (a.allocation_risk_score || 0);
    if (sortBy === "master_score") return (b.mp_vigilance_master_score || 0) - (a.mp_vigilance_master_score || 0);
    if (sortBy === "funds") return (b.total_allocated_inr || 0) - (a.total_allocated_inr || 0);
    if (sortBy === "syndicate") return (b.syndicate_projects || 0) - (a.syndicate_projects || 0);
    return a.mp_id.localeCompare(b.mp_id);
  });

  const highRiskCount = mps.filter((m) => (m.allocation_risk_score || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Vendor Concentration & Favoritism Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">
            MP Allocation Concentration & Favoritism Monitor
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Measures vendor monopoly risk and undue contractor favoritism using the Herfindahl-Hirschman Index (HHI) and Top-1 / Top-3 concentration ratios across parliamentary allocations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-rose-50/80 border border-rose-100 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">
              Severe Favoritism
            </div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight mt-0.5">
              {highRiskCount} MPs
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
              MPs Profiled
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {mps.length}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Allocations</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">₹52,592 Cr</div>
          <div className="text-xs text-slate-500 mt-1">Across 100 monitored constituencies</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Peak Allocation Risk</div>
          <div className="text-3xl font-extrabold text-rose-700 mt-2">98.4 / 100</div>
          <div className="text-xs text-rose-600 font-medium mt-1">MP0070 (23 syndicate works)</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Syndicate-Linked Works</div>
          <div className="text-3xl font-extrabold text-purple-700 mt-2">1,820</div>
          <div className="text-xs text-purple-600 mt-1">Awarded to shell cartels</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Avg Works / MP</div>
          <div className="text-3xl font-extrabold text-indigo-900 mt-2">968</div>
          <div className="text-xs text-indigo-600 mt-1">Sanctioned development projects</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by MP ID (e.g. MP0046, MP0070)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="allocation_risk">Highest Favoritism Risk</option>
            <option value="master_score">Master Vigilance Score</option>
            <option value="syndicate">Most Cartel Works</option>
            <option value="funds">Total Sanctioned Funds</option>
          </select>
        </div>
      </div>

      {/* MP Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">MP ID</th>
                <th className="py-4 px-5">Total Works</th>
                <th className="py-4 px-5 text-right">Total Allocated INR</th>
                <th className="py-4 px-5 text-center">Critical / High Works</th>
                <th className="py-4 px-5 text-center">Cartel Projects</th>
                <th className="py-4 px-5 text-center">Split Clusters</th>
                <th className="py-4 px-5 text-center">Favoritism Score</th>
                <th className="py-4 px-5 text-center">Vigilance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sorted.map((m) => {
                const risk = m.allocation_risk_score || 0;
                const isHigh = risk >= 80;
                return (
                  <tr key={m.mp_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      {m.mp_id}
                    </td>
                    <td className="py-4 px-5 text-slate-700">
                      {m.total_projects?.toLocaleString()} works
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{((m.total_allocated_inr || 0) / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold">
                        {m.critical_projects > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px]">
                            {m.critical_projects} Crit
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px]">
                          {m.high_projects || 0} High
                        </span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-semibold">
                      {m.syndicate_projects > 0 ? (
                        <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          {m.syndicate_projects} cartel works
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-slate-700">
                      {m.split_projects > 0 ? (
                        <span className="text-rose-700 font-bold">{m.split_projects}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center font-mono font-extrabold px-3 py-1 rounded-full text-xs ${
                          isHigh
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : risk >= 50
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {risk.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-800 text-sm">
                      {(m.mp_vigilance_master_score || 0).toFixed(1)}
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
