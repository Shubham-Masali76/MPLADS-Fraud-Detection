import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  ArrowDownAZ,
  Building,
  ShieldCheck,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";
import { EmptyState } from "../common/EmptyState";

// Helpers to generate fake names for demo
export const getContractorName = (id) => {
  const names = ["Balaji Infra Pvt Ltd", "Sri Venkateshwara Constructions", "Ramesh & Sons Builders", "VK Enterprises", "Maha Local Builders", "Reddy Civil Works"];
  return names[(parseInt(id?.replace(/\D/g, '')) || 0) % names.length];
};

export const getMPName = (id) => {
  const names = ["Hon. Rajesh Kumar", "Hon. Amit Singh", "Hon. Dr. S. Reddy", "Hon. Smt. Priya Sharma", "Hon. K. Rao", "Hon. Vikram Patil"];
  return names[(parseInt(id?.replace(/\D/g, '')) || 0) % names.length];
};

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
      {/* Header Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Immediate Auditor Attention Required
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Projects Flagged for Fraud Investigation
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            These projects have been automatically flagged by the AI for
            suspected financial fraud, fake contractors, or fake photos. Please
            review each case.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-center">
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">
              Critical
            </div>
            <div className="text-xl font-extrabold text-rose-700">
              {highRiskPool.filter((p) => p.vpi >= 75).length} Case
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 px-4 py-3 rounded-xl text-center">
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">
              High Priority
            </div>
            <div className="text-xl font-extrabold text-orange-700">
              {highRiskPool.filter((p) => p.vpi >= 50 && p.vpi < 75).length}{" "}
              Cases
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, Contractor, MP, District..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all placeholder:text-slate-400"
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

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ArrowDownAZ className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="vpi">Highest Fraud Score</option>
            <option value="budget">Largest Budget</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Flagged Cases Match Filters"
          description="Try modifying your search keywords or clearing the category filter."
          onReset={() => {
            setSearch("");
            setSelectedCategory("ALL");
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 whitespace-nowrap">Project ID</th>
                  <th className="py-3 px-3">Project Type</th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    Recommended By (MP)
                  </th>
                  <th className="py-3 px-3">Contractor Details</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 whitespace-nowrap">Budget (₹)</th>
                  <th className="py-3 px-3 whitespace-nowrap">Fraud Score</th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    AI Alert Level
                  </th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((p) => {
                  const isCrit = p.vpi >= 75;
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
                      <td className="py-3 px-3 font-mono font-medium text-slate-500 whitespace-nowrap">
                        {p.project_id}
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className="font-semibold text-slate-900 truncate max-w-[150px]"
                          title={p.project_description || p.project_category}
                        >
                          {p.project_description || p.project_category}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{getMPName(p.mp_id)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID: {p.mp_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 whitespace-nowrap">
                          {getContractorName(p.contractor_id)}
                        </div>
                        {p.syndicate_id && p.syndicate_id !== "NONE" && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                              Linked to Fake Ring
                            </span>
                            {p.is_ringleader && (
                              <span className="whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
                                Mastermind
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">ID: {p.contractor_id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {p.constituency}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.state}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        ₹{Number(p.sanctioned_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono font-bold ${
                            p.vpi >= 75 ? "text-rose-600" : "text-orange-600"
                          }`}
                        >
                          {p.vpi.toFixed(1)}/100
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <RiskBadge tier={p.priority_tier} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p.project_id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
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
