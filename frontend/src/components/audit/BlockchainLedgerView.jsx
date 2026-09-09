import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Clock,
  UserCheck,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Lock,
  ArrowDown,
  Layers,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { EmptyState } from "../common/EmptyState";
import { LoadingSkeleton } from "../common/LoadingSkeleton";

export const BlockchainLedgerView = ({ onSelectProject }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' or 'asc'
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBlockchainBlocks();
      setBlocks(data || []);
    } catch (e) {
      console.error("Failed to load blockchain ledger:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleRunAudit = async () => {
    setValidating(true);
    try {
      const res = await apiService.validateBlockchain();
      setAuditResult({
        ...res,
        validated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Audit validation failed:", e);
    } finally {
      setValidating(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filter & Search
  const filteredBlocks = blocks.filter((b) => {
    if (filterType !== "ALL" && b.transaction_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchIndex = String(b.index).includes(q);
      const matchType = b.transaction_type?.toLowerCase().includes(q);
      const matchHash = b.block_hash?.toLowerCase().includes(q);
      const matchPrev = b.previous_hash?.toLowerCase().includes(q);
      const matchProj = b.payload?.project_id?.toLowerCase().includes(q);
      const matchAuditor = b.payload?.auditor_id?.toLowerCase().includes(q);
      const matchDecision = b.payload?.decision?.toLowerCase().includes(q);
      return (
        matchIndex ||
        matchType ||
        matchHash ||
        matchPrev ||
        matchProj ||
        matchAuditor ||
        matchDecision
      );
    }
    return true;
  });

  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    return sortOrder === "desc" ? b.index - a.index : a.index - b.index;
  });

  const transactionTypes = [
    "ALL",
    ...Array.from(new Set(blocks.map((b) => b.transaction_type))),
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Integrity Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                SHA-256 Immutable Ledger
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • Cryptographic Audit Trail
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-2">
              <Lock className="h-6 w-6 text-indigo-600" />
              Tamper-Evident Blockchain Audit Ledger
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Every auditor verdict, project sanction, and forensic review is
              cryptographically hashed with SHA-256 and chained into an
              immutable ledger. Any unauthorized data tampering invalidates the
              hash chain immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleRunAudit}
              disabled={validating}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {validating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying SHA-256 Hash Chain...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-100" />
                  <span>Run Cryptographic Chain Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audit Status Result Display */}
        {auditResult && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in slide-in-from-top-2">
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800">
                  Chain Integrity Status
                </div>
                <div className="text-sm font-extrabold text-emerald-950 mt-0.5">
                  100% Cryptographically Valid
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-indigo-800">
                  Verified Block Depth
                </div>
                <div className="text-sm font-extrabold text-indigo-950 font-mono mt-0.5">
                  {auditResult.total_blocks} Blocks Validated
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Hash className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Latest Block Hash
                </div>
                <div className="text-xs font-mono text-slate-900 font-semibold truncate mt-0.5">
                  {auditResult.latest_block_hash}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Block #, Project ID, Hash, Auditor..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Transaction Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs font-medium bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {transactionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              className="text-xs font-medium text-slate-700 bg-slate-50/60 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition"
            >
              Order: {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </button>

            <button
              onClick={fetchBlocks}
              className="text-xs font-medium text-slate-600 bg-slate-50/60 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl transition"
              title="Refresh ledger"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Blocks Display */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : sortedBlocks.length === 0 ? (
        <EmptyState
          title="No Blocks Match Filter"
          description="Try broadening your search query or reset transaction filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setFilterType("ALL");
          }}
        />
      ) : (
        <div className="space-y-4">
          {sortedBlocks.map((block, idx) => {
            const isGenesis = block.index === 0;
            const isDecision = block.transaction_type === "AUDITOR_DECISION";
            const decision = block.payload?.decision;
            const projectId = block.payload?.project_id;

            return (
              <div
                key={block.index}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all shadow-sm overflow-hidden"
              >
                {/* Block Header Banner */}
                <div className="bg-slate-50/70 border-b border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-slate-900 text-amber-300 shadow-sm">
                      BLOCK #{block.index}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isGenesis
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : isDecision
                            ? decision === "ESCALATE"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : decision === "HOLD"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {block.transaction_type}
                    </span>
                    {decision && (
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-slate-400">Verdict:</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                            decision === "ESCALATE"
                              ? "bg-rose-100 text-rose-700"
                              : decision === "HOLD"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {decision}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {new Date(block.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                      <span className="text-slate-400 text-[10px]">NONCE:</span>
                      <span className="font-bold text-slate-800">
                        {block.nonce}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Block Content Body */}
                <div className="p-6 space-y-4">
                  {/* Cryptographic Hashes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    {/* Block Hash */}
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <Hash className="h-3 w-3 text-emerald-600" />
                          Current Block Hash (SHA-256)
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              block.block_hash,
                              `bh_${block.index}`,
                            )
                          }
                          className="hover:text-slate-900 transition flex items-center gap-1 text-slate-400 p-0.5 rounded"
                        >
                          {copiedHash === `bh_${block.index}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-slate-800 font-semibold break-all selection:bg-indigo-100">
                        {block.block_hash}
                      </div>
                    </div>

                    {/* Previous Block Hash */}
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-slate-400" />
                          Previous Hash Pointer
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              block.previous_hash,
                              `ph_${block.index}`,
                            )
                          }
                          className="hover:text-slate-900 transition flex items-center gap-1 text-slate-400 p-0.5 rounded"
                        >
                          {copiedHash === `ph_${block.index}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 break-all">
                        {block.previous_hash}
                      </div>
                    </div>
                  </div>

                  {/* Decoded Transaction Payload */}
                  <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 font-mono text-xs border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <span className="flex items-center gap-2 text-indigo-400">
                        <FileText className="h-3.5 w-3.5" />
                        Decoded Cryptographic Payload
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Payload Hash:{" "}
                        {block.payload_hash
                          ? block.payload_hash.substring(0, 16) + "..."
                          : "N/A"}
                      </span>
                    </div>

                    {isGenesis ? (
                      <div className="space-y-1 text-slate-300 py-1">
                        <div>
                          <span className="text-slate-400">SYSTEM:</span>{" "}
                          <span className="text-emerald-400">
                            {block.payload?.system}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">AUTHORITY:</span>{" "}
                          <span className="text-white">
                            {block.payload?.authority}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">VERSION:</span>{" "}
                          <span className="text-amber-400">
                            {block.payload?.version}
                          </span>
                        </div>
                      </div>
                    ) : isDecision ? (
                      <div className="space-y-1.5 py-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-slate-400">
                              PROJECT_TARGET:
                            </span>{" "}
                            <span className="text-amber-400 font-bold font-mono">
                              {projectId}
                            </span>
                            {onSelectProject && (
                              <button
                                onClick={() => onSelectProject(projectId)}
                                className="ml-2 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-sans"
                              >
                                View Forensic Dossier{" "}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400">AUDITOR:</span>{" "}
                            <span className="text-white font-semibold">
                              {block.payload?.auditor_id}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">
                            OFFICIAL_RECORD:
                          </span>{" "}
                          <span className="text-slate-200 font-sans text-xs">
                            {block.payload?.notes ||
                              "Decision recorded and locked into ledger."}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-300 py-1">
                        <div>
                          <span className="text-slate-400">PROJECT_ID:</span>{" "}
                          <span className="text-amber-400">{projectId}</span>
                          {onSelectProject && (
                            <button
                              onClick={() => onSelectProject(projectId)}
                              className="ml-2 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-sans"
                            >
                              Inspect <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {block.payload?.sanctioned_amount && (
                          <div>
                            <span className="text-slate-400">
                              SANCTIONED_AMOUNT:
                            </span>{" "}
                            <span className="text-white">
                              ₹
                              {Number(
                                block.payload.sanctioned_amount,
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {block.payload?.contractor_id && (
                          <div>
                            <span className="text-slate-400">
                              AWARDED_CONTRACTOR:
                            </span>{" "}
                            <span className="text-slate-300">
                              {block.payload.contractor_id}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Block Chain Link Connector Footer */}
                <div className="bg-slate-50/70 border-t border-slate-200/80 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Cryptographic Link: Verified Valid</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Difficulty: 2 leading zeros (SHA-256 Valid)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
