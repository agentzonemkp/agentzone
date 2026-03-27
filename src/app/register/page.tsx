"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "oracle",
    pricingModel: "per-call",
    basePrice: "",
    apiEndpoint: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) {
      setResult("Error: Connect wallet first");
      return;
    }
    
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basePrice: parseFloat(form.basePrice),
          walletAddress: address,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(`Success! Agent registered with ID: ${data.agentId}`);
        setForm({
          name: "",
          description: "",
          category: "oracle",
          pricingModel: "per-call",
          basePrice: "",
          apiEndpoint: "",
        });
      } else {
        const err = await res.json();
        setResult(`Error: ${err.error || "Registration failed"}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/" className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/explore" className="text-sm text-[#7a8194] hover:text-[#00ff88]">
            Explore
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main className="max-w-[600px] mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold mb-1 font-sans">Register Agent</h1>
        <p className="text-xs text-[#454b5a] mb-8 uppercase tracking-wider">
          List your agent on AgentZone marketplace
        </p>

        {!isConnected ? (
          <div className="border border-[#1a1d24] p-8 text-center bg-[#111318]">
            <p className="text-sm text-[#7a8194] mb-4">Connect your wallet to register an agent.</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">Agent Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30"
              />
            </div>

            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">Description</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none"
                >
                  <option value="oracle">Oracle</option>
                  <option value="trading">Trading</option>
                  <option value="data">Data</option>
                  <option value="analytics">Analytics</option>
                  <option value="automation">Automation</option>
                  <option value="ml">ML</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div>
                <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">Pricing Model</label>
                <select
                  value={form.pricingModel}
                  onChange={e => setForm({ ...form, pricingModel: e.target.value })}
                  className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none"
                >
                  <option value="per-call">Per Call</option>
                  <option value="subscription">Subscription</option>
                  <option value="tiered">Tiered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">Base Price (USDC)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.basePrice}
                onChange={e => setForm({ ...form, basePrice: e.target.value })}
                placeholder="0.10"
                className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30"
              />
            </div>

            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#454b5a] block mb-1">API Endpoint (optional)</label>
              <input
                type="url"
                value={form.apiEndpoint}
                onChange={e => setForm({ ...form, apiEndpoint: e.target.value })}
                placeholder="https://your-agent.example.com/api"
                className="w-full bg-[#111318] border border-[#1a1d24] px-4 py-3 text-sm outline-none focus:border-[#00ff88]/30"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#00ff88] text-[#07080a] py-3 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-50 mt-4"
            >
              {submitting ? "Registering..." : "Register Agent"}
            </button>

            {result && (
              <div className={`text-xs mt-2 p-3 border ${result.startsWith("Error") ? "text-[#ff3b5c] border-[#ff3b5c]/20 bg-[#ff3b5c]/5" : "text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5"}`}>
                {result}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
