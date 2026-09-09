import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Building,
  ShieldCheck,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";
import { EmptyState } from "../common/EmptyState";

export const HighRiskQueue = ({ projects = [], onSelectProject }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("vpi");

  // Filter projects (Critical & High only)
  const highRiskPool = projects.filter(
    (p) => p.priority_tier === "CRITICAL" || p.priority_tier === "HIGH",
  );

  const filtered = highRiskPool.filter((p) => {
    if (selectedCategory !== "ALL" && p.project_category !== selectedCategory) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        p.project_id.toLowerCase().includes(q) ||
        p.mp_id.toLowerCase().includes(q) ||
        p.contractor_id.toLowerCase().includes(q) ||
        p.constituency.toLowerCase().includes(q) ||
        (p.project_description &&
          p.project_description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "vpi") return b.vpi - a.vpi;
    if (sortBy === "amount") return b.sanctioned_amount - a.sanctioned_amount;
    return a.project_id.localeCompare(b.project_id);
  });

  const categories = [
    "ALL",
    ...Array.from(new Set(highRiskPool.map((p) => p.project_category))),
  ];

  return (
    <div className="space-y-6">
      {/* High-Risk Queue Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              Immediate Auditor Attention Required
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-3">
            High-Risk Priority Queue
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Prioritized projects flagged by AI anomaly detection, shell
            contractor networks, and photo GPS mismatches. Review each case and
            record an official auditor verdict.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-rose-50/70 border border-rose-100 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">
              Critical
            </div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight mt-0.5">
              1 Case
            </div>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
              High Priority
            </div>
            <div className="text-2xl font-extrabold text-amber-900 tracking-tight mt-0.5">
              660 Cases
            </div>
          </div>
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
            placeholder="Search by ID, Contractor, MP, District..."
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium ml-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="vpi">Highest Risk Score</option>
            <option value="amount">Sanctioned Amount</option>
            <option value="id">Project ID</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No High-Risk Cases Match Filters"
          description="Try modifying your search keywords or clearing the category filter."
          onReset={() => {
            setSearch("");
            setSelectedCategory("ALL");
          }}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Project ID</th>
                  <th className="py-4 px-5">Category & Purpose</th>
                  <th className="py-4 px-5">Awarding MP</th>
                  <th className="py-4 px-5">Contractor / Syndicate</th>
                  <th className="py-4 px-5">Constituency</th>
                  <th className="py-4 px-5 text-right">Sanctioned INR</th>
                  <th className="py-4 px-5 text-center">Risk Score</th>
                  <th className="py-4 px-5 text-center">Priority</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((p) => {
                  const isCrit = p.priority_tier === "CRITICAL";
                  return (
                    <tr
                      key={p.project_id}
                      onClick={() => onSelectProject(p.project_id)}
                      className={`cursor-pointer transition-colors ${
                        isCrit
                          ? "bg-rose-50/40 hover:bg-rose-50/80"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-4 px-5 font-mono font-bold text-slate-900">
                        {p.project_id}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {p.project_description || p.project_category}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.project_category}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-700">
                        {p.mp_id}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-mono text-slate-800 font-semibold">
                          {p.contractor_id}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {p.syndicate_id && p.syndicate_id !== "NONE" && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {p.syndicate_id}
                            </span>
                          )}
                          {p.is_ringleader && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                              RINGLEADER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {p.constituency}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.state}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(p.sanctioned_amount).toLocaleString()}
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-extrabold text-rose-600 text-sm">
                        {Number(p.vpi).toFixed(1)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <RiskBadge tier={p.priority_tier} size="sm" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p.project_id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white px-3.5 py-2 text-xs font-semibold transition-all shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
