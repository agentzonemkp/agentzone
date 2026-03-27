"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  wallet_address: string;
  verified: boolean;
  base_price_usdc: number;
  reputation: {
    reputation_score: number;
    total_jobs: number;
    successful_jobs: number;
  } | null;
}

const CATEGORIES = ["oracle", "trading", "data", "analytics", "automation", "ml", "social"];

export default function ExplorePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("limit", "50");

    const res = await fetch(`/api/v1/agents?${params}`);
    const data = await res.json();
    
    let filtered = data.agents || [];
    
    // Client-side filtering for query and minScore
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((a: Agent) => 
        a.name?.toLowerCase().includes(q) || 
        a.description?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
      );
    }
    
    if (minScore > 0) {
      filtered = filtered.filter((a: Agent) => 
        (a.reputation?.reputation_score || 0) >= minScore
      );
    }
    
    setAgents(filtered);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchAgents();
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
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search agents by name, capability, or description..."
            className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30"
          />
        </form>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap items-end">
          {/* Category Pills */}
          <div className="flex-1">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Category</div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setCategory(""); fetchAgents(); }}
                className={`px-3 py-1 text-xs border ${!category ? 'border-[#00ff88] text-[#00ff88]' : 'border-[#1a1d24] text-[#7a8194]'} hover:border-[#00ff88]/50`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); fetchAgents(); }}
                  className={`px-3 py-1 text-xs border capitalize ${category === cat ? 'border-[#00ff88] text-[#00ff88]' : 'border-[#1a1d24] text-[#7a8194]'} hover:border-[#00ff88]/50`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reputation Slider */}
          <div className="w-64">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">
              Min Reputation: {minScore}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={e => { setMinScore(parseInt(e.target.value)); fetchAgents(); }}
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
          <div className="text-center text-[#454b5a] py-20 text-sm">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center text-[#454b5a] py-20 text-sm">No agents found</div>
        ) : (
          <div className="grid gap-[1px] bg-[#1a1d24]">
            {agents.map(agent => (
              <Link
                key={agent.id}
                href={`/agent/${encodeURIComponent(agent.id)}`}
                className="bg-[#111318] p-5 hover:bg-[#0d0f12] transition-colors flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm">{agent.name || "Unnamed Agent"}</span>
                    <span className="text-[0.6rem] px-2 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">
                      {agent.category}
                    </span>
                    {agent.verified && (
                      <span className="text-[0.6rem] px-2 py-0.5 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#7a8194] truncate max-w-xl">
                    {agent.description || "No description"}
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4">
                  <div className="text-right">
                    <div className="text-sm text-[#00d4ff]">
                      ${agent.base_price_usdc}/call
                    </div>
                  </div>
                  {agent.reputation ? (
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#00ff88]">
                        {agent.reputation.reputation_score.toFixed(0)}
                      </div>
                      <div className="text-[0.6rem] text-[#454b5a] uppercase tracking-wider">
                        {agent.reputation.total_jobs} jobs
                      </div>
                    </div>
                  ) : (
                    <div className="text-[0.6rem] text-[#454b5a] uppercase tracking-wider">No reputation</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
