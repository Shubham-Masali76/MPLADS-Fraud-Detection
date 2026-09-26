import React, { useState } from "react";
import {
  Scissors,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";

export const WorkSplittingView = ({ clusters = [], onSelectProject }) => {
  const [filterGfr, setFilterGfr] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filtered = clusters.filter((c) => {
    if (filterGfr === "GFR_ONLY" && !c.evades_gfr_threshold) return false;
    if (selectedCategory !== "ALL" && c.project_category !== selectedCategory)
      return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.cluster_id.toLowerCase().includes(q) ||
        c.mp_id.toLowerCase().includes(q) ||
        (c.effective_entity_id &&
          c.effective_entity_id.toLowerCase().includes(q)) ||
        (c.project_category && c.project_category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const categories = [
    "ALL",
    ...Array.from(
      new Set(clusters.map((c) => c.project_category).filter(Boolean))
    ),
  ];

  const totalEvasions = clusters.filter((c) => c.evades_gfr_threshold).length;
  const totalAmount = clusters.reduce(
    (acc, c) => acc + (c.total_split_amount_inr || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Scissors className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              GFR Rule 149/157 Vigilance Check
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">
            Tender Slicing & Work Fragmentation Detector
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Identifies artificial project slicing into multiple sub-₹50 Lakh
            works awarded in rapid succession to circumvent statutory Central
            Public Procurement & CVC tender thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-rose-50/80 border border-rose-100 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">
              GFR Evasions
            </div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight mt-0.5">
              {totalEvasions} Clusters
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-center min-w-[120px]">
            <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
              Total Fragmented
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              ₹{(totalAmount / 10000000).toFixed(1)} Cr
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Clusters
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">45</div>
          <div className="text-xs text-slate-500 mt-1">
            Synthesized tender slices
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Below ₹50L Limit
          </div>
          <div className="text-3xl font-extrabold text-rose-700 mt-2">29</div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Circumventing open tenders
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Avg Sub-Work Size
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            ₹47.6 L
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Clustered 95% near ₹50L cap
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Avg Time Window
          </div>
          <div className="text-3xl font-extrabold text-indigo-900 mt-2">
            24 Days
          </div>
          <div className="text-xs text-indigo-600 mt-1">
            Awarded in rapid proximity
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Cluster ID, MP ID, Syndicate..."
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterGfr("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterGfr === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Clusters ({clusters.length})
            </button>
            <button
              onClick={() => setFilterGfr("GFR_ONLY")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterGfr === "GFR_ONLY"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-600 hover:text-rose-800"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              GFR Evasions Only ({totalEvasions})
            </button>
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
        </div>
      </div>

      {/* Clusters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((cluster) => {
          const isEvasion = cluster.evades_gfr_threshold;
          return (
            <div
              key={cluster.cluster_id}
              className={`bg-white rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md ${
                isEvasion
                  ? "border-rose-200/80 hover:border-rose-300"
                  : "border-slate-200/80"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {cluster.cluster_id}
                    </span>
                    {isEvasion ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        GFR Limit Evasion
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Standard Split
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Category:{" "}
                    <strong className="text-slate-800">
                      {cluster.project_category}
                    </strong>{" "}
                    • Window:{" "}
                    <strong className="text-slate-800">
                      {cluster.timespan_days} days
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono">
                    ₹{(cluster.total_split_amount_inr / 100000).toFixed(1)} L
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Avg: ₹{(cluster.average_amount_inr / 100000).toFixed(1)} L /
                    work
                  </div>
                </div>
              </div>

              {/* Entity Breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Awarding MP
                  </div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {cluster.mp_id}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Beneficiary Entity
                  </div>
                  <div className="font-mono font-bold text-indigo-600 mt-0.5">
                    {cluster.effective_entity_id}
                  </div>
                </div>
              </div>

              {/* Member Projects List */}
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                  <span>
                    Fragmented Projects ({cluster.project_ids?.length || 0})
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    Click to inspect dossier
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.project_ids?.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => onSelectProject(pid)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-xs font-mono font-semibold text-slate-700 transition-all"
                    >
                      <span>{pid}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
