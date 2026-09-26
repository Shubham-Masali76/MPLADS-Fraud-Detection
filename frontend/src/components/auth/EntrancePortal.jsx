import React from "react";
import {
  ShieldCheck,
  HardHat,
  ArrowRight,
  Activity,
  IndianRupee,
  Landmark,
  Building2,
  MapPin,
  Settings
} from "lucide-react";

export function EntrancePortal({ onSelectRole }) {
  const roles = [
    {
      id: "mospi",
      title: "Ministry (MoSPI)",
      description: "Manage national funds, trigger election freezes, and oversee MPLADS.",
      icon: <Settings className="h-8 w-8 text-fuchsia-600" />,
      color: "border-slate-200 hover:border-fuchsia-500",
      iconBg: "bg-fuchsia-100",
      buttonColor: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
    },
    {
      id: "mp",
      title: "Member of Parliament",
      description: "View your project funds and suggest new development work.",
      icon: <Landmark className="h-8 w-8 text-blue-600" />,
      color: "border-slate-200 hover:border-blue-500",
      iconBg: "bg-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      id: "district_authority",
      title: "District Authority (DC)",
      description: "Approve projects and release funds to contractors.",
      icon: <Building2 className="h-8 w-8 text-emerald-600" />,
      color: "border-slate-200 hover:border-emerald-500",
      iconBg: "bg-emerald-100",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    {
      id: "implementing_agency",
      title: "Implementing Agency",
      description: "Execute physical work and release contractor installments.",
      icon: <Building2 className="h-8 w-8 text-orange-600" />,
      color: "border-slate-200 hover:border-orange-500",
      iconBg: "bg-orange-100",
      buttonColor: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    {
      id: "field_engineer",
      title: "Field Engineer (JE)",
      description:
        "Visit physical sites to lock Day-0 Baseline Geofence locations.",
      icon: <MapPin className="h-8 w-8 text-cyan-600" />,
      color: "border-slate-200 hover:border-cyan-500",
      iconBg: "bg-cyan-100",
      buttonColor: "bg-cyan-600 hover:bg-cyan-700 text-white",
    },
    {
      id: "contractor",
      title: "Contractor",
      description:
        "View your assigned work and upload progress photos to get paid.",
      icon: <HardHat className="h-8 w-8 text-amber-600" />,
      color: "border-slate-200 hover:border-amber-500",
      iconBg: "bg-amber-100",
      buttonColor: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    {
      id: "auditor",
      title: "Fraud Auditor",
      description:
        "Review flagged projects, detect fake photos, and prevent fraud.",
      icon: <ShieldCheck className="h-8 w-8 text-indigo-600" />,
      color: "border-slate-200 hover:border-indigo-500",
      iconBg: "bg-indigo-100",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl mb-4 border-2 border-indigo-500 ring-4 ring-indigo-50">
            <Landmark className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            MPLADS System Portal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select your authorized role to enter the system.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl p-5 flex flex-col group w-full md:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] max-w-full md:max-w-[280px] ${role.color}`}
            >
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-3 ${role.iconBg}`}
              >
                {role.icon}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {role.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed flex-grow mb-4">
                {role.description}
              </p>
              <button
                onClick={() => onSelectRole(role.id)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${role.buttonColor}`}
              >
                Access Portal
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
