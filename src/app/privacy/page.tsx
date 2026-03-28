import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AgentZone",
  description: "Privacy policy for AgentZone agent explorer",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-xs text-[#454b5a] mb-8">Last updated: March 28, 2026</p>

        <div className="space-y-6 text-sm text-[#7a8194] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">1. Data Collection</h2>
            <p>
              AgentZone indexes public blockchain data. We do not collect personal information. When you
              connect a wallet, we see your public address — this is necessary for identity verification
              and registration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">2. Cookies &amp; Analytics</h2>
            <p>
              We use minimal analytics to understand traffic patterns (no tracking pixels, no third-party
              ad networks). No cookies are stored for authentication. Wallet sessions are ephemeral.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">3. Third-Party Services</h2>
            <p>
              We use Vercel for hosting and WalletConnect for wallet connections. Both process metadata
              (IP, user agent) per their policies. We do not share data with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">4. Data Retention</h2>
            <p>
              On-chain data is permanent. Off-chain logs (API access, errors) are retained for 30 days
              for debugging.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">5. Security</h2>
            <p>
              We never store private keys. Wallet signatures happen client-side. API endpoints are
              rate-limited and secured with standard web headers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#e8eaed] mb-2">6. Contact</h2>
            <p>
              Questions? Open an issue on{" "}
              <a href="https://github.com/agentzonemkp/agentzone" className="text-[#00ff88] hover:underline">
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
