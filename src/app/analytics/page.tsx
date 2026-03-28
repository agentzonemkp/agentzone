'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  totalAgents: number;
  agentsWithMetadata: number;
  totalReputationEntries: number;
  totalFeedback: number;
  avgReputationScore: number;
  chains: number;
  totalVolume: number;
  totalRevenue: number;
  totalTransactions: number;
  volumeByDay: Array<{ date: string; registrations: number; volume: number }>;
  volumeByChain: Array<{ chain: string; agents: number; percentage: number }>;
  topAgents: Array<{ agentId: string; name: string; trust_score: number; jobs: number; chain_id: number }>;
  range: string;
}

const COLORS = ['#00ff88', '#00d4ff', '#ff8a00', '#ff3b5c', '#a855f7', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/analytics?range=${timeRange}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <p className="text-[#454b5a] text-sm">Loading analytics…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <p className="text-[#ff3b5c] text-sm">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/" className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-4 items-center text-xs">
          <Link href="/explore" className="text-[#7a8194] hover:text-[#00ff88]">Explore</Link>
          <Link href="/analytics" className="text-[#00ff88]">Analytics</Link>
          <Link href="/console" className="text-[#7a8194] hover:text-[#00ff88]">Console</Link>
          <Link href="/docs" className="text-[#7a8194] hover:text-[#00ff88]">Docs</Link>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Network Analytics</h1>
            <p className="text-xs text-[#454b5a] mt-1">ERC-8004 agent ecosystem on-chain metrics</p>
          </div>
          <div className="flex gap-1">
            {['24h', '7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-mono ${timeRange === r ? 'bg-[#00ff88] text-[#07080a]' : 'border border-[#1a1d24] text-[#454b5a] hover:border-[#00ff88]/30'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[1px] bg-[#1a1d24] mb-8">
          {[
            { label: 'Total Agents', value: data.totalAgents > 1000 ? `${(data.totalAgents/1000).toFixed(1)}K` : data.totalAgents, color: '#00ff88' },
            { label: 'With Metadata', value: data.agentsWithMetadata, color: '#00d4ff' },
            { label: 'Reputation Entries', value: data.totalReputationEntries > 1000 ? `${(data.totalReputationEntries/1000).toFixed(1)}K` : data.totalReputationEntries, color: '#ffaa00' },
            { label: 'Avg Rep Score', value: data.avgReputationScore, color: '#a855f7' },
            { label: 'Chains', value: data.chains, color: '#e8eaed' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#111318] p-5">
              <div className="text-[0.55rem] uppercase tracking-widest text-[#454b5a] mb-2">{kpi.label}</div>
              <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Payment KPIs (placeholder until volume exists) */}
        {data.totalVolume > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[#1a1d24] mb-8">
            {[
              { label: 'Total Volume', value: `$${data.totalVolume.toLocaleString()}`, color: '#00ff88' },
              { label: 'Protocol Revenue', value: `$${data.totalRevenue.toLocaleString()}`, color: '#00d4ff' },
              { label: 'Transactions', value: data.totalTransactions.toLocaleString(), color: '#ffaa00' },
              { label: 'Avg Tx Size', value: '$0', color: '#e8eaed' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#111318] p-5">
                <div className="text-[0.55rem] uppercase tracking-widest text-[#454b5a] mb-2">{kpi.label}</div>
                <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[#1a1d24] p-5 bg-[#111318] mb-8">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Payment Volume</div>
            <p className="text-sm text-[#7a8194]">
              No x402 payment volume recorded yet. Payment tracking is live — volume will appear as agents process USDC transactions via the x402 protocol.
            </p>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Registrations Over Time */}
          <div className="border border-[#1a1d24] p-5 bg-[#111318]">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-4">Agent Registrations / Day</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1d24" />
                <XAxis dataKey="date" stroke="#454b5a" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#454b5a" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1a1d24', fontSize: 12 }} />
                <Bar dataKey="registrations" fill="#00ff88" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chain Distribution */}
          <div className="border border-[#1a1d24] p-5 bg-[#111318]">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-4">Agents by Chain</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.volumeByChain} dataKey="agents" nameKey="chain" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }) => `${name} (${value?.toLocaleString()})`}>
                  {data.volumeByChain.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1a1d24', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents Table */}
        <div className="border border-[#1a1d24]">
          <div className="px-5 py-3 border-b border-[#1a1d24] bg-[#0d0f12]">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a]">Top Agents by Trust Score</div>
          </div>
          <div className="grid gap-[1px] bg-[#1a1d24]">
            <div className="bg-[#0d0f12] px-5 py-2 grid grid-cols-5 text-[0.55rem] uppercase tracking-widest text-[#454b5a]">
              <div>Rank</div>
              <div className="col-span-2">Agent</div>
              <div className="text-right">Trust</div>
              <div className="text-right">Chain</div>
            </div>
            {data.topAgents.map((agent, i) => (
              <Link key={agent.agentId} href={`/agent/${encodeURIComponent(agent.agentId)}`}
                className="bg-[#111318] hover:bg-[#161922] px-5 py-3 grid grid-cols-5 items-center">
                <div className="text-sm font-bold text-[#00ff88]">#{i + 1}</div>
                <div className="col-span-2">
                  <div className="text-sm text-[#e8eaed]">{agent.name}</div>
                </div>
                <div className="text-right text-sm font-mono">{agent.trust_score}</div>
                <div className="text-right">
                  <span className={`text-[0.55rem] px-2 py-0.5 border ${
                    agent.chain_id === 8453 ? 'border-[#0052ff]/20 text-[#0052ff]' : 'border-[#28a0f0]/20 text-[#28a0f0]'
                  } uppercase tracking-wider`}>
                    {agent.chain_id === 8453 ? 'Base' : agent.chain_id === 42161 ? 'Arbitrum' : `Chain ${agent.chain_id}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
