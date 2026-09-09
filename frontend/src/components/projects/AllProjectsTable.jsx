import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";
import { EmptyState } from "../common/EmptyState";

export const AllProjectsTable = ({ projects = [], onSelectProject }) => {
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = projects.filter((p) => {
    if (selectedTier !== "ALL" && p.priority_tier !== selectedTier)
      return false;
    if (selectedCategory !== "ALL" && p.project_category !== selectedCategory)
      return false;
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const categories = [
    "ALL",
    ...Array.from(new Set(projects.map((p) => p.project_category))),
  ];

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Project ID, MP, Contractor, Constituency..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white transition font-normal"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Tier Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Priority:</span>
            </div>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Tiers (100k)</option>
              <option value="CRITICAL">Critical (1)</option>
              <option value="HIGH">High (660)</option>
              <option value="MEDIUM">Medium (45.4k)</option>
              <option value="LOW">Low (53.9k)</option>
            </select>

            {/* Category Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium ml-1">
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
          <span>
            Showing{" "}
            <strong className="text-slate-900 font-semibold">
              {filtered.length.toLocaleString()}
            </strong>{" "}
            matching works
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            Total Indexed: 100,000 projects
          </span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Projects Match Query"
          description="Try broadening your search term or setting Priority to 'All Tiers'."
          onReset={() => {
            setSearch("");
            setSelectedTier("ALL");
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
                  <th className="py-4 px-5">MP ID</th>
                  <th className="py-4 px-5">Contractor</th>
                  <th className="py-4 px-5">Location</th>
                  <th className="py-4 px-5 text-right">Sanctioned INR</th>
                  <th className="py-4 px-5 text-center">Risk Score</th>
                  <th className="py-4 px-5 text-center">Priority</th>
                  <th className="py-4 px-5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentItems.map((p) => (
                  <tr
                    key={p.project_id}
                    onClick={() => onSelectProject(p.project_id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
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
                    <td className="py-4 px-5 font-mono text-slate-800">
                      {p.contractor_id}
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
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-800 text-sm">
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
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 px-3 py-1.5 text-xs font-semibold transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 px-6 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-bold text-slate-900">{page}</span> of{" "}
              <span className="font-bold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
