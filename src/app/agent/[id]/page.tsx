"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { use } from "react";

interface AgentDetail {
  agent: {
    id: string;
    wallet_address: string;
    chain_id: number;
    contract_address: string;
    token_id: string;
    name: string;
    description: string;
    category: string;
    has_erc8004_identity: boolean;
    verified: boolean;
    trust_score: number;
    success_rate: number;
    total_revenue_usdc: number;
    transaction_count: number;
    unique_customers: number;
    revenue_30d: number;
    tx_count_30d: number;
    base_price_usdc: number;
    pricing_model: string;
    api_endpoint: string;
    avg_response_time_ms: number;
    rank_revenue: number;
    rank_transactions: number;
    rank_trust: number;
    growth_rate: number;
    created_at: string;
    last_active_at: string;
  };
  reputation: {
    avg_score: number;
    total_feedback: number;
    reviews: Array<{
      client: string;
      score: number;
      feedback_count: number;
    }>;
  };
  payments: Array<{
    id: string;
    tx_hash: string;
    customer: string;
    amount_usdc: number;
    service: string;
    status: string;
    timestamp: string;
  }>;
}

function shortAddr(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

function chainName(id: number) {
  const chains: Record<number, string> = { 1: 'Ethereum', 8453: 'Base', 42161: 'Arbitrum', 10: 'Optimism', 137: 'Polygon' };
  return chains[id] || `Chain ${id}`;
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agentId = decodeURIComponent(id);
  const [data, setData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'reputation' | 'payments'>('overview');

  useEffect(() => {
    fetch(`/api/v1/agents/${encodeURIComponent(agentId)}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <div className="text-sm text-[#454b5a]">Loading agent…</div>
      </div>
    );
  }

  if (!data || !data.agent) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <div className="text-sm text-[#454b5a]">Agent not found</div>
      </div>
    );
  }

  const { agent, reputation, payments } = data;

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/explore" className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-16">
        <Link href="/explore" className="text-xs text-[#454b5a] hover:text-[#7a8194] uppercase tracking-wider mb-6 inline-block">
          ← Back to Explorer
        </Link>

        {/* Agent Header */}
        <div className="border border-[#1a1d24] mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1d24] bg-[#0d0f12]">
            <div className="flex items-center gap-3">
              <span className="text-xl">⬡</span>
              <span className="font-bold text-lg">{agent.name}</span>
              <span className="text-[0.65rem] text-[#454b5a] font-mono">#{agent.token_id}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[0.6rem] px-2 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">
                {chainName(agent.chain_id)}
              </span>
              <span className="text-[0.6rem] px-2 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">
                {agent.category}
              </span>
              {agent.has_erc8004_identity && (
                <span className="text-[0.6rem] px-2 py-0.5 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider">
                  ERC-8004
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-[1px] bg-[#1a1d24]">
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Trust Score</div>
              <div className="text-3xl font-bold text-[#00ff88]">{agent.trust_score}</div>
              {agent.rank_trust > 0 && (
                <div className="text-[0.7rem] text-[#7a8194] mt-1">Rank #{agent.rank_trust}</div>
              )}
            </div>
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Reputation</div>
              <div className="text-3xl font-bold text-[#00d4ff]">{reputation.avg_score}</div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">{reputation.total_feedback} reviews</div>
            </div>
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Transactions</div>
              <div className="text-2xl font-bold">{agent.transaction_count}</div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">{agent.unique_customers} customers</div>
            </div>
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Revenue</div>
              <div className="text-2xl font-bold">${agent.total_revenue_usdc.toFixed(2)}</div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">${agent.revenue_30d.toFixed(2)} (30d)</div>
            </div>
          </div>

          {/* Owner + Contract */}
          <div className="border-t border-[#1a1d24] px-6 py-3 bg-[#0d0f12] flex items-center justify-between text-[0.7rem] text-[#454b5a] font-mono">
            <span>Owner: {shortAddr(agent.wallet_address)}</span>
            <span>Contract: {shortAddr(agent.contract_address)}</span>
            {agent.api_endpoint && <span>API: {agent.api_endpoint}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#1a1d24]">
          {(['overview', 'reputation', 'payments'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-xs uppercase tracking-wider ${tab === t ? 'text-[#00ff88] border-b-2 border-[#00ff88]' : 'text-[#454b5a] hover:text-[#7a8194]'}`}
            >
              {t} {t === 'reputation' && `(${reputation.total_feedback})`}
              {t === 'payments' && `(${payments.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {agent.description && (
              <div className="border border-[#1a1d24] p-5 bg-[#111318]">
                <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">About</div>
                <p className="text-sm text-[#7a8194] leading-relaxed">{agent.description}</p>
              </div>
            )}
            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Details</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-[#454b5a]">Success Rate:</span> <span className="text-[#e8eaed]">{agent.success_rate}%</span></div>
                <div><span className="text-[#454b5a]">Avg Response:</span> <span className="text-[#e8eaed]">{agent.avg_response_time_ms}ms</span></div>
                <div><span className="text-[#454b5a]">Growth Rate:</span> <span className="text-[#e8eaed]">{agent.growth_rate}%</span></div>
                <div><span className="text-[#454b5a]">Pricing:</span> <span className="text-[#e8eaed]">${agent.base_price_usdc} ({agent.pricing_model})</span></div>
                <div><span className="text-[#454b5a]">30d Txns:</span> <span className="text-[#e8eaed]">{agent.tx_count_30d}</span></div>
                <div><span className="text-[#454b5a]">30d Revenue:</span> <span className="text-[#e8eaed]">${agent.revenue_30d.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'reputation' && (
          <div className="border border-[#1a1d24]">
            {reputation.reviews.length === 0 ? (
              <div className="p-8 text-center text-[#454b5a] text-sm">No reputation data yet</div>
            ) : (
              <div className="grid gap-[1px] bg-[#1a1d24]">
                <div className="bg-[#0d0f12] px-5 py-2 grid grid-cols-3 text-[0.6rem] uppercase tracking-widest text-[#454b5a]">
                  <div>Client</div>
                  <div className="text-right">Score</div>
                  <div className="text-right">Feedback Count</div>
                </div>
                {reputation.reviews.map((r, i) => (
                  <div key={i} className="bg-[#111318] px-5 py-3 grid grid-cols-3 items-center">
                    <div className="text-xs font-mono text-[#7a8194]">{shortAddr(r.client)}</div>
                    <div className="text-right">
                      <span className={`font-bold ${r.score >= 70 ? 'text-[#00ff88]' : r.score >= 40 ? 'text-[#ffaa00]' : 'text-[#ff3b5c]'}`}>
                        {r.score}
                      </span>
                    </div>
                    <div className="text-right text-xs text-[#7a8194]">{r.feedback_count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="border border-[#1a1d24]">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-[#454b5a] text-sm">No payment history</div>
            ) : (
              <div className="grid gap-[1px] bg-[#1a1d24]">
                <div className="bg-[#0d0f12] px-5 py-2 grid grid-cols-5 text-[0.6rem] uppercase tracking-widest text-[#454b5a]">
                  <div>Tx Hash</div>
                  <div>Customer</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Service</div>
                  <div className="text-right">Status</div>
                </div>
                {payments.map(p => (
                  <div key={p.id} className="bg-[#111318] px-5 py-3 grid grid-cols-5 items-center">
                    <div className="text-xs font-mono text-[#7a8194]">
                      <a href={`https://basescan.org/tx/${p.tx_hash}`} target="_blank" rel="noopener" className="hover:text-[#00ff88]">
                        {shortAddr(p.tx_hash)}
                      </a>
                    </div>
                    <div className="text-xs font-mono text-[#7a8194]">{shortAddr(p.customer)}</div>
                    <div className="text-right text-sm">${p.amount_usdc}</div>
                    <div className="text-right text-xs text-[#7a8194]">{p.service || '—'}</div>
                    <div className="text-right">
                      <span className={`text-[0.6rem] px-2 py-0.5 border uppercase tracking-wider ${
                        p.status === 'completed' ? 'border-[#00ff88]/20 text-[#00ff88]' :
                        p.status === 'failed' ? 'border-[#ff3b5c]/20 text-[#ff3b5c]' :
                        'border-[#1a1d24] text-[#7a8194]'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
