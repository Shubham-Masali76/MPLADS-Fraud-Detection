import React from "react";

export const RiskBadge = ({ tier = "LOW", score = null, size = "md" }) => {
  const t = (tier || "LOW").toUpperCase();

  const styles = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200 ring-red-600/10",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10",
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10",
  };

  const dotColors = {
    CRITICAL: "bg-red-500 animate-pulse",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-emerald-500",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  const activeStyle = styles[t] || styles.LOW;
  const dotColor = dotColors[t] || dotColors.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ring-1 ring-inset ${activeStyle} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{t}</span>
      {score !== null && (
        <span className="font-mono font-bold opacity-90 border-l border-current/20 pl-1.5 ml-0.5">
          {Number(score).toFixed(1)}
        </span>
      )}
    </span>
  );
};
