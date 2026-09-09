import React from "react";
import { Users, Building2, Landmark, AlertTriangle } from "lucide-react";

export const SyndicateCard = ({ syndicate, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
        isSelected
          ? "bg-navy-900 text-white border-navy-700 shadow-md ring-2 ring-amber-400/40"
          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold tracking-tight">
          {syndicate.syndicate_id}
        </span>
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            isSelected
              ? "bg-red-500/30 text-red-200 border border-red-500/50"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {Number(syndicate.collusion_risk_score).toFixed(1)} Collusion Risk
        </span>
      </div>

      <div className="mt-2.5 space-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Landmark className="h-3.5 w-3.5 opacity-70" />
          <span className="font-mono">{syndicate.bank_account_id}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Users className="h-3.5 w-3.5 opacity-70" />
          <span>{syndicate.syndicate_size} Member Contractors</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center justify-between text-[11px] font-mono">
        <span>{syndicate.total_projects} Projects</span>
        <span className="font-bold">
          ₹{(syndicate.total_funds_inr / 10000000).toFixed(2)} Cr
        </span>
      </div>
    </div>
  );
};
