"use client";

import { useState, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

interface Agent {
  id: string;
  wallet_address: string;
  token_id: string;
  name: string;
  description: string;
  category: string;
  verified: boolean;
  has_erc8004_identity: boolean;
  has_x402: boolean;
  trust_score: number;
  transaction_count: number;
  total_revenue_usdc: number;
  avg_reputation: number;
  total_feedback: number;
  last_active_at: string;
  chain_id: number;
}

const CHAINS: Record<number, { label: string; color: string; border: string }> = {
  8453: { label: "Base", color: "text-[#4d8cff]", border: "border-[#0052ff]/30" },
  42161: { label: "Arbitrum", color: "text-[#28a0f0]", border: "border-[#28a0f0]/30" },
  1: { label: "Ethereum", color: "text-[#627eea]", border: "border-[#627eea]/30" },
};

const PAGE_SIZE = 50;

export default function ExplorePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("composite_score");
  const [filter, setFilter] = useState("both");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalAgents, setTotalAgents] = useState(0);
  const [view, setView] = useState<"cards" | "table">("cards");

  const fetchAgents = useCallback(async (pageNum = 0, append = false) => {
    setLoading(true);
    
    try {
      let fetched: Agent[] = [];
      let total = 0;
      
      // Use search endpoint if query is non-empty
      if (query.trim()) {
        const searchParams = new URLSearchParams();
        searchParams.set("q", query);
        searchParams.set("limit", String(PAGE_SIZE));
        searchParams.set("offset", String(pageNum * PAGE_SIZE));
        
        const res = await fetch(`/api/v1/search?${searchParams}`);
        const data = await res.json();
        fetched = data.agents || [];
        total = data.total || fetched.length;
      } else {
        // Use regular agents endpoint
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(pageNum * PAGE_SIZE));
        params.set("sort_by", sortBy);
        params.set("filter", filter);
        if (minScore > 0) params.set("min_trust_score", String(minScore));
        
        const res = await fetch(`/api/v1/agents?${params}`);
        const data = await res.json();
        fetched = data.agents || [];
        total = data.total || fetched.length;
      }
      
      setAgents(prev => append ? [...prev, ...fetched] : fetched);
      setHasMore(fetched.length === PAGE_SIZE);
      
      if (!append) {
        setTotalAgents(total);
      }
    } catch {
      if (!append) setAgents([]);
    }
    setLoading(false);
  }, [sortBy, filter, minScore, query]);

  useEffect(() => {
    setPage(0);
    fetchAgents(0);
  }, [sortBy, fetchAgents]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    fetchAgents(0);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchAgents(next, true);
  }

  function goToPage(p: number) {
    setPage(p);
    fetchAgents(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
  }

  function displayName(agent: Agent): string {
    const name = agent.name || '';
    
    // Sanitize raw URLs, data URIs, SVG, and long hex strings
    if (name.startsWith('http') || name.startsWith('data:') || name.startsWith('<svg') || 
        (name.startsWith('0x') && name.length > 20)) {
      return shortAddr(agent.wallet_address || agent.id);
    }
    
    if (name && !name.startsWith("Agent "))
      return name;
    if (agent.description && agent.description.length > 0 && !agent.description.startsWith("0x"))
      return agent.description.slice(0, 50);
    return `Agent #${agent.token_id}`;
  }

  const chain = (id: number) => CHAINS[id] || { label: `Chain ${id}`, color: "text-[#7a8194]", border: "border-[#1a1d24]" };
  const totalPages = Math.ceil(totalAgents / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed] overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/" className="font-bold flex items-center gap-2 text-sm shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-2 sm:gap-4 items-center text-xs min-w-0">
          <Link href="/analytics" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Analytics</Link>
          <Link href="/console" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Console</Link>
          <Link href="/docs" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Docs</Link>
          <Link href="/register" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Register</Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Explore Agents</h1>
            <p className="text-xs text-[#454b5a]">
              {totalAgents.toLocaleString()} agents indexed · Page {page + 1} of {totalPages || "…"}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setView("cards")}
              className={`px-2 py-1 text-xs ${view === "cards" ? "bg-[#00ff88] text-[#07080a]" : "border border-[#1a1d24] text-[#454b5a]"}`}>
              ▦ Cards
            </button>
            <button onClick={() => setView("table")}
              className={`px-2 py-1 text-xs ${view === "table" ? "bg-[#00ff88] text-[#07080a]" : "border border-[#1a1d24] text-[#454b5a]"}`}>
              ≡ Table
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, wallet…"
            className="flex-1 min-w-0 bg-[#111318] border border-[#1a1d24] px-3 sm:px-4 py-2.5 text-sm outline-none focus:border-[#00ff88]/30 font-mono"
          />
          <button type="submit" className="bg-[#00ff88] text-[#07080a] px-3 sm:px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.2)] shrink-0">
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 mb-6 items-center">
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); fetchAgents(0); }}
            className="bg-[#111318] border border-[#1a1d24] px-2 sm:px-3 py-1.5 text-xs text-[#7a8194] outline-none min-w-0">
            <option value="all">All ({totalAgents.toLocaleString()})</option>
            <option value="verified">ERC-8004</option>
            <option value="x402">x402</option>
            <option value="both">Verified + Active</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-[#111318] border border-[#1a1d24] px-2 sm:px-3 py-1.5 text-xs text-[#7a8194] outline-none min-w-0">
            <option value="composite_score">Best Ranked</option>
            <option value="reputation">Reputation</option>
            <option value="transactions">Transactions</option>
            <option value="volume">Volume</option>
            <option value="trust_score">Trust Score</option>
            <option value="recent">Most Recent</option>
          </select>
          <div className="col-span-2 flex items-center gap-2 text-xs text-[#454b5a]">
            <span className="shrink-0">Trust: {minScore}</span>
            <input type="range" min="0" max="100" value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
              onMouseUp={() => { setPage(0); fetchAgents(0); }}
              onTouchEnd={() => { setPage(0); fetchAgents(0); }}
              className="flex-1 h-1 bg-[#1a1d24] appearance-none cursor-pointer accent-[#00ff88]" />
          </div>
        </div>

        {/* Loading */}
        {loading && agents.length === 0 ? (
          <div className="text-center text-[#454b5a] py-20 text-sm">Loading agents…</div>
        ) : agents.length === 0 ? (
          <div className="text-center text-[#454b5a] py-20 text-sm">No agents found matching your criteria.</div>
        ) : view === "cards" ? (
          /* Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map(agent => {
              const c = chain(agent.chain_id);
              const name = displayName(agent);
              const desc = (agent.description && !agent.description.startsWith("0x"))
                ? agent.description.slice(0, 100)
                : "ERC-8004 verified agent";

              return (
                <div key={agent.id} className="bg-[#111318] border border-[#1a1d24] hover:border-[#00ff88]/20 transition-colors flex flex-col overflow-hidden">
                  {/* Card Header */}
                  <div className="p-3 sm:p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-[#0d0f12] border border-[#1a1d24] flex items-center justify-center text-xs font-bold text-[#00ff88] shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/agent/${encodeURIComponent(agent.id)}`}
                            className="text-sm font-bold hover:text-[#00ff88] transition-colors block truncate">
                            {name}
                          </Link>
                          <div className="text-[0.6rem] text-[#454b5a] font-mono truncate">{shortAddr(agent.wallet_address)}</div>
                        </div>
                      </div>
                      <span className={`text-[0.55rem] px-1.5 py-0.5 border ${c.border} ${c.color} uppercase tracking-wider shrink-0`}>
                        {c.label}
                      </span>
                    </div>
                    <p className="text-[0.7rem] text-[#7a8194] line-clamp-2 mb-3 leading-relaxed break-all">{desc}</p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                      <div className="bg-[#0d0f12] p-1.5 sm:p-2 text-center">
                        <div className="text-sm sm:text-lg font-bold text-[#00ff88]">{agent.trust_score}</div>
                        <div className="text-[0.4rem] sm:text-[0.5rem] text-[#454b5a] uppercase tracking-wider">Trust</div>
                      </div>
                      <div className="bg-[#0d0f12] p-1.5 sm:p-2 text-center">
                        <div className="text-sm sm:text-lg font-bold text-[#00d4ff]">{agent.avg_reputation || "—"}</div>
                        <div className="text-[0.4rem] sm:text-[0.5rem] text-[#454b5a] uppercase tracking-wider">Rep</div>
                      </div>
                      <div className="bg-[#0d0f12] p-1.5 sm:p-2 text-center overflow-hidden">
                        <div className="text-sm sm:text-lg font-bold text-[#e8eaed] truncate">{(agent.transaction_count || 0).toLocaleString()}</div>
                        <div className="text-[0.4rem] sm:text-[0.5rem] text-[#454b5a] uppercase tracking-wider">Txns</div>
                      </div>
                      <div className="bg-[#0d0f12] p-1.5 sm:p-2 text-center overflow-hidden">
                        <div className="text-sm sm:text-lg font-bold text-[#ffaa00] truncate">${(agent.total_revenue_usdc || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-[0.4rem] sm:text-[0.5rem] text-[#454b5a] uppercase tracking-wider">Earned</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {agent.has_erc8004_identity && (
                        <span className="text-[0.5rem] px-1.5 py-0.5 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider">ERC-8004</span>
                      )}
                      {agent.has_x402 && (
                        <span className="text-[0.5rem] px-1.5 py-0.5 border border-[#3b82f6]/20 text-[#3b82f6] uppercase tracking-wider">x402</span>
                      )}
                      {agent.category && !agent.category.startsWith("0x") && (
                        <span className="text-[0.5rem] px-1.5 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">{agent.category}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="grid grid-cols-4 border-t border-[#1a1d24]">
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=overview`}
                      className="py-2 text-center text-[0.5rem] sm:text-[0.6rem] uppercase tracking-wider text-[#7a8194] hover:text-[#00ff88] hover:bg-[#0d0f12] transition-colors border-r border-[#1a1d24]">
                      <span className="hidden sm:inline">💬 </span>Chat
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=x402`}
                      className="py-2 text-center text-[0.5rem] sm:text-[0.6rem] uppercase tracking-wider text-[#7a8194] hover:text-[#00d4ff] hover:bg-[#0d0f12] transition-colors border-r border-[#1a1d24]">
                      <span className="hidden sm:inline">🧪 </span>Test
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=payments`}
                      className="py-2 text-center text-[0.5rem] sm:text-[0.6rem] uppercase tracking-wider text-[#7a8194] hover:text-[#ffaa00] hover:bg-[#0d0f12] transition-colors border-r border-[#1a1d24]">
                      <span className="hidden sm:inline">📊 </span>Stats
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=reputation`}
                      className="py-2 text-center text-[0.5rem] sm:text-[0.6rem] uppercase tracking-wider text-[#7a8194] hover:text-[#a855f7] hover:bg-[#0d0f12] transition-colors">
                      <span className="hidden sm:inline">🤝 </span>Rep
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View — hidden on mobile, fallback to cards */
          <div className="hidden sm:grid gap-[1px] bg-[#1a1d24] border border-[#1a1d24]">
            <div className="bg-[#0d0f12] px-5 py-2 grid grid-cols-12 gap-4 text-[0.55rem] uppercase tracking-widest text-[#454b5a]">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Agent</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-1 text-center">Chain</div>
              <div className="col-span-1 text-right">Trust</div>
              <div className="col-span-1 text-right">Rep</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            {agents.map(agent => {
              const c = chain(agent.chain_id);
              return (
                <div key={agent.id} className="bg-[#111318] px-5 py-2.5 hover:bg-[#0d0f12] grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 text-xs text-[#454b5a] font-mono">#{agent.token_id}</div>
                  <div className="col-span-3">
                    <Link href={`/agent/${encodeURIComponent(agent.id)}`} className="flex items-center gap-2 hover:text-[#00ff88]">
                      <span className="font-bold text-sm truncate">{displayName(agent)}</span>
                      {agent.has_erc8004_identity && (
                        <span className="text-[0.5rem] px-1 py-0.5 border border-[#00ff88]/20 text-[#00ff88] shrink-0">8004</span>
                      )}
                      {agent.has_x402 && (
                        <span className="text-[0.5rem] px-1 py-0.5 border border-[#3b82f6]/20 text-[#3b82f6] shrink-0">x402</span>
                      )}
                    </Link>
                  </div>
                  <div className="col-span-2 text-xs text-[#7a8194] font-mono">{shortAddr(agent.wallet_address)}</div>
                  <div className="col-span-1 text-center">
                    <span className={`text-[0.55rem] px-1.5 py-0.5 border ${c.border} ${c.color} uppercase tracking-wider`}>{c.label}</span>
                  </div>
                  <div className="col-span-1 text-right text-sm font-bold text-[#00ff88]">{agent.trust_score}</div>
                  <div className="col-span-1 text-right text-sm font-bold text-[#00d4ff]">{agent.avg_reputation || "—"}</div>
                  <div className="col-span-3 text-right flex gap-1 justify-end">
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=overview`}
                      className="px-2 py-1 text-[0.55rem] border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]/30 hover:text-[#00ff88]">
                      💬
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=x402`}
                      className="px-2 py-1 text-[0.55rem] border border-[#1a1d24] text-[#7a8194] hover:border-[#00d4ff]/30 hover:text-[#00d4ff]">
                      🧪
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=payments`}
                      className="px-2 py-1 text-[0.55rem] border border-[#1a1d24] text-[#7a8194] hover:border-[#ffaa00]/30 hover:text-[#ffaa00]">
                      📊
                    </Link>
                    <Link href={`/agent/${encodeURIComponent(agent.id)}?tab=reputation`}
                      className="px-2 py-1 text-[0.55rem] border border-[#1a1d24] text-[#7a8194] hover:border-[#a855f7]/30 hover:text-[#a855f7]">
                      🤝
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-1">
            <button onClick={() => goToPage(0)} disabled={page === 0}
              className="px-2 sm:px-3 py-1.5 text-xs border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]/30 disabled:opacity-30 disabled:cursor-not-allowed">
              «
            </button>
            <button onClick={() => goToPage(page - 1)} disabled={page === 0}
              className="px-2 sm:px-3 py-1.5 text-xs border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]/30 disabled:opacity-30 disabled:cursor-not-allowed">
              ‹ Prev
            </button>
          </div>

          <div className="flex gap-1">
            {/* Page number buttons — fewer on mobile */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const maxVisible = 5;
              let p: number;
              if (totalPages <= maxVisible) {
                p = i;
              } else if (page < 3) {
                p = i;
              } else if (page > totalPages - 3) {
                p = totalPages - maxVisible + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button key={p} onClick={() => goToPage(p)}
                  className={`px-2 sm:px-3 py-1.5 text-xs border ${p === page ? "border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10" : "border-[#1a1d24] text-[#454b5a] hover:border-[#00ff88]/30"}`}>
                  {p + 1}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1">
            <button onClick={() => goToPage(page + 1)} disabled={!hasMore}
              className="px-2 sm:px-3 py-1.5 text-xs border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]/30 disabled:opacity-30 disabled:cursor-not-allowed">
              Next ›
            </button>
            <button onClick={() => goToPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="px-2 sm:px-3 py-1.5 text-xs border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]/30 disabled:opacity-30 disabled:cursor-not-allowed">
              »
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
