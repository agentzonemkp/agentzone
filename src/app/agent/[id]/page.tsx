"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { use } from "react";
import { useSearchParams } from "next/navigation";

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
    has_x402: boolean;
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
    image: string;
    external_url: string;
    services: Array<{ url: string; name?: string; description?: string }>;
    is_soulbound: boolean;
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
  x402: {
    tx_count: number;
    total_volume_usdc: number;
    unique_buyers: number;
    first_tx: string | null;
    last_tx: string | null;
  } | null;
}

function shortAddr(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

function chainName(id: number) {
  const chains: Record<number, string> = { 1: 'Ethereum', 8453: 'Base', 42161: 'Arbitrum', 10: 'Optimism', 137: 'Polygon' };
  return chains[id] || `Chain ${id}`;
}

function explorerUrl(chainId: number, type: 'address' | 'tx' | 'token', value: string) {
  const base: Record<number, string> = { 8453: 'https://basescan.org', 42161: 'https://arbiscan.io', 1: 'https://etherscan.io', 10: 'https://optimistic.etherscan.io' };
  return `${base[chainId] || base[8453]}/${type}/${value}`;
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agentId = decodeURIComponent(id);
  const searchParams = useSearchParams();
  const validTabs = ['overview', 'reputation', 'payments', 'x402', 'validation'] as const;
  type Tab = typeof validTabs[number];
  const initialTab = validTabs.includes(searchParams.get('tab') as Tab) ? (searchParams.get('tab') as Tab) : 'overview';
  const [data, setData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab);

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

  const { agent, reputation, payments, x402 } = data;

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/explore" className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-4 items-center text-xs">
          <Link href="/explore" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Explore</Link>
          <Link href="/analytics" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Analytics</Link>
          <Link href="/docs" className="text-[#7a8194] hover:text-[#00ff88] hidden sm:block">Docs</Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        <Link href="/explore" className="text-xs text-[#454b5a] hover:text-[#7a8194] uppercase tracking-wider mb-6 inline-block">
          ← Back to Explorer
        </Link>

        {/* Agent Header */}
        <div className="border border-[#1a1d24] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1a1d24] bg-[#0d0f12] gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">⬡</span>
              <span className="font-bold text-lg truncate">{agent.name}</span>
              <span className="text-[0.65rem] text-[#454b5a] font-mono shrink-0">#{agent.token_id}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              {agent.has_x402 && (
                <span className="text-[0.6rem] px-2 py-0.5 border border-[#3b82f6]/20 text-[#3b82f6] uppercase tracking-wider">
                  x402
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[#1a1d24]">
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
              <div className="text-2xl font-bold">{(agent.transaction_count || 0).toLocaleString()}</div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">{(agent.unique_customers || 0).toLocaleString()} customers</div>
            </div>
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Volume</div>
              <div className="text-2xl font-bold">${(agent.total_revenue_usdc || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">USDC</div>
            </div>
          </div>

          {/* Owner + Contract */}
          <div className="border-t border-[#1a1d24] px-4 sm:px-6 py-3 bg-[#0d0f12] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[0.65rem] sm:text-[0.7rem] text-[#454b5a] font-mono">
            <a href={explorerUrl(agent.chain_id, 'address', agent.wallet_address)} target="_blank" rel="noopener" className="hover:text-[#00ff88]">
              Owner: {shortAddr(agent.wallet_address)} ↗
            </a>
            <a href={explorerUrl(agent.chain_id, 'address', agent.contract_address)} target="_blank" rel="noopener" className="hover:text-[#00ff88]">
              Contract: {shortAddr(agent.contract_address)} ↗
            </a>
            {agent.api_endpoint && <span>API: {agent.api_endpoint}</span>}
            <a href={explorerUrl(agent.chain_id, 'token', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') + `?a=${agent.wallet_address}`} target="_blank" rel="noopener" className="hover:text-[#00d4ff]">
              USDC Transfers ↗
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-[#1a1d24] overflow-x-auto scrollbar-hide">
          {(['overview', 'reputation', 'payments', 'x402', 'validation'] as const).map(t => (
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

        {tab === 'x402' && (
          <div className="space-y-6">
            {/* x402 Stats */}
            {x402 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[#1a1d24] border border-[#1a1d24]">
                <div className="bg-[#111318] p-4">
                  <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Transactions</div>
                  <div className="text-2xl font-bold text-[#3b82f6]">{x402.tx_count.toLocaleString()}</div>
                </div>
                <div className="bg-[#111318] p-4">
                  <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Volume</div>
                  <div className="text-2xl font-bold text-[#00ff88]">${x402.total_volume_usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-[#111318] p-4">
                  <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Unique Buyers</div>
                  <div className="text-2xl font-bold">{x402.unique_buyers.toLocaleString()}</div>
                </div>
                <div className="bg-[#111318] p-4">
                  <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Last Active</div>
                  <div className="text-sm font-bold text-[#7a8194]">{x402.last_tx ? new Date(x402.last_tx).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            )}

            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">x402 Payment Protocol</div>
              <p className="text-sm text-[#7a8194] mb-4">
                x402 enables HTTP-native payments. Agents expose paid endpoints that return <code className="text-[#00d4ff] bg-[#0d0f12] px-1 py-0.5">402 Payment Required</code> with
                payment details. Clients pay via USDC on Base, then retry with proof.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-[#1a1d24] p-4 bg-[#0d0f12]">
                  <div className="text-[0.55rem] uppercase tracking-widest text-[#454b5a] mb-2">Agent Wallet</div>
                  <a href={explorerUrl(agent.chain_id, 'address', agent.wallet_address)} target="_blank" rel="noopener"
                    className="text-xs font-mono text-[#00ff88] hover:underline break-all">
                    {agent.wallet_address}
                  </a>
                </div>
                <div className="border border-[#1a1d24] p-4 bg-[#0d0f12]">
                  <div className="text-[0.55rem] uppercase tracking-widest text-[#454b5a] mb-2">Payment Token</div>
                  <div className="text-xs font-mono text-[#00d4ff]">USDC (Base)</div>
                  <div className="text-[0.6rem] text-[#454b5a] mt-1 break-all">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</div>
                </div>
              </div>
            </div>

            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Report Payment</div>
              <p className="text-xs text-[#7a8194] mb-3">
                Submit a USDC transaction hash to verify and record an x402 payment to this agent.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... transaction hash"
                  id="tx-hash-input"
                  className="flex-1 bg-[#0d0f12] border border-[#1a1d24] text-[#e8eaed] px-3 py-2 text-xs font-mono focus:border-[#00ff88] outline-none"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('tx-hash-input') as HTMLInputElement;
                    const hash = input?.value?.trim();
                    if (!hash) return;
                    try {
                      const res = await fetch('/api/v1/payments/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tx_hash: hash, agent_wallet: agent.wallet_address }),
                      });
                      const data = await res.json();
                      alert(data.success ? `Verified! $${data.payment?.amount_usdc} USDC` : `Error: ${data.error}`);
                    } catch (e) {
                      alert('Verification failed');
                    }
                  }}
                  className="px-4 py-2 bg-[#00ff88] text-[#07080a] text-xs font-bold uppercase tracking-wider hover:bg-[#00cc6a]"
                >
                  Verify & Record
                </button>
              </div>
            </div>

            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Integration</div>
              <pre className="text-xs font-mono text-[#7a8194] bg-[#0d0f12] p-4 overflow-x-auto whitespace-pre">{`// x402 client example
const response = await fetch(agentEndpoint);
if (response.status === 402) {
  const paymentDetails = response.headers.get('X-Payment');
  // Pay USDC to ${shortAddr(agent.wallet_address)} on Base
  const tx = await payUSDC(paymentDetails);
  // Retry with proof
  const result = await fetch(agentEndpoint, {
    headers: { 'X-Payment-Proof': tx.hash }
  });
}`}</pre>
            </div>
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
        {tab === 'validation' && (
          <div className="space-y-6">
            {/* ERC-8004 Identity */}
            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">ERC-8004 Identity</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[#1a1d24] p-4 bg-[#0d0f12]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${agent.has_erc8004_identity ? 'bg-[#00ff88] shadow-[0_0_6px_#00ff88]' : 'bg-[#454b5a]'}`} />
                    <span className="text-xs font-bold">{agent.has_erc8004_identity ? 'Verified' : 'Unverified'}</span>
                  </div>
                  <div className="text-[0.6rem] text-[#7a8194]">On-chain identity token #{agent.token_id} on {chainName(agent.chain_id)}</div>
                  <a href={explorerUrl(agent.chain_id, 'token', agent.contract_address) + `?a=${agent.token_id}`}
                    target="_blank" rel="noopener" className="text-[0.6rem] text-[#00ff88] hover:underline mt-1 inline-block">
                    View on explorer ↗
                  </a>
                </div>
                <div className="border border-[#1a1d24] p-4 bg-[#0d0f12]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                    <span className="text-xs font-bold">Soulbound</span>
                  </div>
                  <div className="text-[0.6rem] text-[#7a8194]">ERC-8004 tokens are non-transferable. This identity is permanently bound to the owner wallet.</div>
                </div>
              </div>
            </div>

            {/* TEE Attestation */}
            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a]">TEE Attestation</div>
                <span className="text-[0.55rem] px-2 py-0.5 border border-[#ffaa00]/20 text-[#ffaa00] uppercase tracking-wider">Coming Soon</span>
              </div>
              <p className="text-xs text-[#7a8194] mb-4">
                Trusted Execution Environment attestation verifies the agent runs in a secure enclave (Intel SGX, ARM TrustZone, AWS Nitro).
                Attestation proofs will be anchored on-chain.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Intel SGX', icon: '🔒', status: 'pending' },
                  { label: 'AWS Nitro', icon: '☁️', status: 'pending' },
                  { label: 'ARM TrustZone', icon: '🛡️', status: 'pending' },
                ].map(tee => (
                  <div key={tee.label} className="border border-[#1a1d24] p-3 bg-[#0d0f12] text-center">
                    <div className="text-lg mb-1">{tee.icon}</div>
                    <div className="text-[0.6rem] text-[#454b5a]">{tee.label}</div>
                    <div className="text-[0.55rem] text-[#7a8194] mt-1">Not attested</div>
                  </div>
                ))}
              </div>
            </div>

            {/* zkML Verification */}
            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a]">zkML Verification</div>
                <span className="text-[0.55rem] px-2 py-0.5 border border-[#ffaa00]/20 text-[#ffaa00] uppercase tracking-wider">Coming Soon</span>
              </div>
              <p className="text-xs text-[#7a8194] mb-4">
                Zero-knowledge proofs verify ML model inference without revealing model weights.
                Supported frameworks: EZKL, RISC Zero, Giza.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'EZKL', desc: 'ONNX → ZK circuit', status: 'pending' },
                  { label: 'RISC Zero', desc: 'General zkVM', status: 'pending' },
                  { label: 'Giza', desc: 'Cairo ML proofs', status: 'pending' },
                ].map(zk => (
                  <div key={zk.label} className="border border-[#1a1d24] p-3 bg-[#0d0f12] text-center">
                    <div className="text-xs font-bold text-[#00d4ff] mb-1">{zk.label}</div>
                    <div className="text-[0.55rem] text-[#454b5a]">{zk.desc}</div>
                    <div className="text-[0.55rem] text-[#7a8194] mt-1">No proof submitted</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation API */}
            <div className="border border-[#1a1d24] p-5 bg-[#111318]">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Submit Validation</div>
              <p className="text-xs text-[#7a8194] mb-3">
                Agent operators can submit TEE attestation reports or zkML proofs via the API.
              </p>
              <pre className="text-xs font-mono text-[#7a8194] bg-[#0d0f12] p-4 overflow-x-auto whitespace-pre">{`POST /api/v1/agents/{id}/validate
Content-Type: application/json

{
  "type": "tee_attestation" | "zkml_proof",
  "framework": "sgx" | "nitro" | "ezkl" | "risc_zero",
  "proof": "<base64-encoded attestation or proof>",
  "metadata": { "model_hash": "...", "enclave_id": "..." }
}`}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
