import { NextResponse } from 'next/server';
import { graphqlClient } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';
import { getX402GlobalStats } from '@/lib/x402-data';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Binary search for total count since Hasura doesn't support COUNT
async function countEntities(entity: string): Promise<number> {
  let lo = 0, hi = 100000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const q = `{ ${entity}(offset: ${mid}, limit: 1) { id } }`;
    try {
      const data: any = await graphqlClient.request(q);
      if (data[entity]?.length > 0) lo = mid + 1;
      else hi = mid;
    } catch {
      hi = mid;
    }
  }
  return lo;
}

export async function GET() {
  try {
    const [totalERC8004, totalReputation, x402Stats] = await Promise.all([
      countEntities('Agent'),
      countEntities('Reputation'),
      getX402GlobalStats(30).catch(() => null),
    ]);

    // Count verified+active agents (ERC-8004 holders that also have x402 transactions)
    // Get x402 seller wallets from Turso
    let verifiedActiveCount = 0;
    try {
      const x402Result = await turso.execute(
        'SELECT wallet_address FROM x402_payments WHERE tx_count > 0'
      );
      const x402Wallets = x402Result.rows.map(r => String(r.wallet_address).toLowerCase());
      
      // Check which have ERC-8004 identity (batch query)
      const batchSize = 50;
      for (let i = 0; i < x402Wallets.length; i += batchSize) {
        const batch = x402Wallets.slice(i, i + batchSize);
        try {
          const data: any = await graphqlClient.request(`
            query CountOverlap($wallets: [String!]) {
              Agent(where: {wallet_address: {_in: $wallets}, has_erc8004_identity: {_eq: true}}) { id }
            }
          `, { wallets: batch });
          verifiedActiveCount += (data.Agent || []).length;
        } catch {}
      }
    } catch {}

    return NextResponse.json({
      total_erc8004_agents: totalERC8004,
      verified_active_agents: verifiedActiveCount,
      total_reputation_entries: totalReputation,
      chains: 2,
      chain_names: ['Base', 'Arbitrum'],
      x402_economy: x402Stats ? {
        total_transactions: Number(x402Stats.total_transactions || 0),
        total_volume_usdc: Number(x402Stats.total_amount || 0) / 1_000_000,
        unique_buyers: Number(x402Stats.unique_buyers || 0),
        unique_sellers: Number(x402Stats.unique_sellers || 0),
      } : null,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      total_erc8004_agents: 38000,
      verified_active_agents: 0,
      total_reputation_entries: 0,
      chains: 2,
      chain_names: ['Base', 'Arbitrum'],
      error: error.message,
    });
  }
}
