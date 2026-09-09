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
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 to-navy-900 text-white rounded-xl p-5 border border-red-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              High-Risk Vigilance Queue
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Prioritized cases flagged by the multi-signal AI engine (Isolation
            Forest + Shell Cartel Adjacency + Tender Slicing + GPS Mismatch).
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs shrink-0">
          <div className="bg-red-950/60 border border-red-500/30 px-3 py-2 rounded-lg text-center">
            <div className="text-[10px] text-red-300 uppercase font-semibold">
              Critical
            </div>
            <div className="text-lg font-bold text-red-400">1 Case</div>
          </div>
          <div className="bg-orange-950/60 border border-orange-500/30 px-3 py-2 rounded-lg text-center">
            <div className="text-[10px] text-orange-300 uppercase font-semibold">
              High Priority
            </div>
            <div className="text-lg font-bold text-orange-400">660 Cases</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Contractor, MP, District..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-700 font-mono"
          >
            <option value="vpi">Highest VPI Score</option>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Category & Purpose</th>
                  <th className="py-3 px-4">Awarding MP</th>
                  <th className="py-3 px-4">Contractor / Syndicate</th>
                  <th className="py-3 px-4">Constituency</th>
                  <th className="py-3 px-4 text-right">Sanctioned INR</th>
                  <th className="py-3 px-4 text-center">VPI Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                          ? "bg-red-50/40 hover:bg-red-50/80"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                        {p.project_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {p.project_description || p.project_category}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.project_category}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {p.mp_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">
                          {p.contractor_id}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.syndicate_id && p.syndicate_id !== "NONE" && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              {p.syndicate_id}
                            </span>
                          )}
                          {p.is_ringleader && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                              RINGLEADER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{p.constituency}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{Number(p.sanctioned_amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-red-600">
                        {Number(p.vpi).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <RiskBadge tier={p.priority_tier} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p.project_id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white px-3 py-1.5 text-xs font-semibold transition shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Dossier</span>
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
