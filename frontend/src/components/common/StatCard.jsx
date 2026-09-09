import React from "react";

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = false,
  variant = "default",
  badgeText = null,
}) => {
  const borderVariants = {
    default: "border-slate-200 hover:border-slate-300",
    critical: "border-red-300 bg-gradient-to-br from-white to-red-50/40",
    high: "border-orange-200 bg-gradient-to-br from-white to-orange-50/40",
    medium: "border-amber-200 bg-gradient-to-br from-white to-amber-50/40",
    low: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40",
    navy: "border-navy-700 bg-navy-900 text-white",
  };

  const iconColors = {
    default: "bg-slate-100 text-slate-700",
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
    navy: "bg-navy-800 text-amber-400",
  };

  const isNavy = variant === "navy";

  return (
    <div
      className={`rounded-xl border p-5 transition-all shadow-sm ${borderVariants[variant] || borderVariants.default}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isNavy ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              iconColors[variant] || iconColors.default
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`font-mono text-2xl font-bold tracking-tight ${
            isNavy ? "text-white" : "text-slate-900"
          }`}
        >
          {value}
        </span>
        {badgeText && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && (
            <span className={isNavy ? "text-slate-400" : "text-slate-500"}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
