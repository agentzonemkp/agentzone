import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { graphqlClient } from '@/lib/graphql-client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

export async function GET() {
  try {
    // Get total payments and volume
    const totals = await turso.execute(`
      SELECT 
        COUNT(*) as total_agents_with_payments,
        SUM(tx_count) as total_payments,
        SUM(total_volume_usdc) as total_volume,
        SUM(unique_buyers) as total_unique_buyers
      FROM x402_payments
      WHERE tx_count > 0
    `);

    const totalsRow = totals.rows[0];

    // Get top sellers
    const topSellers = await turso.execute({
      sql: `
        SELECT 
          wallet_address,
          tx_count,
          total_volume_usdc,
          unique_buyers,
          first_tx_at,
          last_tx_at
        FROM x402_payments
        WHERE tx_count > 0
        ORDER BY total_volume_usdc DESC
        LIMIT 10
      `,
    });

    // Enrich top sellers with agent names from GraphQL
    const topSellerAddresses = topSellers.rows.map((r) => r.wallet_address as string);
    let agentNameMap = new Map<string, { name: string; category: string }>();

    if (topSellerAddresses.length > 0) {
      try {
        const agentData: any = await graphqlClient.request(`
          query GetAgentNames($addresses: [String!]) {
            Agent(where: {wallet_address: {_in: $addresses}}) {
              wallet_address
              name
              category
            }
          }
        `, { addresses: topSellerAddresses });

        for (const agent of (agentData.Agent || [])) {
          agentNameMap.set(agent.wallet_address.toLowerCase(), {
            name: agent.name || 'Unknown',
            category: agent.category || 'uncategorized',
          });
        }
      } catch (error: any) {
        console.error('[x402/stats] Error fetching agent names:', error.message);
      }
    }

    const enrichedTopSellers = topSellers.rows.map((row) => {
      const agentInfo = agentNameMap.get(row.wallet_address as string) || {
        name: 'Unknown',
        category: 'uncategorized',
      };
      return {
        wallet_address: row.wallet_address,
        name: agentInfo.name,
        category: agentInfo.category,
        tx_count: row.tx_count,
        total_volume_usdc: row.total_volume_usdc,
        unique_buyers: row.unique_buyers,
        first_tx_at: row.first_tx_at,
        last_tx_at: row.last_tx_at,
      };
    });

    // Calculate activity over time (last 30 days)
    const recentActivity = await turso.execute(`
      SELECT 
        DATE(last_tx_at) as date,
        COUNT(*) as active_agents,
        SUM(tx_count) as daily_txs
      FROM x402_payments
      WHERE last_tx_at > datetime('now', '-30 days')
      GROUP BY DATE(last_tx_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return NextResponse.json({
      summary: {
        total_agents_with_payments: Number(totalsRow.total_agents_with_payments || 0),
        total_payments: Number(totalsRow.total_payments || 0),
        total_volume_usdc: Number(totalsRow.total_volume || 0),
        total_unique_buyers: Number(totalsRow.total_unique_buyers || 0),
      },
      top_sellers: enrichedTopSellers,
      recent_activity: recentActivity.rows,
    });
  } catch (error: any) {
    console.error('[x402/stats] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch x402 stats',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
