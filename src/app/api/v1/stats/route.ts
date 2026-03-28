import { NextResponse } from 'next/server';
import { graphqlClient } from '@/lib/graphql-client';
import { getX402GlobalStats } from '@/lib/x402-data';

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
    const [totalAgents, totalReputation, x402Stats] = await Promise.all([
      countEntities('Agent'),
      countEntities('Reputation'),
      getX402GlobalStats(30).catch(() => null),
    ]);

    // Count agents with metadata (has description)
    const metaQuery = `{ Agent(where: {description: {_neq: ""}}, limit: 100000) { id } }`;
    const metaData: any = await graphqlClient.request(metaQuery);
    const withMetadata = metaData.Agent?.length || 0;

    return NextResponse.json({
      total_agents: totalAgents,
      agents_with_metadata: withMetadata,
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
      total_agents: 35000,
      agents_with_metadata: 35,
      total_reputation_entries: 1000,
      chains: 2,
      chain_names: ['Base', 'Arbitrum'],
      error: error.message,
    });
  }
}
