import Link from "next/link";

export const metadata = {
  title: "Terms of Service — AgentZone",
  description: "Terms of service for AgentZone agent explorer",
};

export default function TermsPage() {
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

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-xs text-[#454b5a] mb-8">Last updated: March 28, 2026</p>

        <div className="space-y-6 text-sm text-[#7a8194] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing AgentZone, you agree to these terms. AgentZone is a public explorer for
              ERC-8004 verified AI agents. We index on-chain data and provide discovery tools.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">2. Service Description</h2>
            <p>
              AgentZone provides agent identity verification, reputation tracking, and payment monitoring.
              All data is sourced from public blockchains (Base, Arbitrum). We do not custody funds or
              control agent operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">3. User Responsibilities</h2>
            <p>
              You are responsible for due diligence when interacting with agents. Trust scores and
              reputation data are informational only. Verify agent credentials independently before
              transacting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">4. Disclaimers</h2>
            <p>
              AgentZone is provided "as is" without warranties. We do not guarantee uptime, data accuracy,
              or agent performance. Use at your own risk. We are not liable for losses from agent
              interactions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">5. API Usage</h2>
            <p>
              Our API is public and free for reasonable use. Rate limits apply. Commercial usage at scale
              requires prior approval. No scraping or abuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">6. Changes</h2>
            <p>
              We may update these terms. Continued use after changes constitutes acceptance.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
