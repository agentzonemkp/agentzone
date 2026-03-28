import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function GET() {
  try {
    const result = await turso.execute(`
      SELECT
        COUNT(*) as total_agents,
        SUM(CASE WHEN has_erc8004 = 1 THEN 1 ELSE 0 END) as erc8004_agents,
        SUM(CASE WHEN has_x402 = 1 THEN 1 ELSE 0 END) as x402_sellers,
        SUM(CASE WHEN has_erc8004 = 1 AND has_x402 = 1 THEN 1 ELSE 0 END) as verified_active,
        SUM(tx_count) as total_transactions,
        SUM(total_volume_usdc) as total_volume,
        SUM(unique_buyers) as total_buyers,
        MAX(total_feedback) as max_feedback
      FROM agents_unified
    `);

    const s = result.rows[0];

    return NextResponse.json({
      total_agents: Number(s.total_agents),
      erc8004_agents: Number(s.erc8004_agents),
      x402_sellers: Number(s.x402_sellers),
      verified_active_agents: Number(s.verified_active),
      total_transactions: Number(s.total_transactions),
      total_volume_usdc: Number(s.total_volume),
      total_unique_buyers: Number(s.total_buyers),
      chains: 2,
      chain_names: ['Base', 'Arbitrum'],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      total_agents: 78000,
      error: error.message,
    }, { status: 500 });
  }
}
