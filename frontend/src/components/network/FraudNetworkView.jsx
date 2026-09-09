import React, { useState, useEffect, useRef } from "react";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  ShieldAlert,
  Landmark,
  User,
  Building,
  CheckCircle,
} from "lucide-react";
import { SyndicateCard } from "./SyndicateCard";
import { RiskBadge } from "../common/RiskBadge";

export const FraudNetworkView = ({
  syndicates = [],
  graphData,
  onSelectProject,
}) => {
  const [selectedSyndicateId, setSelectedSyndicateId] = useState(
    syndicates[0]?.syndicate_id || "SYNDICATE_011",
  );
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const selectedSyndicate =
    syndicates.find((s) => s.syndicate_id === selectedSyndicateId) ||
    syndicates[0];

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Fixed SVG canvas dimensions
  const width = 640;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate coordinates for nodes dynamically around center bank account
  const positionedNodes = nodes.map((n, i) => {
    const data = n.data;
    let x = centerX;
    let y = centerY;

    if (data.type === "bank_account") {
      x = centerX;
      y = centerY;
    } else if (data.type === "mp") {
      x = centerX - 220;
      y = centerY - 120;
    } else if (data.type === "project") {
      x = centerX - 100;
      y = centerY - 120;
    } else if (data.type === "district") {
      x = centerX - 100;
      y = centerY - 200;
    } else if (data.is_ringleader) {
      x = centerX + 160;
      y = centerY - 80;
    } else {
      // Sister vendors distributed around
      const angle = (i * 2 * Math.PI) / (nodes.length - 2);
      x = centerX + 180 * Math.cos(angle);
      y = centerY + 140 * Math.sin(angle);
    }

    return { ...n, x, y };
  });

  const nodeMap = new Map(positionedNodes.map((n) => [n.data.id, n]));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Graph Network Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">
            Contractor Cartel & Collusion Topology
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Uncovers hidden relationships between shell contractors bidding on
            identical projects under shared bank accounts and centralized
            ringleaders.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 shrink-0 font-semibold">
          <span>100 Syndicates</span>
          <span className="text-slate-300">•</span>
          <span>1,000 Vendors</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Syndicates List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            <span>Detected Shell Syndicates</span>
            <span className="text-indigo-600 font-mono">100 Cartels</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {syndicates.map((s) => (
              <SyndicateCard
                key={s.syndicate_id}
                syndicate={s}
                isSelected={s.syndicate_id === selectedSyndicateId}
                onSelect={() => {
                  setSelectedSyndicateId(s.syndicate_id);
                  setSelectedNode(null);
                }}
              />
            ))}
          </div>
        </div>

        {/* Center & Right: Interactive Network Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Canvas Toolbar */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-900">
                  {selectedSyndicate?.syndicate_id} Graph Topology
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-xs">
                  Shared Account:{" "}
                  <strong className="font-mono text-slate-800">
                    {selectedSyndicate?.bank_account_id}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setSelectedNode(null);
                  }}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-4">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Edges */}
                <g stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3">
                  {edges.map((e) => {
                    const src = nodeMap.get(e.data.source);
                    const tgt = nodeMap.get(e.data.target);
                    if (!src || !tgt) return null;
                    return (
                      <line
                        key={e.data.id}
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={
                          e.data.label === "DEPOSITS_TO" ? "#E11D48" : "#475569"
                        }
                        strokeWidth={e.data.label === "DEPOSITS_TO" ? 2 : 1.5}
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                {positionedNodes.map((n) => {
                  const d = n.data;
                  const isSelected = selectedNode?.id === d.id;
                  const isBank = d.type === "bank_account";
                  const isRingleader = d.is_ringleader;

                  return (
                    <g
                      key={d.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      onClick={() => setSelectedNode(d)}
                      className="cursor-pointer group"
                    >
                      {/* Pulse circle for ringleader */}
                      {isRingleader && (
                        <circle
                          r="26"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="2"
                          className="animate-ping opacity-75"
                        />
                      )}

                      {/* Main node shape */}
                      {isBank ? (
                        <rect
                          x="-20"
                          y="-20"
                          width="40"
                          height="40"
                          rx="8"
                          fill="#065F46"
                          stroke={isSelected ? "#FBBF24" : "#34D399"}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all"
                        />
                      ) : (
                        <circle
                          r={isRingleader ? 22 : 16}
                          fill={
                            isRingleader
                              ? "#991B1B"
                              : d.type === "project"
                                ? "#EA580C"
                                : d.type === "mp"
                                  ? "#1E3A8A"
                                  : "#334155"
                          }
                          stroke={
                            isSelected
                              ? "#FBBF24"
                              : isRingleader
                                ? "#F87171"
                                : "#64748B"
                          }
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all"
                        />
                      )}

                      {/* Node Label */}
                      <text
                        y={isBank ? 32 : 28}
                        textAnchor="middle"
                        fill={isRingleader ? "#FCA5A5" : "#E2E8F0"}
                        fontSize={isRingleader ? "11" : "9"}
                        fontWeight={isRingleader ? "bold" : "normal"}
                        fontFamily="monospace"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Node Inspector Floating Badge */}
              {selectedNode && (
                <div className="absolute bottom-5 left-5 right-5 bg-slate-900/90 border border-slate-700/80 text-white p-4 rounded-2xl text-xs backdrop-blur-md shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {selectedNode.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {selectedNode.type}
                      </span>
                      {selectedNode.is_ringleader && (
                        <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                          PRIMARY CARTEL RINGLEADER
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs">
                      {selectedNode.label}
                    </p>
                  </div>

                  {selectedNode.type === "project" && (
                    <button
                      onClick={() => onSelectProject(selectedNode.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all shrink-0"
                    >
                      Open Dossier
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Canvas Legend */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-600 ring-2 ring-rose-400/40" />
                  <span className="font-medium text-slate-700">
                    Cartel Ringleader
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-md bg-emerald-700 ring-2 ring-emerald-400/40" />
                  <span className="font-medium text-slate-700">
                    Shared Bank Account
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-700 ring-2 ring-blue-400/40" />
                  <span className="font-medium text-slate-700">
                    Awarding MP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-orange-600 ring-2 ring-orange-400/40" />
                  <span className="font-medium text-slate-700">
                    Project Work
                  </span>
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                Adjacency Graph Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
