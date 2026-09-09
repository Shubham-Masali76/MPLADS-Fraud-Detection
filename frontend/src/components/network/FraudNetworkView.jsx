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
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 to-slate-900 text-white rounded-xl p-5 border border-navy-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Fraud Network & Cartel Topology Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Exposes multi-contractor collusion rings operating under identical
            bank accounts. Identifies puppet-masters and sister paper bidders
            across 13 states.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-navy-900 px-3 py-1.5 rounded-lg border border-navy-700 text-purple-300">
          <span>100 Syndicates Profiled</span>
          <span>•</span>
          <span>1,000 Connected Vendors</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Syndicates List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Detected Shell Syndicates</span>
            <span className="text-navy-900 font-mono">100 Cartels</span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
            {/* Canvas Toolbar */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-navy-900">
                  {selectedSyndicate?.syndicate_id} Graph Topology
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 text-[11px]">
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
                <div className="absolute bottom-4 left-4 right-4 bg-navy-900/95 border border-navy-700 text-white p-3.5 rounded-xl text-xs backdrop-blur-sm shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {selectedNode.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-navy-800 border border-navy-700 text-slate-300">
                        {selectedNode.type}
                      </span>
                      {selectedNode.is_ringleader && (
                        <span className="text-[9px] uppercase font-mono font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                          PRIMARY CARTEL RINGLEADER
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {selectedNode.label}
                    </p>
                  </div>

                  {selectedNode.type === "project" && (
                    <button
                      onClick={() => onSelectProject(selectedNode.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition"
                    >
                      Open Dossier
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Canvas Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-700 border border-red-500" />
                  <span>Cartel Ringleader</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-800 border border-emerald-400" />
                  <span>Shared Bank Account</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-blue-900 border border-blue-600" />
                  <span>Awarding MP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-orange-600 border border-orange-400" />
                  <span>Project Work</span>
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[10px]">
                Adjacency Graph Layer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
