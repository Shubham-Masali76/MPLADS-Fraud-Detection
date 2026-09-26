import React, { useState } from "react";
import { LogOut, Truck, FileText, CreditCard } from "lucide-react";

export function MaterialVendorDashboard({ projects = [], onLogout }) {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-slate-50 font-sans">
      <div className="w-full md:w-64 md:h-screen md:shrink-0 overflow-y-auto bg-slate-900 text-white flex flex-col">
        <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-orange-500 p-2 rounded-lg"><Truck className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="font-bold text-sm">Supplier Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono">ID: SUP-1102</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div onClick={() => setActiveTab("invoices")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "invoices" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <FileText className="h-4 w-4" /><span className="text-sm font-medium">My Invoices</span>
          </div>
          <div onClick={() => setActiveTab("payments")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${activeTab === "payments" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <CreditCard className="h-4 w-4" /><span className="text-sm font-medium">Bank Clearances</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-3 py-2">
            <LogOut className="h-4 w-4" /><span className="text-sm font-medium">Secure Logout</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8">
          <h2 className="text-lg font-bold text-slate-800">{activeTab === "invoices" ? "Submitted Invoices" : "Payment Ledger"}</h2>
        </header>
        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left">
              <h3 className="font-bold text-slate-800">Active Material Orders</h3>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New Invoice</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
              {projects.slice(10, 20).map(p => (
                <div key={p.project_id} className="p-4 flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900">Materials for {p.work_category}</div>
                    <div className="text-sm text-slate-500">Contractor: {p.executing_agency}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{(p.sanctioned_amount * 0.4 / 100000).toFixed(2)} Lakhs</div>
                    <div className="text-xs text-amber-600 font-medium">Pending Clearance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
