"use client";

import { useState, useEffect } from "react";
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
  trust_score: number;
  transaction_count: number;
  total_revenue_usdc: number;
  avg_reputation: number;
  total_feedback: number;
  last_active_at: string;
  chain_id: number;
}

const CATEGORIES = ["All", "Oracle", "Trading", "Data", "Analytics", "Automation", "ML", "Social", "Unknown"];
const CHAINS: Record<number, string> = { 8453: "Base", 42161: "Arbitrum", 1: "Ethereum", 10: "Optimism", 137: "Polygon" };

export default function ExplorePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("trust_score");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, [sortBy]);

  async function fetchAgents() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("sort_by", sortBy);
    if (minScore > 0) params.set("min_trust_score", String(minScore));
    if (query) params.set("search", query);

    try {
      const res = await fetch(`/api/v1/agents?${params}`);
      const data = await res.json();
      let filtered = data.agents || [];

      // Client-side category filter
      if (category !== "All") {
        const cat = category.toLowerCase();
        filtered = filtered.filter((a: Agent) => 
          (a.category || "").toLowerCase() === cat
        );
      }

      setAgents(filtered);
      setTotal(data.count || filtered.length);
    } catch {
      setAgents([]);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchAgents();
  }

  function shortAddr(addr: string) {
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/" className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/register" className="text-sm text-[#7a8194] hover:text-[#00ff88]">
            Register Agent
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Agent Explorer</h1>
          <p className="text-sm text-[#7a8194]">
            {total.toLocaleString()} ERC-8004 agents indexed on Base
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, wallet address, or description…"
            className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30 font-mono"
          />
        </form>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap items-end">
          {/* Category Pills */}
          <div className="flex-1">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Category</div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setTimeout(fetchAgents, 0); }}
                  className={`px-3 py-1 text-xs border ${category === cat ? 'border-[#00ff88] text-[#00ff88]' : 'border-[#1a1d24] text-[#7a8194]'} hover:border-[#00ff88]/50`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Sort</div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-[#111318] border border-[#1a1d24] px-3 py-1 text-xs text-[#7a8194] outline-none"
            >
              <option value="trust_score">Trust Score</option>
              <option value="transaction_count">Transactions</option>
              <option value="reputation">Reputation</option>
            </select>
          </div>

          {/* Reputation Slider */}
          <div className="w-48">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">
              Min Trust: {minScore}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
              onMouseUp={() => fetchAgents()}
              className="w-full h-1 bg-[#1a1d24] appearance-none cursor-pointer accent-[#00ff88]"
            />
          </div>

          <button
            onClick={fetchAgents}
            className="bg-[#00ff88] text-[#07080a] px-6 py-2 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            Apply
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center text-[#454b5a] py-20 text-sm">Loading agents…</div>
        ) : agents.length === 0 ? (
          <div className="text-center text-[#454b5a] py-20 text-sm">No agents found</div>
        ) : (
          <div className="grid gap-[1px] bg-[#1a1d24]">
            {/* Header row */}
            <div className="bg-[#0d0f12] px-5 py-2 grid grid-cols-12 gap-4 text-[0.6rem] uppercase tracking-widest text-[#454b5a]">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Agent</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-1 text-center">Chain</div>
              <div className="col-span-1 text-right">Trust</div>
              <div className="col-span-2 text-right">Reputation</div>
              <div className="col-span-2 text-right">Category</div>
            </div>

            {agents.map(agent => {
              const displayName = (agent.name && !agent.name.startsWith("Agent ") && !agent.name.startsWith("0x"))
                ? agent.name
                : agent.description && agent.description.length > 0 && !agent.description.startsWith("0x")
                  ? agent.description.slice(0, 40)
                  : `Agent #${agent.token_id}`;
              const chainLabel = CHAINS[agent.chain_id] || `${agent.chain_id}`;

              return (
                <Link
                  key={agent.id}
                  href={`/agent/${encodeURIComponent(agent.id)}`}
                  className="bg-[#111318] px-5 py-3 hover:bg-[#0d0f12] transition-colors grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-1 text-xs text-[#454b5a] font-mono">
                    #{agent.token_id}
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{displayName}</span>
                      {agent.has_erc8004_identity && (
                        <span className="text-[0.55rem] px-1.5 py-0.5 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider shrink-0">
                          8004
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-[#7a8194] font-mono">
                    {shortAddr(agent.wallet_address)}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-[0.6rem] px-1.5 py-0.5 border uppercase tracking-wider ${
                      agent.chain_id === 8453 ? 'border-[#0052ff]/30 text-[#4d8cff]' :
                      agent.chain_id === 42161 ? 'border-[#28a0f0]/30 text-[#28a0f0]' :
                      'border-[#1a1d24] text-[#7a8194]'
                    }`}>
                      {chainLabel}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-sm font-bold text-[#00ff88]">{agent.trust_score}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    {agent.total_feedback > 0 ? (
                      <div>
                        <span className="text-sm font-bold text-[#00d4ff]">{agent.avg_reputation}</span>
                        <span className="text-[0.6rem] text-[#454b5a] ml-1">({agent.total_feedback})</span>
                      </div>
                    ) : (
                      <span className="text-[0.6rem] text-[#454b5a]">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[0.6rem] px-2 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">
                      {agent.category || '—'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
