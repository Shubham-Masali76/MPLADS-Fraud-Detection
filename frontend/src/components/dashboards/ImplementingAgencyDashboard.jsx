import React, { useState } from "react";
import { Briefcase, LogOut, CheckCircle, Camera, Building2 } from "lucide-react";

export function ImplementingAgencyDashboard({ onLogout }) {
  const [assigned, setAssigned] = useState(false);
  const [activeAgency, setActiveAgency] = useState("PWD");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md flex flex-col md:flex-row md:justify-between items-center gap-4 text-center md:text-left">
        <div className="flex items-center gap-4">
          <Briefcase className="text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">Implementing Agency Portal</h1>
          
          {/* Agency Switcher for Demo Purposes */}
          <div className="ml-4 flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
            <Building2 size={14} className="text-slate-400 mr-2" />
            <select 
              className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
              value={activeAgency}
              onChange={(e) => setActiveAgency(e.target.value)}
            >
              <option value="PWD" className="text-slate-900 bg-white">Public Works Dept (PWD)</option>
              <option value="WATER" className="text-slate-900 bg-white">Water Supply Dept</option>
              <option value="ZILLA" className="text-slate-900 bg-white">Zilla Parishad</option>
              <option value="RURAL" className="text-slate-900 bg-white">Rural Development</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0 items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tender & Execution Management</h2>
            <p className="text-slate-500 mt-1">
              Currently viewing sanctioned projects for: <strong className="text-slate-700">{activeAgency}</strong>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Mock Project for IA */}
          <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 md:gap-6">
            
            {/* Image Viewer */}
            <div className="w-full md:w-1/3">
              <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-48 relative group">
                <img 
                  src="/uploads/evidence_1.jpg" 
                  onError={(e) => { if (!e.target.src.includes('mock-evidence.jpg')) { e.target.src = '/mock-evidence.jpg'; } }}
                  alt="Site Evidence" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Day-0 Evidence
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 flex flex-col justify-center">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">Sanctioned</span>
                <span className="text-sm font-medium text-slate-500">ID: LIVE-1029</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {activeAgency === 'WATER' ? 'Construction of Solar Water Pump Facility' : 
                 activeAgency === 'PWD' ? 'Rural Road Macadamization (3km)' :
                 activeAgency === 'ZILLA' ? 'Primary School Boundary Wall' : 
                 'Community Hall Construction'}
              </h3>
              <p className="text-slate-600 text-sm mb-4">Location: Varanasi, Uttar Pradesh | Budget: ₹12,50,000</p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAssigned(true)}
                  disabled={assigned}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    assigned 
                      ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {assigned ? (
                    <><CheckCircle size={16} /> Tender Awarded (VEN-9942)</>
                  ) : (
                    "Award Tender to Contractor"
                  )}
                </button>
                <button className="flex-1 py-2 px-4 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} /> Assign Field Engineer
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
