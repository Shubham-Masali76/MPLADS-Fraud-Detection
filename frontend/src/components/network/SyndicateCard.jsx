import React from "react";
import { Users, Building2, Landmark, AlertTriangle } from "lucide-react";

export const SyndicateCard = ({ syndicate, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? "bg-indigo-50/70 border-indigo-400/80 text-slate-900 shadow-sm ring-2 ring-indigo-500/20"
          : "bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-800 shadow-sm hover:shadow-md hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-slate-900">
          {syndicate.syndicate_id}
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
          {Number(syndicate.collusion_risk_score).toFixed(1)} Risk
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Landmark className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-slate-700 text-[11px]">
            {syndicate.bank_account_id}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">
            {syndicate.syndicate_size} Member Contractors
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 text-[11px]">
          {syndicate.total_projects} Projects
        </span>
        <span className="font-bold text-slate-900">
          ₹{(syndicate.total_funds_inr / 10000000).toFixed(2)} Cr
        </span>
      </div>
    </div>
  );
};
