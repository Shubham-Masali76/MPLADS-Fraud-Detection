import React from "react";
import { BarChart3 } from "lucide-react";

export const RiskDistributionChart = ({ data = [], stats = null }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-navy-700" />
            Category Risk Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Concentration of High & Critical alerts across project categories
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
          N = 100,000 Works
        </span>
      </div>

      {/* Progress Bars for Categories */}
      <div className="mt-4 space-y-3.5">
        {data.map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {item.category}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-red-600 font-bold">
                  {item.high_risk} alerts
                </span>
                <span className="text-slate-400">
                  / {item.total.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(item.percentage * 2.5, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Risk Tier Overall Bar */}
      {stats && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Overall Portfolio Vigilance Distribution</span>
            <span className="font-mono text-slate-500">100% Monitored</span>
          </div>
          <div className="h-3.5 w-full rounded-md bg-slate-100 overflow-hidden flex p-0.5 gap-0.5 border border-slate-200">
            <div
              title={`Critical: ${stats.critical_priority_count}`}
              className="h-full bg-red-600 rounded-sm"
              style={{ width: "1%" }}
            />
            <div
              title={`High: ${stats.high_priority_count}`}
              className="h-full bg-orange-500 rounded-sm"
              style={{ width: "4%" }}
            />
            <div
              title={`Medium: ${stats.medium_priority_count}`}
              className="h-full bg-amber-400 rounded-sm"
              style={{ width: "45%" }}
            />
            <div
              title={`Low: ${stats.low_priority_count}`}
              className="h-full bg-emerald-500 rounded-sm"
              style={{ width: "50%" }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <span>Critical (1)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>High (660)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Medium (45.4k)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Low (53.9k)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
