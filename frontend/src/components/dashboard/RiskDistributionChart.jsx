import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";

export const RiskDistributionChart = ({ data = [], stats = null }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Category Risk Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Concentration of high & critical fraud alerts across project
              sectors
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
            100,000 Works
          </span>
        </div>

        {/* Progress Bars for Categories */}
        <div className="mt-6 space-y-4">
          {data.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-extrabold font-mono">
                    {item.high_risk} alerts
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    / {item.total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.percentage * 2.5, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Tier Overall Bar */}
      {stats && (
        <div className="mt-8 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Overall Portfolio Safety Breakdown</span>
            <span className="text-indigo-600 font-mono">100% Calibrated</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/60">
            <div
              title={`Critical: ${stats.critical_priority_count}`}
              className="h-full bg-rose-600 rounded-full"
              style={{ width: "1%" }}
            />
            <div
              title={`High: ${stats.high_priority_count}`}
              className="h-full bg-amber-500 rounded-full"
              style={{ width: "4%" }}
            />
            <div
              title={`Medium: ${stats.medium_priority_count}`}
              className="h-full bg-blue-400 rounded-full"
              style={{ width: "45%" }}
            />
            <div
              title={`Low: ${stats.low_priority_count}`}
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: "50%" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span>Critical (1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>High (660)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span>Medium (45.4k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Low (53.9k)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
