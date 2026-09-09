import React from "react";
import { MapPin, AlertCircle, ArrowUpRight } from "lucide-react";

export const DistrictRiskChart = ({ data = [], onSelectDistrict = null }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-600" />
              Constituency Risk Hotspots
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Top parliamentary constituencies ranked by fraud severity & funds
              exposed
            </p>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            6 Priority Hubs
          </span>
        </div>

        <div className="mt-5 space-y-2">
          {data.map((item, idx) => (
            <div
              key={item.district}
              className="p-3 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <span className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  #{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{item.district}</span>
                    {item.critical > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                        Critical Case
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.state} •{" "}
                    <span className="font-semibold text-slate-700">
                      {item.high} High-Risk Works
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-extrabold text-slate-900">
                  ₹{(item.total_funds / 10000000).toFixed(2)} Cr
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Risk Score:{" "}
                  <span className="font-bold text-rose-600 font-sans">
                    {item.avg_vpi}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Cross-verified against 100 MP Allocation Datasets
        </span>
        <span className="text-indigo-600 font-bold hover:underline cursor-pointer">
          View Map Analysis →
        </span>
      </div>
    </div>
  );
};
