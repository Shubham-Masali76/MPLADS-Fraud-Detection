import React from "react";

export const LoadingSkeleton = ({ lines = 4, className = "" }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-9 bg-slate-100 rounded border border-slate-200/50 w-full"
        ></div>
      ))}
    </div>
  );
};
