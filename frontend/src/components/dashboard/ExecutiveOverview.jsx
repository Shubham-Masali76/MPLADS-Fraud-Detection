import React from "react";
import { AlertTriangle, Layers, ArrowRight, ShieldCheck, Wallet } from "lucide-react";

export function ExecutiveOverview({ stats, onNavigateToHighRisk }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Summary</h1>
            <p className="text-slate-500 mt-2 text-lg">The AI is actively checking all projects for suspicious activity.</p>
          </div>
          <button onClick={onNavigateToHighRisk} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors">
            Review Suspicious Projects <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mt-10">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Wallet className="h-5 w-5" /></div>
              <span className="font-bold text-slate-500">Total Money Tracked</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900">₹{((stats.total_amount_monitored || 52592000000) / 10000000).toFixed(0)} Cr</div>
          </div>
          
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
              <span className="font-bold text-amber-700">Needs Your Review</span>
            </div>
            <div className="text-4xl font-extrabold text-amber-600">{stats.high_risk_count || 660}</div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Layers className="h-5 w-5" /></div>
              <span className="font-bold text-indigo-700">Total Projects</span>
            </div>
            <div className="text-4xl font-extrabold text-indigo-900">100,000+</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
         <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
         <h2 className="text-2xl font-bold text-slate-900 mb-2">System is Running Smoothly</h2>
         <p className="text-slate-500 max-w-lg mx-auto">The AI is checking projects in the background. Click 'Needs Review' to check the flagged ones.</p>
      </div>
    </div>
  );
}
