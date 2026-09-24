import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Database,
  FileText,
  Search,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { apiService } from "../../services/apiService";

export function BlockchainLedgerView({ onSelectProject }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLedger() {
      try {
        const data = await apiService.getBlockchainBlocks();
        if (data && Array.isArray(data)) {
          // Sort newest first
          const sorted = [...data].sort((a, b) => b.index - a.index);
          setLedger(sorted);
        } else if (data && data.chain) {
          const sorted = [...data.chain].sort((a, b) => b.index - a.index);
          setLedger(sorted);
        }
      } catch (err) {
        console.error("Failed to load ledger", err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading audit log...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
              <ShieldCheck className="h-4 w-4" /> Secure System
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Audit Log
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              A secure, permanent record of all decisions made.
            </p>
          </div>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <Lock className="h-4 w-4" /> Verify Security
          </button>
        </div>

        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Status</div>
              <div className="text-xs text-slate-500">All Good</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Total Records
              </div>
              <div className="text-xs text-slate-500">
                {ledger.length} Blocks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger List */}
      <div className="space-y-4">
        {ledger.map((block) => {
          const isGenesis = block.index === 0;
          let verdictColor = "bg-slate-100 text-slate-700";
          if (block.payload.decision === "APPROVE")
            verdictColor = "bg-emerald-100 text-emerald-800";
          if (
            block.payload.decision === "ESCALATE" ||
            block.payload.decision === "REJECT"
          )
            verdictColor = "bg-rose-100 text-rose-800";

          return (
            <div
              key={block.index}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Block Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-slate-400">
                    #{block.index}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${verdictColor}`}
                  >
                    {isGenesis
                      ? "System Init"
                      : block.payload.action ||
                        block.transaction_type ||
                        "Audit Decision"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Clock className="h-4 w-4" />
                  {new Date(
                    typeof block.timestamp === "number"
                      ? block.timestamp * 1000
                      : block.timestamp,
                  ).toLocaleString()}
                </div>
              </div>

              {/* Block Content */}
              <div className="p-6">
                {!isGenesis ? (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-900">
                          Target Project:
                        </span>
                        <button
                          onClick={() =>
                            onSelectProject(block.payload.project_id)
                          }
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          {block.payload.project_id}
                        </button>
                      </div>
                      <p className="text-slate-600 text-sm">
                        <span className="font-semibold">Auditor Notes:</span>{" "}
                        {block.payload.notes}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Verdict
                      </span>
                      <div className="font-bold text-slate-900">
                        {block.payload.decision}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 text-sm">
                    {block.payload.message || "Genesis Block Created"}
                  </div>
                )}
              </div>

              {/* Minimal Hash Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Hash:
                  <span className="text-slate-600">
                    {(block.block_hash || block.hash || "").substring(0, 16)}...
                  </span>
                </div>
                {block.previous_hash && block.previous_hash !== "0" && (
                  <div className="text-slate-300">
                    Prev: {block.previous_hash.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
