"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import { use } from "react";

interface AgentData {
  agent: {
    id: string;
    name: string;
    description: string;
    category: string;
    pricing_model: string;
    base_price_usdc: number;
    wallet_address: string;
    api_endpoint: string;
    verified: boolean;
  };
  reputation: {
    total_jobs: number;
    successful_jobs: number;
    total_revenue_usdc: number;
    reputation_score: number;
    avg_response_time_ms: number;
  } | null;
  services: Array<{
    id: string;
    name: string;
    description: string;
    price_usdc: number;
    endpoint: string;
  }>;
  validations: Array<{
    validation_type: string;
    passed: boolean;
    validated_at: string;
  }>;
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agentId = decodeURIComponent(id);
  const { address, isConnected } = useAccount();
  
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  async function fetchAgent() {
    try {
      const res = await fetch(`/api/v1/agents/${encodeURIComponent(agentId)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleTest() {
    if (!isConnected) {
      alert("Connect wallet to test agent");
      return;
    }
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const res = await fetch(`/api/v1/agents/${encodeURIComponent(agentId)}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: testInput,
          walletAddress: address,
        }),
      });
      
      const result = await res.json();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ error: err.message });
    }
    
    setTestLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <div className="text-sm text-[#454b5a]">Loading agent...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#e8eaed] flex items-center justify-center">
        <div className="text-sm text-[#454b5a]">Agent not found</div>
      </div>
    );
  }

  const { agent, reputation, services, validations } = data;
  const successRate = reputation && reputation.total_jobs > 0
    ? ((reputation.successful_jobs / reputation.total_jobs) * 100).toFixed(1)
    : "0.0";

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
        {/* Back link */}
        <Link href="/explore" className="text-xs text-[#454b5a] hover:text-[#7a8194] uppercase tracking-wider mb-6 inline-block">
          ← Back to Explorer
        </Link>

        {/* Agent Card */}
        <div className="border border-[#1a1d24] overflow-hidden mb-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1d24] bg-[#0d0f12]">
            <div className="flex items-center gap-3">
              <span className="text-xl">⬡</span>
              <span className="font-bold text-lg font-sans">{agent.name}</span>
              <span className="text-[0.65rem] text-[#454b5a]">{agent.id}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[0.6rem] px-2 py-0.5 border border-[#1a1d24] text-[#7a8194] uppercase tracking-wider">
                {agent.category}
              </span>
              {agent.verified && (
                <span className="text-[0.6rem] px-2 py-0.5 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider">
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Three-column data */}
          <div className="grid grid-cols-3 gap-[1px] bg-[#1a1d24]">
            {/* Reputation */}
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Reputation</div>
              {reputation ? (
                <>
                  <div className="text-3xl font-bold text-[#00ff88] font-sans">
                    {reputation.reputation_score.toFixed(0)}
                  </div>
                  <div className="text-[0.7rem] text-[#7a8194] mt-1">
                    {reputation.total_jobs} jobs · {successRate}% success
                  </div>
                </>
              ) : (
                <div className="text-sm text-[#454b5a]">No reputation data</div>
              )}
            </div>

            {/* Revenue */}
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Total Revenue</div>
              <div className="text-2xl font-bold font-sans">
                ${reputation ? reputation.total_revenue_usdc.toFixed(2) : "0.00"}
              </div>
              <div className="text-[0.7rem] text-[#7a8194] mt-1">USDC lifetime</div>
            </div>

            {/* Validations */}
            <div className="bg-[#111318] p-5">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Validations</div>
              {validations.length > 0 ? (
                validations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 text-[0.75rem]">
                    <span className={v.passed ? "text-[#00ff88] font-bold" : "text-[#ff3b5c]"}>
                      {v.passed ? "✓" : "✗"}
                    </span>
                    <span className="text-[#7a8194]">{v.validation_type.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#454b5a]">No validations</div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="border-t border-[#1a1d24] px-6 py-4">
            <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-3">Services</div>
            {services.length > 0 ? (
              services.map(svc => (
                <div key={svc.id} className="flex items-center justify-between py-2 border-b border-[#ffffff08] last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{svc.name}</span>
                    {svc.description && (
                      <span className="text-xs text-[#7a8194]">{svc.description}</span>
                    )}
                  </div>
                  <span className="text-[#00d4ff] text-sm font-medium">
                    ${svc.price_usdc}/call
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#454b5a]">No services registered</div>
            )}
          </div>

          {/* Description */}
          {agent.description && (
            <div className="border-t border-[#1a1d24] px-6 py-4">
              <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">About</div>
              <p className="text-sm text-[#7a8194] leading-relaxed">{agent.description}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-[#1a1d24] px-6 py-3 bg-[#0d0f12] flex items-center justify-between text-[0.7rem] text-[#454b5a]">
            <span>Owner: {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}</span>
            <span>Pricing: {agent.pricing_model}</span>
          </div>
        </div>

        {/* Testing Interface */}
        <div className="border border-[#1a1d24] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a1d24] bg-[#0d0f12]">
            <div className="font-bold text-sm font-sans">Test Agent</div>
            <div className="text-xs text-[#7a8194] mt-1">
              {isConnected ? "Send a test request (x402 payment simulated)" : "Connect wallet to test"}
            </div>
          </div>
          
          <div className="p-6 bg-[#111318]">
            <div className="mb-4">
              <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-2">
                Input (JSON or text)
              </label>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder='{"query": "test data"}'
                rows={4}
                disabled={!isConnected}
                className="w-full bg-[#07080a] border border-[#1a1d24] px-4 py-3 text-sm font-mono outline-none focus:border-[#00ff88]/30 resize-none disabled:opacity-50"
              />
            </div>
            
            <button
              onClick={handleTest}
              disabled={!isConnected || testLoading}
              className="bg-[#00ff88] text-[#07080a] px-6 py-2 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? "Testing..." : `Test ($${agent.base_price_usdc} USDC)`}
            </button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-[#07080a] border border-[#1a1d24]">
                <div className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] mb-2">Result</div>
                <pre className="text-xs text-[#7a8194] whitespace-pre-wrap font-mono">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
