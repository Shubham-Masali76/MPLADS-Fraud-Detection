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
  onClick = null,
}) => {
  const variantStyles = {
    default: {
      card: "bg-white border-slate-200/80 hover:border-slate-300",
      iconBg: "bg-slate-100 text-slate-700",
      badge: "bg-slate-100 text-slate-700",
    },
    critical: {
      card: "bg-white border-rose-200 hover:border-rose-300 shadow-rose-500/5",
      iconBg: "bg-rose-50 text-rose-600 ring-4 ring-rose-50/50",
      badge: "bg-rose-50 text-rose-700 border border-rose-200",
    },
    high: {
      card: "bg-white border-amber-200 hover:border-amber-300 shadow-amber-500/5",
      iconBg: "bg-amber-50 text-amber-600 ring-4 ring-amber-50/50",
      badge: "bg-amber-50 text-amber-800 border border-amber-200",
    },
    medium: {
      card: "bg-white border-purple-200 hover:border-purple-300 shadow-purple-500/5",
      iconBg: "bg-purple-50 text-purple-600 ring-4 ring-purple-50/50",
      badge: "bg-purple-50 text-purple-700 border border-purple-200",
    },
    navy: {
      card: "bg-white border-indigo-200 hover:border-indigo-300 shadow-indigo-500/5",
      iconBg: "bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50",
      badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-6 transition-all duration-200 shadow-xs hover:shadow-md ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      } ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 hover:scale-105 ${style.iconBg}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-medium">{subtitle}</span>
        {badgeText && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.badge}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
