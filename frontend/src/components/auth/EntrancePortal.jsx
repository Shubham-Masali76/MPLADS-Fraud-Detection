import React from "react";
import {
  ShieldCheck,
  HardHat,
  ArrowRight,
  Activity,
  Landmark,
  Building2,
  MapPin,
} from "lucide-react";

export function EntrancePortal({ onSelectRole }) {
  const roles = [
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
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 shadow-xl mb-4">
            <Activity className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            MPLADS System Portal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select your authorized role to enter the system.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl p-6 flex flex-col group w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[320px] ${role.color}`}
            >
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${role.iconBg}`}
              >
                {role.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {role.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed flex-grow mb-6">
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
