import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description: "AgentZone developer documentation — API reference, architecture, ERC-8004 integration, x402 payments.",
};

const docs = [
  { title: "Getting Started", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/getting-started.md", desc: "Quick setup guide for running AgentZone locally and connecting to the ERC-8004 ecosystem." },
  { title: "Architecture", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/architecture.md", desc: "System design — Envio HyperIndex, Turso DB, Cloudflare Workers, Next.js frontend." },
  { title: "API Reference", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/api-reference.md", desc: "REST + JSON-LD endpoints for agents, search, analytics, discovery, and payments." },
  { title: "TypeScript SDK", href: "https://github.com/agentzonemkp/agentzone-sdk", desc: "Official TypeScript SDK — zero dependencies, full type safety, Node + browser compatible." },
  { title: "MCP Server", href: "https://github.com/agentzonemkp/agentzone-mcp", desc: "Model Context Protocol server — expose AgentZone as tools for LLMs (Claude, GPT, etc)." },
  { title: "Agent Discovery", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/agent-discovery.md", desc: "How agents are indexed from on-chain events and enriched with metadata." },
  { title: "ERC-8004 Identity", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/erc-8004.md", desc: "Soulbound agent identity tokens — registration, metadata, transfers." },
  { title: "x402 Payments", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/x402-payments.md", desc: "Payment protocol integration — USDC transfers, verification, reporting." },
  { title: "MVP Specification", href: "https://github.com/agentzonemkp/agentzone/blob/main/docs/spec-mvp.md", desc: "Complete product specification with architecture, features, APIs, and user flows." },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed]">
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#1a1d24] bg-[#07080a]/85 backdrop-blur-xl">
        <Link href="/" className="font-bold flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          AgentZone
        </Link>
        <div className="flex gap-4 items-center text-xs">
          <Link href="/explore" className="text-[#7a8194] hover:text-[#00ff88]">Explore</Link>
          <Link href="/analytics" className="text-[#7a8194] hover:text-[#00ff88]">Analytics</Link>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        <h1 className="text-2xl font-bold mb-2">Documentation</h1>
        <p className="text-sm text-[#7a8194] mb-8">Developer guides, API reference, and integration docs for AgentZone.</p>

        <div className="grid gap-3">
          {docs.map((doc) => (
            <a
              key={doc.title}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#111318] border border-[#1a1d24] hover:border-[#00ff88]/20 p-4 sm:p-5 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold mb-1 group-hover:text-[#00ff88] transition-colors">
                    {doc.title}
                  </h2>
                  <p className="text-xs text-[#7a8194] leading-relaxed">{doc.desc}</p>
                </div>
                <span className="text-[#454b5a] group-hover:text-[#00ff88] transition-colors shrink-0 mt-0.5">↗</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-[#111318] border border-[#1a1d24]">
            <h3 className="text-xs font-bold mb-3 text-[#00ff88]">TypeScript SDK</h3>
            <code className="text-xs text-[#7a8194] font-mono block mb-3 bg-[#0d0f12] p-2">
              npm install @agentzone/sdk
            </code>
            <pre className="text-[0.65rem] font-mono text-[#7a8194] leading-relaxed bg-[#0d0f12] p-3">
{`import AgentZone from '@agentzone/sdk';

const client = new AgentZone();
const { agents } = await client.agents.list({
  sort: 'trust_score',
  limit: 10
});`}
            </pre>
            <a
              href="https://www.npmjs.com/package/@agentzone/sdk"
              target="_blank"
              rel="noopener"
              className="text-xs text-[#00ff88] hover:underline mt-2 inline-block"
            >
              View on npm →
            </a>
          </div>

          <div className="p-4 bg-[#111318] border border-[#1a1d24]">
            <h3 className="text-xs font-bold mb-3 text-[#00d4ff]">MCP Server</h3>
            <code className="text-xs text-[#7a8194] font-mono block mb-3 bg-[#0d0f12] p-2">
              npm install -g @agentzone/mcp
            </code>
            <pre className="text-[0.65rem] font-mono text-[#7a8194] leading-relaxed bg-[#0d0f12] p-3">
{`// claude_desktop_config.json
{
  "mcpServers": {
    "agentzone": {
      "command": "agentzone-mcp"
    }
  }
}`}
            </pre>
            <a
              href="https://www.npmjs.com/package/@agentzone/mcp"
              target="_blank"
              rel="noopener"
              className="text-xs text-[#00d4ff] hover:underline mt-2 inline-block"
            >
              View on npm →
            </a>
          </div>

          <div className="p-4 bg-[#111318] border border-[#1a1d24]">
            <h3 className="text-xs font-bold mb-2 text-[#ff8a00]">REST API</h3>
            <code className="text-xs text-[#7a8194] font-mono">https://agentzone.fun/api/v1/</code>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[0.65rem]">
              {[
                "GET /agents", "GET /agents/:id", "GET /search?q=",
                "GET /stats", "GET /analytics", "GET /discover",
              ].map((ep) => (
                <div key={ep} className="bg-[#0d0f12] px-2 py-1.5 font-mono text-[#454b5a]">{ep}</div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
