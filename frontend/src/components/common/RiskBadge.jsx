import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

export const RiskBadge = ({ tier = "LOW", score = null, size = "md" }) => {
  const normalizedTier = (tier || "LOW").toUpperCase();

  const configs = {
    CRITICAL: {
      label: "Critical Risk",
      bg: "bg-rose-50 border-rose-200 text-rose-700",
      dot: "bg-rose-500",
      icon: ShieldAlert,
    },
    HIGH: {
      label: "High Risk",
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      dot: "bg-amber-500",
      icon: AlertTriangle,
    },
    MEDIUM: {
      label: "Medium Risk",
      bg: "bg-blue-50 border-blue-200 text-blue-700",
      dot: "bg-blue-500",
      icon: AlertCircle,
    },
    LOW: {
      label: "Low / Normal",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "bg-emerald-500",
      icon: CheckCircle,
    },
  };

  const config = configs[normalizedTier] || configs.LOW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm transition-all ${
        config.bg
      } ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} shrink-0 animate-pulse`}
      />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{config.label}</span>
      {score !== null && score !== undefined && (
        <span className="font-mono font-bold opacity-80 border-l border-current/20 pl-1.5 ml-0.5">
          {typeof score === "number" ? score.toFixed(1) : score}%
        </span>
      )}
    </span>
  );
};
