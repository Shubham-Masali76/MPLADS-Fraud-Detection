import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react";

export const DistrictRiskChart = ({ data = [], onSelectDistrict = null }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              Constituency Risk Hotspots
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Top constituencies by syndicate & fraud concentration
            </p>
          </div>
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Top Vulnerabilities
          </span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {data.map((item, idx) => (
            <div
              key={item.district}
              className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition -mx-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-400 w-4">
                  0{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{item.district}</span>
                    {item.critical > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase">
                        CRITICAL CASE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.state} • {item.high} High-Risk Works
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-slate-900">
                  ₹{(item.total_funds / 10000000).toFixed(2)} Cr
                </div>
                <div className="text-[10px] text-slate-500">
                  Avg VPI:{" "}
                  <span className="font-bold text-red-600">{item.avg_vpi}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Cross-referenced with 100 MP Allocation files</span>
        <span className="text-navy-700 font-semibold flex items-center gap-0.5 cursor-pointer hover:underline">
          GIS Overlay Active
        </span>
      </div>
    </div>
  );
};
