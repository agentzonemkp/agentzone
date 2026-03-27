'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  totalVolume: number;
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionSize: number;
  volumeByDay: Array<{ date: string; volume: number; revenue: number; transactions: number }>;
  volumeByChain: Array<{ chain: string; volume: number; count: number }>;
  topAgents: Array<{ agentId: string; name: string; revenue: number; jobs: number }>;
}

const COLORS = ['#00ff88', '#00d4ff', '#ff8a00', '#ff3b5c', '#a855f7', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/analytics?range=${timeRange}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <p className="text-[#7a8194]">Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <p className="text-[#ff3b5c]">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold font-['Outfit'] text-[#00ff88] mb-2">
              Payment Analytics
            </h1>
            <p className="text-[#7a8194]">x402 protocol volume, revenue, and trends</p>
          </div>

          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded font-mono text-sm ${
                  timeRange === range
                    ? 'bg-[#00ff88] text-[#07080a]'
                    : 'bg-[#111318] border border-[#1a1d24] text-[#7a8194] hover:border-[#00ff88]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <p className="text-[#7a8194] text-sm mb-2">Total Volume</p>
            <p className="text-3xl font-bold text-[#00ff88]">
              ${data.totalVolume.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <p className="text-[#7a8194] text-sm mb-2">Protocol Revenue (1%)</p>
            <p className="text-3xl font-bold text-[#00d4ff]">
              ${data.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <p className="text-[#7a8194] text-sm mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-[#ff8a00]">
              {data.totalTransactions.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <p className="text-[#7a8194] text-sm mb-2">Avg Transaction</p>
            <p className="text-3xl font-bold text-[#e8eaed]">
              ${data.avgTransactionSize.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Volume Over Time */}
        <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#00ff88] mb-4">Volume Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1d24" />
              <XAxis dataKey="date" stroke="#7a8194" style={{ fontSize: '12px' }} />
              <YAxis stroke="#7a8194" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111318',
                  border: '1px solid #1a1d24',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#00ff88"
                strokeWidth={2}
                name="Volume (USDC)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00d4ff"
                strokeWidth={2}
                name="Revenue (1%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Volume by Chain */}
          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00ff88] mb-4">Volume by Chain</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.volumeByChain}
                  dataKey="volume"
                  nameKey="chain"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.volumeByChain.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111318',
                    border: '1px solid #1a1d24',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Agents */}
          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00ff88] mb-4">Top Agents by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topAgents.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1d24" />
                <XAxis dataKey="name" stroke="#7a8194" style={{ fontSize: '12px' }} />
                <YAxis stroke="#7a8194" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111318',
                    border: '1px solid #1a1d24',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="#00ff88" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
